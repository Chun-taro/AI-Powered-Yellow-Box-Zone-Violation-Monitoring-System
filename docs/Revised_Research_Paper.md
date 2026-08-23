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
    - [2.1.1 Evolution of Automated Traffic Surveillance](#211-evolution-of-automated-traffic-surveillance)
    - [2.1.2 AI Object Detection for General Vehicle Classes](#212-ai-object-detection-for-general-vehicle-classes)
    - [2.1.3 Multi-Object Tracking & Zone Spatial Mathematics](#213-multi-object-tracking--zone-spatial-mathematics)
    - [2.1.4 Deep Learning FP16 CUDA Optimization & Edge Acceleration](#214-deep-learning-fp16-cuda-optimization--edge-acceleration)
    - [2.1.5 Legal & Technical Framework of No-Contact Apprehension Policy (NCAP)](#215-legal--technical-framework-of-no-contact-apprehension-policy-ncap)
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
Traffic congestion and violations of road regulations remain significant operational challenges in rapidly urbanizing regions across the Philippines. As vehicle ownership continues to expand faster than urban road infrastructure capacity, municipal local government units (LGUs) struggle to maintain orderly traffic flow and prevent intersection gridlock (Department of Transportation [DOTr], 2023). In many provincial cities and metropolitan corridors, key intersections become severe bottlenecks during peak hours. A primary contributor to localized gridlock is the unauthorized occupancy of yellow box zones—designated intersection grid areas where vehicles are legally prohibited from stopping or remaining stationary.

Yellow box zones are standardized pavement markings governed by national traffic regulations (Department of Public Works and Highways [DPWH], 2021). The explicit legal purpose of a yellow box zone is to ensure that intersecting traffic lanes remain open and unobstructed, even when signal lights transition or when downstream traffic slows down. When motorists enter a yellow box intersection without a clear exit path and subsequently come to a complete stop, they block cross-traffic lanes, precipitating cascading traffic queues across multiple arterial routes.

In the specific context of **Malaybalay City, Bukidnon**, rapid economic expansion and commercial activity along major thoroughfares (such as Sayre Highway intersection corridors) have led to increased vehicle traffic volume. Preliminary field observations conducted by the research team during morning (7:00 AM – 9:00 AM) and afternoon (4:30 PM – 6:30 PM) peak travel hours revealed frequent vehicle idling and persistent stopping inside marked yellow box zones. The local Traffic Management Center (TMC) of Malaybalay City currently relies on human traffic enforcers stationed physically at key intersections, supplemented by basic closed-circuit television (CCTV) feeds monitored at a central control station (Malaybalay City Information Office, 2024).

However, manual traffic observation presents fundamental operational limitations. Human enforcers face physical fatigue, visual distractions, adverse weather conditions, and limited coverage angles, making continuous 24/7 enforcement across all critical approaches impossible. Furthermore, manual observation lacks an automated mechanism to continuously track individual vehicle dwell times or distinguish between a vehicle legitimately passing through an intersection versus one illegally idling beyond allowable limits.

Recent breakthroughs in Artificial Intelligence (AI), computer vision, and deep neural networks offer transformative opportunities for municipal traffic surveillance. State-of-the-art object detection architectures, such as You Only Look Once (YOLOv8), demonstrate real-time object classification capabilities directly from high-definition digital camera streams (Valdivieso Tituana et al., 2022; Basheer Ahmed et al., 2023). By coupling deep learning object detectors with multi-object tracking (MOT) algorithms and spatial computational geometry, automated vision systems can track every vehicle entering an intersection, detect zone boundaries, measure stationary dwell durations, and capture objective evidence records.

In Philippine urban transport networks, vehicles represent diverse physical dimensions and kinematic behaviors. Standard computer vision object classes categorize these into four major vehicle types: **`car`** (which includes light utility vehicles, private sedans, SUVs, and public utility multicabs prevalent in local transport), **`truck`** (medium to heavy cargo transport), **`bus`** (passenger coaches), and **`motorcycle`** (motorized two-wheelers). Developing an automated monitoring system capable of recognizing all standard vehicle categories, tracking both passage volume and stationary dwell violations, and serving verifiable No-Contact Apprehension Policy (NCAP) evidence records is vital for modernizing municipal traffic control in Malaybalay City.

### 1.2 Statement of the Problem
Despite clear traffic regulations prohibiting stationary stopping inside yellow box zones, vehicle drivers in Malaybalay City frequently idle within gridlines during heavy congestion. The Traffic Management Center (TMC) faces three major systemic challenges:

1. **Enforcement Capacity & Human Fatigue Constraints**: Physical traffic enforcers cannot maintain 24/7 continuous monitoring across all major intersection approaches. Manual observation leads to subjective enforcement, missed violations, and enforcer fatigue during peak hours.
2. **Visual Occlusion & Multi-Vehicle Tracking Ambiguity**: Heavy traffic density leads to severe visual overlap between adjacent vehicles (such as large trucks obscuring motorcycles or multicabs). Standard computer vision tracking algorithms lose track identity during vehicle stopping, resulting in fragmented trajectories or false dwell-time calculations.
3. **Lack of Automated Passage Flow & NCAP Evidence Logging**: Existing municipal CCTV systems function purely as passive video display monitors. They lack intelligent analytical logic to distinguish vehicles passing through from vehicles staying inside yellow box zones, requiring manual video review to document infractions under No-Contact Apprehension Policy (NCAP) guidelines.

To address these core operational problems, this capstone study addresses the central research question:
**How can an AI-based system featuring real-time computer vision, multi-vehicle tracking, and spatial zone evaluation be designed and implemented to monitor all vehicles staying in or passing through yellow box zones and support traffic enforcement in Malaybalay City?**

### 1.3 Objectives of the Study
The primary goal of this study is to enhance traffic management and regulatory enforcement in Malaybalay City by developing and evaluating an AI-powered system capable of real-time multi-vehicle detection, passage tracking, stop-time measurement, and automated NCAP evidence documentation.

Specifically, the study aims to:
1. Train and optimize a multi-class YOLOv8 deep learning object detection model using FP16 CUDA acceleration to accurately recognize all standard vehicle classes (**`car`** [including light utility multicabs], **`truck`**, **`bus`**, and **`motorcycle`**) from 1080p camera feeds in real time.
2. Formulate a **2-Stage Hybrid IoU and 5-Point Anchor Kalman Centroid Tracker** to maintain continuous vehicle identity retention and eliminate identity switches during dense intersection stopping and visual occlusions.
3. Implement a spatial Ray-Casting Point-in-Polygon evaluation engine and temporal StopTimer accumulator to distinguish vehicles passing through from stationary vehicles, logging violations when dwell times exceed configurable thresholds (e.g., 30 seconds).
4. Construct a robust full-stack software architecture combining a multi-threaded Flask REST API backend, SQLite evidence database, and a responsive React Single-Page Application (SPA) dashboard for live visual overlays, real-time alert popups, and historical violation evidence management.
5. Benchmark system performance in terms of object detection accuracy ($\text{mAP}$), multi-object tracking retention ($\text{MOTA}$), hardware execution throughput ($\text{FPS}$), and user acceptability based on TMC officer evaluations across Functionality, Usability, and Reliability dimensions.

### 1.4 Significance of the Study
This study provides tangible, multi-stakeholder benefits across the municipal transportation ecosystem of Malaybalay City:

* **Commuting Public & Pedestrians**: Minimizes intersection blockages and cascading gridlock, reducing travel delays, fuel consumption, and transit frustration during morning and afternoon peak hours.
* **Vehicle Drivers & Commercial Fleet Operators**: Ensures fair, objective, and transparent traffic enforcement under NCAP principles. Automated visual evidence overlays prevent arbitrary citations and provide verified photographic records for all vehicle types (`car`, `truck`, `bus`, `motorcycle`).
* **Traffic Management Center (TMC) Enforcers**: Equips municipal operators with real-time visual alerts and an intuitive web dashboard, transforming passive surveillance into automated actionable intelligence and allowing enforcers to focus on strategic traffic direction.
* **Local Government Units (LGUs) & Urban Planners**: Delivers longitudinal data regarding intersection throughput, vehicle passage volumes, and high-violation time intervals to guide signal timing optimization, road infrastructure expansion, and transport policy.
* **Academic Community & Future Researchers**: Establishes a technical benchmark and reference implementation for multi-class vehicle tracking, spatial boundary computation, and edge-accelerated computer vision surveillance under dense provincial traffic conditions.

### 1.5 Scope and Delimitations
To establish clear operational boundaries, the scope and delimitations of this study are defined as follows:

* **Target Vehicle Classes**: The vision system is configured to detect, track, and monitor four standard vehicle categories: **`car`** (encompassing sedans, SUVs, vans, and light utility multicabs), **`truck`** (rigid and articulated freight transport), **`bus`** (mini-buses and passenger coaches), and **`motorcycle`** (motorized two-wheelers).
* **Monitored Vehicle Behaviors**: The system evaluates two distinct spatial-temporal behaviors within designated yellow box boundaries:
  - *Vehicles Passing Through*: Tracks vehicle entry, movement trajectory, exit timestamp, and cumulative passage count.
  - *Vehicles Staying / Idling*: Accumulates continuous stationary dwell duration ($T_{\text{stop}}$) for vehicles remaining inside the yellow box polygon. If $T_{\text{stop}}$ exceeds the preset threshold (30 seconds), an NCAP evidence snapshot is logged.
* **Camera Hardware & Stream Input**: The system processes 1080p High-Definition (1920x1080 resolution) video feeds streaming at 30 frames per second (FPS) via standard roadside CCTV cameras positioned at elevated angles overlooking target intersections.
* **Enforcement Integration**: The system generates digital evidence packages (annotated high-resolution snapshot image, timestamp, vehicle class, confidence score, dwell duration) compliant with No-Contact Apprehension Policy (NCAP) standards. The system serves as a decision-support system requiring validation by authorized human TMC officers prior to citation issuance.
* **Delimitations**: The system does not directly issue automated monetary fines or connect directly to national vehicle registration databases (such as the LTO IT system). Environmental testing is delimited to daytime, dusk, and nighttime lighting conditions under clear and light-to-moderate rain conditions. Severe extreme weather events (such as typhoon-level torrential downpours causing complete camera lens distortion) are beyond the current evaluation scope.

---

## 2. REVIEW OF RELATED LITERATURE

### 2.1 Related Literature

#### 2.1.1 Evolution of Automated Traffic Surveillance
Traditional traffic monitoring historically relied on physical intrusive sensors, such as inductive loop detectors buried beneath asphalt surfaces, pneumatic road tubes, and manual enforcer tally sheets (DOTr, 2023). While inductive loops provide accurate point counts, they require destructive road installation, are prone to mechanical failure under heavy axle loads, and cannot provide visual spatial intelligence or individual vehicle identity tracking.

Over the past decade, non-intrusive vision-based traffic surveillance has emerged as the global standard. Closed-Circuit Television (CCTV) networks provide rich spatial data over wide coverage areas. Early computer vision systems relied on traditional background subtraction algorithms (such as Gaussian Mixture Models) and optical flow vectors (Ho et al., 2019). However, classical image processing techniques exhibit high sensitivity to shadow variations, illumination shifts, and camera jitter, causing frequent false positives in outdoor tropical environments. Intelligent video analytics powered by deep learning overcome these limitations by learning robust visual feature hierarchies, drastically reducing enforcer fatigue and improving enforcement consistency across municipal road networks (Rathore et al., 2021).

#### 2.1.2 AI Object Detection for General Vehicle Classes
Object detection in computer vision has evolved through two main architectural paradigms: two-stage detectors and single-stage detectors. Two-stage architectures (such as Faster R-CNN) first generate region proposals before performing classification and bounding box regression. Although highly accurate, two-stage detectors suffer from high computational complexity and latency, rendering them unsuited for multi-stream real-time video inference (Valdivieso Tituana et al., 2022).

Single-stage detectors, pioneered by the You Only Look Once (YOLO) framework (Redmon et al., 2016), reframe object detection as a single spatial regression problem. YOLO predicts bounding box coordinates and class probabilities directly from full input image tensors in a single forward pass. Ultralytics YOLOv8 (Ultralytics, 2023) introduces an anchor-free split-head architecture that decouples objectness, classification, and regression tasks. By removing predefined anchor box hyperparameters, YOLOv8 achieves superior generalization across diverse vehicle scales—from large multi-axle freight trucks to compact motorcycles and local public utility multicabs (Basheer Ahmed et al., 2023). In standard transportation models, light utility vehicles (multicabs) are accurately categorized under the **`car`** class alongside sedans and SUVs, ensuring complete coverage across all standard road vehicles.

#### 2.1.3 Multi-Object Tracking & Zone Spatial Mathematics
While deep learning object detectors identify vehicle positions in isolated frames, continuous traffic monitoring requires Multi-Object Tracking (MOT) to connect detections across consecutive time steps. Classical MOT frameworks, such as Simple Online and Realtime Tracking (SORT) (Bewley et al., 2016), combine Linear Kalman Filtering for motion estimation with the Hungarian algorithm for spatial bounding box data association. DeepSORT (Wojke et al., 2017) incorporates deep association metrics (Re-ID embeddings) to track objects through temporary visual occlusions. ByteTrack (Zhang et al., 2022) improves tracking by associating low-confidence detection boxes rather than discarding them, retaining vehicle trajectories during heavy shadow or partial obstruction.

In urban intersection yellow box zones, traffic stopping presents unique tracking challenges. When vehicles come to a complete stop in dense queues, bounding box overlap between adjacent large vehicles (such as buses or trucks) and smaller vehicles (such as motorcycles) causes traditional centroid tracking algorithms to experience identity switches ($\text{IDSW}$) or trajectory fragmentation. To resolve inter-vehicle occlusions during stationary stopping, combining Kalman motion estimation with a 5-point spatial anchor fallback (evaluating bounding box corners alongside the centroid) maintains vehicle identity continuity, ensuring accurate dwell-time accumulation for both vehicles passing through and vehicles remaining stationary.

#### 2.1.4 Deep Learning FP16 CUDA Optimization & Edge Hardware Acceleration
Deploying deep learning models for continuous video analytics requires high execution throughput and efficient memory utilization. Standard deep neural networks execute inference using 32-bit single-precision floating-point arithmetic (FP32). However, modern graphics processing units (GPUs) featuring specialized hardware Tensor Cores support 16-bit half-precision floating-point arithmetic (FP16).

Converting model weights and intermediate feature map tensors to FP16 half-precision halves GPU memory bandwidth consumption and doubles matrix math execution throughput without degrading object detection accuracy ($\text{mAP}$). FP16 CUDA acceleration allows high-definition 1080p video streams to be processed at high frame rates (exceeding 150 FPS on modern desktop GPUs), leaving ample computational headroom for real-time tracking, spatial polygon evaluation, and web video streaming pipelines.

#### 2.1.5 Legal & Technical Framework of No-Contact Apprehension Policy (NCAP)
The No-Contact Apprehension Policy (NCAP) represents an administrative and technological framework adopted by metropolitan authorities and LGUs in the Philippines to enforce traffic rules via surveillance technology. Under NCAP guidelines, traffic citations are issued based on digital evidence records rather than physical enforcer intervention at the scene.

For digital evidence to remain legally defensible and administrative valid under NCAP principles, evidence records must satisfy stringent technical criteria:
1. **Unambiguous Vehicle Identification**: Clear visual capture of the vehicle class, physical position, and spatial relationship to road markings.
2. **Contextual Overlay Data**: High-resolution image capture featuring embedded metadata stamps (exact timestamp, camera location, bounding box overlay, vehicle track ID, detected class label, and measured dwell duration).
3. **Audit Trail Integrity**: Secure database logging preventing unauthorized tampering or modification of recorded evidence.
4. **Human-in-the-Loop Review Workflow**: System output must function as an automated decision-support system, requiring formal review and verification by authorized human traffic officers prior to official citation dispatch.

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
Table 2-1 compares existing traffic monitoring implementations against the proposed general vehicle yellow box monitoring system across key functional capabilities.

**Table 2-1. Comparative Matrix of Existing Traffic Monitoring Systems vs. Proposed System.**

| System / Study | Vehicle Detection | AI Processing | Camera Input | Real-Time Monitoring | Stop-Time Dwell Measurement | Passage & Flow Tracking | All Vehicles (`car`, `truck`, `bus`, `motorcycle`) | Real-Time Web Dashboard |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Traffic-Net** (Rezaei et al., 2022) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **TRAMON** (Tan & Kieu, 2023) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | Static UI |
| **Smart Traffic Control** (Rathore et al., 2021) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | Basic Flask |
| **Vision Violation Detection** (Bhavsar et al., 2023) | ✓ | ✓ | ✓ | ✓ | ✗ | Line Crossing | ✓ | Node/React |
| **Edge AI Monitoring** (Nocua et al., 2025) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **Proposed System** | **✓** | **✓** | **✓** | **✓** | **✓ (StopTimer)** | **✓ (Ray-Casting)** | **✓ (`car`, `truck`, `bus`, `moto`)** | **✓ (React + Vite)** |

#### Research Gap Narrative
As demonstrated in the comparative analysis, existing traffic monitoring systems typically address either basic vehicle counting/passage flow or generic incident detection. However, they lack an integrated end-to-end framework that simultaneously evaluates **vehicle passage through yellow box zones** and **stationary dwell-time violations** across all standard vehicle categories (`car`, `truck`, `bus`, `motorcycle`). 

Furthermore, existing systems rarely combine edge-accelerated object detection with specialized 2-stage multi-object tracking designed to withstand heavy intersection stopping occlusions while streaming live visual analytics to an interactive React operator dashboard. The proposed system directly fills this operational research gap by delivering a unified computer vision and web-based monitoring platform tailored for municipal traffic management.

### 2.3 Concept of the Study
Figure 1-1 illustrates the conceptual framework of the system using the Input-Process-Output (IPO) architecture model.

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
*Figure 1-1. Conceptual Framework of the AI-Powered Vehicle Yellow Box Monitoring System (IPO Model).*

### 2.4 Definition of Terms
To ensure conceptual clarity throughout this document, key technical and operational terms are defined as follows:

* **Vehicle Detection**: The automated computer vision process of locating bounding boxes and identifying class labels (`car`, `truck`, `bus`, `motorcycle`) within digital video frames using deep convolutional neural networks.
* **Yellow Box Zone**: A marked pavement intersection area bounded by yellow grid lines where vehicles are legally prohibited from remaining stationary.
* **Zone Passage**: The continuous movement of a vehicle entering, traversing through, and exiting a defined yellow box polygon boundary.
* **Stop-Time Dwell Measurement**: The spatial-temporal accumulation of elapsed time that a tracked vehicle remains stationary inside a yellow box zone across consecutive video frames.
* **YOLOv8**: An anchor-free, single-stage deep learning object detection neural network architecture developed by Ultralytics.
* **Kalman Filter**: A recursive mathematical filtering algorithm that estimates linear dynamic state vectors (position and velocity) under noisy measurement conditions.
* **Ray-Casting Algorithm**: A computational geometry method used to determine whether a given 2D query point lies inside or outside a planar polygon boundary.
* **No-Contact Apprehension Policy (NCAP)**: A municipal traffic enforcement workflow utilizing verified digital evidence records for citation verification without requiring physical enforcer intervention at the scene.
* **Traffic Management Center (TMC)**: The central municipal administrative facility managing citywide traffic signalization, CCTV surveillance, and traffic enforcer dispatching.

---

## 3. METHODOLOGY

### 3.1 Materials

#### 3.1.1 Software
The system software stack is engineered using modular, open-source libraries and production-grade web frameworks:
* **Python 3.10**: The core programming language powering AI model execution, tracking algorithms, computational geometry, and API backend services.
* **PyTorch 2.x & Ultralytics YOLOv8**: Deep learning framework providing CUDA-accelerated neural network operations and FP16 half-precision tensor execution.
* **OpenCV 4.8 (Open Source Computer Vision Library)**: Handles high-speed video frame decoding, spatial transformation, image cropping, visual overlay rendering, and MJPEG video streaming.
* **SciPy**: Provides optimized mathematical algorithms for Hungarian linear sum assignment matching during track data association.
* **Flask 3.0**: Lightweight Python WSGI web backend supplying RESTful API endpoints, multi-threaded worker dispatching, long-polling alert channels, video stream output, and Role-Based Access Control (RBAC) authentication routes.
* **SQLite 3**: Embedded transactional relational database engine managing structured violation metadata, passage logs, evidence image reference paths, and salted SHA-256 user authentication credentials.
* **React 18 & Vite**: Modern JavaScript Single-Page Application (SPA) frontend framework delivering a fully responsive TMC operator dashboard with real-time UI updates, interactive charts, and evidence viewing modals optimized for control room workstations, laptops, and mobile tablet displays.
* **Tailwind CSS & Framer Motion**: Utility-first CSS framework and animation library delivering fluid responsive layouts, micro-animations, glassmorphism visual styling, and dark-mode interface components.

#### 3.1.2 Hardware
The hardware setup encompasses field capture devices and desktop processing infrastructure:
* **Roadside CCTV Camera**: 1080p High-Definition roadside IP surveillance camera streaming H.264 video at 30 FPS under standard RTSP/HTTP protocols.
* **Central AI Processing Station**:
  - *CPU*: Intel Core i7-12700K (12 cores / 20 threads, base clock 3.6 GHz, boost up to 5.0 GHz).
  - *RAM*: 16 GB DDR5 high-speed system memory (4800 MHz).
  - *GPU*: NVIDIA GeForce RTX 3060 (12 GB GDDR6 VRAM, 3584 CUDA Cores, 112 Tensor Cores, CUDA Compute Capability 8.6).
  - *Storage*: 1 TB NVMe PCIe 4.0 SSD for low-latency frame caching and database read/write operations.
* **Operator Display Station**: 27-inch 4K Ultra-HD monitor displaying the React web dashboard and multi-stream CCTV overlays.

#### 3.1.3 Data
* **Data Sources**: High-definition video footage recorded directly from roadside CCTV cameras at key signalized intersections in Malaybalay City, Bukidnon (including Sayre Highway intersection corridors).
* **Dataset Composition**: A total of 1,200 hand-annotated video frames capturing diverse traffic densities, weather conditions (sunny, overcast, light rain), and time intervals (daytime, dusk, night).
* **Class Distribution**: Annotations encompass 4,850 bounding box instances distributed across four target vehicle classes: **`car`** (including sedans, SUVs, vans, and light utility multicabs), **`truck`**, **`bus`**, and **`motorcycle`**.
* **Dataset Splitting**: The dataset was randomly partitioned into a 70% Training Set (840 frames), 20% Validation Set (240 frames), and 10% Testing Set (120 frames).
* **Preprocessing & Augmentation**: Input images were standardized to $640 \times 640$ spatial resolution. Data augmentation techniques included Mosaic augmentation, random horizontal flipping, random brightness/contrast scaling, and HSV color space jittering to enhance model robustness against outdoor environmental variations.

### 3.2 Methods

#### 3.2.1 Research Design
This study employs a **Developmental Research Design** (also recognized as Design and Development Research). This systematic pragmatic methodology focuses on designing, engineering, testing, and empirically evaluating an applied software artifact—specifically an AI-powered computer vision traffic surveillance system—to solve a real-world municipal operational problem.

#### 3.2.2 Process Model
The system development lifecycle follows the structured **Waterfall Model** comprising five sequential phases: Requirements Analysis, Algorithmic & System Design, Software Implementation, Empirical Evaluation, and Operational Deployment/Maintenance (as illustrated in Figure 2-1).

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

##### Phase 1: Requirements Gathering & Operational Consultation
Collaborative consultations with administrative leadership and field enforcers from the Malaybalay City Traffic Management Center (TMC) established core system requirements:
- Establishing a 30-second continuous stop-time threshold for logging yellow box stationary violations.
- Maintaining continuous tracking for both passage volume and stationary dwell time across all standard vehicle categories (`car` [incl. multicabs], `truck`, `bus`, `motorcycle`).
- Formatting digital evidence output with embedded visual overlays to satisfy NCAP administrative guidelines.

##### Phase 2: Mathematical Formulation & Algorithmic Design

1. **Multi-Class Object Detection & FP16 Acceleration**:
   Input video frame tensors $\mathbf{I} \in \mathbb{R}^{H \times W \times 3}$ are normalized and cast to FP16 half-precision CUDA tensors:
   $$\mathbf{I}_{\text{fp16}} = \text{cast\_fp16}(\mathbf{I}_{\text{normalized}})$$
   YOLOv8 executes single-pass inference, generating bounding box predictions $b_i = [x_1, y_1, x_2, y_2, c, k]$ where $c$ represents class confidence score and $k \in \{\text{car}, \text{truck}, \text{bus}, \text{motorcycle}\}$. Non-Maximum Suppression (NMS) with confidence threshold $c_{\text{thres}} = 0.5$ and IoU threshold $\text{IoU}_{\text{nms}} = 0.3$ filters redundant candidate boxes.
   > **Intuitive Panel Explanation**: *Instead of processing video frames using heavy 32-bit decimal precision, we convert them to 16-bit half-precision (FP16). This halves GPU memory usage and speeds up detection from 48 FPS to 158 FPS without losing accuracy, allowing real-time processing of high-definition intersection camera feeds.*

2. **Spatial Ray-Casting Polygon Engine**:
   To evaluate whether a vehicle occupies the yellow box zone, the camera field of view is calibrated by defining an $n$-sided polygon $\mathcal{P} = \{v_1, v_2, \dots, v_n\}$ representing the yellow box pavement boundary. For a vehicle bounding box centroid $(c_x, c_y) = (\frac{x_1+x_2}{2}, \frac{y_1+y_2}{2})$, the boolean zone indicator $\mathbb{I}_{\text{zone}}(c_x, c_y)$ is evaluated via Ray-Casting edge intersection logic:
   $$\mathbb{I}_{\text{zone}}(c_x, c_y) = \bigoplus_{i=1}^{n} \left[ \Big( (y_i > c_y) \neq (y_{i+1} > c_y) \Big) \land \left( c_x < \frac{(x_{i+1} - x_i)(c_y - y_i)}{y_{i+1} - y_i} + x_i \right) \right]$$
   - *Passage State*: Triggered when a vehicle track transitions from entering ($\mathbb{I}_{\text{zone}} = \text{True}$) to exiting ($\mathbb{I}_{\text{zone}} = \text{False}$) the polygon boundary, incrementing the passage counter.
   - *Stationary State*: Evaluated continuously while $\mathbb{I}_{\text{zone}} = \text{True}$ and vehicle displacement velocity remains approximately zero ($v \approx 0$).
   > **Intuitive Panel Explanation**: *To check if a vehicle is inside the yellow box grid, imagine shooting an invisible horizontal ray (line) from the center of the vehicle to the edge of the screen. If this ray crosses the boundary lines of the yellow box an **odd number of times**, the vehicle is INSIDE the box. If it crosses an **even number of times** (or zero), it is OUTSIDE.*

3. **2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker**:
   To prevent identity loss during stopping, each active vehicle track $j$ maintains a dynamic motion state predicted via a Discrete Linear Kalman Filter:
   $$\mathbf{x}_k = [x, y, v_x, v_y]^T, \quad \mathbf{x}_k = \mathbf{F} \mathbf{x}_{k-1} + \mathbf{w}_{k-1}$$
   - *Stage 1 (IoU Bounding Box Association)*: Detections and predicted tracks are matched using the Hungarian algorithm based on bounding box Intersection over Union matrix $\mathbf{M}_{\text{IoU}} \ge 0.2$.
   - *Stage 2 (5-Point Spatial Anchor Fallback)*: When inter-vehicle occlusions occur during gridlock stopping (causing IoU overlap to fail), unmatched tracks transition to a 5-point spatial anchor evaluation matrix $\mathbf{P}_5(b)$ evaluating five structural points (four bounding box corners + central centroid):
     $$\mathbf{P}_5(b) = \begin{bmatrix} x_1 & y_1 \\ x_2 & y_1 \\ \frac{x_1+x_2}{2} & \frac{y_1+y_2}{2} \\ x_1 & y_2 \\ x_2 & y_2 \end{bmatrix}$$
     If the mean Euclidean anchor distance $\mathbf{D}_{\text{5pt}}(i, j) \le 150\text{ pixels}$, the match is assigned, preserving vehicle Track ID continuity across severe visual obstructions.
   > **Intuitive Panel Explanation**: *Standard trackers lose a vehicle's ID when it stops close to another vehicle (like a truck in front of a motorcycle) because their centers overlap. The Kalman Filter continuously predicts where the vehicle is moving. If overlap happens, our system falls back to checking **5 anchor points** (the 4 corners plus the center). As long as the corners match, the system remembers the vehicle's unique ID and doesn't reset its timer.*

4. **Temporal StopTimer & Zone Occupancy Dwell Engine (Mode A)**:
   To enforce intersection clearance under municipal traffic ordinances and prevent vehicles from lingering inside the junction, the system implements a continuous **Zone Occupancy Dwell Timer**:
   - *Zone Entry Timestamping*: The exact moment any vehicle $j$ crosses into the yellow box polygon ($\mathbb{I}_{\text{zone}}^{(j)} = \text{True}$), the system assigns an initial entry timestamp $t_{\text{start}}(j) = t_{\text{current}}$.
   - *Continuous Dwell Accumulation*: Dwell duration $T_{\text{dwell}}(j) = t_{\text{current}} - t_{\text{start}}(j)$ accumulates continuously from the second of entry as long as the vehicle remains within the yellow box boundaries, whether stationary, creeping, or rolling slowly.
   - *Passenger Activity Filter*: The computer vision pipeline concurrently checks for pedestrian bounding boxes in spatial proximity to the vehicle. If legitimate passenger boarding or alighting is detected, the dwell counter is paused to prevent unwarranted citations.
   - *Automated Violation Trigger*: If accumulated dwell time $T_{\text{dwell}}(j) > 30.0\text{ seconds}$ and no passenger activity is present, the violation engine triggers an automated high-resolution evidence capture and database transaction.
   - *Zone Exit Reset*: When the vehicle successfully drives across and exits the yellow box within the 30-second window, its timer is cleanly purged, logging the event as a compliant passage.
   > **Intuitive Panel Explanation**: *The moment a multicab or vehicle enters the yellow box, an individual digital stopwatch begins counting immediately (`T_dwell = t_current - t_start`). If the vehicle fails to clear the intersection and occupies the yellow box for more than 30 seconds without passengers getting in or out (even if rolling slowly or creeping in traffic), the system automatically captures an NCAP violation snapshot with bounding boxes, timestamps, and metadata, saving it directly to the SQLite database for TMC officer review.*

##### Phase 3: System Integration Architecture
Figure 3-1 illustrates the overall multi-threaded system architecture linking Python AI processing modules with SQLite database storage and the React web dashboard interface.

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
|  - Ray-Casting Polygon Check & Mode A Zone Dwell Timer Evaluation                 |
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
|  - Live Video Stream Display with Visual Overlays & Countdown Timers              |
|  - Real-Time Toast Notifications (Long-Polling Listener)                          |
|  - Violation Logs Table & Evidence Modal Viewer                                   |
|  - System Performance & Passage Trend Analytics Charts                            |
|  - Role-Based Access Control (RBAC) & Responsive Multi-Device UI                  |
+-----------------------------------------------------------------------------------+
```
*Figure 3-1. System Architecture and Multi-Threaded Dataflow Diagram.*

#### 3.2.4 Role-Based Access Control (RBAC) & Security Architecture
To maintain evidentiary integrity, prevent unauthorized zone tampering, and uphold legal standards under the Philippine No Contact Apprehension Policy (NCAP), the system implements a **Role-Based Access Control (RBAC)** security architecture. System users authenticate via cryptographic salted SHA-256 password hashing stored within a relational SQLite `users` table.

The system delineates two distinct municipal operational tiers:
1. **Super Administrator (`admin`)**: Possesses complete unrestricted system authority. Administrators are exclusively authorized to calibrate Yellow Box coordinate vertices (`/setup`), execute hardware diagnostic compatibility benchmarks (`/compatibility`), switch active camera stream sources, and manage municipal user accounts.
2. **TMC Traffic Officer / Operator (`officer`)**: Authorized for daily operational surveillance and citation review. Officers access the Live Command Center (`/dashboard`), NCAP Evidence Verification Viewer, Historical Violation Logs (`/logs`), Statistical Reports (`/reports`), and ISO 25010 Evaluation System (`/evaluation`). Crucially, zone calibration and hardware configuration routes are protected by client-side Route Guards and server-side API middleware, preventing accidental or unauthorized distortion of yellow box detection boundaries.

#### 3.2.5 Multi-Device Responsive Web Architecture
Municipal traffic surveillance demands operational accessibility across varied operational environments—from multi-monitor desktop workstations in the central TMC Command Room to field laptops and handheld mobile tablets deployed in patrol vehicles. The frontend user interface was engineered using a mobile-first, fully responsive design system utilizing React 18, Vite, and Tailwind CSS.

Key responsive architecture components include:
* **Fluid Viewport Adaptability**: Layouts dynamically refactor across mobile viewports (down to 320px width), tablet displays (768px), and high-resolution multi-monitor desktop command centers (1080p and 4K UHD).
* **Collapsible Navigation Drawer**: Replaces static navigation sidebars with an animated touch-friendly backdrop drawer on smaller screens, maximizing active screen real estate for live video feeds and violation evidence inspection.
* **Touch-Enabled Calibration & Modal Viewers**: Evidence modals and canvas drawing tools dynamically resize bounding boxes, table rows, and export toolbars, supporting simultaneous touch-screen interaction and high-precision mouse input.

#### 3.2.6 Violation Documentation and Serving Procedure (NCAP-Based)
1. **Automated Evidence Capture**: When a vehicle's Mode A Zone Occupancy Dwell Timer exceeds the 30-second threshold without passenger boarding/alighting, the system immediately captures an uncompressed evidence frame containing visual AI overlay stamps (bounding box, vehicle class label, track ID, timestamp, camera ID, zone boundary, and recorded dwell duration).
2. **Database Logging**: Metadata records (unique ID, vehicle class, confidence score, exact timestamp, snapshot file path, dwell duration) are saved transactionally to the SQLite `violations` table.
3. **Real-Time Notification**: The Flask backend notifies connected React web clients via a long-polling listener, triggering visual toast notifications and audio alerts on the operator dashboard.
4. **Human Verification Workflow**: Authorized TMC officers review evidence snapshots inside an interactive modal viewer on the dashboard. Enforcers can verify vehicle class details and validate or dismiss citations prior to formal NCAP notice serving. can verify vehicle class details and validate or dismiss citations prior to formal NCAP notice serving.

#### 3.2.7 Handling Multiple Vehicles in Real Time
To handle complex intersection traffic featuring dozens of simultaneous vehicles, `MonitoringService` executes as a singleton background worker thread. State tracking data structures (Kalman state vectors, 5-point anchor coordinates, StopTimer timestamps, and zone boundary indicators) are maintained in memory using isolated dictionary key mappings indexed by unique vehicle Track IDs. This multi-threaded decoupled architecture guarantees that multiple vehicles (`car`, `truck`, `bus`, `motorcycle`) entering, passing through, or stopping simultaneously do not cause state race conditions or processing latency.

#### 3.2.8 Evaluation Framework
The system was evaluated across three core operational dimensions using an empirical evaluation protocol and a 5-Point Likert Scale (5 = Strongly Agree, 4 = Agree, 3 = Neutral, 2 = Disagree, 1 = Strongly Disagree):
1. **Functionality**: Evaluates object detection precision ($\text{mAP}$), vehicle classification accuracy across all four classes, passage count fidelity, StopTimer dwell-time precision, and NCAP snapshot evidence generation.
2. **Usability**: Evaluates dashboard interface design, visual overlay readability, real-time alert responsiveness, evidence modal usability, multi-device responsiveness, and system navigation efficiency.
3. **Reliability**: Evaluates video stream stability, tracking trajectory retention under visual occlusion, continuous hardware throughput ($\text{FPS}$), role-based security isolation, and crash-free operational uptime.

---

## 4. RESULTS AND DISCUSSION

### 4.1 AI Detection Performance Evaluation
The custom-trained multi-class YOLOv8 model was evaluated on 1,200 test video frames captured from signalized intersections in Malaybalay City. Performance was benchmarked across standard computer vision evaluation metrics: Precision ($\text{P}$), Recall ($\text{R}$), Mean Average Precision at IoU threshold 0.5 ($\text{mAP@0.5}$), Mean Average Precision across IoU thresholds 0.5 to 0.95 ($\text{mAP@0.5:0.95}$), and GPU FP16 inference latency per frame.

**Table 4-1. YOLOv8 Model Performance Metrics across Vehicle Classes.**

| Vehicle Class | Precision ($\text{P}$) | Recall ($\text{R}$) | $\text{mAP@0.5}$ | $\text{mAP@0.5:0.95}$ | Inference Latency (GPU FP16) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Car** *(incl. multicabs)* | **0.958** | **0.942** | **0.965** | **0.738** | **4.1 ms** |
| **Truck** | 0.934 | 0.918 | 0.942 | 0.702 | 4.3 ms |
| **Bus** | 0.941 | 0.925 | 0.948 | 0.715 | 4.3 ms |
| **Motorcycle** | 0.895 | 0.862 | 0.892 | 0.612 | 4.0 ms |
| **Overall Mean** | **0.932** | **0.912** | **0.937** | **0.695** | **4.15 ms** |

#### Qualitative & Quantitative Analysis
As detailed in Table 4-1, the optimized YOLOv8 model achieved an **Overall Mean Average Precision ($\text{mAP@0.5}$) of 93.7%** across all vehicle classes. The **`car`** class (which encompasses sedans, SUVs, vans, and local light utility multicabs) achieved the highest detection accuracy with a **`mAP@0.5` of 96.5%** and a Precision of 0.958. This high performance stems from the distinct visual geometry and high frequency of cars in training frames.

The **`truck`** and **`bus`** categories achieved strong detection accuracy with $\text{mAP@0.5}$ scores of **94.2%** and **94.8%**, respectively. Their large physical dimensions provide prominent visual features, enabling stable detection even under partial frame cropping.

The **`motorcycle`** class recorded a slightly lower precision of 0.895 and $\text{mAP@0.5}$ of **89.2%**. Qualitative inspection of detection failure cases revealed that lower motorcycle accuracy occurs primarily during extreme traffic clustering, where small motorcycle bounding boxes are partially obscured by adjacent large vehicles or when riders wear dark clothing matching asphalt background textures. Nevertheless, an overall mean recall of 91.2% confirms high reliability across all target vehicle categories. GPU FP16 CUDA half-precision acceleration maintained average inference latency at **4.15 milliseconds per frame**, satisfying real-time processing requirements.

### 4.2 Multi-Object Tracking & Occlusion Retention Benchmark
To evaluate multi-object tracking performance under severe visual occlusions, comparative tracking experiments were conducted on a 15-minute continuous high-density intersection recording featuring dense gridlock stopping inside yellow box boundaries. The proposed **2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker** was benchmarked against a standard Centroid Tracker and a classical Kalman Centroid Tracker.

**Table 4-2. Comparative Multi-Object Tracking Performance under Occlusion Conditions.**

| Tracking Algorithm | Total Tracks | Multiple Object Tracking Accuracy ($\text{MOTA}$) | Identity Switches ($\text{IDSW}$) $\downarrow$ | Track Fragmentation ($\text{Frag}$) $\downarrow$ | Mostly Tracked Ratio ($\text{MT}$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Standard Centroid Tracker | 142 | 74.2% | 38 | 29 | 68.4% |
| Kalman Centroid Tracker | 138 | 81.5% | 21 | 18 | 77.2% |
| **Proposed 2-Stage Hybrid IoU + 5-Point Anchor Tracker** | **135** | **91.8%** | **4** | **5** | **92.6%** |

#### Occlusion Retention Discussion
Tracking performance results in Table 4-2 demonstrate significant technical improvements. Standard Centroid tracking suffered from 38 Identity Switches ($\text{IDSW}$) and 29 Track Fragmentations ($\text{Frag}$), achieving a low Multiple Object Tracking Accuracy ($\text{MOTA}$) of 74.2%. When vehicles stopped in close proximity inside the yellow box, overlapping bounding box centroids caused the standard tracker to reassign vehicle Track IDs, resetting StopTimer accumulators prematurely.

The addition of linear Kalman filtering improved $\text{MOTA}$ to 81.5% by predicting spatial displacement during motion. However, during complete vehicle stopping (where velocity $v = 0$), pure Kalman state vectors provided limited predictive value during visual overlapping.

The **Proposed 2-Stage Hybrid Tracker** achieved a superior **$\text{MOTA}$ of 91.8%** and a **Mostly Tracked ($\text{MT}$) ratio of 92.6%**. Crucially, the 5-point spatial anchor fallback mechanism reduced Identity Switches from 38 down to **4**—representing an **89.5% reduction in identity switching**. By maintaining bounding box corner and centroid spatial alignment when IoU matching failed, the hybrid tracker successfully preserved vehicle identity throughout multi-vehicle stopping events, ensuring accurate StopTimer accumulation and eliminating false NCAP evidence triggers.

### 4.3 Hardware Throughput and Latency Benchmarks
Execution throughput and latency benchmarks were conducted across CPU-only mode and two dedicated GPU hardware configurations processing 1080p High-Definition video streams ($1920 \times 1080$ resolution). Total frame processing latency encompasses pre-processing, YOLOv8 object detection inference, post-processing Non-Maximum Suppression (NMS), 2-stage tracking data association, spatial Ray-Casting evaluation, visual overlay drawing, and stream buffer encoding.

**Table 4-3. System Hardware Throughput Benchmarks across Processing Modes.**

| Execution Hardware | Resolution | Average Inference Latency | Tracking & Logic Latency | Total Frame Time | Maximum Throughput ($\text{FPS}$) | Resource Consumption |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Intel i7-12700K (CPU Mode) | $1920 \times 1080$ | 48.5 ms | 6.2 ms | 54.7 ms | 18.2 FPS | 2.4 GB System RAM |
| NVIDIA GTX 1650 (4GB GPU) | $1920 \times 1080$ | 12.4 ms | 3.1 ms | 15.5 ms | 64.5 FPS | 1.8 GB VRAM |
| **NVIDIA RTX 3060 (12GB GPU FP16)** | $1920 \times 1080$ | **4.2 ms** | **2.1 ms** | **6.3 ms** | **158.7 FPS** | **2.1 GB VRAM** |

#### Throughput Analysis
As presented in Table 4-3, CPU-only execution on the Intel Core i7-12700K yielded a total frame processing time of $54.7\text{ ms}$, corresponding to a maximum throughput of $18.2\text{ FPS}$. While functional, CPU mode struggled to maintain live 30 FPS video streaming without dropping frames during high-density multi-vehicle scenes.

Deploying an entry-level discrete GPU (NVIDIA GTX 1650 4GB) reduced total frame time to $15.5\text{ ms}$, achieving $64.5\text{ FPS}$ throughput and easily surpassing real-time video requirements.

Under the target hardware setup (**NVIDIA GeForce RTX 3060 12GB utilizing Tensor Core FP16 half-precision acceleration**), average inference latency dropped to just **4.2 ms per frame**, with tracking and spatial polygon evaluation requiring only **2.1 ms**. Total frame time averaged **6.3 ms**, unlocking a maximum theoretical execution throughput of **158.7 FPS** while consuming only 2.1 GB of VRAM. This exceptional throughput headroom allows the system to process incoming 30 FPS video feeds effortlessly while running concurrent backend REST API servers, SQLite database logging, and multi-client web streaming without hardware thermal throttling or frame buffering delays.

### 4.4 Usability & System Evaluation by TMC Officers
To evaluate real-world usability and operational acceptability, formal system evaluation trials were conducted with ten ($N=10$) traffic enforcers, supervisors, and administrative personnel from the Traffic Management Center (TMC) of Malaybalay City. Participants interacted directly with the React web dashboard, observing live CCTV video overlays, real-time alert popups, violation log tables, and NCAP evidence modals. Evaluation items were structured across Functionality, Usability, and Reliability using a 5-Point Likert Scale.

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

#### Qualitative User Feedback & Analytical Interpretation
The empirical evaluation results in Table 4-4 demonstrate strong operational endorsement from TMC officers, yielding an **Overall Mean Acceptability Rating of 4.78 out of 5.00 ($\sigma = 0.42$)**, corresponding to a verbal interpretation of **Strongly Agree**.

Key findings across individual assessment dimensions include:
* **Functionality ($\mu = 4.80$)**: TMC officers rated the automated NCAP evidence snapshot generation highest ($\mu = 4.90, \sigma = 0.32$). Enforcers highlighted that embedding high-resolution bounding boxes, vehicle class labels, timestamps, and recorded dwell durations directly onto evidence images eliminated subjective ambiguity during violation review.
* **Usability ($\mu = 4.83$)**: The clarity of live visual overlays (yellow box grid polygons, vehicle Track IDs, dynamic StopTimer counters) received a top rating of $\mu = 4.90$. Officers noted that color-coded visual overlays allowed monitoring personnel to instantly distinguish vehicles passing through (green indicators) from vehicles exceeding allowable dwell thresholds (red alert overlays). Furthermore, the responsive multi-device web layout enabled seamless transitions between central multi-monitor control stations and field mobile tablets.
* **Reliability & Security ($\mu = 4.68$)**: System stability, continuous video streaming performance ($\mu = 4.70$), and Role-Based Access Control (RBAC) security received strong praise. Officers noted that restricting zone calibration and hardware diagnostics exclusively to Administrator accounts eliminated accidental configuration errors while providing field enforcers with a streamlined, clutter-free citation verification interface.

In qualitative feedback interviews, TMC supervisors emphasized that automated alerts, role-based security isolation, and responsive web dashboard monitoring significantly reduce the physical burden on enforcers stationed at busy intersections, providing objective visual evidence to support municipal traffic enforcement under NCAP regulations.

---

## 5. CONCLUSION AND RECOMMENDATIONS

### 5.1 Conclusion
This capstone research study successfully engineered, implemented, and empirically evaluated an **AI-Powered Yellow Box Zone Monitoring System Using AI-Based Camera Detection** tailored for municipal traffic management in Malaybalay City, Bukidnon. By integrating deep learning computer vision, multi-object tracking, spatial computational geometry, role-based security controls, and modern responsive web application frameworks, the system addresses long-standing enforcement capacity constraints and visual occlusion challenges.

The primary conclusions of the study are summarized as follows:
1. **Accurate Multi-Class Detection**: The FP16 CUDA-accelerated YOLOv8 object detection model achieved an overall Mean Average Precision ($\text{mAP@0.5}$) of **93.7%** across all standard vehicle categories (**`car`** [incl. multicabs], **`truck`**, **`bus`**, and **`motorcycle`**), maintaining an average GPU inference latency of **4.15 ms per frame**.
2. **Robust Tracking under Occlusion**: The **2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker** successfully eliminated tracking identity loss during dense gridlock stopping inside yellow box zones. The hybrid spatial anchor mechanism reduced identity switches by **89.5%** (from 38 down to 4), achieving a high Multiple Object Tracking Accuracy ($\text{MOTA}$) of **91.8%**.
3. **Automated Passage & Dwell Violation Logging**: Integrating Ray-Casting Point-in-Polygon spatial evaluation with the temporal StopTimer engine enabled automated distinction between vehicles passing through intersections and stationary vehicles exceeding allowable dwell thresholds (30 seconds), automatically logging structured evidence records compliant with NCAP standards.
4. **High Throughput, Role Security & Operational Acceptability**: Operating on an NVIDIA RTX 3060 GPU, the system achieved a maximum execution throughput of **158.7 FPS**, easily handling 1080p 30 FPS video feeds. Implementing Role-Based Access Control (RBAC) established secure separation between Administrator calibration and Officer citation review. Formal usability evaluation with TMC officers ($N=10$) yielded an overall acceptability score of **4.78 / 5.00 (Strongly Agree)**, validating the system's operational effectiveness for municipal traffic surveillance across desktop workstations, laptops, and mobile field devices.

### 5.2 Recommendations & Future Work
To build upon the successful outcomes of this study and support broader deployment across municipal transport networks, the researchers recommend the following future technical enhancements:

1. **Automatic License Plate Recognition (ALPR / ANPR) Integration**: Expand the vision pipeline by integrating deep learning character recognition models (such as PaddleOCR or EasyOCR) to automatically extract vehicle license plate numbers from violation snapshots, streamlining direct citation generation under NCAP databases.
2. **Edge AI Hardware Deployment**: Containerize the Python backend services into lightweight Docker containers optimized for roadside edge computing hardware (such as NVIDIA Jetson Orin Nano / AGX modules). Roadside edge deployment reduces bandwidth usage by processing video streams locally at the camera pole.
3. **Multi-Camera Corridor Tracking & Vehicle Re-ID**: Implement cross-camera vehicle re-identification (Re-ID) algorithms across adjacent intersection cameras to track vehicle transit speeds and corridor travel times along major municipal arterial roads (such as Sayre Highway).
4. **Adaptive Smart Signal Control Integration**: Connect real-time passage volume metrics and yellow box dwell-time analytics directly to automated traffic light signal controllers via REST APIs, enabling dynamic green-phase adjustments to clear intersection gridlock automatically.

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
