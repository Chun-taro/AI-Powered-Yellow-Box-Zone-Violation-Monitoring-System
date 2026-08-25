# System configuration settings
import os

# Define the absolute path to the project's root directory
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    # Camera settings
    # Use environment variable for camera source if available, otherwise use default.
    # Example: export CAMERA_SOURCE=0 for a webcam
    camera_source = os.getenv('CAMERA_SOURCE', 'camera/test_video5.mp4')
  
    FRAME_WIDTH = 1280
    FRAME_HEIGHT = 720
    FPS = 30

    # Detection settings
    CONFIDENCE_THRESHOLD = 0.25  # Higher threshold = more accurate labels, fewer false detections
    # To use the generic pretrained model, simply use its name.
    # Ultralytics will download it automatically on the first run.
    MODEL_PATH = os.path.join(BASE_DIR, 'ai_model', 'models', 'yolov8s.pt')

    # Zone settings
    ZONE_CONFIG_PATH = os.path.join(BASE_DIR, 'zone_config.json')

    def load_zone_config(self):
        import json
        try:
            if os.path.exists(self.ZONE_CONFIG_PATH):
                with open(self.ZONE_CONFIG_PATH, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading zone config: {e}")
        
        # Default coordinates if file doesn't exist or fails
        return [
            (865, 587),
            (1057, 617),
            (1152, 247),
            (1074, 230),
        ]

    def save_zone_config(self, coordinates):
        import json
        try:
            # Ensure coordinates are integers
            cleaned_coords = [[int(x), int(y)] for x, y in coordinates]
            with open(self.ZONE_CONFIG_PATH, 'w') as f:
                json.dump(cleaned_coords, f)
            self.YELLOW_BOX_ZONE = cleaned_coords
            return True
        except Exception as e:
            print(f"Error saving zone config: {e}")
            return False

    # System settings
    SYSTEM_CONFIG_PATH = os.path.join(BASE_DIR, 'system_config.json')

    def load_system_config(self):
        import json
        default_cfg = {'lpr_enabled': True}
        try:
            if os.path.exists(self.SYSTEM_CONFIG_PATH):
                with open(self.SYSTEM_CONFIG_PATH, 'r') as f:
                    data = json.load(f)
                    return {**default_cfg, **data}
        except Exception as e:
            print(f"Error loading system config: {e}")
        return default_cfg

    def save_system_config(self, cfg_data):
        import json
        try:
            current = self.load_system_config()
            current.update(cfg_data)
            with open(self.SYSTEM_CONFIG_PATH, 'w') as f:
                json.dump(current, f, indent=2)
            self._system_config = current
            return True
        except Exception as e:
            print(f"Error saving system config: {e}")
            return False

    @property
    def LPR_ENABLED(self):
        if not hasattr(self, '_system_config'):
            self._system_config = self.load_system_config()
        return self._system_config.get('lpr_enabled', True)

    @LPR_ENABLED.setter
    def LPR_ENABLED(self, value):
        self.save_system_config({'lpr_enabled': bool(value)})

    @property
    def YELLOW_BOX_ZONE(self):
        if not hasattr(self, '_yellow_box_zone'):
            self._yellow_box_zone = self.load_zone_config()
        return self._yellow_box_zone

    @YELLOW_BOX_ZONE.setter
    def YELLOW_BOX_ZONE(self, value):
        self._yellow_box_zone = value

    # Time limits
    STOP_TIME_LIMIT = 15  # seconds vehicle can stop in zone before violation

    # Performance optimization settings
    FRAME_SKIP = 3  # Process AI model every Nth frame (1=all frames for full 30 FPS if hardware allows)
    # Tip: Higher frame skip = faster apparent FPS output but less frequent 'AI brain' updates
    # Current: 3 = AI runs every 3rd frame for better streaming FPS on lower-end hardware
    
    JPEG_QUALITY = 60  # Optimized for faster streaming
    # Current: 70 = High quality streaming for clear vehicle detection
    # For ultra-high quality, increase to 80-90. For faster, use 50-60.

    # Database settings
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'violations.db')

    # Flask settings
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    HOST = os.getenv('HOST', '127.0.0.1')
    PORT = int(os.getenv('PORT', 5000))

    # Desktop App settings
    WINDOW_TITLE = 'Vehicle Yellow Box Zone Monitoring'

config = Config()
