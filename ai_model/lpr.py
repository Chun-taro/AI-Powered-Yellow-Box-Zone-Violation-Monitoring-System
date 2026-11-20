"""
License Plate Recognition (LPR) module using Fast-ALPR and EasyOCR.
Enhanced Multi-Stage Pipeline: Image Super-Resolution/Upscaling + Contrast/Edge Sharpening +
Multi-Scale Preprocessing + Dual-Engine OCR with Philippine Plate Pattern Disambiguation and Formatting.
"""
import re
import logging
import warnings
import cv2
import numpy as np

# Suppress PyTorch cuDNN LSTM non-contiguous memory compaction warning in EasyOCR
warnings.filterwarnings('ignore', category=UserWarning, module='torch.nn.modules.rnn')

# Ensure bidi import does not fail under Windows Application Control / AppLocker
try:
    import bidi
except Exception:
    import sys, types
    bidi_shim = types.ModuleType('bidi')
    bidi_shim.get_display = lambda x: x
    bidi_shim.get_base_level = lambda x: 0
    sys.modules['bidi'] = bidi_shim
    sys.modules['bidi.algorithm'] = bidi_shim
    sys.modules['bidi.wrapper'] = bidi_shim

try:
    import onnxruntime as ort
    from fast_alpr import ALPR
    FAST_ALPR_AVAILABLE = True
except ImportError:
    FAST_ALPR_AVAILABLE = False

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except Exception as e:
    EASYOCR_AVAILABLE = False
    logging.warning(f"EasyOCR not available: {e}")

# Background brand words, stickers, slogans, and plate frame text to ignore
IGNORED_WORDS = {
    'PILIPINAS', 'PHILIPPINES', 'MATATAG', 'REPUBLIKA', 'REGION', 'NCR',
    'TOYOTA', 'HONDA', 'MITSUBISHI', 'ISUZU', 'SUZUKI', 'NISSAN', 'HYUNDAI',
    'FORD', 'CHEVROLET', 'MAZDA', 'KIA', 'VIOLATION', 'COLOR', 'PLATE',
    'LTO', 'DAVAO', 'CEBU', 'MANILA', 'CAR', 'MOTORCYCLE', 'TRUCK', 'BUS',
    'SAKAY', 'DISTANCE', 'KEEP', 'GARAY', 'SERVICE', 'EXPRESS', 'FORWARD',
    'SHOHOKU', 'SLAM', 'DUNK', 'BASKETBALL', 'PASSENGER', 'ROUTE', 'PUJ',
    'PRIVATE', 'PUBLIC', 'REGISTERED', 'COMMERCIAL', 'CAUTION', 'STOP', 'SLOW',
    'SAFETY', 'SPEED', 'DIESEL', 'TURBO', '4X4', 'INTERCOOLER', 'NOTFORHIRE',
    'FORHIRE', 'BARANGAY', 'OFFICIAL', 'PATROL'
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
      - 3 letters + 3-4 numbers (e.g. KBA 5939, ABC 1234, NGA 543)
      - 2 letters + 4-5 numbers (Motorcycles / Commercial: AB 12345, LF 0764)
      - 4 numbers + 2 letters (Special / Vintage: 1234 AB)
      - 1 letter + 4-6 numbers (Fleet / Public: A 123456)
      - Temporary / MV File: 4 numbers + 4-6 numbers (e.g. 1301 123456)
    """
    cleaned = clean_ocr_text(text)
    if not cleaned or len(cleaned) < 4 or len(cleaned) > 10:
        return None

    # Strip common leading/trailing border frame artifacts (e.g. '|', 'I', '1' detected from plate border)
    # when trailing string forms a valid 3-letter + 3/4-digit plate (e.g. 'IKBA5939' -> 'KBA 5939')
    if len(cleaned) in (7, 8) and cleaned[0] in ('I', '1', 'L', 'T') and re.match(r'^[A-Z]{3}\d{3,4}$', cleaned[1:]):
        cand = cleaned[1:]
        return f"{cand[:3]} {cand[3:]}"

    if len(cleaned) in (7, 8) and cleaned[-1] in ('I', '1', 'L', 'T') and re.match(r'^[A-Z]{3}\d{3,4}$', cleaned[:-1]):
        cand = cleaned[:-1]
        return f"{cand[:3]} {cand[3:]}"

    # 0. Philippine Temporary / MV File Plates (e.g. 1001-141681, 1001 141681, 10D144661)
    if len(cleaned) in range(8, 12):
        first_4 = "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[:4])
        rest = "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[4:])
        if first_4.isdigit() and rest.isdigit() and len(rest) >= 4:
            return f"{first_4} {rest}"

    # 1. Exact Matches (No mutation)
    if re.match(r'^[A-Z]{3}\d{3,4}$', cleaned):
        return f"{cleaned[:3]} {cleaned[3:]}"
    if re.match(r'^[A-Z]{2}\d{4,5}$', cleaned):
        return f"{cleaned[:2]} {cleaned[2:]}"
    if re.match(r'^\d{4}[A-Z]{2}$', cleaned):
        return f"{cleaned[:4]} {cleaned[4:]}"
    if re.match(r'^[A-Z]\d{4,6}$', cleaned):
        return f"{cleaned[0]} {cleaned[1:]}"
    if re.match(r'^\d{4}\d{4,6}$', cleaned):
        return f"{cleaned[:4]}-{cleaned[4:]}"

    # 2. Positional Fuzzy Disambiguation for 7-character strings (e.g. 'ABC12O4' -> 'ABC 1204', 'B4N7288' -> 'BAN 7288')
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

    # 3. Positional Fuzzy Disambiguation for 6-character strings (e.g. 'B4N728' -> 'BAN 728', 'AB12O4' -> 'AB 1204')
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

    # 4. Positional Fuzzy Disambiguation for 5-character strings (e.g. 'F4652' -> 'F 4652', 'AB123' -> 'AB 123')
    if len(cleaned) == 5:
        if cleaned[0].isalpha() or cleaned[0] in DIGIT_TO_LETTER:
            p_let = DIGIT_TO_LETTER.get(cleaned[0], cleaned[0])
            p_dig = "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[1:])
            if p_let.isalpha() and p_dig.isdigit():
                return f"{p_let} {p_dig}"
        if (cleaned[:2].isalpha() or all(c in DIGIT_TO_LETTER or c.isalpha() for c in cleaned[:2])):
            p_let = "".join(DIGIT_TO_LETTER.get(c, c) for c in cleaned[:2])
            p_dig = "".join(LETTER_TO_DIGIT.get(c, c) for c in cleaned[2:])
            if p_let.isalpha() and p_dig.isdigit():
                return f"{p_let} {p_dig}"

    # 5. Strict Philippine plate pattern fallback (letters followed by digits)
    m = re.match(r'^([A-Z]{2,3})(\d{3,4})$', cleaned)
    if m:
        return f"{m.group(1)} {m.group(2)}"
    m2 = re.match(r'^(\d{3,4})([A-Z]{2,3})$', cleaned)
    if m2:
        return f"{m2.group(1)} {m2.group(2)}"

    return None


def score_plate_candidate(raw_text, det_conf=0.5, ocr_conf=0.5):
    """
    Computes a composite score and validation status for a candidate plate string.
    Returns:
        (formatted_plate_str, composite_score, is_validated_bool)
    """
    if not raw_text:
        return None, 0.0, False

    val = validate_philippine_plate(raw_text)
    if val:
        # Standard 3-letter + 4-digit or 3-letter + 3-digit Philippine formats
        if re.match(r'^[A-Z]{3} \d{3,4}$', val):
            base_score = 1.6 + det_conf * 1.5 + ocr_conf * 0.5
        elif re.match(r'^[A-Z]{2} \d{4,5}$', val):
            base_score = 1.4 + det_conf * 1.4 + ocr_conf * 0.4
        else:
            base_score = 1.2 + det_conf * 1.2 + ocr_conf * 0.3
        return val, base_score, True

    # Generic clean string fallback (only if solid confidence)
    cleaned = clean_ocr_text(raw_text)
    if 4 <= len(cleaned) <= 8 and det_conf >= 0.35:
        # Penalize unformatted strings so properly validated plates always take priority
        score = 0.5 + det_conf * 0.8 + ocr_conf * 0.2
        return cleaned, score, False

    return None, 0.0, False


def preprocess_plate_crop(crop):
    """
    Preprocesses plate crop using CLAHE, Bilateral Filter, and Bilinear/Cubic Upscaling
    to enhance text contrast and character edges for OCR.
    """
    if crop is None or crop.size == 0:
        return None

    h, w = crop.shape[:2]
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


def generate_multiscale_variants(image):
    """
    Generates multi-scale upscaled and contrast-enhanced variants of a vehicle or plate image.
    Essential for detecting small license plates (<60px wide) from high-angle CCTV feeds.
    """
    if image is None or image.size == 0:
        return []

    h, w = image.shape[:2]
    variants = [image]

    # Target optimal dimension: at least 480x480 for YOLOv9 plate detection
    min_dim = min(h, w)
    max_dim = max(h, w)
    if max_dim < 600 or min_dim < 300:
        scale = max(1.5, 600.0 / max(max_dim, 1))
        scale = min(scale, 3.0)  # Cap scale to prevent excessive memory usage
        new_w, new_h = int(w * scale), int(h * scale)
        scaled = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        variants.append(scaled)

        # Unsharp mask on scaled
        gaussian = cv2.GaussianBlur(scaled, (0, 0), 1.5)
        sharpened = cv2.addWeighted(scaled, 1.4, gaussian, -0.4, 0)
        variants.append(sharpened)

        # Contrast-enhanced via CLAHE in LAB color space
        try:
            lab = cv2.cvtColor(scaled, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            l_enh = clahe.apply(l)
            enhanced_bgr = cv2.cvtColor(cv2.merge([l_enh, a, b]), cv2.COLOR_LAB2BGR)
            variants.append(enhanced_bgr)
        except Exception:
            pass

    return variants


def crop_plate_region(frame, bbox):
    """
    Crops specifically the lower mounting region where vehicle license plates are installed.
    Covers the bottom 55% of the vehicle to capture both front bumper and rear tailgate/step mounts
    across jeepneys, multicabs, trucks, buses, SUVs, and tricycles.

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

    # Cover 45% to 102% of vehicle bounding box (generous lower region)
    plate_y1 = max(0, int(y1 + bh * 0.45))
    plate_y2 = min(h, int(y2 + bh * 0.02))
    plate_x1 = max(0, int(x1 + bw * 0.02))
    plate_x2 = min(w, int(x2 - bw * 0.02))

    if plate_y1 >= plate_y2 or plate_x1 >= plate_x2:
        return frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]

    return frame[plate_y1:plate_y2, plate_x1:plate_x2]


def get_plate_candidate_crops(frame, bbox):
    """
    Returns multiple targeted sub-crops from a detected vehicle for multi-stage plate detection:
      1. Context-padded vehicle crop (+8% padding so bumper edge is never cut)
      2. Lower half of vehicle (45% - 102% height)
      3. Deep bumper/rear-step crop (65% - 105% height)
      4. Mid-front grille crop (30% - 75% height)
    """
    if frame is None or frame.size == 0 or not bbox:
        return []

    x1, y1, x2, y2 = bbox
    h, w = frame.shape[:2]
    bw = x2 - x1
    bh = y2 - y1
    if bw <= 10 or bh <= 10:
        return []

    crops = []

    # 1. Context-padded vehicle crop
    pad_x = int(bw * 0.08)
    pad_y = int(bh * 0.08)
    px1 = max(0, x1 - pad_x)
    py1 = max(0, y1 - pad_y)
    px2 = min(w, x2 + pad_x)
    py2 = min(h, y2 + pad_y)
    padded = frame[py1:py2, px1:px2]
    if padded.size > 0:
        crops.append(padded)

    # 2. Lower vehicle region (45% - 102%)
    ly1 = max(0, int(y1 + bh * 0.45))
    ly2 = min(h, int(y2 + bh * 0.02))
    lower = frame[ly1:ly2, max(0, x1):min(w, x2)]
    if lower.size > 0:
        crops.append(lower)

    # 3. Deep bumper / rear step (65% - 105%)
    by1 = max(0, int(y1 + bh * 0.65))
    by2 = min(h, int(y2 + bh * 0.05))
    bumper = frame[by1:by2, max(0, x1):min(w, x2)]
    if bumper.size > 0:
        crops.append(bumper)

    return crops


class LicensePlateReader:
    """
    Dual-Engine License Plate Reader:
      - Primary: Fast-ALPR (YOLOv9 Plate Detector + MobileViT-v2 Global Plate OCR)
      - Fallback: EasyOCR with multi-variant CLAHE and edge-sharpening preprocessing.
    Equipped with multi-scale upscaling, multi-candidate scoring, and Philippine format validation.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._reader = None
            cls._instance._fast_alpr = None
            cls._instance._ready = False
        return cls._instance

    def initialize(self):
        """Load the Fast-ALPR and EasyOCR models (call this in background thread)."""
        # 1. Initialize Fast-ALPR (Dedicated Deep-Learning Plate Detector + MobileViT-v2 OCR)
        if FAST_ALPR_AVAILABLE and self._fast_alpr is None:
            try:
                logging.getLogger('open_image_models').setLevel(logging.WARNING)
                sess_opts = ort.SessionOptions()
                sess_opts.log_severity_level = 3
                providers = ['CPUExecutionProvider']
                ocr_dev = 'cpu'

                self._fast_alpr = ALPR(
                    detector_model='yolo-v9-s-608-license-plate-end2end',
                    ocr_model='global-plates-mobile-vit-v2-model',
                    detector_providers=providers,
                    ocr_device=ocr_dev,
                    detector_conf_thresh=0.08,  # Lower threshold to capture low-contrast/angled plates
                    detector_sess_options=sess_opts,
                    ocr_sess_options=sess_opts
                )
                self._ready = True
                logging.info(f"✓ LPR Engine (Fast-ALPR YOLOv9 + MobileViT-v2) loaded and ready.")
            except Exception as e:
                logging.warning(f"Fast-ALPR failed to initialize: {e}. Falling back to EasyOCR.")
                self._fast_alpr = None

        # 2. Initialize EasyOCR as fallback
        if EASYOCR_AVAILABLE and self._reader is None:
            try:
                import torch
                use_gpu = torch.cuda.is_available()
                self._reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
                # Compact cuDNN RNN/LSTM weights to single contiguous memory chunk
                if hasattr(self._reader, 'recognizer'):
                    try:
                        for m in self._reader.recognizer.modules():
                            if isinstance(m, torch.nn.RNNBase):
                                m.flatten_parameters()
                    except Exception:
                        pass
                self._ready = True
                logging.info(f"✓ LPR Fallback (EasyOCR) model loaded and ready (GPU Enabled: {use_gpu}).")
            except Exception as e:
                logging.error(f"LPR EasyOCR failed to initialize: {e}")

    def _parse_ocr_results(self, ocr_results):
        """
        Extracts, merges, and scores plate candidates from detailed EasyOCR output.
        """
        if not ocr_results:
            return None, 0.0, False

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
        best_validated = False

        # 1. Single token validation
        for _, text, conf in sorted_items:
            plate, score, is_val = score_plate_candidate(text, det_conf=0.7, ocr_conf=conf)
            if plate and score > best_score:
                best_candidate = plate
                best_score = score
                best_validated = is_val

        # 2. Adjacent pairs validation (e.g. "LF" + "0764" or "ABC" + "1234")
        for i in range(len(sorted_items) - 1):
            _, text1, conf1 = sorted_items[i]
            _, text2, conf2 = sorted_items[i + 1]
            merged = f"{text1} {text2}"
            plate, score, is_val = score_plate_candidate(merged, det_conf=0.7, ocr_conf=(conf1 + conf2) / 2.0)
            if plate and score > best_score:
                best_candidate = plate
                best_score = score
                best_validated = is_val

        # 3. Full concatenated text validation
        all_text = " ".join([t for _, t, _ in sorted_items])
        plate_all, score_all, is_val_all = score_plate_candidate(all_text, det_conf=0.6, ocr_conf=0.5)
        if plate_all and score_all > best_score:
            best_candidate = plate_all
            best_score = score_all
            best_validated = is_val_all

        return best_candidate, best_score, best_validated

    def read_plate(self, frame_crop, full_vehicle_crop=None, return_confidence=False):
        """
        Read license plate text using Fast-ALPR with multi-scale upscaling, multi-candidate scoring,
        and EasyOCR fallback.

        Args:
            frame_crop: numpy array of the cropped plate or bumper region
            full_vehicle_crop: optional full vehicle bounding box from which targeted bumper crops are extracted
            return_confidence: if True, returns (plate, score, is_validated); else returns plate or None

        Returns:
            str or tuple: Formatted plate number (e.g. 'KBA 5939') or None if unreadable.
        """
        if not self._ready:
            return (None, 0.0, False) if return_confidence else None

        best_plate = None
        best_score = 0.0
        best_validated = False

        # -----------------------------------------------------------------
        # Phase 1: High-Precision Fast-ALPR (Instant Fast-Path + Fallback)
        # -----------------------------------------------------------------
        if self._fast_alpr is not None:
            # 1. Primary Direct Pass (Instant: ~0.08 - 0.12s)
            primary_cands = []
            if full_vehicle_crop is not None and full_vehicle_crop.size > 0:
                primary_cands.append(full_vehicle_crop)
            if frame_crop is not None and frame_crop.size > 0:
                primary_cands.append(frame_crop)

            for cand_img in primary_cands:
                try:
                    fast_results = self._fast_alpr.predict(cand_img)
                    if fast_results:
                        cw, ch = cand_img.shape[1], cand_img.shape[0]
                        for item in fast_results:
                            raw_plate = getattr(item.ocr, 'text', '')
                            det_conf = float(getattr(item.detection, 'confidence', 0.5))
                            ocr_confs = getattr(item.ocr, 'confidence', None)
                            ocr_conf = float(np.mean(ocr_confs)) if isinstance(ocr_confs, (list, np.ndarray)) and len(ocr_confs) > 0 else 0.5

                            bbox = getattr(item.detection, 'bounding_box', None)
                            spatial_bonus = 0.0
                            if bbox is not None and cw > 0 and ch > 0:
                                plate_cx = (bbox.x1 + bbox.x2) / 2.0
                                plate_cy = (bbox.y1 + bbox.y2) / 2.0
                                dist_center_x = abs(plate_cx - (cw / 2.0)) / float(cw)
                                cy_ratio = plate_cy / float(ch)

                                # Target vehicle plate is centered horizontally
                                if dist_center_x <= 0.25:
                                    spatial_bonus += 0.25
                                elif dist_center_x > 0.38:
                                    spatial_bonus -= 0.60  # Peripheral plate belongs to adjacent vehicle

                                # Target vehicle plate is mounted on bumper/grille (lower/mid body)
                                if cy_ratio >= 0.40:
                                    spatial_bonus += 0.25
                                elif cy_ratio < 0.25:
                                    spatial_bonus -= 0.60  # Background vehicle or roof sticker

                            plate, score, is_val = score_plate_candidate(raw_plate, det_conf=det_conf, ocr_conf=ocr_conf)
                            score += spatial_bonus

                            if plate and score > best_score:
                                best_plate = plate
                                best_score = score
                                best_validated = is_val

                                # Fast-Exit: validated Philippine plate on primary pass returns immediately!
                                if is_val and score >= 1.8:
                                    if return_confidence:
                                        return best_plate, best_score, best_validated
                                    return best_plate
                except Exception as e:
                    logging.debug(f"Fast-ALPR primary pass error: {e}")

            # 2. Secondary Multi-Scale Pass (Only executed if primary pass found no validated plate)
            if not best_validated:
                secondary_variants = []
                for img in primary_cands:
                    secondary_variants.extend(generate_multiscale_variants(img))

                for cand_img in secondary_variants:
                    try:
                        fast_results = self._fast_alpr.predict(cand_img)
                        if fast_results:
                            for item in fast_results:
                                raw_plate = getattr(item.ocr, 'text', '')
                                det_conf = float(getattr(item.detection, 'confidence', 0.5))
                                ocr_confs = getattr(item.ocr, 'confidence', None)
                                ocr_conf = float(np.mean(ocr_confs)) if isinstance(ocr_confs, (list, np.ndarray)) and len(ocr_confs) > 0 else 0.5

                                plate, score, is_val = score_plate_candidate(raw_plate, det_conf=det_conf, ocr_conf=ocr_conf)
                                if plate and score > best_score:
                                    best_plate = plate
                                    best_score = score
                                    best_validated = is_val
                                    if is_val and score >= 1.8:
                                        if return_confidence:
                                            return best_plate, best_score, best_validated
                                        return best_plate
                    except Exception as e:
                        logging.debug(f"Fast-ALPR secondary pass error: {e}")

        # If Fast-ALPR produced a validated plate or solid score, return it immediately
        if best_validated or (best_plate and best_score >= 1.0):
            if return_confidence:
                return best_plate, best_score, best_validated
            return best_plate

        # -----------------------------------------------------------------
        # Phase 2: EasyOCR Multi-Variant Preprocessing Fallback
        # -----------------------------------------------------------------
        if self._reader is not None:
            easy_candidate_crops = []
            if frame_crop is not None and frame_crop.size > 0:
                easy_candidate_crops.append(frame_crop)
            if full_vehicle_crop is not None and full_vehicle_crop.size > 0:
                vh, vw = full_vehicle_crop.shape[:2]
                if vh > 30 and vw > 30:
                    bumper_primary = full_vehicle_crop[int(vh * 0.50):, :]
                    if bumper_primary.size > 0:
                        easy_candidate_crops.append(bumper_primary)

            allowlist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -'
            try:
                import torch
                inference_ctx = torch.inference_mode()
            except Exception:
                import contextlib
                inference_ctx = contextlib.nullcontext()

            with inference_ctx:
                for crop in easy_candidate_crops:
                    variants = preprocess_plate_variants(crop)
                    for variant in variants:
                        try:
                            results = self._reader.readtext(
                                variant, detail=1, paragraph=False, allowlist=allowlist
                            )
                            if results:
                                plate, score, is_val = self._parse_ocr_results(results)
                                if plate and score > best_score:
                                    best_plate = plate
                                    best_score = score
                                    best_validated = is_val
                                    if is_val:
                                        break
                        except Exception as e:
                            logging.debug(f"LPR EasyOCR error on variant: {e}")
                    if best_validated:
                        break

        if return_confidence:
            return best_plate, best_score, best_validated
        return best_plate


# Singleton instance
lpr_reader = LicensePlateReader()
