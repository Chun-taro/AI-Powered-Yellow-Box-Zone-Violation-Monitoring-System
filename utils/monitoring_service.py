import cv2
import numpy as np
import threading
import time
import os
import logging
from datetime import datetime
from config.config import config
from utils.camera import CameraHandler
from ai_model.detect import VehicleDetector
from ai_model.tracker import CentroidTracker, compute_iou
from ai_model.lpr import lpr_reader, crop_plate_region
from ai_model.color_detector import vehicle_color_detector, vehicle_color_tracker
from database.database import Database
import math
import csv
from concurrent.futures import ThreadPoolExecutor

class MonitoringService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(MonitoringService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.camera = None
        self.tracker = None
        self.db = Database()
        
        # Asynchronous AI Model Loading to prevent blocking system startup
        self.detector = None
        self.ai_loading = True
        self.ai_error = None
        
        logging.info("Initializing AI Model pre-loader (YOLOv8)...")
        threading.Thread(target=self._load_model_async, daemon=True).start()
        
        self.latest_frame = None
        self.last_access_time = time.time()
        self.is_running = False
        self.thread = None
        self.stop_event = threading.Event()
        
        # Tracking State
        self.vehicle_timers = {}
        self.movement_start_pos = {}
        self.is_stopped_map = {}
        self.violated_ids = set()
        self.vehicle_types = {}
        self.vehicle_confidences = {}
        self.vehicle_loading_status = {}
        self.cached_plates = {}  # {obj_id: plate_number} - Temporary cache while in yellowbox
        self.cached_plate_scores = {}  # {obj_id: float}
        self.cached_plate_validated = {}  # {obj_id: bool}
        self.pending_lpr_ids = set()
        self.lpr_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="LPR_Worker")
        self.color_detector = vehicle_color_detector
        self.color_tracker = vehicle_color_tracker
        
        self.fps_current = 0
        self.fps_ai = 0
        self.person_count = 0
        self.vehicle_count = 0
        
        # Zone tracking for dynamic updates
        self.zone_coords = None
        self.yellow_zone = None
        self._check_zone_update()
        
        # New State for Async AI tracking
        self.current_persons = []
        self.tracked_objects_map = {}
        self.display_boxes = {}
        self.bbox_to_label = {}
        
        # Initialize placeholder frame for immediate feedback
        self._set_placeholder_frame("Initializing system...")
        
        self._initialized = True
        logging.info("MonitoringService singleton initialized")

    def _load_model_async(self):
        """Loads the AI model and LPR in a background thread."""
        try:
            model_path = os.path.join(os.getcwd(), config.MODEL_PATH)
            det = VehicleDetector(
                model_path=model_path,
                conf_thres=config.CONFIDENCE_THRESHOLD
            )
            # Warm up CUDA kernels with a dummy frame so detection on frame 1 is instant
            dummy = np.zeros((720, 1280, 3), dtype=np.uint8)
            _ = det.detect(dummy)
            self.detector = det
            self.ai_loading = False
            logging.info("✓ AI Model loaded, warmed up, and ready (Background Thread)")
        except Exception as e:
            self.ai_error = str(e)
            self.ai_loading = False
            logging.error(f"Detector failed to load in background: {e}")
        
        # Initialize LPR in same background thread (after YOLO to avoid resource contention)
        try:
            lpr_reader.initialize()
        except Exception as e:
            logging.warning(f"LPR initialization failed (non-critical): {e}")

    def start(self):
        """Starts the monitoring thread if not already running."""
        with self._lock:
            if not self.is_running:
                logging.info("Starting monitoring threads...")
                self.stop_event.clear()
                self.is_running = True
                
                # Main Video Thread (30 FPS)
                self.thread = threading.Thread(target=self._run_loop, daemon=True)
                self.thread.start()
                
                # AI Inference Thread (Decoupled)
                self.ai_thread = threading.Thread(target=self._ai_loop, daemon=True)
                self.ai_thread.start()

    def stop(self):
        """Stops the monitoring thread and releases resources."""
        with self._lock:
            if self.is_running:
                logging.info("Stopping monitoring thread...")
                self.is_running = False
                self.stop_event.set()
                if self.thread:
                    self.thread.join(timeout=0.4)
                if hasattr(self, 'ai_thread') and self.ai_thread:
                    self.ai_thread.join(timeout=0.4)
                
                if self.camera:
                    self.camera.close()
                    self.camera = None
                
                try:
                    self.lpr_executor.shutdown(wait=False, cancel_futures=True)
                except Exception:
                    pass
                
                logging.info("Monitoring thread stopped")

    def get_frame(self):
        """Called by Flask clients to get the latest processed frame."""
        self.last_access_time = time.time()
        
        if not self.is_running:
            self.start()
            
        return self.latest_frame

    def get_realtime_stats(self):
        """Returns the current monitoring metrics."""
        return {
            'person_count': self.person_count,
            'vehicle_count': self.vehicle_count,
            'fps_stream': self.fps_current,
            'fps_ai': self.fps_ai
        }

    def _run_loop(self):
        """The main AI detection and frame processing loop."""
        try:
            # Initialize Camera
            self.camera = CameraHandler()
            
            # AI Detector is already pre-loaded in __init__
            if self.detector is None:
                 logging.error("AI Detector not found. Attempting reload...")
                 # Fallback reload logic if needed
                
            # Initialize Tracker
            self.tracker = CentroidTracker(max_disappeared=30, max_distance=200)
            
            # Initial zone trigger
            self._check_zone_update()
            
            # Constants
            frame_skip = int(getattr(config, 'FRAME_SKIP', 2))
            jpeg_quality = int(getattr(config, 'JPEG_QUALITY', 65))
            time_limit = getattr(config, 'STOP_TIME_LIMIT', 15)
            save_dir = os.path.join("static", "violations")
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)
            
            frame_count = 0
            fps_frames = 0
            fps_last_time = time.time()
            
            current_persons = []
            
            # Keep-alive timeout (shut down if no one is watching)
            IDLE_TIMEOUT = 10 # seconds

            while not self.stop_event.is_set():
                # Check for idle timeout
                if time.time() - self.last_access_time > IDLE_TIMEOUT:
                    logging.info("No active viewers detected. Service entering idle mode.")
                    break

                # Frame capture
                frame = self.camera.read_frame()
                if frame is None:
                    time.sleep(0.01)
                    continue
                
                # Check for camera change
                if str(self.camera.source) != str(config.camera_source):
                    logging.info(f"Camera source changed to {config.camera_source}. Resetting...")
                    self.camera.source = config.camera_source
                    self.camera.open()
                
                frame_count += 1
                current_time = time.time()
                
                # Update Video FPS
                fps_frames += 1
                if current_time - fps_last_time >= 1.0:
                    self.fps_current = fps_frames
                    fps_frames = 0
                    fps_last_time = current_time
                
                # Periodic zone update check
                if frame_count % 30 == 0:
                    self._check_zone_update()
                
                # DRAWING (Fast 30 FPS Stream)
                if self.yellow_zone is not None:
                    cv2.polylines(frame, [self.yellow_zone], isClosed=True, color=(0, 255, 255), thickness=2)
                
                # Draw latest detections from the AI thread using a snapshot for thread safety
                current_detections = sorted(list(self.tracked_objects_map.items()), key=lambda x: x[0])
                valid_detections = []
                for obj_id, (centroid, bbox) in current_detections:
                    if obj_id not in self.movement_start_pos: continue # Waiting for AI
                    x1, y1, x2, y2 = bbox
                    is_in_zone = False
                    if self.yellow_zone is not None:
                        # Test center, bottom ground-contact, and lower-body of bounding box against yellow zone
                        test_pt1 = (float(x1 + (x2 - x1) / 2), float(y1 + (y2 - y1) / 2))
                        test_pt2 = (float(x1 + (x2 - x1) / 2), float(y2))
                        test_pt3 = (float(x1 + (x2 - x1) / 2), float(y1 + (y2 - y1) * 0.75))
                        is_in_zone = cv2.pointPolygonTest(self.yellow_zone, test_pt1, False) >= 0 or \
                                     cv2.pointPolygonTest(self.yellow_zone, test_pt2, False) >= 0 or \
                                     cv2.pointPolygonTest(self.yellow_zone, test_pt3, False) >= 0
                    
                    # Only detect and draw vehicles that enter the yellow box zone
                    if not is_in_zone:
                        continue

                    # Filter out any overlapping duplicate detections
                    is_overlap = False
                    area_cur = max(1.0, float((x2 - x1) * (y2 - y1)))
                    for _, _, b_prev in valid_detections:
                        iou = compute_iou(bbox, b_prev)
                        area_prev = max(1.0, float((b_prev[2] - b_prev[0]) * (b_prev[3] - b_prev[1])))
                        inter_w = max(0.0, min(x2, b_prev[2]) - max(x1, b_prev[0]))
                        inter_h = max(0.0, min(y2, b_prev[3]) - max(y1, b_prev[1]))
                        containment = float(inter_w * inter_h) / min(area_cur, area_prev)
                        if iou >= 0.20 or containment >= 0.38:
                            is_overlap = True
                            break
                    if not is_overlap:
                        valid_detections.append((obj_id, centroid, bbox))

                active_draw_ids = set()
                for obj_id, centroid, bbox in valid_detections:
                    active_draw_ids.add(obj_id)
                    target_b = [float(v) for v in bbox]
                    is_stopped = self.is_stopped_map.get(obj_id, False)

                    # Smooth Display Interpolator: Completely eliminates shaking & box jitter
                    if obj_id not in self.display_boxes:
                        self.display_boxes[obj_id] = target_b.copy()
                    else:
                        prev_b = self.display_boxes[obj_id]
                        if is_stopped:
                            # 100% Frozen Position for Stopped Vehicles (0.0px jitter)
                            diff_pos = math.hypot(target_b[0] - prev_b[0], target_b[1] - prev_b[1])
                            if diff_pos > 22.0:
                                self.display_boxes[obj_id] = [
                                    prev_b[i] + 0.15 * (target_b[i] - prev_b[i]) for i in range(4)
                                ]
                        else:
                            # Smooth exponential glide for moving vehicles (buttery 30 FPS display)
                            alpha = 0.35
                            self.display_boxes[obj_id] = [
                                prev_b[i] + alpha * (target_b[i] - prev_b[i]) for i in range(4)
                            ]

                    draw_box = [int(round(v)) for v in self.display_boxes[obj_id]]
                    x1, y1, x2, y2 = draw_box

                    vlabel = f"Vehicle #{obj_id}"
                    color = (0, 165, 255) # Orange
                    is_loading = (time.time() - self.vehicle_loading_status.get(obj_id, 0)) < 1.0

                    if obj_id in self.violated_ids: 
                        color = (0, 0, 255) # Red
                        cv2.putText(frame, "VIOLATION", (x1, max(15, y1 - 25)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)
                    elif is_loading:
                        cv2.putText(frame, "LOADING 15s", (x1, max(15, y1 - 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                        color = (0, 255, 255) # Yellow/Cyan
                    elif obj_id in self.vehicle_timers:
                        elapsed = time.time() - self.vehicle_timers[obj_id]
                        rem = max(0, int(time_limit - elapsed))
                        cv2.putText(frame, f"{rem}s", (x1, max(15, y1 - 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2)
                        color = (0, 165, 255) # Orange
                    
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, vlabel, (x1, max(15, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

                # Periodic cleanup of expired display boxes
                if frame_count % 30 == 0:
                    self.display_boxes = {k: v for k, v in self.display_boxes.items() if k in active_draw_ids}

                for p in self.current_persons:
                    px1, py1, px2, py2 = p[0], p[1], p[2], p[3]
                    status = p[7] if len(p) > 7 else 'pedestrian'
                    if status == 'boarding':
                        cv2.rectangle(frame, (px1, py1), (px2, py2), (255, 255, 0), 2)
                        cv2.putText(frame, "Boarding/Alighting", (px1, max(15, py1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
                    else:
                        cv2.rectangle(frame, (px1, py1), (px2, py2), (0, 255, 0), 1)
                        cv2.putText(frame, "Pedestrian", (px1, max(15, py1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 0), 1)
                
                # (Counters removed from frame - now displayed in UI)
                
                # (HUD removed from frame - now displayed in UI)
                
                # JPEG Encoding at high priority
                res, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality])
                if res:
                    self.latest_frame = buffer.tobytes()
                
                # Maintain target FPS to match hardware capability (30 FPS standard)
                target_delay = 1.0 / getattr(config, 'FPS', 30)
                elapsed_loop = time.time() - current_time
                sleep_time = max(0.001, target_delay - elapsed_loop)
                time.sleep(sleep_time) 

        except Exception as e:
            logging.error(f"Error in MonitoringService loop: {e}")
        finally:
            with self._lock:
                self.is_running = False
                if self.camera:
                    self.camera.close()
                    self.camera = None
        
        # Tracking State
        self.vehicle_timers = {}
        self.movement_start_pos = {}
        self.is_stopped_map = {}
        self.violated_ids = set()
        self.vehicle_types = {}
        self.vehicle_confidences = {}
        self.vehicle_loading_status = {}
        self.cached_plates = {}  # {obj_id: plate_number} - Temporary cache while in yellowbox
        self.color_detector = vehicle_color_detector
        self.color_tracker = vehicle_color_tracker
        
        self.fps_current = 0
        self.fps_ai = 0
        self.person_count = 0
        self.vehicle_count = 0

    def _extract_vehicle_color(self, crop_img, obj_id=None, vehicle_type='car'):
        """
        Extract vehicle color with enhanced multi-space (CIELAB + HSV) color matching,
        anatomical panel sampling, and temporal multi-frame voting.
        """
        if obj_id is not None:
            return self.color_tracker.get_color(obj_id, fallback_crop=crop_img, vehicle_type=vehicle_type)
        return self.color_detector.detect_color(crop_img, vehicle_type=vehicle_type)

    def _generate_evidence_image(self, frame, bbox, obj_id, label, elapsed, vehicle_color, conf_pct, plate_number, db_timestamp, location_name):
        """
        Generates a high-definition, uncropped evidentiary snapshot.
        Guarantees that 100% of the vehicle is visible with generous margins,
        yellow box zone boundary context, and professional high-contrast metadata badges.
        """
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = bbox
        vw = max(1, x2 - x1)
        vh = max(1, y2 - y1)
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        zone_coords = self.zone_coords or config.YELLOW_BOX_ZONE
        mode = getattr(config, 'EVIDENCE_SNAPSHOT_MODE', 'wide_crop')

        if mode == 'full_composite':
            evidence = frame.copy()
            
            # 1. Draw Yellow Box Zone Polygon on full scene
            if zone_coords:
                pts = np.array(zone_coords, np.int32).reshape((-1, 1, 2))
                overlay = evidence.copy()
                cv2.fillPoly(overlay, [pts], (0, 215, 255))
                cv2.addWeighted(overlay, 0.18, evidence, 0.82, 0, evidence)
                cv2.polylines(evidence, [pts], isClosed=True, color=(0, 230, 255), thickness=3, lineType=cv2.LINE_AA)

            # 2. Draw Vehicle Violation Bounding Box
            cv2.rectangle(evidence, (x1, y1), (x2, y2), (0, 0, 255), 3, lineType=cv2.LINE_AA)
            
            # Violation header tag
            tag_text = f"VIOLATION | Stopped: {elapsed:.1f}s"
            (tw, th), _ = cv2.getTextSize(tag_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            tag_y = max(th + 12, y1 - 10)
            cv2.rectangle(evidence, (x1, tag_y - th - 8), (x1 + tw + 16, tag_y + 6), (0, 0, 220), -1)
            cv2.putText(evidence, tag_text, (x1 + 8, tag_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

            # 3. Zoomed Picture-in-Picture Vehicle Inset (placed on opposite side to avoid obscuring vehicle)
            pad_x = int(max(vw * 0.35, 60))
            pad_y = int(max(vh * 0.35, 50))
            ix1 = max(0, x1 - pad_x)
            iy1 = max(0, y1 - pad_y)
            ix2 = min(w, x2 + pad_x)
            iy2 = min(h, y2 + pad_y)
            v_crop = frame[iy1:iy2, ix1:ix2].copy()

            if v_crop.size > 0:
                inset_w = 440
                inset_h = int(inset_w * (v_crop.shape[0] / v_crop.shape[1]))
                if inset_h > 300:
                    inset_h = 300
                    inset_w = int(inset_h * (v_crop.shape[1] / v_crop.shape[0]))
                
                resized_crop = cv2.resize(v_crop, (inset_w, inset_h), interpolation=cv2.INTER_LANCZOS4)
                ins_x = 24 if cx > (w // 2) else (w - inset_w - 24)
                ins_y = 24

                cv2.rectangle(evidence, (ins_x - 3, ins_y - 3), (ins_x + inset_w + 3, ins_y + inset_h + 3), (0, 0, 0), -1)
                evidence[ins_y:ins_y+inset_h, ins_x:ins_x+inset_w] = resized_crop
                cv2.rectangle(evidence, (ins_x, ins_y), (ins_x + inset_w, ins_y + inset_h), (0, 215, 255), 2)
                
                badge_text = f"VEHICLE CLOSE-UP (#{obj_id})"
                cv2.rectangle(evidence, (ins_x, ins_y), (ins_x + 220, ins_y + 24), (0, 0, 0), -1)
                cv2.putText(evidence, badge_text, (ins_x + 8, ins_y + 17), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)

            # 4. Bottom Official Metadata Bar
            banner_h = 60
            banner_y1 = h - banner_h
            overlay = evidence.copy()
            cv2.rectangle(overlay, (0, banner_y1), (w, h), (15, 15, 20), -1)
            cv2.addWeighted(overlay, 0.85, evidence, 0.15, 0, evidence)
            cv2.line(evidence, (0, banner_y1), (w, banner_y1), (0, 215, 255), 2)

            row1 = f"TMC MALAYBALAY EVIDENCE DOSSIER | {location_name.upper()}"
            row2 = f"TIME: {db_timestamp} | VEHICLE: {label.upper()} (#{obj_id}) | COLOR: {vehicle_color} ({conf_pct}%) | PLATE: {plate_number} | DWELL: {elapsed:.1f}s"
            cv2.putText(evidence, row1, (24, banner_y1 + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 230, 255), 2, cv2.LINE_AA)
            cv2.putText(evidence, row2, (24, banner_y1 + 46), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (255, 255, 255), 1, cv2.LINE_AA)
            return evidence

        else:
            # Default: WIDE CONTEXT CROP (High Definition, centered on vehicle, guarantees whole vehicle is visible)
            target_w = min(w, max(960, int(vw * 2.2)))
            target_h = min(h, max(540, int(vh * 2.0)))

            cx1 = max(0, min(cx - target_w // 2, w - target_w))
            cy1 = max(0, min(cy - target_h // 2, h - target_h))
            cx2 = min(w, cx1 + target_w)
            cy2 = min(h, cy1 + target_h)

            crop = frame[cy1:cy2, cx1:cx2].copy()
            cw, ch = crop.shape[1], crop.shape[0]

            # 1. Draw yellow box zone shifted by crop origin
            if zone_coords:
                pts = np.array(zone_coords, np.int32) - np.array([cx1, cy1])
                pts = pts.reshape((-1, 1, 2))
                overlay = crop.copy()
                cv2.fillPoly(overlay, [pts], (0, 215, 255))
                cv2.addWeighted(overlay, 0.18, crop, 0.82, 0, crop)
                cv2.polylines(crop, [pts], isClosed=True, color=(0, 230, 255), thickness=3, lineType=cv2.LINE_AA)

            # 2. Shifted vehicle coordinates
            vx1, vy1 = x1 - cx1, y1 - cy1
            vx2, vy2 = x2 - cx1, y2 - cy1

            # Red bounding box around vehicle
            cv2.rectangle(crop, (vx1, vy1), (vx2, vy2), (0, 0, 255), 3, lineType=cv2.LINE_AA)

            # Violation header badge
            tag_text = f"VIOLATION | Stopped: {elapsed:.1f}s"
            (tw, th), _ = cv2.getTextSize(tag_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            tag_y = max(th + 10, vy1 - 10)
            cv2.rectangle(crop, (vx1, tag_y - th - 8), (vx1 + tw + 16, tag_y + 6), (0, 0, 220), -1)
            cv2.putText(crop, tag_text, (vx1 + 8, tag_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

            # Color & Plate info boxes with high-contrast outlines
            info_y = min(ch - 55, vy2 + 25)
            color_text = f"COLOR: {vehicle_color} ({conf_pct}%)"
            plate_text = f"PLATE: {plate_number}"
            
            # High-contrast text: black stroke + crisp fill
            cv2.putText(crop, color_text, (vx1, info_y), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 4, cv2.LINE_AA)
            cv2.putText(crop, color_text, (vx1, info_y), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(crop, plate_text, (vx1, info_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 4, cv2.LINE_AA)
            cv2.putText(crop, plate_text, (vx1, info_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2, cv2.LINE_AA)

            # Bottom sleek metadata bar
            bar_h = 36
            bar_y = ch - bar_h
            overlay = crop.copy()
            cv2.rectangle(overlay, (0, bar_y), (cw, ch), (20, 20, 25), -1)
            cv2.addWeighted(overlay, 0.85, crop, 0.15, 0, crop)
            cv2.line(crop, (0, bar_y), (cw, bar_y), (0, 215, 255), 1)
            
            meta_str = f"TMC MALAYBALAY | {db_timestamp} | SAYRE HWY - FORTICH ST. | {label.upper()} #{obj_id}"
            cv2.putText(crop, meta_str, (12, bar_y + 23), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 230, 255), 1, cv2.LINE_AA)
            return crop

    def _save_violation(self, frame, bbox, obj_id, label, elapsed, confidence=0.0):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        x1, y1, x2, y2 = bbox
        h, w, _ = frame.shape
        
        # Extract vehicle color with enhanced AI detector and temporal tracker
        vehicle_crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        vehicle_color, color_conf = self._extract_vehicle_color(
            vehicle_crop, obj_id=obj_id, vehicle_type=label
        )
        conf_pct = int(color_conf * 100)

        # --- LPR: Read plate from evidentiary frame (with cached pre-capture fallback) ---
        plate_number = None
        if getattr(config, 'LPR_ENABLED', True):
            fresh_plate = None
            fresh_score = 0.0
            fresh_val = False
            try:
                plate_crop = crop_plate_region(frame, bbox)
                v_crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                fresh_plate, fresh_score, fresh_val = lpr_reader.read_plate(plate_crop, full_vehicle_crop=v_crop, return_confidence=True)
            except Exception as e:
                logging.warning(f"LPR direct read on violation frame failed for vehicle {obj_id}: {e}")

            cached_plate = self.cached_plates.get(obj_id)
            cached_score = self.cached_plate_scores.get(obj_id, 0.0)
            cached_val = self.cached_plate_validated.get(obj_id, False)

            # Prioritize definitive fresh read from crisp stopped evidentiary snapshot
            if fresh_plate and fresh_val and (fresh_score >= 1.5 or not cached_val):
                plate_number = fresh_plate
                self.cached_plates[obj_id] = fresh_plate
                self.cached_plate_scores[obj_id] = fresh_score
                self.cached_plate_validated[obj_id] = fresh_val
            elif fresh_plate and (fresh_score > cached_score or not cached_plate):
                plate_number = fresh_plate
                self.cached_plates[obj_id] = fresh_plate
                self.cached_plate_scores[obj_id] = fresh_score
                self.cached_plate_validated[obj_id] = fresh_val
            elif cached_plate:
                plate_number = cached_plate
            elif fresh_plate:
                plate_number = fresh_plate
            
            if plate_number:
                logging.info(f"LPR confirmed plate: {plate_number} for vehicle ID {obj_id}")
            else:
                plate_number = "UNREADABLE"
        else:
            plate_number = "LPR DISABLED"
        
        db_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        location_name = "Sayre Highway - Fortich St., Malaybalay City"

        # Generate High-Definition Evidence Snapshot (guarantees whole vehicle is visible + road context)
        evidence_image = self._generate_evidence_image(
            frame=frame,
            bbox=bbox,
            obj_id=obj_id,
            label=label,
            elapsed=elapsed,
            vehicle_color=vehicle_color,
            conf_pct=conf_pct,
            plate_number=plate_number,
            db_timestamp=db_timestamp,
            location_name=location_name
        )

        filename = f"violation_{timestamp}_{label}_{obj_id}.jpg"
        save_path = os.path.join("static", "violations", filename)
        cv2.imwrite(save_path, evidence_image, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        db_image_path = f"violations/{filename}"
        
        try:
            if hasattr(self.db, 'insert_violation'):
                ret, buffer = cv2.imencode('.jpg', evidence_image)
                self.db.insert_violation(
                    vehicle_type=label, timestamp=db_timestamp, image_path=db_image_path,
                    image_blob=buffer.tobytes() if ret else None, detection_id=f"{timestamp}_{obj_id}",
                    stop_duration=elapsed, notes=f"Object ID: {obj_id}, Stopped for {elapsed:.1f}s",
                    plate_number=plate_number, confidence=confidence,
                    location=location_name, vehicle_color=vehicle_color
                )
                
                from utils.events import new_violation_event
                new_violation_event.set()
        except Exception as e:
            logging.error(f"Failed to save violation to DB: {e}")

    def _is_on_right_side(self, x, y, margin=40):
        """
        Calculates if a coordinate (x, y) is on the right-side monitored lane / sidewalk
        based on the angled perspective boundary of the yellow box zone.
        Any detection on the left side (left lane traffic, oncoming vehicles, motorcyclists)
        is strictly discarded.
        """
        if self.yellow_zone is None or len(self.yellow_zone) < 4:
            return True
        try:
            pts = self.yellow_zone.reshape(-1, 2)
            # Sort vertices by Y to separate top points (far road) from bottom points (near road)
            sorted_by_y = pts[pts[:, 1].argsort()]
            top_two = sorted_by_y[:2]
            bottom_two = sorted_by_y[2:]
            
            # In top two, smaller x is top-left
            top_left = top_two[top_two[:, 0].argsort()][0]
            # In bottom two, smaller x is bottom-left
            bottom_left = bottom_two[bottom_two[:, 0].argsort()][0]
            
            x_tl, y_tl = float(top_left[0]), float(top_left[1])
            x_bl, y_bl = float(bottom_left[0]), float(bottom_left[1])
            
            if abs(y_bl - y_tl) > 1e-3:
                t = (y - y_tl) / (y_bl - y_tl)
                # Compute angled diagonal X boundary at height y
                boundary_x = x_tl + t * (x_bl - x_tl)
            else:
                boundary_x = min(x_tl, x_bl)
            
            return x >= (boundary_x - margin)
        except Exception:
            return True

    def _classify_person_relation(self, px1, py1, px2, py2, vehicle_boxes):
        """
        Determines whether a detected person is:
        - 'inside': Seated passenger/driver or motorcycle rider/passenger (SUPPRESSED).
        - 'boarding': Entering or exiting vehicle (crossing door/step boundary).
        - 'pedestrian': Walking outside on sidewalk/street.
        
        Returns:
            tuple: (status, matched_vehicle_box_or_none)
        """
        pw = max(1, px2 - px1)
        ph = max(1, py2 - py1)
        p_area = float(pw * ph)
        pcx = (px1 + px2) // 2
        pcy = (py1 + py2) // 2

        best_status = 'pedestrian'
        best_v_box = None

        for v_box in vehicle_boxes:
            vx1, vy1, vx2, vy2 = v_box[:4]
            v_type = v_box[4] if len(v_box) > 4 else 'car'
            vw = max(1, vx2 - vx1)
            vh = max(1, vy2 - vy1)

            # Bounding box intersection
            ix1 = max(px1, vx1)
            iy1 = max(py1, vy1)
            ix2 = min(px2, vx2)
            iy2 = min(py2, vy2)
            iw = max(0, ix2 - ix1)
            ih = max(0, iy2 - iy1)
            inter_area = float(iw * ih)
            overlap_ratio = inter_area / p_area

            # Spatial distance from person to vehicle perimeter
            dist_x = max(0, max(vx1 - px2, px1 - vx2))
            dist_y = max(0, max(vy1 - py2, py1 - vy2))
            edge_dist = math.hypot(dist_x, dist_y)

            is_horiz_aligned = (pcx >= vx1 - 25) and (pcx <= vx2 + 25)
            is_vert_overlapping = (py2 >= vy1) and (py1 <= vy2)

            # 1. MOTORCYCLE RIDER & PILLION PASSENGER (Always suppress - not pedestrians or boarding)
            if v_type == 'motorcycle':
                if overlap_ratio >= 0.15 or (is_horiz_aligned and is_vert_overlapping):
                    return 'inside', v_box

            # 2. SEATED PASSENGER / DRIVER INSIDE 4-WHEEL VEHICLE
            is_feet_on_ground_or_step = py2 >= (vy2 - 0.20 * vh)
            is_in_cabin = (pcx >= vx1 - 10) and (pcx <= vx2 + 10) and (pcy >= vy1) and (pcy <= vy2)

            if (overlap_ratio >= 0.50 and not is_feet_on_ground_or_step) or \
               (overlap_ratio >= 0.75) or \
               (is_in_cabin and not is_feet_on_ground_or_step):
                best_status = 'inside'
                best_v_box = v_box
                continue

            # 3. BOARDING / ALIGHTING (Stepping in/out through doorway/step onto road)
            is_vertically_aligned = (pcy >= vy1 - 25) and (pcy <= vy2 + 35)
            is_at_doorway_side = pcx >= (vx1 + 0.30 * vw)
            if is_vertically_aligned and is_feet_on_ground_or_step and is_at_doorway_side:
                if (0.12 <= overlap_ratio <= 0.85) or (edge_dist <= 35):
                    return 'boarding', v_box

        return best_status, best_v_box

    def _async_lpr_worker(self, obj_id, plate_crop, v_crop):
        """Runs OCR in background worker thread without blocking the AI or stream loops."""
        try:
            read_p, score, is_val = lpr_reader.read_plate(plate_crop, full_vehicle_crop=v_crop, return_confidence=True)
            if read_p:
                prev_score = self.cached_plate_scores.get(obj_id, 0.0)
                prev_val = self.cached_plate_validated.get(obj_id, False)

                # Progressive Upgrade Condition:
                # 1. First plate detected for this vehicle
                # 2. Or newly detected plate is properly validated while previous was only generic string
                # 3. Or newly detected plate has higher composite score
                should_update = (
                    (obj_id not in self.cached_plates) or
                    (is_val and not prev_val) or
                    (score > prev_score + 0.15)
                )
                if should_update:
                    self.cached_plates[obj_id] = read_p
                    self.cached_plate_scores[obj_id] = score
                    self.cached_plate_validated[obj_id] = is_val
                    logging.info(f"LPR vehicle #{obj_id}: captured plate '{read_p}' (score: {score:.2f}, validated: {is_val})")
        except Exception as e:
            logging.debug(f"Async LPR worker error: {e}")
        finally:
            self.pending_lpr_ids.discard(obj_id)

    def _ai_loop(self):
        """Asynchronous AI detection loop to prevent visual lag."""
        try:
            # Wait for detector and camera to be ready
            while not self.stop_event.is_set() and (self.detector is None or self.camera is None):
                time.sleep(0.5)
            
            # AI thread will use the class-level self.yellow_zone
            self._check_zone_update()
            time_limit = getattr(config, 'STOP_TIME_LIMIT', 15)
            
            ai_frames = 0
            ai_last_time = time.time()
            
            while not self.stop_event.is_set():
                if not self.is_running: 
                    time.sleep(0.1)
                    continue
                    
                frame = self.camera.read_frame()
                if frame is None:
                    time.sleep(0.01)
                    continue
                
                try:
                    current_time = time.time()
                    ai_frames += 1
                    if current_time - ai_last_time >= 1.0:
                        self.fps_ai = ai_frames
                        ai_frames = 0
                        ai_last_time = current_time

                    # Frame pacing: skip AI inference on alternate frames to cut CPU/GPU load by 50%
                    # while maintaining real-time tracking fidelity
                    ai_frame_skip = int(getattr(config, 'FRAME_SKIP', 2))
                    if ai_frame_skip > 1 and (ai_frames % ai_frame_skip != 0):
                        time.sleep(0.005)
                        continue

                    h, w = frame.shape[:2]

                    # AI Inference (Full frame)
                    detections_raw = self.detector.detect(frame)
                    
                    class_names = {
                        0: 'person', 2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck',
                        10: 'multicab', 11: 'tricycle',
                        'person': 'person', 'car': 'car', 'motorcycle': 'motorcycle',
                        'bus': 'bus', 'truck': 'truck', 'multicab': 'multicab', 'tricycle': 'tricycle'
                    }
                    raw_vehicles = []
                    raw_persons = []
                    
                    for detection in detections_raw:
                        cls_id = detection['class']
                        conf = detection['confidence']
                        raw_label = detection.get('class_name') or class_names.get(cls_id)
                        if not raw_label: continue
                        label = 'person' if raw_label == 'person' else 'car'
                        v_type = raw_label  # Preserves exact type ('multicab', 'tricycle', 'car', etc.)
                        x1, y1, x2, y2 = map(int, detection['bbox'])
                        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                        
                        if label == 'car':
                            raw_vehicles.append((x1, y1, x2, y2, cx, cy, conf, label, v_type))
                        elif label == 'person':
                            if conf < 0.25: continue
                            raw_persons.append((x1, y1, x2, y2, cx, cy, conf))

                    # Deduplicate overlapping vehicle detections (NMS & Containment)
                    # Merges multi-class, partial, or split bounding boxes (e.g., upper cabin + lower bed/tailgate)
                    # so the ENTIRE vehicle is enclosed
                    if len(raw_vehicles) > 1:
                        raw_vehicles_sorted = sorted(raw_vehicles, key=lambda x: x[6], reverse=True)
                        deduped_vehicles = []
                        for rv in raw_vehicles_sorted:
                            box_a = [rv[0], rv[1], rv[2], rv[3]]
                            area_a = max(1.0, float((box_a[2] - box_a[0]) * (box_a[3] - box_a[1])))
                            w_a = box_a[2] - box_a[0]
                            is_dup = False
                            for idx_dk, dk in enumerate(deduped_vehicles):
                                box_b = [dk[0], dk[1], dk[2], dk[3]]
                                area_b = max(1.0, float((box_b[2] - box_b[0]) * (box_b[3] - box_b[1])))
                                w_b = box_b[2] - box_b[0]
                                
                                iou = compute_iou(box_a, box_b)
                                inter_w = max(0.0, min(box_a[2], box_b[2]) - max(box_a[0], box_b[0]))
                                inter_h = max(0.0, min(box_a[3], box_b[3]) - max(box_a[1], box_b[1]))
                                containment = float(inter_w * inter_h) / min(area_a, area_b)
                                
                                cx_a, cy_a = rv[4], rv[5]
                                cx_b, cy_b = dk[4], dk[5]
                                center_inside = (box_b[0] <= cx_a <= box_b[2] and box_b[1] <= cy_a <= box_b[3]) or \
                                                (box_a[0] <= cx_b <= box_a[2] and box_a[1] <= cy_b <= box_a[3])
                                
                                # Vertical alignment check for split vehicle parts (cabin + bed/tailgate)
                                is_vert_stack = False
                                if inter_w >= 0.45 * min(w_a, w_b):
                                    top_box = box_a if box_a[1] < box_b[1] else box_b
                                    bot_box = box_b if box_a[1] < box_b[1] else box_a
                                    v_gap = bot_box[1] - top_box[3]
                                    if -25 <= v_gap <= max(85, int(0.45 * max(top_box[3]-top_box[1], bot_box[3]-bot_box[1]))):
                                        is_vert_stack = True
                                
                                if iou >= 0.20 or containment >= 0.38 or (center_inside and containment >= 0.25) or is_vert_stack:
                                    is_dup = True
                                    mx1 = min(box_a[0], box_b[0])
                                    my1 = min(box_a[1], box_b[1])
                                    mx2 = max(box_a[2], box_b[2])
                                    my2 = max(box_a[3], box_b[3])
                                    mcx, mcy = (mx1 + mx2) // 2, (my1 + my2) // 2
                                    m_conf = max(rv[6], dk[6])
                                    m_label = dk[7]
                                    m_type = dk[8] if dk[8] not in ('car', 'vehicle') else rv[8]
                                    deduped_vehicles[idx_dk] = (mx1, my1, mx2, my2, mcx, mcy, m_conf, m_label, m_type)
                                    break
                            if not is_dup:
                                deduped_vehicles.append(rv)
                        raw_vehicles = deduped_vehicles

                    # 1. Process all detected vehicles with Whole-Body Canopy Reconstruction
                    detections_for_tracker = []
                    bbox_to_label = {}
                    bbox_to_conf = {}
                    vehicle_count = 0
                    vehicle_boxes_all = []

                    for v in raw_vehicles:
                        vx1, vy1, vx2, vy2, vcx, vcy, vconf, vlabel, vtype = v
                        vw = vx2 - vx1
                        vh = vy2 - vy1

                        # Canopy Reconstruction Phase 1: Passengers/Enforcers in Doorway/Cabin
                        # Expand upward if passengers/enforcers are seated or standing inside the vehicle
                        for pb in raw_persons:
                            px1, py1, px2, py2, pcx, pcy, pconf = pb
                            pw = px2 - px1
                            inter_x = max(0, min(vx2, px2) - max(vx1, px1))
                            if inter_x >= 0.38 * min(vw, pw) and py2 >= vy1 - 30 and py1 < vy2:
                                vy1 = min(vy1, py1 - 15)
                                vx1 = min(vx1, px1)
                                vx2 = max(vx2, px2)
                                vw = vx2 - vx1
                                vh = vy2 - vy1

                        # Canopy Reconstruction Phase 2: Road Perspective Proportional Recovery
                        # On this monitored road corridor, multicabs, jeepneys, and utility vehicles
                        # have a physical height >= 0.95 * width. Truncated tailgate detections
                        # are restored to full vehicle dimensions.
                        if vy2 > 220:
                            min_h = int(vw * 0.95)
                            if (vy2 - vy1) < min_h:
                                vy1 = max(0, vy2 - min_h)
                                vh = vy2 - vy1

                        vcx, vcy = (vx1 + vx2) // 2, (vy1 + vy2) // 2
                        vehicle_boxes_all.append((vx1, vy1, vx2, vy2, vtype))
                        
                        is_in_zone = False
                        if self.yellow_zone is not None:
                            test_pt1 = (float(vcx), float(vcy))
                            test_pt2 = (float(vcx), float(vy2))
                            test_pt3 = (float(vcx), float(vy1 + (vy2 - vy1) * 0.75))
                            is_in_zone = cv2.pointPolygonTest(self.yellow_zone, test_pt1, False) >= 0 or \
                                         cv2.pointPolygonTest(self.yellow_zone, test_pt2, False) >= 0 or \
                                         cv2.pointPolygonTest(self.yellow_zone, test_pt3, False) >= 0
                        else:
                            is_in_zone = True

                        if is_in_zone:
                            vehicle_count += 1
                        
                        rect = (vx1, vy1, vx2, vy2)
                        detections_for_tracker.append(rect)
                        bbox_to_label[rect] = 'vehicle'
                        bbox_to_conf[rect] = vconf

                    # 2. Process persons with spatial passenger suppression & boarding detection
                    person_count = 0
                    current_persons = []

                    for p in raw_persons:
                        px1, py1, px2, py2, pcx, pcy, pconf = p
                        p_status, matched_vbox = self._classify_person_relation(px1, py1, px2, py2, vehicle_boxes_all)
                        
                        # Case A: Passenger / driver seated inside vehicle cabin OR on motorcycle -> SUPPRESS
                        if p_status == 'inside':
                            continue

                        # Case B: Boarding or Alighting (Stepping in/out through door/step)
                        if p_status == 'boarding':
                            if self.yellow_zone is not None:
                                dist_to_zone = cv2.pointPolygonTest(self.yellow_zone, (float(pcx), float(pcy)), True)
                                if dist_to_zone >= -90:
                                    current_persons.append((px1, py1, px2, py2, pcx, pcy, pconf, 'boarding'))
                            else:
                                current_persons.append((px1, py1, px2, py2, pcx, pcy, pconf, 'boarding'))

                        # Case C: Outside Pedestrian on sidewalk or crossing street
                        elif p_status == 'pedestrian':
                            if self.yellow_zone is not None:
                                dist_to_zone = cv2.pointPolygonTest(self.yellow_zone, (float(pcx), float(pcy)), True)
                                if dist_to_zone >= -70: # strictly inside zone or right adjacent sidewalk
                                    person_count += 1
                                    current_persons.append((px1, py1, px2, py2, pcx, pcy, pconf, 'pedestrian'))
                            else:
                                person_count += 1
                                current_persons.append((px1, py1, px2, py2, pcx, pcy, pconf, 'pedestrian'))

                    # Tracking Update
                    self.tracked_objects_map = self.tracker.update(detections_for_tracker)
                    self.bbox_to_label.update(bbox_to_label)
                    
                    # Update confidence for tracked objects
                    for obj_id, (centroid, bbox) in self.tracked_objects_map.items():
                        bbox_tuple = tuple(bbox)
                        if bbox_tuple in bbox_to_conf:
                            self.vehicle_confidences[obj_id] = bbox_to_conf[bbox_tuple]
                        if bbox_tuple in bbox_to_label:
                             self.vehicle_types[obj_id] = bbox_to_label[bbox_tuple]

                    # Periodic vehicle color temporal tracking update (every 3 frames for zero lag)
                    if ai_frames % 3 == 0:
                        for obj_id, (_, bbox) in self.tracked_objects_map.items():
                            vx1, vy1, vx2, vy2 = bbox
                            v_crop = frame[max(0, vy1):min(h, vy2), max(0, vx1):min(w, vx2)]
                            if v_crop.size > 0:
                                self.color_tracker.update(
                                    obj_id, v_crop,
                                    vehicle_type=self.vehicle_types.get(obj_id, 'car')
                                )

                    # Periodic cleanup of expired vehicle color tracks (every 30 frames)
                    if ai_frames % 30 == 0:
                        self.color_tracker.clean_up(self.tracked_objects_map.keys())

                    # Calculate unique active vehicles inside the yellow zone
                    zone_vehicle_count = 0
                    for obj_id, (centroid, bbox) in self.tracked_objects_map.items():
                        x1, y1, x2, y2 = bbox
                        if self.yellow_zone is not None:
                            test_pt1 = (float(x1 + (x2 - x1) / 2), float(y1 + (y2 - y1) / 2))
                            test_pt2 = (float(x1 + (x2 - x1) / 2), float(y2))
                            test_pt3 = (float(x1 + (x2 - x1) / 2), float(y1 + (y2 - y1) * 0.75))
                            if cv2.pointPolygonTest(self.yellow_zone, test_pt1, False) >= 0 or \
                               cv2.pointPolygonTest(self.yellow_zone, test_pt2, False) >= 0 or \
                               cv2.pointPolygonTest(self.yellow_zone, test_pt3, False) >= 0:
                                zone_vehicle_count += 1
                        else:
                            zone_vehicle_count += 1

                    self.person_count = person_count
                    self.vehicle_count = zone_vehicle_count
                    self.current_persons = current_persons

                    # ---------------------------------------------------------
                    # TARGETED BEST-VEHICLE PASSENGER ASSOCIATION:
                    # Associates each boarding/loading person with EXACTLY ONE
                    # vehicle based on ground contact (depth), doorway proximity,
                    # and spatial affinity.
                    # This ensures that if a person loads into a closer Vehicle #2,
                    # ONLY Vehicle #2's loading timer resets, and Vehicle #1's
                    # timer continues uninterrupted even if bounding boxes overlap.
                    # ---------------------------------------------------------
                    active_loading_vehicles = set()
                    for p_data in current_persons:
                        px1, py1, px2, py2, pcx, pcy, pconf = p_data[:7]
                        pstatus = p_data[7] if len(p_data) > 7 else 'pedestrian'
                        p_area = max(1, (px2 - px1) * (py2 - py1))

                        best_vid = None
                        best_score = -1e9

                        for vid, (_, v_bbox) in self.tracked_objects_map.items():
                            vx1, vy1, vx2, vy2 = v_bbox[:4]
                            vw = max(1, vx2 - vx1)
                            vh = max(1, vy2 - vy1)

                            # 1. Depth & Road Contact Gate:
                            # Person must stand at the road depth of THIS vehicle
                            ground_diff = abs(py2 - vy2)
                            if ground_diff > (0.32 * vh):
                                continue  # Reject: Person is at a different depth (e.g. at closer vehicle, not farther vehicle)

                            # 2. Doorway & Proximity evaluation
                            dist_x = max(0, max(vx1 - px2, px1 - vx2))
                            dist_y = max(0, max(vy1 - py2, py1 - vy2))
                            edge_dist = math.hypot(dist_x, dist_y)

                            inter_w = max(0, min(vx2, px2) - max(vx1, px1))
                            inter_h = max(0, min(vy2, py2) - max(vy1, py1))
                            has_overlap = (inter_w > 0) and (inter_h > 0)
                            overlap_ratio = float(inter_w * inter_h) / p_area

                            is_vertically_aligned = (pcy >= vy1 - 25) and (pcy <= vy2 + 35)
                            is_at_doorway_side = (pcx >= vx1 + 0.25 * vw) or (pcy >= vy2 - 0.25 * vh)

                            is_candidate = False
                            if pstatus == 'boarding' and (has_overlap or edge_dist <= 45):
                                is_candidate = True
                            elif has_overlap and is_at_doorway_side:
                                is_candidate = True
                            elif edge_dist <= 35 and is_vertically_aligned and is_at_doorway_side:
                                is_candidate = True

                            if is_candidate:
                                # Affinity score favors close ground contact and doorway proximity
                                score = 100.0 - (ground_diff / float(vh) * 50.0) - (edge_dist / 45.0 * 30.0) + (overlap_ratio * 20.0)
                                if score > best_score:
                                    best_score = score
                                    best_vid = vid

                        if best_vid is not None:
                            active_loading_vehicles.add(best_vid)
                            self.vehicle_loading_status[best_vid] = current_time

                    # VIOLATION & DWELL TIMER LOGIC
                    current_frame_ids = set()
                    for obj_id, (centroid, bbox) in self.tracked_objects_map.copy().items():
                        if self.tracker.disappeared.get(obj_id, 0) > 15: continue
                        current_frame_ids.add(obj_id)
                        x1, y1, x2, y2 = bbox
                        scx, scy = (x1+x2)//2, (y1+y2)//2
                        
                        if self.yellow_zone is not None:
                            test_pt1 = (float(scx), float(scy))
                            test_pt2 = (float(scx), float(y2))
                            test_pt3 = (float(scx), float(y1 + (y2 - y1) * 0.75))
                            is_in_zone = cv2.pointPolygonTest(self.yellow_zone, test_pt1, False) >= 0 or \
                                         cv2.pointPolygonTest(self.yellow_zone, test_pt2, False) >= 0 or \
                                         cv2.pointPolygonTest(self.yellow_zone, test_pt3, False) >= 0
                        else:
                            is_in_zone = False
                        
                        # Stopped Detection
                        if obj_id not in self.movement_start_pos:
                            self.movement_start_pos[obj_id] = (current_time, scx, scy)
                        else:
                            start_t, start_x, start_y = self.movement_start_pos[obj_id]
                            if current_time - start_t >= 1.0:
                                dist = math.hypot(scx - start_x, scy - start_y)
                                self.is_stopped_map[obj_id] = dist < 15
                                self.movement_start_pos[obj_id] = (current_time, scx, scy)
                        
                        # Active loading state: ONLY triggered if THIS vehicle was associated with an active boarding person
                        is_loading = (obj_id in active_loading_vehicles) or ((current_time - self.vehicle_loading_status.get(obj_id, 0)) < 1.0)

                        # Targeted LPR Pre-Capture (Zone-Focused & Rate-Paced):
                        # Only runs asynchronously on vehicles dwelling or stopped in the yellow box zone,
                        # completely eliminating wasted CPU/GPU OCR cycles on passing road traffic.
                        if is_in_zone and getattr(config, 'LPR_ENABLED', True):
                            has_validated_plate = self.cached_plate_validated.get(obj_id, False) and (self.cached_plate_scores.get(obj_id, 0.0) >= 2.0)
                            lpr_sample_rate = 12 if obj_id in self.cached_plates else 6
                            if not has_validated_plate and obj_id not in self.pending_lpr_ids and (ai_frames % lpr_sample_rate == 0):
                                try:
                                    plate_crop = crop_plate_region(frame, bbox)
                                    v_crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                                    if plate_crop is not None and plate_crop.size > 0:
                                        self.pending_lpr_ids.add(obj_id)
                                        self.lpr_executor.submit(
                                            self._async_lpr_worker,
                                            obj_id,
                                            plate_crop.copy(),
                                            v_crop.copy() if v_crop is not None else None
                                        )
                                except Exception:
                                    pass

                        # Yellow Box Zone Dwell Timer Logic
                        if is_in_zone:
                            if not is_loading:
                                # Normal vehicle dwelling in yellow box without passengers -> countdown to violation
                                if obj_id not in self.vehicle_timers:
                                    self.vehicle_timers[obj_id] = current_time
                                
                                elapsed = current_time - self.vehicle_timers[obj_id]
                                if elapsed >= time_limit and obj_id not in self.violated_ids:
                                    self.violated_ids.add(obj_id)
                                    self._save_violation(
                                        frame, bbox, obj_id, 
                                        'vehicle', 
                                        elapsed,
                                        confidence=self.vehicle_confidences.get(obj_id, 0.0)
                                    )
                            else:
                                # Legitimate passenger boarding/alighting -> RESET TIMER BACK TO 15s
                                self.vehicle_timers.pop(obj_id, None)
                        else:
                            # Vehicle cleared or left yellow box zone without violation
                            if obj_id not in self.violated_ids:
                                self.cached_plates.pop(obj_id, None)
                                self.cached_plate_scores.pop(obj_id, None)
                                self.cached_plate_validated.pop(obj_id, None)
                            self.vehicle_timers.pop(obj_id, None)
                        
                        # Periodic local check
                        if ai_frames % 10 == 0:
                            self._check_zone_update()
                except Exception as e:
                    logging.error(f"Error in AI loop iteration: {e}")
                    time.sleep(0.05)

        except Exception as e:
            logging.error(f"Error in AI loop: {e}")

    def _check_zone_update(self):
        """Checks if the zone configuration has changed and updates the shared state."""
        new_coords = config.YELLOW_BOX_ZONE
        if new_coords != self.zone_coords:
            logging.info("Zone configuration change detected. Updating monitoring area...")
            self.zone_coords = new_coords
            self.yellow_zone = np.array(new_coords, np.int32).reshape((-1, 1, 2))

    def _set_placeholder_frame(self, text):
        """Sets a placeholder frame for UI feedback while camera is starting."""
        w = getattr(config, 'FRAME_WIDTH', 1280)
        h = getattr(config, 'FRAME_HEIGHT', 720)
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Gradient background for premium feel
        for i in range(h):
            color = int(20 + (i/h)*30)
            frame[i, :] = (color, color, color)
        
        cv2.putText(frame, text, (w // 3, h // 2), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        res, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
        if res:
            self.latest_frame = buffer.tobytes()

monitoring_service = MonitoringService()
