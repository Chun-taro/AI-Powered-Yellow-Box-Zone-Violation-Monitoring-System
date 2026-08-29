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
        # Note: We use standard FP32 (half=False) to prevent 'CUDA illegal instruction' crashes on GPUs
        # that lack hardware FP16 tensor core support (e.g. GTX 1060/1070/1080/1650/1660/Pascal/Turing).
        if torch.cuda.is_available():
            try:
                # Test basic CUDA tensor operation
                _ = torch.zeros(1, device='cuda')
                self.device = 0
                self.half = False
                gpu_name = torch.cuda.get_device_name(0)
                logging.info(f"✓ AI Detector using GPU (CUDA: {gpu_name}) in reliable FP32 mode")
            except Exception as e:
                logging.warning(f"CUDA device check error: {e}. Defaulting to CPU mode.")
                self.device = 'cpu'
                self.half = False
        else:
            self.device = 'cpu'
            self.half = False
            logging.info("ℹ AI Detector using CPU mode")

        # Load YOLO model
        self.model = YOLO(self.model_path)
        
        # Move model to selected device
        try:
            self.model.to(self.device)
        except Exception as e:
            logging.warning(f"Could not move model to {self.device}: {e}. Defaulting to CPU.")
            self.device = 'cpu'
            self.half = False
            try:
                self.model.to('cpu')
            except Exception:
                pass

    def detect(self, frame):
        """
        Perform vehicle and person detection on a single video frame with automatic CUDA fallback.
        
        Args:
            frame (numpy.ndarray): Input BGR image frame
            
        Returns:
            list[dict]: List of detection dictionaries with 'bbox', 'confidence', and 'class'
        """
        if frame is None or frame.size == 0:
            return []

        # Inference with YOLOv8
        try:
            results = self.model(
                frame, 
                conf=self.conf_thres, 
                iou=0.3, 
                agnostic_nms=True, 
                verbose=False, 
                imgsz=640,
                device=self.device,
                half=self.half
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
                self.half = False
                try:
                    self.model.to('cpu')
                    results = self.model(
                        frame, 
                        conf=self.conf_thres, 
                        iou=0.3, 
                        agnostic_nms=True, 
                        verbose=False, 
                        imgsz=640,
                        device='cpu',
                        half=False
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
                    detections.append({
                        'bbox': [int(x) for x in xyxy_arr[i]],
                        'confidence': float(conf_arr[i]),
                        'class': int(cls_arr[i])
                    })
            except Exception as e:
                logging.warning(f"Error parsing detection boxes: {e}")

        return detections

