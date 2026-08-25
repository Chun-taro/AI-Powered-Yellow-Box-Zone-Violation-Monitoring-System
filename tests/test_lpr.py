import os
import sys
import unittest
import numpy as np
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ai_model.lpr import (
    validate_philippine_plate,
    clean_ocr_text,
    crop_plate_region,
    preprocess_plate_crop,
    preprocess_plate_variants,
    lpr_reader
)


class TestLPRModule(unittest.TestCase):

    def test_plate_validation_exact_patterns(self):
        # 3 letters + 4 digits
        self.assertEqual(validate_philippine_plate("ABC1234"), "ABC 1234")
        self.assertEqual(validate_philippine_plate("abc 1234"), "ABC 1234")
        self.assertEqual(validate_philippine_plate("CAA 9912"), "CAA 9912")

        # 3 letters + 3 digits
        self.assertEqual(validate_philippine_plate("NGA 543"), "NGA 543")

        # 2 letters + 4 digits (commercial / motorcycles)
        self.assertEqual(validate_philippine_plate("LF 0764"), "LF 0764")
        self.assertEqual(validate_philippine_plate("LF0764"), "LF 0764")
        self.assertEqual(validate_philippine_plate("ND8812"), "ND 8812")

        # 4 digits + 2 letters
        self.assertEqual(validate_philippine_plate("1234AB"), "1234 AB")

    def test_plate_validation_fuzzy_corrections(self):
        # Letter 'O' instead of digit '0'
        self.assertEqual(validate_philippine_plate("ABC 12O4"), "ABC 1204")
        # Digit '0' instead of letter 'O'
        self.assertEqual(validate_philippine_plate("0BC 1234"), "OBC 1234")
        # Digit '1' instead of letter 'I'
        self.assertEqual(validate_philippine_plate("1BC 1234"), "IBC 1234")

    def test_blacklist_word_filtering(self):
        self.assertEqual(validate_philippine_plate("TOYOTA ABC 1234"), "ABC 1234")
        self.assertEqual(validate_philippine_plate("PILIPINAS CAA 9912"), "CAA 9912")
        self.assertEqual(validate_philippine_plate("HONDA ND8812"), "ND 8812")

    def test_crop_plate_region(self):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        bbox = (100, 100, 300, 300)
        crop = crop_plate_region(frame, bbox)
        self.assertIsNotNone(crop)
        self.assertGreater(crop.shape[0], 0)
        self.assertGreater(crop.shape[1], 0)

    def test_preprocess_variants(self):
        sample = np.ones((50, 150, 3), dtype=np.uint8) * 128
        variants = preprocess_plate_variants(sample)
        self.assertGreater(len(variants), 0)


if __name__ == '__main__':
    unittest.main()
