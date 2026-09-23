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

        # High-performance inference with YOLOv8 using torch.inference_mode()
        try:
            with torch.inference_mode():
                results = self.model(
                    frame, 
                    conf=self.conf_thres, 
                    iou=0.3, 
                    agnostic_nms=True, 
                    verbose=False, 
                    imgsz=640,
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
                    detections.append({
                        'bbox': [int(x) for x in xyxy_arr[i]],
                        'confidence': float(conf_arr[i]),
                        'class': int(cls_arr[i])
                    })
            except Exception as e:
                logging.warning(f"Error parsing detection boxes: {e}")

        return detections

