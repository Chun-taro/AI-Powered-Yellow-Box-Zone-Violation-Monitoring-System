# Comprehensive Budget Plan & Financial Analysis (Philippine Peso - PHP)
## AI-Powered Yellow Box Zone Monitoring System Using AI-Based Camera Detection

**Project Title:** AI-Powered Yellow Box Zone Monitoring System  
**Target Deployment Site:** Traffic Management Center (TMC) / Key Intersections, Malaybalay City, Bukidnon  
**Institution:** Bukidnon State University - College of Technologies  
**Hardware Strategy:** **Deployed directly on an existing Desktop PC / Laptop** (No dedicated AI workstation purchase required)  
**Currency:** Philippine Peso (PHP, ₱)

---

## 1. Executive Summary

This updated budget plan outlines the capital investment (**CapEx**) and recurring operational expenses (**OpEx**) required to deploy, operate, and maintain the **AI-Powered Yellow Box Zone Monitoring System**. Designed to monitor vehicle movement (`car`/multicab, `truck`, `bus`, `motorcycle`), compute stationary dwell times using the **StopTimer Engine**, and support **No-Contact Apprehension Policy (NCAP)** evidence collection, the system is lightweight and optimized to run directly on an **existing office/desktop PC**.

By leveraging an existing PC alongside open-source software (YOLOv8 FP16, OpenCV, React, Flask, SQLite), **hardware purchasing costs are dramatically reduced**, making the project extremely cost-effective for Capstone defense and LGU deployment.

Three deployment tiers are detailed:
1. **Tier 1: Single-Camera Capstone Prototype / Lab Defense** (Existing PC + 1 IP Camera/Webcam Feed)
2. **Tier 2: Single 4-Way Intersection Field Deployment** (Existing PC + 4 Roadside IP Cameras + Field Gear)
3. **Tier 3: Multi-Intersection Network** (Existing TMC Office PCs + Roadside IP Cameras)

---

## 2. Itemized Component Cost Breakdown

### A. Host Computer Requirement (Existing PC Deployment)

| Component | Minimum / Recommended Specs | Qty | Unit Cost (PHP) | Total Cost (PHP) | Remarks |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Host Computer** | Existing Office PC / Laptop (Intel i5/i7 or Ryzen 5/7, 8GB+ RAM) | 1 | **₱0.00** | **₱0.00** | Uses existing hardware available at TMC / School Lab |
| **Evidence Storage (Optional)** | 4TB External / Internal Surveillance HDD (WD Purple / Seagate SkyHawk) | 1 | ₱6,500.00 | ₱6,500.00 | Optional storage expansion for continuous 24/7 video snapshot logging |
| **Subtotal (Host Computer CapEx)** | | | | **₱6,500.00** | *(₱0.00 if using existing PC storage)* |

---

### B. Roadside Field Equipment (Per Intersection - 4 Approaches)

| Item | Technical Specifications | Qty | Unit Cost (PHP) | Total Cost (PHP) |
| :--- | :--- | :---: | :---: | :---: |
| **Roadside IP Cameras** | 1080p Full HD / 4K @ 30 FPS, Outdoor IP67, IR Night Vision 30m, H.264/H.265 PoE | 4 | ₱7,500.00 | ₱30,000.00 |
| **PoE+ Network Switch** | 8-Port Gigabit PoE+ Industrial Switch (120W Total PoE Power Budget) | 1 | ₱5,500.00 | ₱5,500.00 |
| **Roadside Enclosure** | Outdoor NEMA 4X / IP66 Weatherproof Cabinet with Lock & Ventilation | 1 | ₱4,500.00 | ₱4,500.00 |
| **Network Gateway** | Industrial 4G/5G LTE Gateway Router (Dual SIM, VPN support) | 1 | ₱7,500.00 | ₱7,500.00 |
| **Cabling & Conduits** | Outdoor Cat6 STP Shielded Cable (300m roll), PVC Conduits & Fittings | 1 | ₱6,000.00 | ₱6,000.00 |
| **Poles & Brackets** | Heavy-Duty Galvanized Steel Camera Mounting Arms / Pole Brackets | 4 | ₱2,500.00 | ₱10,000.00 |
| **Surge Protection** | Ethernet Lightning & Electrical Surge Protectors | 4 | ₱1,200.00 | ₱4,800.00 |
| **Subtotal (Field Infrastructure CapEx)** | | | | **₱68,300.00** |

---

### C. Software, Data & AI Engineering (CapEx / Initial Development)

| Category | Description | Total Cost (PHP) |
| :--- | :--- | :---: |
| **Core Frameworks** | Python 3.10, PyTorch, YOLOv8 FP16, OpenCV, SciPy (Open Source) | ₱0.00 |
| **Web Dashboard Stack** | React 18, Vite, Tailwind CSS, Flask REST API, SQLite 3 (Open Source) | ₱0.00 |
| **Data Annotation & Training** | Labor & Compute for 1,200+ localized frame dataset (`car`, `truck`, `bus`, `motorcycle`) | ₱15,000.00 |
| **Software Customization** | Ray-Casting Polygon Engine, 2-Stage Kalman Tracker, StopTimer integration | ₱20,000.00 |
| **Field Installation & Calibration**| Site survey, camera alignment, zone coordinate mapping, NCAP workflow testing | ₱15,000.00 |
| **Subtotal (Development & Integration)** | | **₱50,000.00** |

---

## 3. Operational Expenditure (OpEx - Annual Recurring Costs)

| Item | Monthly Cost (PHP) | Annual Cost (PHP) | Remarks |
| :--- | :---: | :---: | :--- |
| **Electricity Power** | ₱500.00 | ₱6,000.00 | PC power draw (~150W-250W) + Field PoE Switch (~60W) |
| **Network Data / Internet** | ₱2,500.00 | ₱30,000.00 | Industrial Fiber / High-Speed Unlimited 4G/5G SIM Connectivity |
| **Hardware Maintenance** | ₱1,000.00 | ₱12,000.00 | Lens cleaning, enclosure fan replacement, cable checks |
| **Software Maintenance** | ₱1,250.00 | ₱15,000.00 | Model retraining with new vehicle types, OS updates, backups |
| **Contingency Reserve** | ₱500.00 | ₱6,000.00 | Emergency replacement fund |
| **Total Annual OpEx** | **₱5,750.00** | **₱69,000.00** | **Per Intersection Site** |

---

## 4. Total Budget by Deployment Scale

### Tier 1: Single-Camera Capstone Defense / Lab Prototype
*Designed for Capstone Defense, Lab Demonstration, and Student Testing using an Existing Laptop/PC.*

- **Existing PC / Laptop**: **₱0.00**
- **1 IP Camera / HD USB Webcam Feed + Tripod**: ₱4,500.00
- **Development & Data Annotation Costs**: ₱15,000.00
- **Initial 1-Year OpEx**: ₱5,000.00
- **GRAND TOTAL TIER 1:** **₱24,500.00**

---

### Tier 2: Single 4-Way Intersection Full Operational Deployment
*Recommended for TMC Malaybalay City live enforcement using an Existing Office PC at the TMC station.*

```
+-----------------------------------------------------------------------------------+
|                  TIER 2 BUDGET SUMMARY - EXISTING PC DEPLOYMENT (PHP)             |
+-----------------------------------------------------------------------------------+
| 1. Host Computer (Existing Desktop PC at TMC)      :  ₱0.00                       |
| 2. Optional 4TB Evidence Storage HDD               :  ₱6,500.00                   |
| 3. Roadside Equipment (4 Approaches / 4 Cameras)   :  ₱68,300.00                  |
| 4. Development, Calibration & Setup                :  ₱50,000.00                  |
| 5. Contingency & Miscellaneous (5%)               :  ₱6,240.00                   |
+-----------------------------------------------------------------------------------+
| TOTAL INITIAL CAPEX                                :  ₱131,040.00                 |
| ANNUAL OPEX (Year 1)                               :  ₱69,000.00                  |
+-----------------------------------------------------------------------------------+
| GRAND TOTAL (FIRST YEAR IMPLEMENTATION)            :  ₱200,040.00                 |
+-----------------------------------------------------------------------------------+
```

---

### Tier 3: Citywide Multi-Intersection Expansion (4 Intersections / 16 Camera Feeds)
*Scales across 4 key intersections in Malaybalay City using Existing TMC Office Workstations.*

- **Host PCs (Existing TMC Computers)**: ₱0.00
- **Optional Storage Hard Drives (4x 4TB HDDs)**: ₱26,000.00
- **Field Infrastructure for 4 Intersections (16 Cameras)**: ₱273,200.00
- **Citywide Fiber Network & Central Dashboard Setup**: ₱50,000.00
- **Citywide Development & Field Commissioning**: ₱80,000.00
- **Annual OpEx (4 Sites)**: ₱240,000.00
- **GRAND TOTAL TIER 3 (FIRST YEAR):** **₱669,200.00**

---

## 5. Financial Comparison: Dedicated Workstation vs. Existing PC

| Budget Metric | Dedicated AI Workstation Plan | **Existing PC Plan (Selected)** | Total Cost Reduction |
| :--- | :---: | :---: | :---: |
| **Host PC Cost** | ₱100,000.00 | **₱0.00** | **-₱100,000.00 (-100%)** |
| **Tier 1 Prototype** | ₱165,000.00 | **₱24,500.00** | **-₱140,500.00 (-85.2%)** |
| **Tier 2 Initial CapEx** | ₱229,215.00 | **₱131,040.00** | **-₱98,175.00 (-42.8%)** |
| **Tier 2 First Year Total** | ₱314,215.00 | **₱200,040.00** | **-₱114,175.00 (-36.3%)** |

---

## 6. Recommendations & Funding Strategy

1. **Capstone Defense & Student Implementation (Tier 1)**:
   By running on your existing student laptop/PC, the prototype budget is reduced to just **₱24,500.00** (covering 1 camera feed, mounting, and dataset annotation), making it easily achievable via university project support or team sharing.
2. **TMC / LGU Pilot Deployment (Tier 2)**:
   Deploy the backend and React dashboard directly on an existing office PC at the Traffic Management Center (TMC). The LGU only needs to fund the field cameras and installation (**₱131,040.00** total CapEx), representing a **36% total savings** compared to purchasing new computer servers.
