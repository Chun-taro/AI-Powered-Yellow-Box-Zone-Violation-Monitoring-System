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
        self.last_access_time = 0
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
        self.pending_lpr_ids = set()
        self.lpr_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="LPR_Worker")
        
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
        self.bbox_to_label = {}
        
        # Initialize placeholder frame for immediate feedback
        self._set_placeholder_frame("Initializing system...")
        
        self._initialized = True
        logging.info("MonitoringService singleton initialized")

    def _load_model_async(self):
        """Loads the AI model and LPR in a background thread."""
        try:
            model_path = os.path.join(os.getcwd(), config.MODEL_PATH)
            self.detector = VehicleDetector(
                model_path=model_path,
                conf_thres=config.CONFIDENCE_THRESHOLD
            )
            self.ai_loading = False
            logging.info("✓ AI Model loaded and ready (Background Thread)")
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
                    self.thread.join(timeout=1.0)
                if hasattr(self, 'ai_thread') and self.ai_thread:
                    self.ai_thread.join(timeout=1.0)
                
                if self.camera:
                    self.camera.close()
                    self.camera = None
                
                self.detector = None # Let GC handle it
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
            self.tracker = CentroidTracker(max_disappeared=15, max_distance=200)
            
            # Initial zone trigger
            self._check_zone_update()
            
            # Constants
            frame_skip = int(getattr(config, 'FRAME_SKIP', 2))
            jpeg_quality = int(getattr(config, 'JPEG_QUALITY', 70))
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
                current_detections = list(self.tracked_objects_map.items())
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
                    
                    if not is_in_zone: continue
                    
                    color = (255, 0, 0) # Blue
                    is_loading = (time.time() - self.vehicle_loading_status.get(obj_id, 0)) < 1.0

                    if obj_id in self.violated_ids: 
                        color = (0, 0, 255) # Red
                    elif is_loading:
                        cv2.putText(frame, "LOADING 15s", (x1, y1-20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                        color = (0, 255, 255) # Yellow/Cyan
                    elif obj_id in self.vehicle_timers:
                        elapsed = time.time() - self.vehicle_timers[obj_id]
                        rem = max(0, int(time_limit - elapsed))
                        cv2.putText(frame, f"{rem}s", (x1, y1-20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)
                        color = (0, 165, 255) # Orange
                    
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)
                    cv2.putText(frame, f"Vehicle #{obj_id}", (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

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
                
                # Maintain target FPS to match hardware capability (60 FPS)
                target_delay = 1.0 / getattr(config, 'FPS', 60)
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
        
        self.fps_current = 0
        self.fps_ai = 0
        self.person_count = 0
        self.vehicle_count = 0

    def _extract_vehicle_color(self, crop_img):
        """
        Extract dominant vehicle body color using multi-region outer panel sampling.
        Excludes dark inner cabin cavities, tires, and windshield reflections.
        """
        if crop_img is None or crop_img.size == 0:
            return "White"
        try:
            h, w, _ = crop_img.shape
            if h < 12 or w < 12:
                return "White"
            
            # Sample outer body panels (Roof, Left Pillar, Right Pillar, Lower Tailgate/Panel)
            # Avoid the central open cavity / passenger cabin shadow
            roof_sample = crop_img[int(h * 0.06):int(h * 0.32), int(w * 0.15):int(w * 0.85)]
            left_pillar = crop_img[int(h * 0.20):int(h * 0.72), int(w * 0.04):int(w * 0.32)]
            right_pillar = crop_img[int(h * 0.20):int(h * 0.72), int(w * 0.68):int(w * 0.96)]
            lower_body = crop_img[int(h * 0.55):int(h * 0.78), int(w * 0.15):int(w * 0.85)]

            samples = [s for s in [roof_sample, left_pillar, right_pillar, lower_body] if s is not None and s.size > 0]
            if not samples:
                samples = [crop_img]

            # Aggregate sampled body pixels
            hsv_samples = [cv2.cvtColor(s, cv2.COLOR_BGR2HSV) for s in samples]

            chromatic_counts = {
                "Red": 0, "Blue": 0, "Green": 0, "Yellow": 0, "Orange": 0
            }
            achromatic_counts = {
                "White": 0, "Silver / Gray": 0, "Black": 0
            }
            total_sampled_pixels = 0

            for hsv in hsv_samples:
                total_sampled_pixels += hsv.shape[0] * hsv.shape[1]
                
                # Chromatic masks (S >= 45, V >= 50)
                m_red1 = cv2.inRange(hsv, np.array([0, 45, 50]), np.array([10, 255, 255]))
                m_red2 = cv2.inRange(hsv, np.array([160, 45, 50]), np.array([180, 255, 255]))
                chromatic_counts["Red"] += cv2.countNonZero(cv2.bitwise_or(m_red1, m_red2))
                
                m_blue = cv2.inRange(hsv, np.array([88, 45, 50]), np.array([135, 255, 255]))
                chromatic_counts["Blue"] += cv2.countNonZero(m_blue)

                m_green = cv2.inRange(hsv, np.array([36, 45, 50]), np.array([86, 255, 255]))
                chromatic_counts["Green"] += cv2.countNonZero(m_green)

                m_yellow = cv2.inRange(hsv, np.array([16, 45, 80]), np.array([35, 255, 255]))
                chromatic_counts["Yellow"] += cv2.countNonZero(m_yellow)

                m_orange = cv2.inRange(hsv, np.array([11, 55, 80]), np.array([18, 255, 255]))
                chromatic_counts["Orange"] += cv2.countNonZero(m_orange)

                # Achromatic masks
                # White: Bright painted panels (V >= 125, S <= 65)
                m_white = cv2.inRange(hsv, np.array([0, 0, 125]), np.array([180, 65, 255]))
                achromatic_counts["White"] += cv2.countNonZero(m_white)

                # Silver / Gray: Medium brightness, low saturation (60 <= V < 125, S <= 45)
                m_silver = cv2.inRange(hsv, np.array([0, 0, 60]), np.array([180, 45, 124]))
                achromatic_counts["Silver / Gray"] += cv2.countNonZero(m_silver)

                # Black: Deep dark painted body (V < 45, S <= 55)
                m_black = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 55, 45]))
                achromatic_counts["Black"] += cv2.countNonZero(m_black)

            if total_sampled_pixels == 0:
                return "White"

            best_chromatic = max(chromatic_counts, key=chromatic_counts.get)
            best_chromatic_count = chromatic_counts[best_chromatic]

            # If there is a prominent chromatic color (e.g. Green, Red, Blue vehicle)
            if best_chromatic_count >= (total_sampled_pixels * 0.12):
                return best_chromatic

            # Otherwise, classify based on achromatic body panel dominance
            white_c = achromatic_counts["White"]
            silver_c = achromatic_counts["Silver / Gray"]
            black_c = achromatic_counts["Black"]

            if white_c >= silver_c and white_c >= (total_sampled_pixels * 0.20):
                return "White"
            elif silver_c >= (total_sampled_pixels * 0.25):
                return "Silver / Gray"
            elif black_c >= (total_sampled_pixels * 0.45):
                return "Black"
            else:
                return "White"
        except Exception as e:
            logging.warning(f"Vehicle color detection error: {e}")
            return "White"

    def _save_violation(self, frame, bbox, obj_id, label, elapsed, confidence=0.0):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        x1, y1, x2, y2 = bbox
        h, w, _ = frame.shape
        pad = 50
        cx1, cy1, cx2, cy2 = max(0, x1-pad), max(0, y1-pad), min(w, x2+pad), min(h, y2+pad)
        cropped = frame[cy1:cy2, cx1:cx2].copy()
        cv2.rectangle(cropped, (x1-cx1, y1-cy1), (x2-cx1, y2-cy1), (0, 0, 255), 2)
        cv2.putText(cropped, "VIOLATION", (x1-cx1, y1-cy1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # Extract vehicle color
        vehicle_crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        vehicle_color = self._extract_vehicle_color(vehicle_crop)
        
        # Overlay color on evidence screenshot in its EXACT matching color (with high-contrast stroke)
        color_bgr_map = {
            "White": (255, 255, 255),
            "Black": (45, 45, 45),
            "Silver / Gray": (200, 200, 200),
            "Red": (0, 0, 255),
            "Blue": (255, 120, 0),        # Vibrant Blue
            "Yellow": (0, 230, 255),       # Vibrant Yellow
            "Green": (0, 230, 0),         # Vibrant Green
            "Orange": (0, 140, 255),       # Vibrant Orange
        }
        text_bgr = color_bgr_map.get(vehicle_color, (255, 255, 255))
        outline_bgr = (255, 255, 255) if vehicle_color == "Black" else (0, 0, 0)

        # Draw crisp high-contrast outline first, then colored fill
        text_pos = (x1-cx1, y2-cy1+40)
        cv2.putText(cropped, f"COLOR: {vehicle_color}", text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.6, outline_bgr, 4)
        cv2.putText(cropped, f"COLOR: {vehicle_color}", text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_bgr, 2)

        # --- LPR: Read plate or use pre-captured plate (if enabled by admin) ---
        plate_number = None
        if getattr(config, 'LPR_ENABLED', True):
            plate_number = self.cached_plates.get(obj_id)
            if not plate_number:
                try:
                    plate_crop = crop_plate_region(frame, bbox)
                    v_crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                    if plate_crop is not None:
                        plate_number = lpr_reader.read_plate(plate_crop, full_vehicle_crop=v_crop)
                except Exception as e:
                    logging.warning(f"LPR failed for vehicle {obj_id}: {e}")
            
            if plate_number:
                logging.info(f"LPR confirmed plate: {plate_number} for vehicle ID {obj_id}")
                cv2.putText(cropped, f"PLATE: {plate_number}",
                            (x1-cx1, y2-cy1+20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                plate_number = "UNREADABLE"
        else:
            plate_number = "LPR DISABLED"
        
        filename = f"violation_{timestamp}_{label}_{obj_id}.jpg"
        save_path = os.path.join("static", "violations", filename)
        cv2.imwrite(save_path, cropped)
        
        db_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        db_image_path = f"violations/{filename}"
        location_name = "Sayre Highway - Fortich St., Malaybalay City"
        
        try:
            if hasattr(self.db, 'insert_violation'):
                ret, buffer = cv2.imencode('.jpg', cropped)
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
            read_p = lpr_reader.read_plate(plate_crop, full_vehicle_crop=v_crop)
            if read_p:
                self.cached_plates[obj_id] = read_p
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

                    h, w = frame.shape[:2]

                    # AI Inference (Full frame)
                    detections_raw = self.detector.detect(frame)
                    
                    class_names = {0: 'person', 2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck'}
                    raw_vehicles = []
                    raw_persons = []
                    
                    for detection in detections_raw:
                        cls_id = detection['class']
                        conf = detection['confidence']
                        if cls_id not in class_names: continue
                        raw_label = class_names[cls_id]
                        label = 'car' if raw_label in ['truck', 'bus', 'vehicle', 'motorcycle'] else raw_label
                        v_type = raw_label  # Preserves exact type ('motorcycle', 'car', etc.)
                        x1, y1, x2, y2 = map(int, detection['bbox'])
                        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                        
                        # -----------------------------------------------------------------
                        # STRICT ANGLED PERSPECTIVE ROI FILTER (LEFT-LANE DISCARD):
                        # Completely ignore any vehicle, motorcycle, or pedestrian on the
                        # left side or center lane of the road.
                        # -----------------------------------------------------------------
                        if label == 'car':
                            if not self._is_on_right_side(cx, cy, margin=35) and not self._is_on_right_side(x2, cy, margin=35):
                                continue
                            raw_vehicles.append((x1, y1, x2, y2, cx, cy, conf, label, v_type))
                        elif label == 'person':
                            if conf < 0.25: continue
                            # STRICT: Person MUST be on or to the right of the angled left boundary
                            if not self._is_on_right_side(cx, cy, margin=0) and not self._is_on_right_side(x2, cy, margin=0):
                                continue
                            raw_persons.append((x1, y1, x2, y2, cx, cy, conf))

                    # Deduplicate overlapping vehicle detections (NMS)
                    # Only deduplicates duplicate bounding boxes of the SAME vehicle at the SAME depth,
                    # NEVER dropping distinct vehicles at different depths along the lane.
                    if len(raw_vehicles) > 1:
                        raw_vehicles_sorted = sorted(raw_vehicles, key=lambda x: x[6], reverse=True)
                        deduped_vehicles = []
                        for rv in raw_vehicles_sorted:
                            box_a = [rv[0], rv[1], rv[2], rv[3]]
                            area_a = max(1, (box_a[2] - box_a[0]) * (box_a[3] - box_a[1]))
                            is_dup = False
                            for dk in deduped_vehicles:
                                box_b = [dk[0], dk[1], dk[2], dk[3]]
                                area_b = max(1, (box_b[2] - box_b[0]) * (box_b[3] - box_b[1]))
                                
                                # Road contact difference (Depth check)
                                y2_diff = abs(box_a[3] - box_b[3])
                                iou = compute_iou(box_a, box_b)
                                
                                inter_w = max(0, min(box_a[2], box_b[2]) - max(box_a[0], box_b[0]))
                                inter_h = max(0, min(box_a[3], box_b[3]) - max(box_a[1], box_b[1]))
                                containment = float(inter_w * inter_h) / min(area_a, area_b)
                                
                                # Two boxes are duplicates of the SAME vehicle ONLY if they share the same road contact (depth)
                                # AND have either high IoU (> 0.65) or high containment (> 0.85)
                                if y2_diff <= 28 and (iou > 0.65 or containment > 0.85):
                                    is_dup = True
                                    break
                            if not is_dup:
                                deduped_vehicles.append(rv)
                        raw_vehicles = deduped_vehicles

                    # 1. Process all detected vehicles
                    detections_for_tracker = []
                    bbox_to_label = {}
                    bbox_to_conf = {}
                    vehicle_count = 0
                    vehicle_boxes_all = []

                    for v in raw_vehicles:
                        vx1, vy1, vx2, vy2, vcx, vcy, vconf, vlabel, vtype = v
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
                            bbox_to_label[rect] = vlabel
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

                        # Strict check: Person must be strictly on or to the right of the yellow boundary
                        if not self._is_on_right_side(pcx, pcy, margin=0):
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

                    self.person_count = person_count
                    self.vehicle_count = vehicle_count
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

                        # Yellow Box Zone Dwell Timer Logic
                        if is_in_zone:
                            # Pre-capture LPR plate while inside yellow box zone ASYNCHRONOUSLY (Zero AI thread blocking)
                            if getattr(config, 'LPR_ENABLED', True) and (obj_id not in self.cached_plates or self.cached_plates[obj_id] is None):
                                if obj_id not in self.pending_lpr_ids and (ai_frames % 5 == 0):
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

                            if not is_loading:
                                # Normal vehicle dwelling in yellow box without passengers -> countdown to violation
                                if obj_id not in self.vehicle_timers:
                                    self.vehicle_timers[obj_id] = current_time
                                
                                elapsed = current_time - self.vehicle_timers[obj_id]
                                if elapsed >= time_limit and obj_id not in self.violated_ids:
                                    self.violated_ids.add(obj_id)
                                    self._save_violation(
                                        frame, bbox, obj_id, 
                                        self.vehicle_types.get(obj_id, 'car'), 
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
