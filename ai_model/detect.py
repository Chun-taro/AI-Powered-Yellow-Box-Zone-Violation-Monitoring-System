import os
import logging

try:
    import torch
    from ultralytics import YOLO
    TORCH_AVAILABLE = True
except Exception:
    TORCH_AVAILABLE = False


class VehicleDetector:
    """
    Optimized YOLOv8 Vehicle Detector with GPU auto-detection,
    reliable FP32 inference across all GPU architectures, and automatic CPU fallback.
    """
    def __init__(self, model_path, conf_thres=0.5):
        if not TORCH_AVAILABLE:
            raise ImportError("Ultralytics/PyTorch not available. Install via 'pip install ultralytics torch'")
        
        self.conf_thres = conf_thres
        self.model_path = model_path
        
        # Detect CUDA GPU availability
        if torch.cuda.is_available():
            try:
                # Test basic CUDA tensor operation
                _ = torch.zeros(1, device='cuda')
                self.device = 0
                gpu_name = torch.cuda.get_device_name(0)
                # Enable cuDNN benchmark mode for optimal GPU convolution algorithms
                torch.backends.cudnn.benchmark = True
                logging.info(f"✓ AI Detector using GPU (CUDA: {gpu_name}) with cuDNN benchmark")
            except Exception as e:
                logging.warning(f"CUDA device check error: {e}. Defaulting to CPU mode.")
                self.device = 'cpu'
        else:
            self.device = 'cpu'
            logging.info("ℹ AI Detector using CPU mode")

        # Load YOLO model
        self.model = YOLO(self.model_path)
        
        # Move model to selected device
        try:
            self.model.to(self.device)
        except Exception as e:
            logging.warning(f"Could not move model to {self.device}: {e}. Defaulting to CPU.")
            self.device = 'cpu'
            try:
                self.model.to('cpu')
            except Exception:
                pass

    @staticmethod
    def classify_domain_vehicle(raw_cls_id, bbox):
        """
        Specializes standard detection bounding boxes to Philippine traffic vehicle classes:
        - Multicab / PUJ: Light commercial microvans/jeepneys with boxy cab & passenger canopy.
        - Tricycle: Motorcycles with passenger sidecars (distinct aspect ratio & width).
        - Private Car / Sedan / SUV: Aerodynamic passenger vehicles.
        - Motorcycle: Two-wheeled vehicles without sidecars.
        - Bus / Truck: Heavy commercial vehicles.
        """
        x1, y1, x2, y2 = bbox
        w = max(1, x2 - x1)
        h = max(1, y2 - y1)
        aspect_ratio = float(w) / float(h)
        area = w * h

        # Class 0: Person / Pedestrian
        if raw_cls_id == 0:
            return 0, 'person'

        # Class 3: Motorcycle
        elif raw_cls_id == 3:
            # A standard motorcycle is narrow (aspect_ratio < 0.65).
            # A Philippine motorized tricycle has an attached passenger sidecar (aspect_ratio >= 0.68).
            if aspect_ratio >= 0.68 and w >= 35:
                return 11, 'tricycle'
            return 3, 'motorcycle'

        # Class 2: Car / Light Vehicle
        elif raw_cls_id == 2:
            # Very small vehicle with sidecar proportions
            if aspect_ratio <= 0.75 and area < 16000:
                return 11, 'tricycle'
            # Multicab / PUJ characteristics:
            # Boxy silhouette (aspect ratio 0.78 to 1.25), tall vertical cabin & passenger canopy
            elif 0.78 <= aspect_ratio <= 1.25 and h >= 48:
                return 10, 'multicab'
            else:
                return 2, 'car'

        # Class 5: Bus
        elif raw_cls_id == 5:
            return 5, 'bus'

        # Class 7: Truck
        elif raw_cls_id == 7:
            return 7, 'truck'

        # Default fallback
        return int(raw_cls_id), 'car'

    def detect(self, frame):
        """
        Perform vehicle and person detection on a single video frame with automatic CUDA fallback.
        
        Args:
            frame (numpy.ndarray): Input BGR image frame
            
        Returns:
            list[dict]: List of detection dictionaries with 'bbox', 'confidence', 'class', and 'vehicle_type'
        """
        if frame is None or frame.size == 0:
            return []

        # High-performance inference with YOLOv8 using torch.inference_mode()
        # Restrict detection classes to vehicle types and person [0: person, 2: car, 3: motorcycle, 5: bus, 7: truck]
        target_classes = [0, 2, 3, 5, 7]
        try:
            with torch.inference_mode():
                results = self.model(
                    frame, 
                    conf=self.conf_thres, 
                    iou=0.3, 
                    agnostic_nms=True, 
                    verbose=False, 
                    imgsz=640,
                    classes=target_classes,
                    device=self.device
                )
        except Exception as e:
            # Handle CUDA error (e.g. illegal instruction or out of memory) by falling back to CPU
            if self.device != 'cpu':
                logging.error(f"GPU inference error ({e}). Switching AI Detector to CPU mode.")
                try:
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except Exception:
                    pass
                self.device = 'cpu'
                try:
                    self.model.to('cpu')
                    results = self.model(
                        frame, 
                        conf=self.conf_thres, 
                        iou=0.3, 
                        agnostic_nms=True, 
                        verbose=False, 
                        imgsz=640,
                        classes=target_classes,
                        device='cpu'
                    )
                except Exception as ex:
                    logging.error(f"CPU fallback detection failed: {ex}")
                    return []
            else:
                logging.error(f"Detection failed: {e}")
                return []

        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is None or len(boxes) == 0:
                continue
            
            try:
                xyxy_arr = boxes.xyxy.cpu().numpy()
                conf_arr = boxes.conf.cpu().numpy()
                cls_arr = boxes.cls.cpu().numpy()

                for i in range(len(boxes)):
                    box = [int(x) for x in xyxy_arr[i]]
                    raw_cls = int(cls_arr[i])
                    spec_cls_id, spec_name = self.classify_domain_vehicle(raw_cls, box)

                    detections.append({
                        'bbox': box,
                        'confidence': float(conf_arr[i]),
                        'class': spec_cls_id,
                        'class_name': spec_name,
                        'vehicle_type': spec_name,
                        'raw_class': raw_cls
                    })
            except Exception as e:
                logging.warning(f"Error parsing detection boxes: {e}")

        return detections

