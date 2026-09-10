# Yellow Box Zone Feature Documentation: Pre-Capture LPR & Advanced Reports Analytics

## Overview

This documentation details the newly implemented features for the **AI-Powered Yellow Box Zone Violation Monitoring System**. These enhancements focus on improving license plate identification accuracy through zone-triggered pre-capture, expanding database analytics with custom date range filtering, and delivering comprehensive visual reporting tools.

---

## 1. Zone-Triggered Pre-Capture License Plate Recognition (LPR)

### Technical Architecture
Previously, license plate recognition was attempted only after a vehicle had already violated the yellow box zone time limit (e.g., remaining stationary for $> 3$ seconds). This often resulted in lower OCR accuracy due to vehicle movement, motion blur, or altered angles upon violation log generation.

The new **Pre-Capture LPR System** introduces an entry-triggered transient caching mechanism:

```
[ Vehicle Enters Yellow Box Zone ]
               │
               ▼
   Check Plate in Cache?
     ├── No ──> Crop Plate Region ──> Run LPR Reader ──> Store in `cached_plates[obj_id]`
     └── Yes ─> Retain Cached Plate Reading
               │
               ▼
    [ Monitor Stop Duration ]
     ├── Violation Committed? ──> Save Violation Log & Attach `cached_plates[obj_id]`
     └── Exits Zone Safely?  ──> Evict `cached_plates[obj_id]` from memory
```

### Key Implementation Details
- **File**: [`utils/monitoring_service.py`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/utils/monitoring_service.py)
- **Transient Cache**: `self.cached_plates` dictionary maps `obj_id` to the pre-read plate string.
- **Pre-Capture Condition**: Triggered immediately when `is_in_zone` evaluates to `True` for any tracked vehicle.
- **Memory Safety**: Automated cleanup evicts cached plates when vehicles exit the yellow box polygon without committing a violation or when tracking IDs expire.

---

## 2. Dynamic Date Range Analytics & Query Engine

### Database Schema Updates
The database schema and query handler were expanded to include location metadata and vehicle color indicators, alongside parameterized SQL range queries.

- **File**: [`database/database.py`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/database/database.py)
- **Schema Enhancements**:
  - `location`: Default tagged as `"Sayre Highway - Fortich St., Malaybalay City"`.
  - `vehicle_color`: Tracked vehicle color attribute (default `"Standard"`).
- **Queries Updated**:
  - `count_violations_by_type(start_date=None, end_date=None)`: Aggregates violations by vehicle classification within custom date ranges.
  - `get_daily_trend(limit=7, start_date=None, end_date=None)`: Returns daily violation time-series counts across specified date windows.

### REST API Parameters
- **Endpoint**: GET `/api/stats`
- **Query Parameters**:
  - `start` *(optional, string)*: Start date in `YYYY-MM-DD` format.
  - `end` *(optional, string)*: End date in `YYYY-MM-DD` format.
- **File**: [`routes/dashboard_routes.py`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/routes/dashboard_routes.py)

---

## 3. Interactive Reports & Export Dashboard

### Features
The frontend `Reports.jsx` page was revamped into an interactive analytics hub for traffic monitoring officers and administrators.

- **File**: [`frontend/src/pages/Reports.jsx`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/frontend/src/pages/Reports.jsx)
- **Key Capabilities**:
  1. **Custom Date Range Filtering**: Dynamic date pickers trigger reactive API re-fetches to update charts and summary metrics in real-time.
  2. **Vehicle Distribution Charts**: Visual pie chart breakdowns of violations by vehicle classification (e.g., Multicab, SUV, Truck, Motorcycle, Bus).
  3. **Violation Trend Analysis**: Interactive bar/line graphs showing daily violation frequencies.
  4. **PDF & Print Exporting**: Built-in functionality to export formatted traffic violation reports suitable for official municipal records.

---

## 4. Asynchronous AI Loop Thread-Safety

### Performance Improvements
To prevent UI/video frame stuttering during complex LPR reads or database transactions:
- **Thread Isolation**: AI object detection and violation evaluation run on a dedicated background thread (`_ai_loop`).
- **Shared State Thread-Safety**: Thread-safe shallow copies (`tracked_objects_map.copy()`) prevent runtime mutation exceptions during frame iteration.
- **FPS Optimization**: Frame skip configuration and worker thread separation ensure continuous 30+ FPS video streaming.

---

## 5. Enhanced Vehicle Color AI Detection & Analytics Monitoring Engine

### 5.1 Dual-Space CIELAB + HSV Color Classification
To overcome real-world outdoor lighting distortions (e.g. direct tropical solar glare, building shadows, overcast cloud cover), the system implements a **Dual-Space Hybrid Color Classifier** in [`ai_model/color_detector.py`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/ai_model/color_detector.py):
- **Perceptual CIELAB Space**: Computes the Euclidean color difference $\Delta E^* = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$ against 11 standardized automotive paint reference vectors:
  - Neutral / Metallic: *White*, *Black*, *Silver*, *Gray*, *Gold / Champagne*
  - Chromatic: *Red*, *Maroon*, *Blue*, *Navy*, *Yellow*, *Green*
- **Joint HSV Cylindrical Partitioning**: Cross-validates hue angle ($H$), saturation ($S$), and brightness ($V$) boundaries to prevent false positives in high-chroma shades.
- **Silver vs. White Resolution**: Separates metallic specular reflections from true white base coat using calibrated lightness ($L^*$) and chroma thresholds.
- **Maroon vs. Black / Navy Resolution**: Uses the positive $a^*$ (redness) axis to reliably classify deep maroon/burgundy vehicles even under dense tree canopy or building shadows.

### 5.2 Class-Aware Anatomical Panel Sampling & Glare/Shadow Rejection
- **Body Panel Sampling**: Isolates the primary painted metal surfaces based on vehicle class (e.g. upper-middle hood and central door panels for cars, specialized masks for buses, trucks, and motorcycles).
- **Masking Exclusions**:
  - Excludes top region (transparent windshield glass, glare, roof racks, sunroofs).
  - Excludes bottom region (black rubber tires, wheels, tarmac shadow).
  - Excludes peripheral border pixels (background road clutter).
- **Specular Glare & Shadow Filtering**: Discards over-saturated sunlight highlights ($V > 245, S < 30$) and deep undercarriage shadows ($V < 30$) before clustering.
- **K-Means Clustering**: Fits $K=3$ dominant color clusters to identify the primary automotive body pigment.

### 5.3 Multi-Frame Temporal Voting Tracker (`VehicleColorTracker`)
- **Exponential Moving Average (EMA) Voting**: Tracks vehicle color predictions across sequential video frames:
  $$W(c) = \sum_{t=1}^{T} \gamma^{T - t} \cdot \mathbb{I}(c_t = c)$$
  with decay factor $\gamma = 0.9$, ensuring that recent frames have higher weight while suppressing single-frame illumination flickering.
- **Confidence Scoring**: Computes a normalized confidence score $\text{Conf}(c^*) \in [0.0, 1.0]$.
- **Minimum Observation Requirement**: Commits only smoothed, stabilized color attributes once a vehicle has been observed for $\ge 2$ frames.

### 5.4 Database & REST API Extensions
- **Database Handler**: [`database/database.py`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/database/database.py)
  - `count_violations_by_color(start_date=None, end_date=None)`: SQL aggregation grouping infractions by vehicle color across custom date ranges.
- **REST API Endpoint**: [`routes/dashboard_routes.py`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/routes/dashboard_routes.py)
  - GET `/api/stats?start=YYYY-MM-DD&end=YYYY-MM-DD`: Returns `by_color` analytics dictionary along with `by_type` and daily trends.

### 5.5 Interactive Web Command Center Analytics & Reports
- **Interactive Distribution Switcher**: Users can toggle effortlessly between **[Colors]** and **[Types]** in [`frontend/src/pages/Reports.jsx`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/frontend/src/pages/Reports.jsx).
- **Automotive Hex Palette**: Dynamic donut chart renders with authentic vehicle paint shades (e.g. Navy `#001f3f`, Maroon `#800000`, Gold `#d4af37`, Silver `#c0c0c0`, etc.).
- **Dominant Offending Color KPI Card**: Prominently highlights the highest-frequency vehicle color involved in yellow box infractions.
- **Multi-Attribute Violation Filtering**: Both [`Reports.jsx`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/frontend/src/pages/Reports.jsx) and [`ViolationLogs.jsx`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/frontend/src/pages/ViolationLogs.jsx) allow simultaneous filtering by Date Range, Vehicle Classification, and Vehicle Color with instant keyword search.
- **Comprehensive Multi-Attribute Exports**:
  - **Official PDF Report**: Incorporates vehicle color breakdown tables, dominant color indicators, and per-infraction color tags alongside vehicle classification.
  - **Excel Spreadsheet Export**: Exports structured `.xlsx` data with complete vehicle color attributes and statistical distribution summaries.

---

## 6. Verification & Testing

To verify the newly implemented features:
1. **Run Color Detector Unit Tests**:
   ```powershell
   python tests/test_color_detector.py
   ```
2. **Run LPR & Detection Unit Tests**:
   ```powershell
   python tests/test_lpr.py
   python tests/test_detection.py
   ```
3. **Launch Monitoring App**:
   ```powershell
   python app.py
   ```
4. **Navigate to Reports Page**: Open `http://localhost:5000/reports` and test the **[Colors | Types]** switcher, dominant color card, custom date filters, and PDF / Excel export functions.
5. **Inspect Live Feeds & Logs**: Verify real-time video stream bounding badges show stabilized vehicle color tags and confidence scores (e.g. "Silver (92%)", "Maroon").
