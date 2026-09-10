"""
Unit tests for Enhanced Vehicle Color Detection AI Module.
"""

import os
import sys
import unittest
import numpy as np
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ai_model.color_detector import (
    VehicleColorDetector,
    VehicleColorTracker,
    vehicle_color_detector,
    vehicle_color_tracker,
)


def create_synthetic_vehicle_crop(bgr_color, glare=False, shadow=False, size=(120, 100)):
    """
    Creates a synthetic vehicle crop simulating body paint with optional glare and shadow.
    """
    h, w = size
    crop = np.zeros((h, w, 3), dtype=np.uint8)
    crop[:] = bgr_color

    # Add simulated windshield / cabin in top-center
    crop[int(h * 0.15):int(h * 0.40), int(w * 0.20):int(w * 0.80)] = [25, 25, 25]

    # Add simulated tires at bottom
    crop[int(h * 0.82):, :] = [15, 15, 15]

    if glare:
        # Sun specular reflection on hood
        crop[int(h * 0.55):int(h * 0.62), int(w * 0.35):int(w * 0.65)] = [255, 255, 255]

    if shadow:
        # Shadow along one side
        crop[:, :int(w * 0.15)] = np.clip(crop[:, :int(w * 0.15)] * 0.4, 0, 255).astype(np.uint8)

    return crop


class TestVehicleColorDetector(unittest.TestCase):

    def setUp(self):
        self.detector = VehicleColorDetector()

    def test_white_detection(self):
        crop = create_synthetic_vehicle_crop([235, 235, 235], glare=True)
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "White")
        self.assertGreater(conf, 0.70)

    def test_black_detection(self):
        crop = create_synthetic_vehicle_crop([30, 30, 30], shadow=True)
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Black")
        self.assertGreater(conf, 0.70)

    def test_silver_gray_detection(self):
        crop = create_synthetic_vehicle_crop([150, 150, 150])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Silver / Gray")
        self.assertGreater(conf, 0.70)

    def test_red_detection(self):
        # Bright Red (BGR: 20, 20, 210)
        crop = create_synthetic_vehicle_crop([20, 20, 210], glare=True)
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Red")
        self.assertGreater(conf, 0.70)

    def test_maroon_dark_red_mapping(self):
        # Deep Maroon / Burgundy (BGR: 20, 15, 110)
        crop = create_synthetic_vehicle_crop([20, 15, 110])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Red")
        self.assertGreater(conf, 0.65)

    def test_blue_detection(self):
        # Royal Blue (BGR: 200, 70, 20)
        crop = create_synthetic_vehicle_crop([200, 70, 20], glare=True)
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Blue")
        self.assertGreater(conf, 0.70)

    def test_navy_dark_blue_mapping(self):
        # Navy Blue (BGR: 110, 35, 15)
        crop = create_synthetic_vehicle_crop([110, 35, 15])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Blue")
        self.assertGreater(conf, 0.65)

    def test_yellow_detection(self):
        # Yellow taxi (BGR: 25, 210, 240)
        crop = create_synthetic_vehicle_crop([25, 210, 240])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Yellow")
        self.assertGreater(conf, 0.70)

    def test_green_detection(self):
        # Green vehicle (BGR: 40, 180, 40)
        crop = create_synthetic_vehicle_crop([40, 180, 40])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Green")
        self.assertGreater(conf, 0.70)

    def test_orange_detection(self):
        # Orange vehicle (BGR: 20, 120, 235)
        crop = create_synthetic_vehicle_crop([20, 120, 235])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Orange")
        self.assertGreater(conf, 0.70)

    def test_brown_bronze_detection(self):
        # Bronze / Brown vehicle (BGR: 35, 65, 120)
        crop = create_synthetic_vehicle_crop([35, 65, 120])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Brown / Bronze")
        self.assertGreater(conf, 0.65)

    def test_gold_champagne_detection(self):
        # Gold / Champagne vehicle (BGR: 130, 190, 210)
        crop = create_synthetic_vehicle_crop([130, 190, 210])
        color, conf = self.detector.detect_color(crop, vehicle_type='car')
        self.assertEqual(color, "Gold / Champagne")
        self.assertGreater(conf, 0.65)

    def test_empty_or_tiny_crop_fallback(self):
        # Empty or tiny crop should return safe fallback without crashing
        c1, _ = self.detector.detect_color(None)
        self.assertEqual(c1, "White")
        c2, _ = self.detector.detect_color(np.zeros((4, 4, 3), dtype=np.uint8))
        self.assertEqual(c2, "White")

    def test_body_panel_extraction_types(self):
        crop = np.zeros((100, 100, 3), dtype=np.uint8)
        for vtype in ('car', 'bus', 'truck', 'motorcycle'):
            panels = self.detector.extract_body_panels(crop, vehicle_type=vtype)
            self.assertGreater(len(panels), 0)
            for p in panels:
                self.assertGreater(p.size, 0)


class TestVehicleColorTracker(unittest.TestCase):

    def setUp(self):
        self.tracker = VehicleColorTracker(history_size=6)

    def test_temporal_smoothing_and_confidence(self):
        # Simulate 5 frames of Red car with 1 momentary white glare frame in the middle
        red_crop = create_synthetic_vehicle_crop([20, 20, 210])
        white_glare = create_synthetic_vehicle_crop([245, 245, 245])

        obj_id = 42
        self.tracker.update(obj_id, red_crop, vehicle_type='car')
        self.tracker.update(obj_id, red_crop, vehicle_type='car')
        # Momentary flare
        self.tracker.update(obj_id, white_glare, vehicle_type='car')
        self.tracker.update(obj_id, red_crop, vehicle_type='car')
        self.tracker.update(obj_id, red_crop, vehicle_type='car')

        color, conf = self.tracker.get_color(obj_id)
        # Glare is smoothed out by temporal history
        self.assertEqual(color, "Red")
        self.assertGreater(conf, 0.75)

    def test_tracker_cleanup(self):
        obj_id = 99
        crop = create_synthetic_vehicle_crop([200, 70, 20])
        self.tracker.update(obj_id, crop, vehicle_type='car')
        self.assertIn(obj_id, self.tracker.tracks)

        # Clean up with active IDs excluding 99
        self.tracker.clean_up(active_ids=[101, 102])
        self.assertNotIn(obj_id, self.tracker.tracks)


if __name__ == '__main__':
    unittest.main()
