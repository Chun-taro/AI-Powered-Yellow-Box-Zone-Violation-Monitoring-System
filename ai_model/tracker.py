import cv2
import numpy as np
import math
from scipy.spatial import distance as dist


def compute_iou(boxA, boxB):
    """Compute Intersection over Union (IoU) of two bounding boxes [x1, y1, x2, y2]."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = max(0, boxA[2] - boxA[0]) * max(0, boxA[3] - boxA[1])
    boxBArea = max(0, boxB[2] - boxB[0]) * max(0, boxB[3] - boxB[1])
    unionArea = float(boxAArea + boxBArea - interArea)

    if unionArea <= 0:
        return 0.0
    return interArea / unionArea


class CentroidTracker:
    """
    Depth-Aware Kalman Filter & IoU Tracker with Occlusion Resistance.
    Features:
      - Unique persistent tracking IDs starting at 1 (Vehicle #1, Vehicle #2, etc.).
      - Depth & Scale Gating: Prevents closer/newer vehicles from stealing farther vehicles' IDs.
      - Occlusion Persistence: Retains occluded vehicles across frames using Kalman projection.
      - Identity Restoration: Restores original tracking ID when an occluded vehicle reappears.
      - Exponential Moving Average (EMA) bounding box smoothing and dimension clamping.
    """
    def __init__(self, max_disappeared=90, max_distance=150, min_iou=0.20):
        self.next_object_id = 1  # Tracking IDs start at 1 (Vehicle #1, Vehicle #2...)
        self.objects = {}        # Stores {objectID: (centroid, bbox)}
        self.disappeared = {}    # Stores {objectID: missed_frame_count}
        self.kf_trackers = {}    # Stores {objectID: KalmanFilter}
        self.smoothed_bboxes = {}# Stores {objectID: [x1, y1, x2, y2]} for dimension stability
        self.stabilized_state = {} # Stores {objectID: dict(cx, ground_y, w, h, ar, still_count)}
        self.is_occluded = {}    # Stores {objectID: bool}
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance
        self.min_iou = min_iou

    def _init_kalman(self, centroid):
        """Initialize a 2D constant-velocity Kalman Filter for a vehicle."""
        kf = cv2.KalmanFilter(4, 2)
        kf.measurementMatrix = np.array([[1, 0, 0, 0], [0, 1, 0, 0]], np.float32)
        kf.transitionMatrix = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [0, 0, 1, 0], [0, 0, 0, 1]], np.float32)
        kf.processNoiseCov = np.eye(4, dtype=np.float32) * 0.03
        kf.measurementNoiseCov = np.eye(2, dtype=np.float32) * 0.1

        kf.statePre = np.array([[centroid[0]], [centroid[1]], [0], [0]], np.float32)
        kf.statePost = np.array([[centroid[0]], [centroid[1]], [0], [0]], np.float32)
        return kf

    def register(self, centroid, bbox):
        new_id = self.next_object_id
        x1, y1, x2, y2 = [float(x) for x in bbox]
        w = max(1.0, x2 - x1)
        h = max(1.0, y2 - y1)
        cx = (x1 + x2) / 2.0
        ground_y = y2
        ar = w / h

        self.objects[new_id] = (centroid, bbox)
        self.disappeared[new_id] = 0
        self.is_occluded[new_id] = False
        self.kf_trackers[new_id] = self._init_kalman(centroid)
        self.smoothed_bboxes[new_id] = [float(x) for x in bbox]
        self.stabilized_state[new_id] = {
            'cx': cx,
            'ground_y': ground_y,
            'w': w,
            'h': h,
            'ar': ar,
            'still_count': 0
        }
        self.next_object_id += 1
        return new_id

    def deregister(self, object_id):
        self.objects.pop(object_id, None)
        self.disappeared.pop(object_id, None)
        self.kf_trackers.pop(object_id, None)
        self.smoothed_bboxes.pop(object_id, None)
        self.stabilized_state.pop(object_id, None)
        self.is_occluded.pop(object_id, None)

    def _smooth_bbox(self, obj_id, new_bbox):
        """
        Rock-Solid Vehicle Shape & Position Stabilization:
          1. Ground-Contact Road Anchoring: Anchors box to (cx, ground_y) where tires contact asphalt,
             preventing the bounding box from bobbing into the road or floating in air.
          2. Aspect-Ratio Regularization: Maintains vehicle's geometric proportions (w/h) to prevent
             distortion or collapsing when partially occluded.
          3. Stationary Motion Deadband: Freezes position and dimensions when vehicle is stopped (<3.2 px shift),
             completely eliminating box jitter and pulsating.
          4. Smooth Velocity-Adaptive Gliding: Tracks moving vehicles responsive to motion with zero perceptible lag.
        """
        x1, y1, x2, y2 = [float(x) for x in new_bbox]
        new_w = max(1.0, x2 - x1)
        new_h = max(1.0, y2 - y1)
        new_cx = (x1 + x2) / 2.0
        new_ground_y = y2
        new_ar = new_w / new_h

        if obj_id not in self.stabilized_state:
            self.stabilized_state[obj_id] = {
                'cx': new_cx,
                'ground_y': new_ground_y,
                'w': new_w,
                'h': new_h,
                'ar': new_ar,
                'still_count': 0
            }
            int_box = [int(round(x)) for x in new_bbox]
            self.smoothed_bboxes[obj_id] = [float(x) for x in int_box]
            return int_box

        st = self.stabilized_state[obj_id]
        prev_cx = st['cx']
        prev_ground_y = st['ground_y']
        prev_w = st['w']
        prev_h = st['h']
        prev_ar = st['ar']

        # Measure spatial displacement from previous stabilized anchor
        dx = new_cx - prev_cx
        dy = new_ground_y - prev_ground_y
        dist_shift = math.hypot(dx, dy)

        # -------------------------------------------------------------
        # Phase 1: Position Stabilization (Deadband + Velocity Filtering)
        # -------------------------------------------------------------
        if dist_shift < 3.2:
            # Stationary vehicle (jitter suppression):
            st['still_count'] += 1
            smooth_cx = prev_cx
            smooth_ground_y = prev_ground_y
        elif dist_shift < 8.0:
            # Slow micro-movement / creeping:
            st['still_count'] = 0
            alpha_pos = 0.12 + 0.16 * ((dist_shift - 3.2) / 4.8)
            smooth_cx = prev_cx + alpha_pos * dx
            smooth_ground_y = prev_ground_y + alpha_pos * dy
        else:
            # Dynamic movement:
            st['still_count'] = 0
            alpha_pos = min(0.55, 0.30 + 0.02 * (dist_shift - 8.0))
            smooth_cx = prev_cx + alpha_pos * dx
            smooth_ground_y = prev_ground_y + alpha_pos * dy

        # -------------------------------------------------------------
        # Phase 2: Dimension & Aspect Ratio Stabilization
        # -------------------------------------------------------------
        if st['still_count'] >= 1:
            # Rock-solid dimension lock while stopped in yellow box / queue
            smooth_w = prev_w
            smooth_h = prev_h
            smooth_ar = prev_ar
        else:
            # Vehicle moving in perspective: clamp rate of single-frame scale change
            clamped_w = float(np.clip(new_w, prev_w * 0.94, prev_w * 1.06))
            clamped_h = float(np.clip(new_h, prev_h * 0.94, prev_h * 1.06))

            # Maintain geometric aspect ratio consistency
            clamped_ar = clamped_w / clamped_h
            smooth_ar = 0.10 * clamped_ar + 0.90 * prev_ar

            # Detect anomalous shape distortion and regularize
            ar_diff = abs(clamped_ar - smooth_ar) / smooth_ar
            if ar_diff > 0.08:
                if clamped_ar > smooth_ar:
                    clamped_w = clamped_h * smooth_ar
                else:
                    clamped_h = clamped_w / smooth_ar

            smooth_w = 0.14 * clamped_w + 0.86 * prev_w
            smooth_h = 0.14 * clamped_h + 0.86 * prev_h

        st['cx'] = smooth_cx
        st['ground_y'] = smooth_ground_y
        st['w'] = smooth_w
        st['h'] = smooth_h
        st['ar'] = smooth_ar

        # Reconstruct high-precision integer bounding box
        sx1 = int(round(smooth_cx - smooth_w / 2.0))
        sx2 = int(round(smooth_cx + smooth_w / 2.0))
        sy2 = int(round(smooth_ground_y))
        sy1 = int(round(smooth_ground_y - smooth_h))

        smoothed = [sx1, sy1, sx2, sy2]
        self.smoothed_bboxes[obj_id] = [float(sx1), float(sy1), float(sx2), float(sy2)]
        return smoothed

    def _compute_5_points(self, bbox):
        startX, startY, endX, endY = bbox
        return np.array([
            [startX, startY],                               # Top-Left
            [endX, startY],                                 # Top-Right
            [(startX + endX) / 2.0, (startY + endY) / 2.0], # Center
            [startX, endY],                                 # Bottom-Left
            [endX, endY]                                    # Bottom-Right
        ])

    def update(self, rects):
        # 1. Kalman Prediction step for all active trackers
        for obj_id, kf in self.kf_trackers.items():
            prediction = kf.predict()
            
            # Predict updated position if missed or occluded in recent frame
            if self.disappeared.get(obj_id, 0) > 0:
                old_centroid, old_bbox = self.objects[obj_id]
                st = self.stabilized_state.get(obj_id)
                # If vehicle was stationary before miss, preserve its exact stationary position
                if st is not None and st.get('still_count', 0) >= 2:
                    new_bbox = old_bbox.copy()
                    new_cx, new_cy = old_centroid
                else:
                    new_cx, new_cy = int(prediction[0, 0]), int(prediction[1, 0])
                    dx = int(np.clip(new_cx - old_centroid[0], -20, 20))
                    dy = int(np.clip(new_cy - old_centroid[1], -20, 20))
                    new_bbox = [old_bbox[0] + dx, old_bbox[1] + dy, old_bbox[2] + dx, old_bbox[3] + dy]
                self.objects[obj_id] = ((new_cx, new_cy), new_bbox)
                self.smoothed_bboxes[obj_id] = [float(x) for x in new_bbox]

        # 2. Check pairwise occlusion between active tracks:
        # A farther vehicle (smaller y2) whose box overlaps with a closer vehicle (larger y2)
        # is marked as occluded so its tracking ID is safely preserved.
        for id1, (_, b1) in self.objects.items():
            for id2, (_, b2) in self.objects.items():
                if id1 != id2 and b2[3] > b1[3] + 25:
                    if compute_iou(b1, b2) > 0.08:
                        self.is_occluded[id1] = True

        # 3. No detections in current frame
        if len(rects) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                limit = int(self.max_disappeared * 1.5) if self.is_occluded.get(object_id, False) else self.max_disappeared
                if self.disappeared[object_id] > limit:
                    self.deregister(object_id)
            return self.objects.copy()

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for i, (startX, startY, endX, endY) in enumerate(rects):
            input_centroids[i] = (int((startX + endX) / 2.0), int((startY + endY) / 2.0))

        # Register all if no existing objects
        if len(self.objects) == 0:
            for i in range(len(input_centroids)):
                self.register(input_centroids[i], rects[i])
            return self.objects.copy()

        object_ids = list(self.objects.keys())
        used_rows = set()
        used_cols = set()

        # --- STAGE 1: Depth & Scale Gated IoU Matching ---
        # Prevents closer/newer vehicles from stealing a farther vehicle's tracking ID
        iou_matrix = np.zeros((len(object_ids), len(rects)), dtype=np.float32)
        for r, obj_id in enumerate(object_ids):
            obj_centroid, obj_bbox = self.objects[obj_id]
            a_track = max(1.0, float((obj_bbox[2] - obj_bbox[0]) * (obj_bbox[3] - obj_bbox[1])))
            vh = max(1.0, float(obj_bbox[3] - obj_bbox[1]))

            for c, rect in enumerate(rects):
                iou = compute_iou(obj_bbox, rect)
                a_det = max(1.0, float((rect[2] - rect[0]) * (rect[3] - rect[1])))
                scale_ratio = min(a_track, a_det) / max(a_track, a_det)
                y2_diff = abs(obj_bbox[3] - rect[3])
                c_dist = math.hypot(obj_centroid[0] - input_centroids[c][0], obj_centroid[1] - input_centroids[c][1])

                # Occlusion / Perspective Gates:
                # 1. Scale ratio gate: vehicles do not differ in area by > 2.2x between frames
                # 2. Road contact depth gate: road contact y2 cannot jump > 65px or 45% of height
                # 3. Centroid jump gate: cannot jump > 175px in a single step
                if scale_ratio < 0.45 or y2_diff > max(65.0, 0.45 * vh) or c_dist > 175.0:
                    iou = 0.0

                iou_matrix[r, c] = iou

        # Greedy IoU matching (highest valid IoU first)
        sorted_indices = np.unravel_index(np.argsort(-iou_matrix, axis=None), iou_matrix.shape)
        for r, c in zip(sorted_indices[0], sorted_indices[1]):
            if r in used_rows or c in used_cols:
                continue
            if iou_matrix[r, c] < self.min_iou:
                break
            
            obj_id = object_ids[r]
            smoothed_rect = self._smooth_bbox(obj_id, rects[c])
            scx = (smoothed_rect[0] + smoothed_rect[2]) // 2
            scy = (smoothed_rect[1] + smoothed_rect[3]) // 2
            self.objects[obj_id] = ((scx, scy), smoothed_rect)
            self.disappeared[obj_id] = 0
            self.is_occluded[obj_id] = False
            
            # Kalman Correction step
            meas = np.array([[input_centroids[c][0]], [input_centroids[c][1]]], np.float32)
            self.kf_trackers[obj_id].correct(meas)
            
            used_rows.add(r)
            used_cols.add(c)

        # --- STAGE 2: Distance & Scale Gated Fallback for Unmatched / Reappearing Tracks ---
        unmatched_rows = [r for r in range(len(object_ids)) if r not in used_rows]
        unmatched_cols = [c for c in range(len(rects)) if c not in used_cols]

        for r in unmatched_rows:
            obj_id = object_ids[r]
            obj_centroid, obj_bbox = self.objects[obj_id]
            a_track = max(1.0, float((obj_bbox[2] - obj_bbox[0]) * (obj_bbox[3] - obj_bbox[1])))
            vh = max(1.0, float(obj_bbox[3] - obj_bbox[1]))

            best_c = None
            best_dist = 1e9

            for c in unmatched_cols:
                if c in used_cols:
                    continue
                rect = rects[c]
                a_det = max(1.0, float((rect[2] - rect[0]) * (rect[3] - rect[1])))
                scale_ratio = min(a_track, a_det) / max(a_track, a_det)
                y2_diff = abs(obj_bbox[3] - rect[3])
                c_dist = math.hypot(obj_centroid[0] - input_centroids[c][0], obj_centroid[1] - input_centroids[c][1])

                # Fallback gate: scale must match reasonably (>=0.48) and depth must be consistent (<=55px)
                if scale_ratio >= 0.48 and y2_diff <= max(55.0, 0.40 * vh) and c_dist <= self.max_distance:
                    if c_dist < best_dist:
                        best_dist = c_dist
                        best_c = c

            if best_c is not None:
                # RESTORE ORIGINAL TRACKING ID!
                smoothed_rect = self._smooth_bbox(obj_id, rects[best_c])
                scx = (smoothed_rect[0] + smoothed_rect[2]) // 2
                scy = (smoothed_rect[1] + smoothed_rect[3]) // 2
                self.objects[obj_id] = ((scx, scy), smoothed_rect)
                self.disappeared[obj_id] = 0
                self.is_occluded[obj_id] = False

                meas = np.array([[input_centroids[best_c][0]], [input_centroids[best_c][1]]], np.float32)
                self.kf_trackers[obj_id].correct(meas)

                used_rows.add(r)
                used_cols.add(best_c)

        # Handle remaining unmatched objects and new detections
        unused_rows = set(range(len(object_ids))).difference(used_rows)
        unused_cols = set(range(len(rects))).difference(used_cols)

        for r in unused_rows:
            obj_id = object_ids[r]
            self.disappeared[obj_id] += 1
            # Occluded vehicles are afforded extra grace frames before deregistering
            limit = int(self.max_disappeared * 1.5) if self.is_occluded.get(obj_id, False) else self.max_disappeared
            if self.disappeared[obj_id] > limit:
                self.deregister(obj_id)

        # Brand new detections that did NOT match any active or occluded vehicle:
        # Assign a NEW unique tracking ID
        for c in unused_cols:
            self.register(input_centroids[c], rects[c])

        return self.objects.copy()

    def get_current_objects(self):
        """Get current tracked objects without modifying state."""
        return self.objects.copy()


