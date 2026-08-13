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

## Verification & Testing

To verify the newly implemented features:
1. **Run Unit Tests**:
   ```powershell
   python -m unittest tests/test_detection.py
   ```
2. **Launch Monitoring App**:
   ```powershell
   python app.py
   ```
3. **Navigate to Reports Page**: Open `http://localhost:5000/reports` (or access via the desktop application) and test custom date filters and export functions.
