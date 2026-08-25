"""
License Plate Recognition (LPR) module using EasyOCR.
Enhanced Multi-Stage Pipeline: Image Super-Resolution/Upscaling + Edge Sharpening +
Multi-Pass Preprocessing + OCR with Philippine Plate Pattern Disambiguation and Formatting.
"""
import re
import logging
import cv2
import numpy as np

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR not installed. LPR will be disabled. Run: pip install easyocr")

# Background brand words and plate frame text to ignore
IGNORED_WORDS = {
    'PILIPINAS', 'PHILIPPINES', 'MATATAG', 'REPUBLIKA', 'REGION', 'NCR',
    'TOYOTA', 'HONDA', 'MITSUBISHI', 'ISUZU', 'SUZUKI', 'NISSAN', 'HYUNDAI',
    'FORD', 'CHEVROLET', 'MAZDA', 'KIA', 'VIOLATION', 'COLOR', 'PLATE',
    'LTO', 'DAVAO', 'CEBU', 'MANILA', 'CAR', 'MOTORCYCLE', 'TRUCK', 'BUS'
}

DIGIT_TO_LETTER = {'0': 'O', '1': 'I', '2': 'Z', '4': 'A', '5': 'S', '6': 'G', '8': 'B', '7': 'T'}
LETTER_TO_DIGIT = {'O': '0', 'D': '0', 'Q': '0', 'I': '1', 'L': '1', 'Z': '2', 'A': '4', 'S': '5', 'G': '6', 'B': '8', 'T': '7'}


def clean_ocr_text(text):
    """Clean string by keeping only uppercase alphanumeric characters and removing blacklist words."""
    if not text:
        return ""
    cleaned = re.sub(r'[^A-Z0-9]', '', str(text).upper())
    for word in IGNORED_WORDS:
        cleaned = cleaned.replace(word, '')
    return cleaned


def validate_philippine_plate(text):
    """
    Validate, correct common OCR character confusions, and format Philippine license plates.
    Standard formats:
      - 3 letters + 3-4 numbers (e.g. ABC 1234, NGA 543)
      - 2 letters + 4-5 numbers (Motorcycles / Commercial: AB 12345, LF 0764)
      - 4 numbers + 2 letters (Special / Vintage: 1234 AB)
      - 1 letter + 4-6 numbers (Fleet / Public: A 123456)
    """
    cleaned = clean_ocr_text(text)
    if not cleaned or len(cleaned) < 4 or len(cleaned) > 9:
        return None

    # 1. Exact Matches (No mutation)
    if re.match(r'^[A-Z]{3}\d{3,4}$', cleaned):
        return f"{cleaned[:3]} {cleaned[3:]}"
    if re.match(r'^[A-Z]{2}\d{4,5}$', cleaned):
        return f"{cleaned[:2]} {cleaned[2:]}"
    if re.match(r'^\d{4}[A-Z]{2}$', cleaned):
        return f"{cleaned[:4]} {cleaned[4:]}"
    if re.match(r'^[A-Z]\d{4,6}$', cleaned):
        return f"{cleaned[0]} {cleaned[1:]}"

    # 2. Positional Fuzzy Disambiguation for 7-character strings (e.g. 'ABC12O4' -> 'ABC 1204')
    if len(cleaned) == 7:
        letters_count_3 = sum(1 for c in cleaned[:3] if c.isalpha() or c in DIGIT_TO_LETTER)
        digits_count_4 = sum(1 for c in cleaned[3:] if c.isdigit() or c in LETTER_TO_DIGIT)
        if letters_count_3 == 3 and digits_count_4 == 4:
            p_cand = "".join(DIGIT_TO_LETTER.get(c, c) for c in cleaned[:3]) + "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[3:])
            if re.match(r'^[A-Z]{3}\d{4}$', p_cand):
                return f"{p_cand[:3]} {p_cand[3:]}"

        letters_count_2 = sum(1 for c in cleaned[:2] if c.isalpha() or c in DIGIT_TO_LETTER)
        digits_count_5 = sum(1 for c in cleaned[2:] if c.isdigit() or c in LETTER_TO_DIGIT)
        if letters_count_2 == 2 and digits_count_5 == 5:
            p_cand = "".join(DIGIT_TO_LETTER.get(c, c) for c in cleaned[:2]) + "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[2:])
            if re.match(r'^[A-Z]{2}\d{5}$', p_cand):
                return f"{p_cand[:2]} {p_cand[2:]}"

    # 3. Positional Fuzzy Disambiguation for 6-character strings (e.g. 'ABC123', 'AB1234', '1234AB')
    if len(cleaned) == 6:
        # Standard 3 letters + 3 digits
        letters_count_3 = sum(1 for c in cleaned[:3] if c.isalpha() or c in DIGIT_TO_LETTER)
        digits_count_3 = sum(1 for c in cleaned[3:] if c.isdigit() or c in LETTER_TO_DIGIT)
        if letters_count_3 == 3 and digits_count_3 == 3:
            p_cand = "".join(DIGIT_TO_LETTER.get(c, c) for c in cleaned[:3]) + "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[3:])
            if re.match(r'^[A-Z]{3}\d{3}$', p_cand):
                return f"{p_cand[:3]} {p_cand[3:]}"

        # 2 letters + 4 digits
        letters_count_2 = sum(1 for c in cleaned[:2] if c.isalpha() or c in DIGIT_TO_LETTER)
        digits_count_4 = sum(1 for c in cleaned[2:] if c.isdigit() or c in LETTER_TO_DIGIT)
        if letters_count_2 == 2 and digits_count_4 == 4:
            p_cand = "".join(DIGIT_TO_LETTER.get(c, c) for c in cleaned[:2]) + "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[2:])
            if re.match(r'^[A-Z]{2}\d{4}$', p_cand):
                return f"{p_cand[:2]} {p_cand[2:]}"

        # 4 digits + 2 letters
        digits_count_4 = sum(1 for c in cleaned[:4] if c.isdigit() or c in LETTER_TO_DIGIT)
        letters_count_2 = sum(1 for c in cleaned[4:] if c.isalpha() or c in DIGIT_TO_LETTER)
        if digits_count_4 == 4 and letters_count_2 == 2:
            p_cand = "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[:4]) + "".join(DIGIT_TO_LETTER.get(c, c) for c in cleaned[4:])
            if re.match(r'^\d{4}[A-Z]{2}$', p_cand):
                return f"{p_cand[:4]} {p_cand[4:]}"

    # 4. Generic Fallback for valid mixed alphanumeric series
    if 4 <= len(cleaned) <= 8 and any(c.isalpha() for c in cleaned) and any(c.isdigit() for c in cleaned):
        m = re.match(r'^([A-Z]+)(\d+)$', cleaned)
        if m:
            return f"{m.group(1)} {m.group(2)}"
        m2 = re.match(r'^(\d+)([A-Z]+)$', cleaned)
        if m2:
            return f"{m2.group(1)} {m2.group(2)}"
        return cleaned

    return None


def preprocess_plate_crop(crop):
    """
    Preprocesses plate crop using CLAHE, Bilateral Filter, and Bilinear/Cubic Upscaling
    to enhance text contrast and character edges for OCR.
    """
    if crop is None or crop.size == 0:
        return None

    h, w = crop.shape[:2]
    # Scale up if small (EasyOCR works best when height >= 100px)
    scale = max(1.0, 120.0 / max(h, 1))
    if scale > 1.0:
        new_w, new_h = int(w * scale), int(h * scale)
        scaled = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    else:
        scaled = crop

    # Convert to grayscale
    if len(scaled.shape) == 3:
        gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY)
    else:
        gray = scaled

    # Bilateral filter to reduce noise while keeping sharp edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    return enhanced


def preprocess_plate_variants(crop):
    """
    Generate multiple enhanced variations (grayscale, sharpened, binarized)
    to maximize OCR character recognition under varying camera lighting.
    """
    if crop is None or crop.size == 0:
        return []

    enhanced = preprocess_plate_crop(crop)
    if enhanced is None:
        return []

    variants = [crop, enhanced]

    try:
        # Unsharp masking for crisp character boundaries
        gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
        sharpened = cv2.addWeighted(enhanced, 1.5, gaussian, -0.5, 0)
        variants.append(sharpened)

        # Otsu thresholding
        _, otsu = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        variants.append(otsu)
    except Exception:
        pass

    return variants


def crop_plate_region(frame, bbox):
    """
    Crop lower-center region of vehicle bounding box where license plate is positioned.

    Args:
        frame: Full video frame (numpy array)
        bbox: (x1, y1, x2, y2) vehicle bounding box

    Returns:
        numpy array: Cropped plate region
    """
    if frame is None or frame.size == 0 or not bbox:
        return None
    x1, y1, x2, y2 = bbox
    h, w = frame.shape[:2]

    bw = x2 - x1
    bh = y2 - y1
    if bw <= 10 or bh <= 10:
        return None

    # Focus on center 75% width and bottom 50% height
    plate_y1 = max(0, int(y1 + bh * 0.45))
    plate_y2 = min(h, int(y2 + bh * 0.05))
    plate_x1 = max(0, int(x1 + bw * 0.12))
    plate_x2 = min(w, int(x2 - bw * 0.12))

    if plate_y1 >= plate_y2 or plate_x1 >= plate_x2:
        return frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]

    return frame[plate_y1:plate_y2, plate_x1:plate_x2]


class LicensePlateReader:
    """
    Wraps EasyOCR to extract license plate text from vehicle crops with multi-pass
    preprocessing, bounding box sorting, fragment merging, and Philippine format validation.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._reader = None
            cls._instance._ready = False
        return cls._instance

    def initialize(self):
        """Load the EasyOCR model (call this in background thread)."""
        if not EASYOCR_AVAILABLE or self._ready:
            return
        try:
            import torch
            use_gpu = torch.cuda.is_available()
            self._reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
            self._ready = True
            logging.info(f"✓ LPR (EasyOCR) model loaded and ready (GPU Enabled: {use_gpu}).")
        except Exception as e:
            logging.error(f"LPR failed to initialize: {e}")

    def _parse_ocr_results(self, ocr_results):
        """
        Extracts, merges, and scores plate candidates from detailed EasyOCR output.
        """
        if not ocr_results:
            return None

        # Sort boxes left-to-right based on horizontal center
        sorted_items = []
        for item in ocr_results:
            if len(item) >= 3:
                box, text, conf = item[0], item[1], item[2]
                cx = sum(p[0] for p in box) / len(box)
                sorted_items.append((cx, text.strip(), float(conf)))
            elif len(item) == 2:
                box, text = item[0], item[1]
                cx = sum(p[0] for p in box) / len(box)
                sorted_items.append((cx, text.strip(), 0.5))

        sorted_items.sort(key=lambda x: x[0])

        best_candidate = None
        best_score = -1.0

        # 1. Single token validation
        for _, text, conf in sorted_items:
            val = validate_philippine_plate(text)
            if val and conf > best_score:
                best_candidate = val
                best_score = conf

        # 2. Adjacent pairs validation (e.g. "LF" + "0764" or "ABC" + "1234")
        for i in range(len(sorted_items) - 1):
            _, text1, conf1 = sorted_items[i]
            _, text2, conf2 = sorted_items[i + 1]
            merged = f"{text1} {text2}"
            val = validate_philippine_plate(merged)
            avg_conf = (conf1 + conf2) / 2.0
            if val and avg_conf > best_score:
                best_candidate = val
                best_score = avg_conf

        # 3. Full concatenated text validation
        all_text = " ".join([t for _, t, _ in sorted_items])
        val_all = validate_philippine_plate(all_text)
        if val_all and (best_candidate is None or best_score < 0.3):
            best_candidate = val_all

        return best_candidate

    def read_plate(self, frame_crop, full_vehicle_crop=None):
        """
        Read license plate text from a cropped vehicle region using multi-pass enhancement.

        Args:
            frame_crop: numpy array of the cropped plate or vehicle region
            full_vehicle_crop: optional full vehicle bounding box crop for fallback

        Returns:
            str: Validated and formatted plate number (e.g. 'ABC 1234') or None if unreadable.
        """
        if not self._ready or self._reader is None:
            return None

        # Build candidate image list
        candidate_crops = []
        if frame_crop is not None and frame_crop.size > 0:
            candidate_crops.append(frame_crop)
        if full_vehicle_crop is not None and full_vehicle_crop.size > 0:
            candidate_crops.append(full_vehicle_crop)

        if not candidate_crops:
            return None

        allowlist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -'

        for crop in candidate_crops:
            variants = preprocess_plate_variants(crop)
            for variant in variants:
                try:
                    results = self._reader.readtext(
                        variant, detail=1, paragraph=False, allowlist=allowlist
                    )
                    if results:
                        plate = self._parse_ocr_results(results)
                        if plate:
                            return plate
                except Exception as e:
                    logging.debug(f"LPR read error on variant: {e}")

        return None


# Singleton instance
lpr_reader = LicensePlateReader()
