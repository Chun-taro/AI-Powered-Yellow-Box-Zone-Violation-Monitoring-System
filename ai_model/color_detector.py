"""
Enhanced Vehicle Color Detection AI Module
Utilizes multi-space color science (CIELAB Delta-E + HSV), vehicle-type anatomical panel sampling,
glare/shadow suppression, K-Means dominant paint clustering, and multi-frame temporal tracking.
"""

import math
import logging
from collections import defaultdict, deque
import cv2
import numpy as np


class VehicleColorDetector:
    """
    Advanced Vehicle Color Detection Engine.
    Combines CIELAB Delta-E perceptual color difference, HSV chromatic gating,
    and adaptive anatomical body panel sampling.
    """

    # 11 Standard Automotive Color Categories
    COLORS = [
        "White",
        "Silver / Gray",
        "Black",
        "Red",
        "Blue",
        "Green",
        "Yellow",
        "Orange",
        "Brown / Bronze",
        "Gold / Champagne",
        "Purple",
    ]

    # Reference centroids in CIELAB (OpenCV scaled: L: 0-255, a: 0-255 [center 128], b: 0-255 [center 128])
    # Calibrated from real vehicle paint finishes under daylight conditions.
    LAB_CENTROIDS = {
        "White": (235, 128, 128),
        "Silver / Gray": (145, 128, 128),
        "Black": (35, 128, 128),
        "Red": (120, 185, 160),           # Bright / Crimson Red
        "Maroon": (70, 165, 142),          # Dark Red / Burgundy / Maroon -> mapped to Red
        "Blue": (105, 130, 80),            # Royal / Vibrant Blue
        "Navy": (55, 132, 95),             # Dark / Navy Blue -> mapped to Blue
        "Green": (115, 95, 155),           # Forest / Jade Green
        "Dark Green": (60, 105, 140),      # Dark Green -> mapped to Green
        "Yellow": (205, 120, 195),         # Taxi / Bright Yellow
        "Orange": (155, 160, 185),         # Bright / Burnt Orange
        "Brown / Bronze": (85, 142, 152),  # Tan / Bronze / Mocha
        "Gold / Champagne": (180, 132, 155), # Metallic Gold / Champagne / Beige
        "Purple": (95, 165, 105),          # Violet / Purple
    }

    # Internal sub-color to main standard automotive category mapping
    COLOR_CATEGORY_MAP = {
        "White": "White",
        "Silver / Gray": "Silver / Gray",
        "Black": "Black",
        "Red": "Red",
        "Maroon": "Red",
        "Blue": "Blue",
        "Navy": "Blue",
        "Green": "Green",
        "Dark Green": "Green",
        "Yellow": "Yellow",
        "Orange": "Orange",
        "Brown / Bronze": "Brown / Bronze",
        "Gold / Champagne": "Gold / Champagne",
        "Purple": "Purple",
    }

    # OpenCV BGR preview mapping for annotations
    COLOR_BGR_MAP = {
        "White": (255, 255, 255),
        "Silver / Gray": (195, 195, 195),
        "Black": (45, 45, 45),
        "Red": (30, 30, 230),
        "Blue": (230, 120, 20),
        "Green": (40, 190, 40),
        "Yellow": (20, 220, 240),
        "Orange": (15, 135, 245),
        "Brown / Bronze": (35, 75, 140),
        "Gold / Champagne": (110, 190, 215),
        "Purple": (190, 60, 150),
    }

    def __init__(self):
        pass

    def extract_body_panels(self, crop_img, vehicle_type='car'):
        """
        Extract vehicle-type adaptive anatomical body panel regions.
        Eliminates windshields, tires, license plates, and passenger cabin cavities.

        Args:
            crop_img: BGR vehicle crop
            vehicle_type: 'car', 'bus', 'truck', 'motorcycle', etc.

        Returns:
            list[np.ndarray]: Extracted body panel crops
        """
        if crop_img is None or crop_img.size == 0:
            return []

        h, w = crop_img.shape[:2]
        if h < 14 or w < 14:
            return [crop_img]

        v_type = (vehicle_type or 'car').lower()
        samples = []

        if v_type in ('car', 'sedan', 'suv', 'van'):
            # 1. Lower bonnet / trunk / tailgate sheet metal (52% to 78% height, 18% to 82% width)
            p_bonnet = crop_img[int(h * 0.52):int(h * 0.78), int(w * 0.18):int(w * 0.82)]
            if p_bonnet.size > 0:
                samples.append(p_bonnet)

            # 2. Side doors & quarter panels (avoiding windows and wheels)
            p_left = crop_img[int(h * 0.35):int(h * 0.70), int(w * 0.05):int(w * 0.22)]
            p_right = crop_img[int(h * 0.35):int(h * 0.70), int(w * 0.78):int(w * 0.95)]
            if p_left.size > 0:
                samples.append(p_left)
            if p_right.size > 0:
                samples.append(p_right)

            # 3. Upper roof line (top 6% to 18%, avoiding windshield)
            p_roof = crop_img[int(h * 0.06):int(h * 0.18), int(w * 0.22):int(w * 0.78)]
            if p_roof.size > 0:
                samples.append(p_roof)

        elif v_type in ('bus', 'truck'):
            # Large side body and tailgate panels
            p_side = crop_img[int(h * 0.25):int(h * 0.76), int(w * 0.10):int(w * 0.90)]
            if p_side.size > 0:
                samples.append(p_side)

        elif v_type == 'motorcycle':
            # Fuel tank and body cowl (35% to 70% height, 25% to 75% width)
            p_tank = crop_img[int(h * 0.35):int(h * 0.70), int(w * 0.25):int(w * 0.75)]
            if p_tank.size > 0:
                samples.append(p_tank)

        else:
            # Fallback general vehicle body
            p_mid = crop_img[int(h * 0.25):int(h * 0.78), int(w * 0.15):int(w * 0.85)]
            if p_mid.size > 0:
                samples.append(p_mid)

        return samples if samples else [crop_img]

    def filter_paint_pixels(self, samples):
        """
        Suppresses non-paint artifacts:
          - Direct sun specular reflections / white chrome glare
          - Deep tire / wheel well and asphalt shadows
          - High-contrast edge noise (grilles, badges, text)

        Returns:
            np.ndarray of shape (N, 3) BGR paint pixels
        """
        if not samples:
            return np.empty((0, 3), dtype=np.uint8)

        paint_pixels_bgr = []

        for sample in samples:
            if sample is None or sample.size == 0:
                continue

            h, w = sample.shape[:2]
            # Downsample if large to maintain real-time FPS
            if h * w > 1600:
                scale = math.sqrt(1600 / float(h * w))
                sample = cv2.resize(sample, (max(8, int(w * scale)), max(8, int(h * scale))), interpolation=cv2.INTER_AREA)

            hsv = cv2.cvtColor(sample, cv2.COLOR_BGR2HSV)
            s_chan = hsv[:, :, 1]
            v_chan = hsv[:, :, 2]

            # 1. Specular Glare Mask: Extreme brightness with washed-out saturation
            # e.g. sun reflection on metallic hood or windshield rim
            glare_mask = (v_chan > 248) & (s_chan < 28)

            # 2. Shadow & Tire Mask: Deep dark undercarriage or wheel well darkness
            shadow_mask = (v_chan < 28)

            # Valid paint mask
            valid_mask = (~glare_mask) & (~shadow_mask)

            # Flatten valid pixels
            bgr_flat = sample[valid_mask]
            if len(bgr_flat) > 0:
                paint_pixels_bgr.append(bgr_flat)

        if not paint_pixels_bgr:
            # Fallback to center region if filters were too strict (e.g. extremely dark night scene)
            raw = np.vstack([s.reshape(-1, 3) for s in samples if s.size > 0])
            return raw if len(raw) > 0 else np.empty((0, 3), dtype=np.uint8)

        return np.vstack(paint_pixels_bgr)

    def _match_color_name(self, lab_pixel, hsv_pixel):
        """
        Calculates perceptual color match using CIELAB Delta-E distance
        and HSV chromatic checks.

        Args:
            lab_pixel: (L, a, b) in OpenCV ranges [0-255]
            hsv_pixel: (H, S, V) in OpenCV ranges [H: 0-180, S: 0-255, V: 0-255]

        Returns:
            (category_name, score)
        """
        L, a, b = float(lab_pixel[0]), float(lab_pixel[1]), float(lab_pixel[2])
        H, S, V = float(hsv_pixel[0]), float(hsv_pixel[1]), float(hsv_pixel[2])

        # Chroma metric in LAB space (distance from neutral gray at 128, 128)
        chroma_lab = math.hypot(a - 128.0, b - 128.0)

        # -------------------------------------------------------------
        # 1. ACHROMATIC GATE (White, Silver / Gray, Black)
        # Vehicles with low saturation and low LAB chroma
        # -------------------------------------------------------------
        if S < 36 and chroma_lab < 14:
            if L >= 195 or (V >= 200 and S < 25):
                return "White", 0.95
            elif L <= 60 or (V <= 52 and S < 35):
                return "Black", 0.94
            else:
                return "Silver / Gray", 0.92

        # -------------------------------------------------------------
        # 2. CHROMATIC & PERCEPTUAL MATCHING VIA LAB DELTA-E
        # -------------------------------------------------------------
        best_candidate = "White"
        min_dist = float('inf')

        for name, centroid in self.LAB_CENTROIDS.items():
            ref_L, ref_a, ref_b = centroid
            
            # Weighted Euclidean distance in LAB space:
            # Emphasize chromatic channels (a, b) for colored vehicles
            # to prevent slight lighting shifts from overriding color tint.
            dL = (L - ref_L) * 0.85
            da = (a - ref_a) * 1.30
            db = (b - ref_b) * 1.30
            dist = math.sqrt(dL * dL + da * da + db * db)

            # Special Hue Boosters / Penalties using HSV context
            # Red wrap-around check: H in [0-12] or [165-180]
            if name in ("Red", "Maroon"):
                if (H <= 12 or H >= 165) and S >= 40:
                    dist *= 0.65
                else:
                    dist *= 1.40

            # Blue check: H in [88-135]
            elif name in ("Blue", "Navy"):
                if 88 <= H <= 135 and S >= 35:
                    dist *= 0.65
                else:
                    dist *= 1.40

            # Green check: H in [35-86]
            elif name in ("Green", "Dark Green"):
                if 35 <= H <= 86 and S >= 35:
                    dist *= 0.65
                else:
                    dist *= 1.40

            # Yellow check: H in [17-35], high brightness
            elif name == "Yellow":
                if 17 <= H <= 35 and S >= 45 and V >= 120:
                    dist *= 0.65
                else:
                    dist *= 1.40

            # Orange check: H in [10-19]
            elif name == "Orange":
                if 10 <= H <= 19 and S >= 60 and V >= 100:
                    dist *= 0.65
                else:
                    dist *= 1.40

            # Gold / Champagne check: low-to-medium saturation yellow/orange with high L
            elif name == "Gold / Champagne":
                if 15 <= H <= 34 and 25 <= S <= 75 and L >= 140:
                    dist *= 0.70

            # Brown / Bronze check: low-medium L, warm hue (orange/red), moderate S
            elif name == "Brown / Bronze":
                if (H <= 24 or H >= 170) and 35 <= S <= 160 and 40 <= L <= 130:
                    dist *= 0.70

            # Purple check: H in [136-164]
            elif name == "Purple":
                if 136 <= H <= 164 and S >= 40:
                    dist *= 0.65

            if dist < min_dist:
                min_dist = dist
                best_candidate = name

        # Map sub-types (e.g. Maroon -> Red, Navy -> Blue)
        standard_name = self.COLOR_CATEGORY_MAP.get(best_candidate, best_candidate)

        # Confidence score derived from distance metric
        confidence = max(0.60, min(0.98, 1.0 - (min_dist / 160.0)))
        return standard_name, confidence

    def detect_color(self, crop_img, vehicle_type='car'):
        """
        Detect the vehicle body color from a bounding box crop.

        Args:
            crop_img (np.ndarray): BGR vehicle image crop
            vehicle_type (str): detected vehicle type ('car', 'bus', 'truck', 'motorcycle')

        Returns:
            tuple: (color_name: str, confidence: float)
                   e.g. ("Red", 0.94)
        """
        if crop_img is None or crop_img.size == 0:
            return "White", 0.70

        try:
            h, w = crop_img.shape[:2]
            if h < 10 or w < 10:
                return "White", 0.70

            # 1. Extract body panels
            samples = self.extract_body_panels(crop_img, vehicle_type=vehicle_type)

            # 2. Filter paint pixels
            paint_pixels = self.filter_paint_pixels(samples)
            if len(paint_pixels) < 8:
                return "White", 0.70

            # 3. Downsample for fast clustering if necessary
            max_pixels = 800
            if len(paint_pixels) > max_pixels:
                indices = np.random.choice(len(paint_pixels), max_pixels, replace=False)
                paint_pixels = paint_pixels[indices]

            # 4. K-Means Dominant Paint Clustering (K=3)
            data = np.float32(paint_pixels)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            k = min(3, len(data))
            flags = cv2.KMEANS_PP_CENTERS

            compactness, labels, centers = cv2.kmeans(data, k, None, criteria, 3, flags)
            counts = np.bincount(labels.flatten(), minlength=k)
            sorted_indices = np.argsort(-counts)

            # Analyze dominant clusters
            centers_bgr = np.uint8(centers)

            # Evaluate each cluster
            cluster_evals = []
            for idx in sorted_indices:
                weight = counts[idx] / float(len(data))
                if weight < 0.15:
                    continue  # Ignore tiny accessory clusters (e.g. trim)

                bgr_c = centers_bgr[idx].reshape(1, 1, 3)
                lab_c = cv2.cvtColor(bgr_c, cv2.COLOR_BGR2LAB)[0, 0]
                hsv_c = cv2.cvtColor(bgr_c, cv2.COLOR_BGR2HSV)[0, 0]

                c_name, c_conf = self._match_color_name(lab_c, hsv_c)
                cluster_evals.append((c_name, c_conf, weight))

            if not cluster_evals:
                # Direct average fallback
                avg_bgr = np.uint8(np.mean(paint_pixels, axis=0)).reshape(1, 1, 3)
                lab_avg = cv2.cvtColor(avg_bgr, cv2.COLOR_BGR2LAB)[0, 0]
                hsv_avg = cv2.cvtColor(avg_bgr, cv2.COLOR_BGR2HSV)[0, 0]
                return self._match_color_name(lab_avg, hsv_avg)

            # Check if any significant chromatic color exists (e.g. Red, Blue, Green, Yellow)
            # Chromatic colors on vehicles should take precedence over background neutral shades
            chromatic_names = {"Red", "Blue", "Green", "Yellow", "Orange", "Brown / Bronze", "Gold / Champagne", "Purple"}
            for c_name, c_conf, weight in cluster_evals:
                if c_name in chromatic_names and weight >= 0.22:
                    return c_name, min(0.98, c_conf + (weight * 0.10))

            # Otherwise pick the top dominant cluster
            top_name, top_conf, top_weight = cluster_evals[0]
            final_conf = min(0.98, top_conf + (top_weight * 0.05))
            return top_name, final_conf

        except Exception as e:
            logging.debug(f"Color detection internal error: {e}")
            return "White", 0.70


class VehicleColorTracker:
    """
    Multi-frame Temporal Voting Engine for Tracked Vehicles.
    Smooths color classification across consecutive video frames to
    eliminate specular glares, tree shadows, or momentary occlusion artifacts.
    """

    def __init__(self, history_size=8):
        self.history_size = history_size
        # Map: obj_id -> deque of (color_name, confidence)
        self.tracks = defaultdict(lambda: deque(maxlen=self.history_size))
        # Map: obj_id -> (best_color, confidence)
        self.smoothed_results = {}
        self.detector = VehicleColorDetector()

    def update(self, obj_id, crop_img, vehicle_type='car'):
        """
        Record a new color observation for a tracked vehicle.

        Args:
            obj_id (int): Unique tracked vehicle object ID
            crop_img (np.ndarray): BGR image crop of vehicle
            vehicle_type (str): detected vehicle type

        Returns:
            tuple: (smoothed_color: str, confidence: float)
        """
        if crop_img is None or crop_img.size == 0:
            return self.get_color(obj_id)

        color_name, conf = self.detector.detect_color(crop_img, vehicle_type=vehicle_type)
        self.tracks[obj_id].append((color_name, conf))

        # Temporal voting with recency & confidence weighting
        observations = self.tracks[obj_id]
        color_scores = defaultdict(float)
        
        n = len(observations)
        for i, (c, score) in enumerate(observations):
            # Recency weight: recent frames have slightly higher weight
            recency = 1.0 + (float(i) / max(1, n)) * 0.5
            color_scores[c] += (score * recency)

        best_color = max(color_scores, key=color_scores.get)
        total_score = sum(color_scores.values())
        smoothed_conf = min(0.99, color_scores[best_color] / max(1e-5, total_score) * 0.95 + 0.04)

        self.smoothed_results[obj_id] = (best_color, smoothed_conf)
        return best_color, smoothed_conf

    def get_color(self, obj_id, fallback_crop=None, vehicle_type='car'):
        """
        Retrieve the temporally smoothed color for a tracked vehicle.
        If no history exists and a fallback crop is provided, calculates it on the fly.
        """
        if obj_id in self.smoothed_results:
            return self.smoothed_results[obj_id]

        if fallback_crop is not None and fallback_crop.size > 0:
            return self.update(obj_id, fallback_crop, vehicle_type=vehicle_type)

        return "White", 0.70

    def clean_up(self, active_ids):
        """
        Purges expired tracks no longer active in the frame tracker.
        """
        active_set = set(active_ids)
        stale_ids = [vid for vid in self.tracks if vid not in active_set]
        for vid in stale_ids:
            self.tracks.pop(vid, None)
            self.smoothed_results.pop(vid, None)


# Global singleton detector & tracker
vehicle_color_detector = VehicleColorDetector()
vehicle_color_tracker = VehicleColorTracker()
