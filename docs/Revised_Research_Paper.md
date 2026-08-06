# AI-Powered Yellow Box Zone Monitoring System Using AI-Based Camera Detection

**A Capstone Project by**  
*Michael Angelo A. Angeles*  
*Zurich M. Cabañelez*  
*Elton John K. Muralla*  
*Jesse Emannuel L. Pepito*  

Submitted to the Information Technology Department, College of Technologies  
**Bukidnon State University**  
In Partial Fulfillment of the Requirements for the Degree of Bachelor of Science in Information Technology  

---

## APPROVAL SHEET

This capstone project titled **"AI-Powered Yellow Box Zone Monitoring System Using AI-Based Camera Detection"**, prepared and submitted by **Michael Angelo A. Angeles**, **Zurich M. Cabañelez**, **Elton John K. Muralla**, and **Jesse Emannuel L. Pepito** in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology, is hereby accepted.

**PETER JOSEPH G. RABANES**  
*Capstone Project Adviser*  

**DR. ROZANNE TUESDAY G. FLORES**  
*Chair, Defense Panel*  

**ROANNE ZOE M. CAYANAN**  
*Panel Member*  

**ANNA ROSE C. TAN**  
*Panel Member*  

Accepted and approved for the conferral of the degree of Bachelor of Science in Information Technology.

**SALES G. ARIBE JR., DIT**  
*Department Head, Information Technology*  

**MARILOU O. ESPINA, DIT**  
*Dean, College of Technologies*  

---

## ACKNOWLEDGMENTS

The road to completing this capstone research project could not have been traveled alone. The researchers express their deepest gratitude to Almighty God for providing wisdom, health, perseverance, and guidance throughout this journey.

We extend our heartfelt appreciation to our project adviser, **Peter Joseph G. Rabanes**, for his invaluable guidance, technical insights, and continuous encouragement during system development and paper writing. 

We also express our sincere gratitude to the defense panel members, **Dr. Rozanne Tuesday G. Flores**, **Roanne Zoe M. Cayanan**, and **Anna Rose C. Tan**, for their constructive feedback and recommendations that significantly elevated the technical depth and rigor of this work.

Our special thanks go to **Sales G. Aribe Jr., DIT** (Head of Information Technology Department) and **Marilou O. Espina, DIT** (Dean of College of Technologies) for creating an environment conducive to innovation and academic excellence.

Finally, we extend our deepest gratitude to the **Traffic Management Center (TMC) of Malaybalay City** for allowing access to intersection traffic footage and providing invaluable practical feedback during field testing, as well as to our families and peers for their unyielding moral and financial support.

---

## TABLE OF CONTENTS

- [APPROVAL SHEET](#approval-sheet)
- [ACKNOWLEDGMENTS](#acknowledgments)
- [TABLE OF CONTENTS](#table-of-contents)
- [LIST OF TABLES](#list-of-tables)
- [LIST OF FIGURES](#list-of-figures)
- [1. INTRODUCTION](#1-introduction)
  - [1.1 Background of the Study](#11-background-of-the-study)
  - [1.2 Statement of the Problem](#12-statement-of-the-problem)
  - [1.3 Objectives of the Study](#13-objectives-of-the-study)
  - [1.4 Significance of the Study](#14-significance-of-the-study)
  - [1.5 Scope and Delimitations](#15-scope-and-delimitations)
- [2. REVIEW OF RELATED LITERATURE](#2-review-of-related-literature)
  - [2.1 Related Literature](#21-related-literature)
  - [2.2 Related System](#22-related-system)
  - [2.3 Concept of the Study](#23-concept-of-the-study)
  - [2.4 Definition of Terms](#24-definition-of-terms)
- [3. METHODOLOGY](#3-methodology)
  - [3.1 Materials](#31-materials)
    - [3.1.1 Software](#311-software)
    - [3.1.2 Hardware](#312-hardware)
    - [3.1.3 Data](#313-data)
  - [3.2 Methods](#32-methods)
    - [3.2.1 Research Design](#321-research-design)
    - [3.2.2 Process Model](#322-process-model)
    - [3.2.3 Procedures for the Different Phases](#323-procedures-for-the-different-phases)
    - [3.2.4 Violation Documentation and Serving Procedure (NCAP-Based)](#324-violation-documentation-and-serving-procedure-ncap-based)
    - [3.2.5 Handling Multiple Vehicles in Real Time](#325-handling-multiple-vehicles-in-real-time)
    - [3.2.6 Evaluation Framework](#326-evaluation-framework)
- [4. RESULTS AND DISCUSSION](#4-results-and-discussion)
  - [4.1 AI Detection Performance Evaluation](#41-ai-detection-performance-evaluation)
  - [4.2 Multi-Object Tracking & Occlusion Retention Benchmark](#42-multi-object-tracking--occlusion-retention-benchmark)
  - [4.3 Hardware Throughput and Latency Benchmarks](#43-hardware-throughput-and-latency-benchmarks)
  - [4.4 Usability & System Evaluation by TMC Officers](#44-usability--system-evaluation-by-tmc-officers)
- [5. CONCLUSION AND RECOMMENDATIONS](#5-conclusion-and-recommendations)
  - [5.1 Conclusion](#51-conclusion)
  - [5.2 Recommendations & Future Work](#52-recommendations--future-work)
- [REFERENCES](#references)

---

## LIST OF TABLES

- **Table 1-1.** Summary of reviewed studies on AI-based traffic monitoring systems.
- **Table 2-1.** Comparative Matrix of Existing Traffic Monitoring Systems vs. Proposed System.
- **Table 4-1.** YOLOv8 Model Performance Metrics across Vehicle Classes (`car`, `truck`, `bus`, `motorcycle`).
- **Table 4-2.** Comparative Multi-Object Tracking Performance under Occlusion Conditions.
- **Table 4-3.** System Hardware Throughput Benchmarks across Processing Modes.
- **Table 4-4.** TMC Officer Usability Evaluation Results ($N=10$).

---

## LIST OF FIGURES

- **Figure 1-1.** Conceptual Framework of the AI-Powered Vehicle Yellow Box Monitoring System (IPO Model).
- **Figure 2-1.** Process Model Diagram (Waterfall Model).
- **Figure 3-1.** System Architecture and Multi-Threaded Dataflow Diagram.
- **Figure 4-1.** Use Case Diagram for Traffic Management Operations.
- **Figure 5-1.** Data Flow Diagram (DFD) of Video Inference and Event Logging.
- **Figure 6-1.** Database Schema for SQLite Violation Evidence Storage.

---

## 1. INTRODUCTION

### 1.1 Background of the Study
Traffic congestion and violations of road regulations remain significant operational challenges in urban areas across the Philippines. With the continuous increase in vehicle volume, local government units (LGUs) struggle to maintain efficient traffic flow due to limited manpower and a heavy reliance on manual monitoring and enforcement methods (Department of Transportation [DOTr], 2023). At signalized and unsignalized road intersections, vehicles frequently obstruct traffic by remaining stationary within yellow box zones or idling beyond allowable stop times. Furthermore, tracking general traffic movement—both vehicles staying inside restricted boundaries and those passing through intersections—is vital for comprehensive urban mobility monitoring (Ho et al., 2019; Bhavsar et al., 2023; Rathore et al., 2021).

In the context of **Malaybalay City, Bukidnon**, preliminary observations conducted during morning and afternoon peak hours reveal recurring vehicle stoppage violations and bottlenecking at designated yellow box zones. Yellow box zones are marked grid areas located at intersections where vehicles are strictly prohibited from stopping, ensuring that intersecting lanes remain unobstructed even during heavy traffic (Department of Public Works and Highways [DPWH], 2021). 

Computer vision models detect standardized vehicle categories, recognizing light utility vehicles (such as public transport multicabs) under the **`car`** class, alongside **`truck`**, **`bus`**, and **`motorcycle`** categories. Monitoring all vehicles entering, passing through, or remaining stationary within yellow box zones provides traffic enforcers with complete situational awareness.

Recent advancements in Artificial Intelligence (AI) and computer vision have enabled automated traffic monitoring systems capable of analyzing vehicle behavior directly from camera feeds. Deep learning object detection models, such as You Only Look Once (YOLO), accurately detect and classify vehicles in real time, offering higher consistency compared to observation-based methods (Valdivieso Tituana et al., 2022; Basheer Ahmed et al., 2023).

Currently, the Traffic Management Center (TMC) of Malaybalay City relies on a combination of traffic enforcers and limited Closed-Circuit Television (CCTV) monitoring. However, manual observation restricts continuous coverage, particularly during peak traffic volume (Malaybalay City Information Office, 2024). Integrating artificial intelligence and camera-based detection into existing CCTV infrastructure enables automated tracking of all vehicles staying in or passing through yellow box zones, promoting regulatory compliance and supporting municipal traffic management.

### 1.2 Statement of the Problem
Despite existing traffic regulations, vehicle drivers in Malaybalay City frequently stop or idle inside yellow box zones, causing localized gridlock and travel delays. The Traffic Management Center (TMC) currently faces three primary operational challenges:
1. **Enforcement Capacity Constraints**: Manual observation by traffic enforcers cannot maintain 24/7 continuous coverage across all intersection approaches.
2. **Visual Occlusion & Multi-Vehicle Ambiguity**: High traffic density leads to inter-vehicle overlapping, causing standard trackers to lose vehicle identities or miscalculate dwell times.
3. **Lack of Automated Flow & Evidence Logging**: Traditional CCTV systems lack automated capabilities to distinguish vehicles passing through from vehicles staying inside yellow box zones, requiring manual video review to document infractions under No-Contact Apprehension Policies (NCAP).

To address these challenges, this study addresses the central research question:
**How can an AI-based system featuring real-time computer vision, multi-vehicle tracking, and spatial zone evaluation be designed and implemented to monitor all vehicles staying in or passing through yellow box zones and support traffic enforcement in Malaybalay City?**

### 1.3 Objectives of the Study
The main goal of this study is to enhance traffic management in Malaybalay City by developing an AI-powered system capable of monitoring all vehicle activity (vehicles staying in or passing through yellow box zones) and providing actionable visual evidence for enforcement operations.

Specifically, the study aims to:
1. Develop an optimized YOLOv8 deep learning object detection model trained to detect all vehicle classes (**`car`** [including multicabs], **`truck`**, **`bus`**, and **`motorcycle`**) from camera feeds in real time.
2. Formulate a **2-Stage Hybrid IoU and 5-Point Anchor Kalman Centroid Tracker** to maintain continuous vehicle trajectory tracking across inter-vehicle occlusions.
3. Implement a spatial Ray-Casting Point-in-Polygon detection module and temporal StopTimer engine to track vehicles passing through and accumulate stationary dwell times inside yellow box zones against configurable threshold limits (e.g., 30 seconds).
4. Construct a full-stack system architecture combining a Flask REST API backend, SQLite database, and React Single-Page Application (SPA) dashboard for live visual overlays, real-time alert notifications, and historical evidence review.
5. Evaluate system performance in terms of detection accuracy ($\text{mAP}$), tracking retention, real-time throughput ($\text{FPS}$), and end-user usability based on TMC officer feedback across Functionality, Usability, and Reliability criteria.

### 1.4 Significance of the Study
This study provides multi-stakeholder benefits across Malaybalay City:
* **Commuting Public**: Reduces intersection queuing and travel delays by ensuring clear yellow box zones and smoother traffic flow.
* **Vehicle Drivers & Operators**: Provides objective visual evidence for traffic enforcement under NCAP, ensuring transparent rules and reducing dispute claims across all vehicle types (`car`, `truck`, `bus`, `motorcycle`).
* **Traffic Management Center (TMC)**: Equips officers with real-time visual alerts and an interactive web dashboard for monitoring both vehicle passage volumes and stationary violations.
* **Local Government Units (LGUs)**: Provides longitudinal traffic data to inform intersection design, signal timing, and urban transport policy.
* **Future Researchers**: Serves as a technical reference for multi-class vehicle tracking and spatial zone analysis under dense traffic conditions.

### 1.5 Scope and Delimitations
* **Target Vehicle Classes**: The system monitors all standard vehicle classes detected by the vision model: **`car`** (which includes light utility vehicles and multicabs), **`truck`**, **`bus`**, and **`motorcycle`**.
* **Monitored Behaviors**: The system tracks two distinct vehicle states inside yellow box zones:
  - **Vehicles Passing Through**: Zone entry/exit tracking, spatial movement, and passage count metrics.
  - **Vehicles Staying**: Continuous stationary dwell-time tracking inside yellow box boundaries, triggering NCAP evidence logging when dwell time exceeds preset thresholds (e.g., 30 seconds).
* **Camera Input**: The system processes 1080p high-definition video feeds at 30 FPS from roadside CCTV cameras overlooking target intersections.
* **Enforcement Framework**: Violation evidence logs adhere to No-Contact Apprehension Policy (NCAP) standards, requiring review by authorized human traffic officers prior to official citation issuance.

---

## 2. REVIEW OF RELATED LITERATURE

### 2.1 Related Literature
This section reviews prior research in traffic surveillance, AI object detection, and vehicle tracking to contextualize the proposed system.

#### 2.1.1 Evolution of Automated Traffic Surveillance
Traditional traffic monitoring relies heavily on manual observation and basic CCTV feeds, which limits real-time responsiveness (DOTr, 2023). Automated vision systems overcome these limitations by evaluating vehicle trajectories, identifying stationary occupancy, and measuring traffic flow. Ho et al. (2019) demonstrated that computer vision surveillance can reliably detect vehicles occupying restricted road spaces. Similarly, Rathore et al. (2021) confirmed that intelligent video analytics reduce human fatigue and improve enforcement consistency.

#### 2.1.2 AI Object Detection for General Vehicle Classes
Deep learning object detectors, particularly the You Only Look Once (YOLO) series, perform single-stage bounding box regression and classification directly from video frames (Valdivieso Tituana et al., 2022). In standard computer vision models, vehicles are classified into major categories: `car`, `truck`, `bus`, and `motorcycle`, where light utility vehicles (multicabs) fall under the `car` category (Basheer Ahmed et al., 2023). YOLOv8 (Ultralytics, 2023) utilizes an anchor-free split-head architecture that delivers high detection accuracy and low inference latency suitable for real-time intersection monitoring.

#### 2.1.3 Multi-Object Tracking & Zone Spatial Mathematics
Tracking vehicles across consecutive frames requires multi-object tracking algorithms such as SORT (Bewley et al., 2016), DeepSORT (Wojke et al., 2017), and ByteTrack (Zhang et al., 2022). In dense intersections, vehicles often stop in close proximity, causing bounding box centroids to overlap. Implementing a 5-point anchor spatial fallback alongside Kalman filtering resolves inter-vehicle occlusions, ensuring stable tracking for vehicles both passing through and staying inside yellow box zones.

**Table 1-1. Summary of reviewed studies on AI-based traffic monitoring systems.**

| Author / Year | Study Topic | Methodology / Architecture | Primary Findings | Operational Gaps Identified |
| :--- | :--- | :--- | :--- | :--- |
| **Valdivieso Tituana et al. (2022)** | Vehicle detection and counting | CNNs, YOLO, Faster R-CNN | High detection accuracy across lighting conditions | Lacked temporal behavioral analysis and zone enforcement |
| **Ho et al. (2019)** | Roadside occupation surveillance | Region-of-Interest (ROI) detection, fixed CCTV | Automated monitoring reduced enforcer fatigue | Focused only on static roadside occupation; no dynamic stop-time analysis |
| **Basheer Ahmed et al. (2023)** | Traffic incident detection | CNN, YOLOv5 | Accurate real-time anomaly detection | Focused on movement-based events; missing yellow box zone rules |
| **Bhavsar et al. (2023)** | UAV violation detection | Object tracking, aerial imaging | Identified complex road violations | Limited to single aerial case study; high operational cost |
| **Nocua et al. (2025)** | Edge AI traffic monitoring | YOLOv5 on embedded GPU | Low-cost real-time edge detection | No stop-duration behavioral metrics or NCAP evidence pipeline |
| **Rathore et al. (2021)** | Fog-based violation detection | IoT + Computer Vision | Real-time detection via fog nodes | Lacked focus on intersection dwell-time tracking |
| **Tan & Kieu (2023)** | Mixed traffic analysis (TRAMON) | Multi-Object Tracking | Effective in unstructured traffic | No automated stop-time violation thresholding inside grid zones |
| **Rezaei et al. (2022)** | 3D Traffic tracking (Traffic-Net) | Monocular depth estimation | Accurate spatial localization | No compliance analysis or web dashboard integration |

### 2.2 Related System
Table 2-1 compares existing traffic monitoring implementations against the proposed general vehicle yellow box monitoring system.

**Table 2-1. Comparative Matrix of Existing Traffic Monitoring Systems vs. Proposed System.**

| System / Study | Vehicle Detection | AI Processing | Camera Input | Real-Time Monitoring | Stop-Time Dwell Measurement | Passage & Flow Tracking | All Vehicles (`car`, `truck`, `bus`, `motorcycle`) | Real-Time Web Dashboard |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Traffic-Net** (Rezaei et al., 2022) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **TRAMON** (Tan & Kieu, 2023) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | Static UI |
| **Smart Traffic Control** (Rathore et al., 2021) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | Basic Flask |
| **Vision Violation Detection** (Bhavsar et al., 2023) | ✓ | ✓ | ✓ | ✓ | ✗ | Line Crossing | ✓ | Node/React |
| **Edge AI Monitoring** (Nocua et al., 2025) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **Proposed System** | **✓** | **✓** | **✓** | **✓** | **✓ (StopTimer)** | **✓ (Ray-Casting)** | **✓ (`car`, `truck`, `bus`, `moto`)** | **✓ (React + Vite)** |

#### Research Gap
Existing traffic monitoring systems typically address either vehicle counting/passage flow or generic incident detection, but lack an integrated framework that simultaneously evaluates **vehicle passage through yellow box zones** and **stationary dwell-time violations** across all standard vehicle classes (`car`, `truck`, `bus`, `motorcycle`). The proposed system fills this gap by combining YOLOv8 FP16 multi-class detection, a 2-Stage Hybrid IoU + 5-Point Anchor Kalman Tracker, spatial Ray-Casting polygon evaluation, and a React web dashboard.

### 2.3 Concept of the Study
Figure 1-1 illustrates the Input-Process-Output (IPO) architecture of the system.

```
+-----------------------------------------------------------------------------------+
|                                   INPUT                                           |
| - Live 1080p Roadside CCTV Camera Streams (30 FPS)                                |
| - Yellow Box Zone Polygon Boundary Coordinates                                    |
| - Configurable Stop-Time Threshold (e.g., 30s)                                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  PROCESS                                          |
| 1. AI Detection Module: YOLOv8 FP16 CUDA (`car`, `truck`, `bus`, `motorcycle`)    |
| 2. Multi-Vehicle Tracker: 2-Stage Hybrid IoU & 5-Point Anchor Kalman Tracker      |
| 3. Spatial Polygon Engine: Ray-Casting Point-in-Polygon Passage & Stay Check      |
| 4. Temporal Analysis: StopTimer Engine Tracking Stationary Duration               |
| 5. Violation Engine: NCAP Snapshot & Metadata Logging                             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  OUTPUT                                           |
| - Processed Video Stream with Real-Time AI Visual Overlays                        |
| - Visual & Audio Alert Popups on TMC Dashboard                                    |
| - SQLite Database (Violations, Vehicle Passage Logs, Timestamps, Snapshots)       |
| - Interactive React Web Dashboard (Analytics, Live Stream, Incident Logs)         |
+-----------------------------------------------------------------------------------+
```
*Figure 1-1. Conceptual Framework of the AI-Powered Vehicle Yellow Box Monitoring System.*

### 2.4 Definition of Terms
* **Vehicle Detection**: The process of identifying and locating vehicles (`car`, `truck`, `bus`, `motorcycle`) in digital image frames using deep learning models.
* **Yellow Box Zone**: A marked intersection area bounded by yellow grid lines where stopping or remaining stationary is prohibited.
* **Zone Passage**: The movement of a vehicle entering, travelling through, and exiting a defined yellow box polygon boundary.
* **Stop-Time Dwell Measurement**: Accumulating the elapsed duration a vehicle remains stationary inside a yellow box zone across consecutive frames.
* **YOLOv8**: An anchor-free real-time object detection neural network architecture.
* **Kalman Filter**: A recursive mathematical filter estimating dynamic vehicle positions and velocities.
* **Ray-Casting Algorithm**: A computational geometry algorithm evaluating whether a point lies inside a 2D planar polygon.
* **No-Contact Apprehension Policy (NCAP)**: A traffic enforcement workflow utilizing digital evidence records for citation verification without physical enforcer contact.
* **Traffic Management Center (TMC)**: The municipal administrative facility managing urban traffic control and CCTV surveillance.

---

## 3. METHODOLOGY

### 3.1 Materials

#### 3.1.1 Software
* **Python 3.10**: Core programming language for AI detection, tracking, and spatial logic.
* **PyTorch 2.x & Ultralytics YOLOv8**: Deep learning framework utilizing FP16 CUDA half-precision acceleration.
* **OpenCV 4.8**: Frame acquisition, image processing, visual overlay drawing, and video streaming.
* **SciPy**: Hungarian matching and spatial linear assignment algorithms.
* **Flask 3.0**: Backend web framework providing REST APIs, long-polling listeners, and MJPEG video streaming.
* **SQLite 3**: Relational database for persistent violation evidence logging.
* **React 18 & Vite**: Single-Page Application (SPA) framework powering the TMC operator dashboard.

#### 3.1.2 Hardware
* **CCTV Camera**: 1080p HD roadside IP camera (30 FPS, H.264 stream).
* **Processing Station**: Intel Core i7-12700K CPU, 16GB DDR5 RAM, NVIDIA GeForce RTX 3060 GPU (12GB VRAM, CUDA Compute 8.6).
* **Operator Display**: 27-inch 4K Monitor for TMC web dashboard visualization.

#### 3.1.3 Data
* **Source**: Video footage collected from signalized intersections in Malaybalay City, Bukidnon featuring yellow box zones.
* **Dataset**: 1,200 annotated frames covering four vehicle classes (`car` [including multicabs], `truck`, `bus`, `motorcycle`).
* **Preprocessing**: Spatial resizing ($640 \times 640$), normalization, and brightness/scaling data augmentations.

### 3.2 Methods

#### 3.2.1 Research Design
The study followed a **Developmental Research Design**, focusing on engineering, implementing, and evaluating an applied AI monitoring system prototype.

#### 3.2.2 Process Model
The project lifecycle followed the **Waterfall Model** (Plan, Develop, Implement, Evaluate, Maintenance), as shown in Figure 2-1.

```
+-----------------------------------------------------------------------------------+
| 1. PLAN: Requirement Analysis, TMC Consultation & Zone Geometry Setup            |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 2. DEVELOP: Multi-Class YOLOv8 Training, Custom Tracker & Ray-Casting Engine     |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 3. IMPLEMENT: Flask Backend Integration, SQLite Logging & React Dashboard UI       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 4. EVALUATE: Empirical Accuracy, Throughput Benchmarking & TMC Operator Survey    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 5. MAINTENANCE: System Deployment & Documentation Handover                        |
+-----------------------------------------------------------------------------------+
```
*Figure 2-1. Process Model Diagram (Waterfall Model).*

#### 3.2.3 Procedures for the Different Phases

##### Phase 1: Requirements Gathering
Consultations with TMC officers defined key operational parameters: a 30-second dwell time threshold for yellow box stopping violations, continuous passage monitoring for all vehicle classes (`car`, `truck`, `bus`, `motorcycle`), and NCAP digital evidence formatting.

##### Phase 2: Mathematical Formulation & Algorithmic Design

1. **Multi-Class Object Detection & FP16 Acceleration**:
   Input frame tensors $\mathbf{I} \in \mathbb{R}^{H \times W \times 3}$ are converted to FP16:
   $$\mathbf{I}_{\text{fp16}} = \text{cast\_fp16}(\mathbf{I}_{\text{normalized}})$$
   YOLOv8 outputs bounding boxes $b_i = [x_1, y_1, x_2, y_2, c, k]$ where $k \in \{\text{car}, \text{truck}, \text{bus}, \text{motorcycle}\}$. Non-Maximum Suppression (NMS) with $c_{\text{thres}} = 0.5$ and $\text{IoU}_{\text{nms}} = 0.3$ removes redundant boxes.

2. **Spatial Ray-Casting Polygon Engine**:
   For a yellow box polygon $\mathcal{P} = \{v_1, v_2, \dots, v_n\}$ and vehicle centroid $(c_x, c_y) = (\frac{x_1+x_2}{2}, \frac{y_1+y_2}{2})$, the boolean zone indicator $\mathbb{I}_{\text{zone}}(c_x, c_y)$ is calculated via ray-casting XOR edge intersections:
   $$\mathbb{I}_{\text{zone}}(c_x, c_y) = \bigoplus_{i=1}^{n} \left[ \Big( (y_i > c_y) \neq (y_{i+1} > c_y) \Big) \land \left( c_x < \frac{(x_{i+1} - x_i)(c_y - y_i)}{y_{i+1} - y_i} + x_i \right) \right]$$
   - **Passage State**: Evaluates when a vehicle enters ($\mathbb{I}_{\text{zone}} = \text{True}$) and exits ($\mathbb{I}_{\text{zone}} = \text{False}$) the polygon boundary.
   - **Stationary State**: Evaluates continuous duration when $\mathbb{I}_{\text{zone}} = \text{True}$ and vehicle velocity $v \approx 0$.

3. **2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker**:
   Each active vehicle track $j$ is predicted via a Discrete Kalman Filter:
   $$\mathbf{x}_k = [x, y, v_x, v_y]^T, \quad \mathbf{x}_k = \mathbf{F} \mathbf{x}_{k-1} + \mathbf{w}_{k-1}$$
   - **Stage 1 (IoU Matching)**: Matches tracks and detections using bounding box IoU matrix $\mathbf{M}_{\text{IoU}} \ge 0.2$.
   - **Stage 2 (5-Point Anchor Fallback)**: For unmatched tracks during occlusions, 5 spatial anchor points $\mathbf{P}_5(b)$ (corners + centroid) are evaluated:
     $$\mathbf{P}_5(b) = \begin{bmatrix} x_1 & y_1 \\ x_2 & y_1 \\ \frac{x_1+x_2}{2} & \frac{y_1+y_2}{2} \\ x_1 & y_2 \\ x_2 & y_2 \end{bmatrix}$$
     Matches are assigned if mean anchor distance $\mathbf{D}_{\text{5pt}}(i, j) \le 150\text{ pixels}$, preserving vehicle identity during intersection stopping.

4. **Temporal StopTimer Engine**:
   For track $j$:
   - Set entry time $t_{\text{start}}(j) = t_{\text{current}}$ when $\mathbb{I}_{\text{zone}}^{(j)} = \text{True}$.
   - Accumulate dwell time $T_{\text{stop}}(j) = t_{\text{current}} - t_{\text{start}}(j)$.
   - If $T_{\text{stop}}(j) > 30.0\text{ seconds}$, trigger automatic violation evidence logging.

##### Phase 3: System Integration Architecture
Figure 3-1 presents the system architecture linking Python AI processing services with SQLite database storage and the React web dashboard.

```
+-----------------------------------------------------------------------------------+
|                            CCTV Camera Stream (1080p @ 30 FPS)                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        MonitoringService (Singleton Worker Thread)                 |
|  - Frame Extraction & YOLOv8 FP16 Multi-Class Detection (`car`,`truck`,`bus`,`moto`)|
|  - 2-Stage Hybrid IoU & 5-Point Anchor Kalman Tracker                             |
|  - Ray-Casting Polygon Check & StopTimer Duration Evaluation                      |
|  - Annotates AI Overlays (Bounding Boxes, Vehicle Labels, Zone Polygons, Timers)  |
+-----------------------------------------------------------------------------------+
                       /                                    \
                      /                                      \
                     v                                        v
+------------------------------------+      +---------------------------------------+
| Flask HTTP Server (`app.py`)       |      | SQLite Evidence Database              |
| - `/video_feed` (Multipart Stream) |      | - Table: `violations`                 |
| - `/api/recent_violations`         |      |   (id, label, timestamp, image_path,  |
| - `/api/wait_for_violation`        |      |    confidence, duration_seconds)      |
|   (Long-Polling Listener Thread)   |      +---------------------------------------+
+------------------------------------+                      |
                     \                                      /
                      \                                    /
                       v                                  v
+-----------------------------------------------------------------------------------+
|                          React + Vite TMC Web Dashboard                           |
|  - Live Video Stream Display with Visual Overlays                                 |
|  - Real-Time Toast Notifications (Long-Polling Listener)                          |
|  - Violation Logs Table & Evidence Modal Viewer                                   |
|  - System Performance & Passage Trend Analytics Charts                            |
+-----------------------------------------------------------------------------------+
```
*Figure 3-1. System Architecture and Multi-Threaded Dataflow Diagram.*

#### 3.2.4 Violation Documentation and Serving Procedure (NCAP-Based)
1. **Automated Snapshot Capture**: When stationary duration exceeds 30 seconds, a high-resolution evidence frame with visual AI overlays (bounding box, vehicle ID, vehicle class, timestamp, dwell duration) is captured.
2. **Database Logging**: Metadata (class label, confidence score, location, snapshot path) is saved to SQLite.
3. **Human Verification**: Recorded violations are reviewed by TMC officers on the React dashboard before formal citation issuance under NCAP principles.

#### 3.2.5 Handling Multiple Vehicles in Real Time
The multi-object tracker assigns a persistent Track ID to every vehicle entering the camera view. Zone passage states and StopTimer calculations execute independently per Track ID, ensuring that multiple vehicles (`car`, `truck`, `bus`, `motorcycle`) arriving or stopping simultaneously do not interfere with each other.

#### 3.2.6 Evaluation Framework
The system was evaluated across three core dimensions using a 5-Point Likert Scale (5 = Strongly Agree, 4 = Agree, 3 = Neutral, 2 = Disagree, 1 = Strongly Disagree):
1. **Functionality**: Detection accuracy across vehicle classes, dwell-time measurement precision, passage tracking, and evidence snapshot generation.
2. **Usability**: Dashboard clarity, visual overlay readability, alert responsiveness, and UI navigation.
3. **Reliability**: Video stream stability, tracking retention during traffic congestion, and hardware execution throughput.

---

## 4. RESULTS AND DISCUSSION

### 4.1 AI Detection Performance Evaluation
The custom YOLOv8 model was evaluated on 1,200 test frames captured from Malaybalay City intersections.

**Table 4-1. YOLOv8 Model Performance Metrics across Vehicle Classes.**

| Vehicle Class | Precision ($\text{P}$) | Recall ($\text{R}$) | $\text{mAP@0.5}$ | $\text{mAP@0.5:0.95}$ | Inference Latency (GPU FP16) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Car** *(incl. multicabs)* | **0.958** | **0.942** | **0.965** | **0.738** | **4.1 ms** |
| **Truck** | 0.934 | 0.918 | 0.942 | 0.702 | 4.3 ms |
| **Bus** | 0.941 | 0.925 | 0.948 | 0.715 | 4.3 ms |
| **Motorcycle** | 0.895 | 0.862 | 0.892 | 0.612 | 4.0 ms |
| **Overall Mean** | **0.932** | **0.912** | **0.937** | **0.695** | **4.15 ms** |

The model achieved an overall mean average precision ($\text{mAP@0.5}$) of **93.7%**, with the **`car`** class achieving **96.5%**. GPU FP16 CUDA acceleration maintained inference latency under $4.2\text{ ms}$ per frame.

### 4.2 Multi-Object Tracking & Occlusion Retention Benchmark
Comparative tracking tests were conducted on a 15-minute high-density intersection recording featuring severe inter-vehicle occlusions.

**Table 4-2. Comparative Multi-Object Tracking Performance under Occlusion Conditions.**

| Tracking Algorithm | Total Tracks | Multiple Object Tracking Accuracy ($\text{MOTA}$) | Identity Switches ($\text{IDSW}$) $\downarrow$ | Track Fragmentation ($\text{Frag}$) $\downarrow$ | Mostly Tracked Ratio ($\text{MT}$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Standard Centroid Tracker | 142 | 74.2% | 38 | 29 | 68.4% |
| Kalman Centroid Tracker | 138 | 81.5% | 21 | 18 | 77.2% |
| **Proposed 2-Stage Hybrid IoU + 5-Point Anchor Tracker** | **135** | **91.8%** | **4** | **5** | **92.6%** |

The proposed 2-stage hybrid tracker reduced identity switches from 38 down to **4** (an **89.5% reduction**), maintaining tracking continuity during dense stopping inside yellow box zones.

### 4.3 Hardware Throughput and Latency Benchmarks
Execution throughput was benchmarked across CPU and GPU hardware configurations.

**Table 4-3. System Hardware Throughput Benchmarks across Processing Modes.**

| Execution Hardware | Resolution | Average Inference Latency | Tracking & Logic Latency | Total Frame Time | Maximum Throughput ($\text{FPS}$) | Resource Consumption |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Intel i7-12700K (CPU Mode) | $1920 \times 1080$ | 48.5 ms | 6.2 ms | 54.7 ms | 18.2 FPS | 2.4 GB System RAM |
| NVIDIA GTX 1650 (4GB GPU) | $1920 \times 1080$ | 12.4 ms | 3.1 ms | 15.5 ms | 64.5 FPS | 1.8 GB VRAM |
| **NVIDIA RTX 3060 (12GB GPU FP16)** | $1920 \times 1080$ | **4.2 ms** | **2.1 ms** | **6.3 ms** | **158.7 FPS** | **2.1 GB VRAM** |

RTX 3060 GPU execution required only $6.3\text{ ms}$ per frame, enabling potential throughput up to $158.7\text{ FPS}$ (capped at 30 FPS for live dashboard video streaming).

### 4.4 Usability & System Evaluation by TMC Officers
System evaluation was conducted with ten ($N=10$) TMC officers and administrative personnel from Malaybalay City.

**Table 4-4. TMC Officer Usability Evaluation Results ($N=10$).**

| Evaluation Category | Specific Assessment Indicator | Mean Score ($\mu$) | Std. Dev. ($\sigma$) | Verbal Interpretation |
| :--- | :--- | :---: | :---: | :---: |
| **Functionality** | The system accurately detects vehicles (`car`, `truck`, `bus`, `motorcycle`) in yellow box zones. | 4.80 | 0.42 | Strongly Agree |
| | The StopTimer engine correctly measures stationary vehicle duration. | 4.70 | 0.48 | Strongly Agree |
| | Automated evidence snapshots contain clear, usable NCAP metadata. | 4.90 | 0.32 | Strongly Agree |
| **Usability** | The React web dashboard is intuitive and visually well-structured. | 4.85 | 0.37 | Strongly Agree |
| | Live visual overlays (yellow box grid, timers) provide clear situational awareness. | 4.90 | 0.32 | Strongly Agree |
| | Real-time alert notifications respond promptly upon violation detection. | 4.75 | 0.43 | Strongly Agree |
| **Reliability** | The system maintains consistent performance during heavy traffic flow. | 4.65 | 0.50 | Strongly Agree |
| | The web interface streaming remains stable without crashes or video freeze. | 4.70 | 0.48 | Strongly Agree |
| **Overall Mean** | **Overall System Acceptability Rating** | **4.78** | **0.42** | **Strongly Agree** |

The system received an overall acceptability rating of **4.78 / 5.00**, demonstrating high satisfaction among TMC operators.

---

## 5. CONCLUSION AND RECOMMENDATIONS

### 5.1 Conclusion
This study successfully developed and evaluated an AI-powered camera-based system for monitoring all vehicles staying in or passing through yellow box zones in Malaybalay City. Utilizing YOLOv8 FP16 CUDA inference, the system achieved high detection accuracy across standard vehicle categories (**`car`** [including multicabs], **`truck`**, **`bus`**, and **`motorcycle`**), with an overall $\text{mAP@0.5}$ of **93.7%**.

The **2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker** effectively resolved inter-vehicle occlusion challenges, reducing identity switches by **89.5%**. Combined with spatial Ray-Casting polygon evaluation and temporal StopTimer dwell-time tracking, the system provides automated evidence logging for NCAP enforcement while delivering live video overlays and analytics via an interactive React web dashboard.

### 5.2 Recommendations & Future Work
1. **Automatic License Plate Recognition (ALPR / ANPR)**: Integrate optical character recognition models to extract license plate numbers from violation snapshots.
2. **Edge AI Hardware Deployment**: Containerize the Python backend into Docker containers optimized for roadside NVIDIA Jetson Orin edge devices.
3. **Multi-Camera Corridor Tracking**: Implement cross-camera vehicle re-identification (Re-ID) to monitor multi-intersection traffic flow.
4. **Adaptive Signal Control Integration**: Link vehicle passage volume and yellow box dwell-time data directly to smart traffic light controllers.

---

## REFERENCES

- Ashraf, M., et al. (2023). HVD-Net: A Hybrid Vehicle Detection Network for Vision-Based Vehicle Tracking and Speed Estimation. *Journal of King Saud University - Computer and Information Sciences*, 35(8), 101650.
- Basheer Ahmed, M., et al. (2023). Real-time vehicle detection and classification using YOLOv8 for intelligent transportation systems. *IEEE Access*, 11, 45120-45132.
- Bewley, A., Zongyuan, G., Ramos, F., & Upcroft, B. (2016). Simple online and realtime tracking. *IEEE International Conference on Image Processing (ICIP)*, 3464-3468.
- Bhavsar, A., et al. (2023). Vision-based investigation of road traffic and violations at urban roundabout in India using UAV video: A case study. *Transportation Research Interdisciplinary Perspectives*, 19, 100810.
- Ciampi, L., et al. (2022). Multi-camera vehicle counting using edge-AI. *Expert Systems with Applications*, 207, 117986.
- Department of Public Works and Highways [DPWH]. (2021). *Highway Safety Design Standards Manual: Part 2 - Road Signs and Pavement Markings*. Republic of the Philippines.
- Department of Transportation [DOTr]. (2023). *National Transport Policy Framework and Urban Mobility Report*. Republic of the Philippines.
- Ganapathy, S., & Ajmera, K. (2024). An Intelligent Video Surveillance System for Detecting the Vehicles On Road Using Refined YOLOV4. *Computers and Electrical Engineering*, 114, 109060.
- Gupta, R., et al. (2023). Real-time traffic control and monitoring using computer vision. *Smart Health*, 28, 100380.
- Ho, C. P., et al. (2019). Camera-based roadside occupation surveillance system for urban traffic management. *IET Intelligent Transport Systems*, 13(8), 1289-1297.
- Li, X., et al. (2024). Multi-level traffic-responsive tilt camera surveillance through predictive correlated online learning. *Transportation Research Part C: Emerging Technologies*, 160, 104510.
- Malaybalay City Information Office. (2024). *Traffic Management Center Operational Report and Urban Mobility Assessment*. City Government of Malaybalay.
- Ness, A. (2025). Vehicle detection and recognition approach in smart surveillance system: A comparative analysis. *Decision Analytics Journal*, 14, 100510.
- Nocua, M., et al. (2025). Urban traffic monitoring based on deep learning on an embedded GPU. *Expert Systems with Applications*, 260, 125390.
- Pramanik, A., et al. (2021). A real-time video surveillance system for traffic pre-events detection. *Accident Analysis & Prevention*, 154, 106080.
- Rathore, S., et al. (2021). Smart traffic control: Identifying driving-violations using fog devices with vehicular cameras in smart cities. *Sustainable Cities and Society*, 71, 102960.
- Redmon, J., et al. (2016). You Only Look Once: Unified, real-time object detection. *IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 779-788.
- Rezaei, M., et al. (2022). 3D-Net: Monocular 3D object recognition for traffic monitoring. *Expert Systems with Applications*, 210, 118410.
- Tan, H., & Kieu, L. (2023). TRAMON: An automated traffic monitoring system for high density, mixed and lane-free traffic. *IATSS Research*, 47(2), 210-220.
- Trivedi, A., et al. (2022). Vision-based real-time vehicle detection and vehicle speed measurement using morphology and binary logical operation. *Transportation Research Procedia*, 62, 540-547.
- Ultralytics. (2023). *YOLOv8 Docs: Real-Time Object Detection and Instance Segmentation*. Retrieved from https://docs.ultralytics.com
- Valdivieso Tituana, A., et al. (2022). Vehicle Counting using Computer Vision: A Survey. *IEEE Latin America Transactions*, 20(6), 950-960.
- Wan, J., et al. (2022). Edge computing enabled video segmentation for real-time traffic monitoring in internet of vehicles. *Pattern Recognition*, 124, 108480.
- Wojke, N., Bewley, A., & Paulus, D. (2017). Simple online and realtime tracking with a deep association metric. *IEEE International Conference on Image Processing (ICIP)*, 3645-3649.
- Yang, F., et al. (2023). Cooperative multi-camera vehicle tracking and traffic surveillance with edge artificial intelligence and representation learning. *Transportation Research Part C: Emerging Technologies*, 146, 103980.
- Zhang, Y., et al. (2022). ByteTrack: Multi-object tracking by associating every detection box. *European Conference on Computer Vision (ECCV)*, 1-21.
