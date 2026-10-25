import unittest
import numpy as np
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ai_model.tracker import CentroidTracker, compute_iou


class TestCentroidTrackerStability(unittest.TestCase):
    def setUp(self):
        self.tracker = CentroidTracker(max_disappeared=30, max_distance=200)

    def test_stationary_deadband_stability(self):
        """Test that stationary vehicle bounding box does not jitter or change dimensions."""
        box0 = [200, 300, 450, 600]  # w=250, h=300
        self.tracker.update([box0])

        np.random.seed(42)
        widths = []
        heights = []
        for _ in range(20):
            noise = np.random.randint(-4, 5, size=4)
            noisy_box = [box0[0] + noise[0], box0[1] + noise[1], box0[2] + noise[2], box0[3] + noise[3]]
            objs = self.tracker.update([noisy_box])
            b = objs[1][1]
            widths.append(b[2] - b[0])
            heights.append(b[3] - b[1])

        # Width and height variance must be practically 0 (within 2 pixels across 20 noisy frames)
        self.assertLessEqual(max(widths) - min(widths), 2)
        self.assertLessEqual(max(heights) - min(heights), 2)

    def test_moving_vehicle_shape_stability(self):
        """Test that moving vehicle preserves its aspect ratio and dimensions smoothly."""
        box0 = [150, 200, 350, 450]  # w=200, h=250
        self.tracker.update([box0])

        np.random.seed(123)
        widths = []
        heights = []
        for i in range(15):
            noise = np.random.randint(-2, 3, size=4)
            # Vehicle moves 8px horizontally and 6px vertically per frame
            true_box = [box0[0] + (i + 1) * 8, box0[1] + (i + 1) * 6, box0[2] + (i + 1) * 8, box0[3] + (i + 1) * 6]
            detected = [true_box[0] + noise[0], true_box[1] + noise[1], true_box[2] + noise[2], true_box[3] + noise[3]]
            objs = self.tracker.update([detected])
            b = objs[1][1]
            widths.append(b[2] - b[0])
            heights.append(b[3] - b[1])

        # Moving width and height must remain stable without expanding or contracting drastically
        self.assertLessEqual(max(widths) - min(widths), 4)
        self.assertLessEqual(max(heights) - min(heights), 4)

    def test_partial_occlusion_aspect_ratio_retention(self):
        """Test that momentary partial occlusions do not warp the vehicle shape permanently."""
        box0 = [100, 200, 300, 450]  # w=200, h=250, AR = 0.80
        for _ in range(5):
            self.tracker.update([box0])

        # Momentary partial occlusion where detector misses bottom 60px
        clipped_box = [100, 200, 300, 390]
        objs = self.tracker.update([clipped_box])
        b = objs[1][1]
        w = b[2] - b[0]
        h = b[3] - b[1]

        # Shape regularizer prevents instant collapse
        self.assertGreater(h, 235)


if __name__ == '__main__':
    unittest.main()
