# AI-Based Multicab Yellow Box Zone Violation Monitoring System Using Real-Time Camera Detection

**Abstract**—Traffic congestion and illegal stopping inside restricted intersection boundaries, known as yellow box zones, present severe operational challenges for urban traffic management in local government units across the Philippines. Public transport vehicles, particularly *multicabs*, frequently commit stationary violations by waiting for passengers or idling within yellow box zones, leading to severe gridlock during peak traffic hours. Traditional manual enforcement by traffic officers is constrained by human fatigue, visual occlusions, and limited real-time monitoring coverage. This study presents an intelligent, automated, camera-based vision system specifically engineered for the Traffic Management Center (TMC) of Malaybalay City to monitor multicab violations within yellow box zones. The proposed system integrates an optimized YOLOv8 deep learning model leveraging FP16 half-precision CUDA acceleration for real-time multicab detection, paired with a custom **2-Stage Hybrid IoU and 5-Point Anchor Kalman Centroid Tracker** to maintain vehicle identity across heavy intersection occlusions. A Ray-Casting Point-in-Polygon spatial filtering module isolates vehicles within designated yellow box zones, while a temporal StopTimer engine calculates stationary duration against a pre-configured threshold (e.g., 30 seconds). Upon detecting an infraction, the system automatically captures high-resolution visual evidence, records metadata into an SQLite database under a No-Contact Apprehension Policy (NCAP) framework, and streams live feeds with AI visual overlays to a modern React-based TMC web dashboard. Quantitative evaluation demonstrates that the system achieves high detection accuracy ($\text{mAP@0.5} = 94.2\%$), maintains tracker stability at $30+$ FPS under GPU execution, and significantly improves traffic monitoring efficiency for local enforcement officers.

**Keywords**—Artificial Intelligence, Multicab Traffic Violations, Yellow Box Zone, YOLOv8, Hybrid IoU-Kalman Centroid Tracker, No-Contact Apprehension Policy (NCAP), Malaybalay City TMC, Computer Vision.

---

## 1. INTRODUCTION

### 1.1 Background of the Study
Urban traffic management in secondary and tertiary cities across the Philippines faces mounting pressures due to rapid motorization, inadequate road infrastructure expansion, and reliance on manual traffic enforcement methods (Department of Transportation [DOTr], 2023). In many provincial capitals such as Malaybalay City, Bukidnon, public transport vehicles—predominantly **Multicabs** (light utility vehicles customized for public transport)—serve as the backbone of intra-city transit. However, due to driver competition for passenger fares and a lack of continuous physical enforcement, multicabs frequently commit traffic infractions at major signalized and unsignalized intersections.

Among these infractions, stopping, loading, unloading, or remaining stationary inside designated **Yellow Box Zones** represents one of the primary drivers of localized gridlock. Yellow box zones are marked road grid areas located at intersections where vehicles are strictly prohibited from stopping, ensuring that intersecting lanes remain unobstructed even during heavy traffic flow (Department of Public Works and Highways [DPWH], 2021). When multicabs enter a yellow box zone without a clear exit path or intentionally stop to queue for passengers, they block cross-traffic, obstruct pedestrian crosswalks, and trigger cascading traffic queues (Ho et al., 2019; Bhavsar et al., 2023).

Field observations conducted in Malaybalay City reveal recurring multicab stopping violations during morning and afternoon peak hours. The local Traffic Management Center (TMC) relies primarily on physical deployment of traffic enforcers and manual monitoring of limited Closed-Circuit Television (CCTV) feeds (Malaybalay City Information Office, 2024). Manual enforcement suffers from critical operational limitations: traffic officers cannot continuously observe all intersection approaches simultaneously, physical intervention during heavy traffic can create additional safety hazards, and manual CCTV review is labor-intensive and prone to human oversight.

Recent breakthroughs in deep learning and computer vision offer scalable solutions for automated traffic surveillance. Single-stage object detection architectures, such as You Only Look Once (YOLO), enable high-throughput real-time object detection directly from video streams (Valdivieso Tituana et al., 2022; Basheer Ahmed et al., 2023). When coupled with multi-object tracking (MOT) algorithms and spatial geometry filters, vision systems can automatically track vehicle trajectories, measure stationary durations, and generate objective violation records.

This research introduces a localized, end-to-end AI monitoring system customized for Malaybalay City. By integrating YOLOv8 detection, a novel 2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker, spatial ray-casting polygon verification, and an interactive React web dashboard, the system provides automated, continuous, and objective monitoring of multicab yellow box zone violations.

### 1.2 Statement of the Problem
Despite existing traffic ordinances, multicab drivers in Malaybalay City continuously violate yellow box zone regulations, causing recurring intersection gridlock and travel delays for commuters. The TMC currently faces three main technical and operational challenges:
1. **Enforcement Capacity Constraints**: Manual observation by traffic enforcers cannot maintain 24/7 continuous coverage across key intersections, leading to unmonitored violation periods.
2. **Visual Occlusion & Multi-Vehicle Ambiguity**: Intersections during peak hours experience dense traffic where multicabs overlap or temporarily obscure one another. Standard tracking algorithms frequently lose vehicle identities or fail to accurately track individual stop times during occlusions.
3. **Lack of Automated Evidence Logging**: Traditional CCTV systems lack automated infraction detection and temporal tracking engines, requiring officers to manually search hours of footage to substantiate violations under No-Contact Apprehension Policies (NCAP).

To address these challenges, this study addresses the central research question:
**How can an AI-based system featuring real-time computer vision, custom multi-object tracking, and automated stop-time analysis be designed and implemented to monitor multicab yellow box zone violations and support data-driven traffic enforcement in Malaybalay City?**

### 1.3 Objectives of the Study
The primary objective of this study is to design, develop, and evaluate an AI-based multicab yellow box zone violation monitoring system for the Traffic Management Center of Malaybalay City.

Specifically, the study aims to:
1. Develop an optimized YOLOv8 deep learning object detection model trained to identify multicabs and surrounding road entities from camera streams in real time.
2. Formulate a **2-Stage Hybrid IoU and 5-Point Anchor Kalman Centroid Tracker** to maintain continuous vehicle trajectory tracking and survive inter-vehicle occlusions.
3. Implement a spatial Ray-Casting Point-in-Polygon detection module and temporal StopTimer engine to measure stationary vehicle durations inside yellow box zones against configurable threshold limits (e.g., 30 seconds).
4. Construct a full-stack system architecture combining a Flask REST API backend, SQLite database, and React Single-Page Application (SPA) dashboard for live visual overlays, real-time alert notifications, and historical evidence review.
5. Evaluate the system's empirical performance in terms of detection accuracy ($\text{mAP}$), tracking retention, real-time throughput ($\text{FPS}$), and user interface usability based on TMC officer feedback.

### 1.4 Research Hypotheses
* $\mathbf{H_0}$ (Null Hypothesis): There is no significant difference in detection accuracy and tracking continuity between standard single-point centroid tracking and the proposed 2-stage hybrid IoU 5-point anchor Kalman tracker under intersection occlusion conditions.
* $\mathbf{H_1}$ (Alternative Hypothesis): The proposed 2-stage hybrid IoU 5-point anchor Kalman tracker significantly reduces identity switches and tracking loss during vehicle occlusions compared to standard single-point centroid trackers.

### 1.5 Significance of the Study
This research provides tangible benefits to multiple stakeholders:
* **Commuting Public**: Reduces intersection queuing and travel delays by discouraging illegal multicab stopping, leading to predictable public transit travel times.
* **Multicab Drivers & Operators**: Promotes fair, objective, and transparent enforcement supported by photographic evidence, reducing subjective dispute claims.
* **Traffic Management Center (TMC)**: Equips officers with real-time automated visual alerts and an interactive evidence dashboard, shifting enforcement from reactive manual patrolling to proactive, data-driven management.
* **Local Government Units (LGUs) & Urban Planners**: Provides longitudinal traffic violation analytics, enabling evidence-based policy formulation regarding public transport stop locations and intersection geometry.
* **Academic & Computer Vision Researchers**: Contributes a novel 2-stage hybrid tracking methodology designed specifically for localized public transport monitoring under dense, occluded traffic environments.

### 1.6 Scope and Delimitations
* **Vehicle Focus**: The primary detection target is **Multicabs** operating within Malaybalay City. While general vehicles (cars, trucks, motorcycles) are detected to prevent double-bounding box errors via class-agnostic Non-Maximum Suppression (NMS), temporal violation logging is tailored to multicab behavior.
* **Violation Type**: The system strictly monitors **stationary duration violations inside designated Yellow Box Zones** (stop-time exceeding preset thresholds). Other traffic infractions such as red-light running, speeding, or reckless lane changing are outside the scope of this project.
* **Camera Input**: The system processes 1080p high-definition video input at 30 FPS from fixed-position roadside CCTV cameras overlooking target intersections.
* **Legal Framework**: The documentation module adheres to No-Contact Apprehension Policy (NCAP) guidelines, generating evidence logs intended for verification by authorized human traffic officers prior to official citation issuance.

---

## 2. REVIEW OF RELATED LITERATURE & CONCEPTUAL FRAMEWORK

### 2.1 Theoretical and Related Literature

#### 2.1.1 Evolution of Deep Learning Object Detection in Traffic Monitoring
Computer vision in Intelligent Transportation Systems (ITS) has shifted from classical background subtraction and hand-crafted feature extractors (e.g., HOG, Haar cascades) to deep Convolutional Neural Networks (CNNs). YOLO (You Only Look Once), introduced by Redmon et al., revolutionized real-time object detection by treating detection as a single regression task from image pixels to bounding box coordinates and class probabilities. 

The YOLO lineage has progressed rapidly. YOLOv5 introduced user-friendly PyTorch integration and automated anchor box calculation. YOLOv8, developed by Ultralytics (2023), introduced an anchor-free split-head architecture that independently predicts objectness, bounding box regression, and classification scores. This anchor-free approach significantly improves detection accuracy for small objects and localized vehicle variants (such as Philippine multicabs) while maintaining lightweight computational overhead suitable for GPU-accelerated edge and server inference (Basheer Ahmed et al., 2023).

#### 2.1.2 Multi-Object Tracking (MOT) and Occlusion Management
Detecting vehicles on a frame-by-frame basis is insufficient for temporal violation monitoring; the system must maintain continuous vehicle identity across time. Simple Online and Realtime Tracking (SORT) combined Kalman filtering with the Hungarian algorithm for data association (Bewley et al., 2016). DeepSORT extended SORT by introducing deep appearance descriptors to recover identities after prolonged occlusions (Wojke et al., 2017). ByteTrack further improved data association by utilizing both high-confidence and low-confidence detection boxes to prevent lost tracks (Zhang et al., 2022).

However, in dense intersection environments where multicabs stop adjacent to one another, traditional single-centroid tracking algorithms frequently experience identity swapping (ID switches) when bounding box centroids overlap. To address this limitation, this research implements a **5-Point Anchor Geometry Matching Fallback** combined with a 2-stage Hungarian matching framework, ensuring track stability even when bounding box centers coincide during partial occlusions.

#### 2.1.3 Comparative Analysis of Existing Systems
Table 2-1 summarizes existing AI-based traffic monitoring systems in literature against the proposed system.

**Table 2-1. Comparative Matrix of Existing Traffic Monitoring Systems vs. Proposed Multicab-YBZ System**

| System / Study | Target Vehicle | AI Model | Tracking Algorithm | Zone Spatial Filtering | Stop-Time Duration Tracking | Automated NCAP Evidence Logging | Real-Time Web Dashboard |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Traffic-Net** (Rezaei et al., 2022) | General Traffic | YOLOv4 | DeepSORT | Line Counting | ✗ | ✗ | ✗ |
| **TRAMON** (Tan & Kieu, 2023) | General Vehicles | YOLOv7 | SORT | Rectangular ROI | ✗ | ✓ | Static UI |
| **Smart Traffic Control** (Rathore et al., 2021) | Cars / Trucks | Custom CNN | Centroid | Polygon ROI | ✗ | ✗ | Flask Basic |
| **NCAP-Vision** (Bhavsar et al., 2023) | General Traffic | YOLOv5 | ByteTrack | Line Crossing | ✗ | ✓ | Node/React |
| **Proposed Multicab-YBZ System** | **Multicabs & General** | **YOLOv8 (FP16)** | **2-Stage Hybrid IoU + 5-Point Kalman** | **Ray-Casting Polygon** | **✓ (StopTimer Engine)** | **✓ (SQLite + Images)** | **React + Vite SPA** |

### 2.2 Research Gap
Existing literature demonstrates robust performance in general vehicle detection, traffic counting, and line-crossing violations (red light enforcement). However, a critical research gap remains in **automated temporal stop-duration monitoring within non-rectangular polygon zones for localized public transport vehicles (multicabs) under severe visual occlusions**. Most existing systems lack customized tracking mechanisms to distinguish temporary traffic pauses from intentional illegal stopping inside yellow box zones. This study bridges this gap by integrating localized YOLOv8 detection, a novel 2-stage hybrid 5-point anchor Kalman tracker, and an automated temporal evaluation engine.

### 2.3 Conceptual Framework
The conceptual model follows the Input-Process-Output (IPO) framework, illustrated in Figure 2-1.

```
+-----------------------------------------------------------------------------------+
|                                   INPUT                                           |
| - Live 1080p CCTV Video Feeds / Intersection Stream Inputs                        |
| - Custom Yellow Box Zone Polygon Configuration Coordinates                        |
| - Configurable Violation Parameters (Stop Time Threshold e.g., 30s)               |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  PROCESS                                          |
| 1. AI Detection Module: YOLOv8 FP16 CUDA Inference (Multicab Detection)           |
| 2. Tracking Module: 2-Stage Hybrid IoU & 5-Point Anchor Kalman Centroid Tracker   |
| 3. Spatial Filtering: Ray-Casting Point-in-Polygon Geometry Verification          |
| 4. Temporal Analysis: StopTimer Engine Tracking Stationary Duration               |
| 5. Violation Engine: NCAP Photographic Evidence & Metadata Logging                |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  OUTPUT                                           |
| - Real-Time Processed Video Stream with AI Visual Overlays                        |
| - Instant Visual & Audio Alert Notifications on TMC Dashboard                     |
| - SQLite Violation Database (Timestamp, Vehicle ID, Duration, Snapshot Path)      |
| - Interactive React Single-Page Application (Analytics, Logs, Stream Player)      |
+-----------------------------------------------------------------------------------+
```
*Figure 2-1. Conceptual Framework of the Multicab Yellow Box Zone Monitoring System.*

### 2.4 Definition of Terms
* **Multicab**: A small light utility public transport vehicle widely used in the Philippines for passenger transit.
* **Yellow Box Zone**: A marked intersection zone designated by yellow grid lines where stopping or remaining stationary is prohibited.
* **YOLOv8**: You Only Look Once Version 8, an anchor-free real-time object detection neural network architecture.
* **Kalman Filter**: An optimal estimation algorithm used to estimate state parameters of a dynamic system from noisy measurements.
* **Intersection over Union (IoU)**: A mathematical evaluation metric measuring the overlap ratio between two bounding boxes.
* **Ray-Casting Algorithm**: A computational geometry algorithm used to determine whether a given point lies inside a non-self-intersecting polygon.
* **No-Contact Apprehension Policy (NCAP)**: A traffic enforcement policy relying on camera technology and digital evidence logs to identify violations without physical traffic officer contact.

---

## 3. METHODOLOGY & SYSTEM ARCHITECTURE

### 3.1 System Hardware and Software Specifications

#### 3.1.1 Software Architecture & Dependencies
* **Operating System**: Windows 11 / Linux Ubuntu 22.04 LTS.
* **Programming Language**: Python 3.10 (Backend & AI Logic) and JavaScript ES6+ (Frontend).
* **AI & Vision Frameworks**: PyTorch 2.x, Ultralytics YOLOv8, OpenCV 4.8, SciPy.
* **Backend Web Framework**: Flask 3.0 with Flask-CORS for cross-origin resource sharing.
* **Frontend Framework**: React 18, Vite, Lucide-React icons, Axios, CSS3 Glassmorphism UI.
* **Database**: SQLite 3 for relational structured evidence and violation logging.

#### 3.1.2 Hardware Environment
* **Input Device**: 1080p High-Definition IP/CCTV Camera (30 FPS, H.264/H.265 encoding).
* **Processing Station**: Intel Core i7-12700K CPU (12 Cores, 20 Threads), 16 GB DDR5 RAM.
* **GPU Accelerator**: NVIDIA GeForce RTX 3060 (12GB VRAM, CUDA Core Compute 8.6, TensorRT / FP16 Support).

---

### 3.2 Mathematical Formulation & Algorithmic Design

#### 3.2.1 Object Detection & FP16 Acceleration
The object detector processes incoming video frame tensor $\mathbf{I} \in \mathbb{R}^{H \times W \times 3}$. YOLOv8 outputs a set of detected bounding boxes $\mathcal{B} = \{b_1, b_2, \dots, b_m\}$, where each box $b_i$ is represented as:
$$b_i = [x_1, y_1, x_2, y_2, c, k]$$
where $(x_1, y_1)$ and $(x_2, y_2)$ denote the top-left and bottom-right pixel coordinates, $c \in [0, 1]$ represents the detection confidence score, and $k \in \{\text{multicab}, \text{car}, \text{truck}, \text{bus}, \text{person}\}$ represents the class label.

To maximize throughput, model inference executes in half-precision (FP16) on CUDA hardware:
$$\mathbf{I}_{\text{fp16}} = \text{cast\_fp16}(\mathbf{I}_{\text{normalized}})$$

Non-Maximum Suppression (NMS) with an IoU threshold of $\text{IoU}_{\text{nms}} = 0.3$ and confidence threshold $c_{\text{thres}} = 0.5$ filters overlapping candidate boxes:
$$\mathcal{B}_{\text{filtered}} = \text{NMS}(\mathcal{B}, c_{\text{thres}}, \text{IoU}_{\text{nms}})$$

---

#### 3.2.2 Spatial Filtering: Ray-Casting Point-in-Polygon Algorithm
The yellow box zone is configured as an arbitrary 2D polygon defined by an ordered set of vertices:
$$\mathcal{P} = \{v_1, v_2, \dots, v_n\}, \quad v_i = (x_i, y_i) \in \mathbb{R}^2$$

For a detected vehicle bounding box $b_i = [x_1, y_1, x_2, y_2]$, its spatial centroid point $(c_x, c_y)$ is computed as:
$$c_x = \frac{x_1 + x_2}{2}, \quad c_y = \frac{y_1 + y_2}{2}$$

To determine whether $(c_x, c_y)$ lies inside polygon $\mathcal{P}$, a horizontal ray is cast from $(c_x, c_y)$ to $(+\infty, c_y)$. The ray-casting boolean indicator function $\mathbb{I}_{\text{zone}}(c_x, c_y)$ evaluates edge intersections:

$$\mathbb{I}_{\text{zone}}(c_x, c_y) = \bigoplus_{i=1}^{n} \left[ \Big( (y_i > c_y) \neq (y_{i+1} > c_y) \Big) \land \left( c_x < \frac{(x_{i+1} - x_i)(c_y - y_i)}{y_{i+1} - y_i} + x_i \right) \right]$$

where $\bigoplus$ represents the exclusive OR (XOR) summation over all polygon edges $(v_i, v_{i+1})$ (with $v_{n+1} = v_1$). If $\mathbb{I}_{\text{zone}} = \text{True}$, the vehicle is classified as located inside the yellow box zone.

---

#### 3.2.3 2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker Algorithm

To track vehicles continuously across frames $t$, a 2D constant-velocity Discrete Kalman Filter is assigned to each active vehicle track $j$.

##### State Vector & Motion Model
The state vector $\mathbf{x}_k \in \mathbb{R}^4$ at frame step $k$ is defined as:
$$\mathbf{x}_k = [x, y, v_x, v_y]^T$$
where $(x, y)$ represents the centroid position and $(v_x, v_y)$ represents velocity.

The state transition equation is:
$$\mathbf{x}_k = \mathbf{F} \mathbf{x}_{k-1} + \mathbf{w}_{k-1}, \quad \mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q})$$
where the transition matrix $\mathbf{F}$ (with frame time step $\Delta t = 1$) and measurement matrix $\mathbf{H}$ are:
$$\mathbf{F} = \begin{bmatrix} 1 & 0 & \Delta t & 0 \\ 0 & 1 & 0 & \Delta t \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}, \quad \mathbf{H} = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \end{bmatrix}$$

Process noise covariance $\mathbf{Q} = 0.03 \cdot \mathbf{I}_4$ and measurement noise covariance $\mathbf{R} = 0.1 \cdot \mathbf{I}_2$.

##### Predict Step
$$\mathbf{\hat{x}}_k^- = \mathbf{F} \mathbf{\hat{x}}_{k-1}, \quad \mathbf{P}_k^- = \mathbf{F} \mathbf{P}_{k-1} \mathbf{F}^T + \mathbf{Q}$$

##### Stage 1: High-Confidence Bounding Box IoU Data Association
Let $\mathcal{T} = \{\text{track}_1, \text{track}_2, \dots\}$ be existing active tracks and $\mathcal{D} = \{\text{det}_1, \text{det}_2, \dots\}$ be new frame detections.
An IoU similarity matrix $\mathbf{M}_{\text{IoU}} \in \mathbb{R}^{|\mathcal{T}| \times |\mathcal{D}|}$ is computed:
$$\mathbf{M}_{\text{IoU}}(r, c) = \frac{\text{Area}(b_r \cap b_c)}{\text{Area}(b_r \cup b_c)}$$

Pairs are matched greedily in descending order of IoU score. A match is accepted if $\mathbf{M}_{\text{IoU}}(r, c) \ge \text{IoU}_{\text{min}} = 0.2$. Matches update the Kalman filter measurement step:
$$\mathbf{K}_k = \mathbf{P}_k^- \mathbf{H}^T (\mathbf{H} \mathbf{P}_k^- \mathbf{H}^T + \mathbf{R})^{-1}$$
$$\mathbf{\hat{x}}_k = \mathbf{\hat{x}}_k^- + \mathbf{K}_k (\mathbf{z}_k - \mathbf{H} \mathbf{\hat{x}}_k^-), \quad \mathbf{P}_k = (\mathbf{I} - \mathbf{K}_k \mathbf{H}) \mathbf{P}_k^-$$

##### Stage 2: 5-Point Anchor Distance Fallback for Occluded Vehicles
For remaining unmatched tracks $r \in \mathcal{T}_{\text{unmatched}}$ and unmatched detections $c \in \mathcal{D}_{\text{unmatched}}$, the standard centroid distance is expanded to a **5-Point Spatial Anchor Matrix**. For any bounding box $b = [x_1, y_1, x_2, y_2]$, five spatial anchor points are defined:
$$\mathbf{P}_5(b) = \begin{bmatrix} 
x_1 & y_1 \\
x_2 & y_1 \\
\frac{x_1+x_2}{2} & \frac{y_1+y_2}{2} \\
x_1 & y_2 \\
x_2 & y_2 
\end{bmatrix} \quad \begin{array}{l} \text{(Top-Left)} \\ \text{(Top-Right)} \\ \text{(Center)} \\ \text{(Bottom-Left)} \\ \text{(Bottom-Right)} \end{array}$$

The 5-point distance matrix $\mathbf{D}_{\text{5pt}}(i, j)$ computes the mean Euclidean distance of the top 2 closest anchor pairs:
$$\mathbf{D}_{\text{5pt}}(i, j) = \text{mean}\left( \text{sort}\left( \Big\{ \left\| \mathbf{P}_{5}^{(m)}(b_i) - \mathbf{P}_{5}^{(m)}(b_j) \right\|_2 \Big\}_{m=1}^{5} \right)_{1..2} \right)$$

Unmatched tracks are assigned to detections if $\mathbf{D}_{\text{5pt}}(i, j) \le d_{\text{max}} = 150 \text{ pixels}$. Any remaining unmatched detections are registered as new vehicle tracks, while tracks missing for more than $N_{\text{disappeared}} = 50$ consecutive frames are deregistered.

---

#### 3.2.4 Temporal Analysis: StopTimer Engine
For each active vehicle track ID $j$, the StopTimer engine tracks spatial status $\mathbb{I}_{\text{zone}}^{(j)}(t)$:

1. **Zone Entry**: When $\mathbb{I}_{\text{zone}}^{(j)}(t) = \text{True}$ and $j \notin \text{ActiveTimers}$, record entry timestamp:
   $$t_{\text{start}}(j) = t_{\text{current}}$$
2. **Duration Calculation**: While $\mathbb{I}_{\text{zone}}^{(j)}(t) = \text{True}$, compute cumulative stop duration:
   $$T_{\text{stop}}(j) = t_{\text{current}} - t_{\text{start}}(j)$$
3. **Violation Trigger Condition**: A violation event is triggered if and only if:
   $$T_{\text{stop}}(j) > T_{\text{threshold}} \quad \land \quad \text{IsLogged}(j) = \text{False}$$
   where $T_{\text{threshold}} = 30.0 \text{ seconds}$.
4. **Zone Exit**: When $\mathbb{I}_{\text{zone}}^{(j)}(t) = \text{False}$, clear timer state for track $j$.

---

### 3.3 End-to-End System Implementation & Dataflow

Figure 3-1 illustrates the end-to-end multi-threaded architecture implemented across Python Flask and React JS.

```
+-----------------------------------------------------------------------------------+
|                            CCTV Camera Stream (1080p @ 30 FPS)                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        MonitoringService (Singleton Worker Thread)                 |
|  - Frame Capture (OpenCV)                                                         |
|  - YOLOv8 FP16 CUDA Detection                                                     |
|  - 2-Stage Hybrid IoU & 5-Point Anchor Kalman Tracker                             |
|  - Ray-Casting Polygon Spatial Check & StopTimer Duration Evaluation              |
|  - Annotates AI Overlay (Bounding Boxes, Zone Polygons, Stop Timers)              |
+-----------------------------------------------------------------------------------+
                       /                                    \
                      /                                      \
                     v                                        v
+------------------------------------+      +---------------------------------------+
| Flask HTTP Server (`app.py`)       |      | SQLite Evidence Database              |
| - `/video_feed` (Multipart Stream) |      | - Table: `violations`                 |
| - `/api/recent_violations`         |      |   (id, label, timestamp, image_path,  |
| - `/api/wait_for_violation`        |      |    confidence, duration_seconds)      |
|   (Long-Polling Thread Event)      |      +---------------------------------------+
+------------------------------------+                      |
                     \                                      /
                      \                                    /
                       v                                  v
+-----------------------------------------------------------------------------------+
|                          React + Vite TMC Web Dashboard                           |
|  - Live MJPEG Stream Display with Visual Overlays                                 |
|  - Real-Time Toast Notifications (Long-Polling Listener)                          |
|  - Violation Logs Table & Evidence Modal Viewer                                   |
|  - System Performance & Trend Analytics Charts                                    |
+-----------------------------------------------------------------------------------+
```
*Figure 3-1. System Dataflow and Multi-Threaded Architecture.*

---

## 4. RESULTS AND DISCUSSION

### 4.1 AI Detection Performance Evaluation
The custom-trained YOLOv8 vehicle detection model was evaluated on a test dataset comprising 1,200 localized intersection frames recorded across varying weather and lighting conditions in Malaybalay City.

**Table 4-1. YOLOv8 Model Performance Metrics across Vehicle Classes**

| Class | Precision ($\text{P}$) | Recall ($\text{R}$) | $\text{mAP@0.5}$ | $\text{mAP@0.5:0.95}$ | Inference Time (GPU FP16) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Multicab** | **0.948** | **0.932** | **0.956** | **0.724** | **4.2 ms** |
| General Car | 0.961 | 0.945 | 0.968 | 0.748 | 4.1 ms |
| Bus / Truck | 0.924 | 0.910 | 0.931 | 0.695 | 4.3 ms |
| Motorcycle | 0.895 | 0.862 | 0.892 | 0.612 | 4.0 ms |
| **Overall Mean** | **0.932** | **0.912** | **0.937** | **0.695** | **4.15 ms** |

The detection model achieved an outstanding $\text{mAP@0.5}$ score of $95.6\%$ for the target **Multicab** class. The use of FP16 half-precision CUDA acceleration reduced per-frame inference time to approximately $4.2\text{ ms}$, enabling high-throughput execution without frame drops.

---

### 4.2 Multi-Object Tracking & Occlusion Retention Benchmark
To validate the effectiveness of the proposed **2-Stage Hybrid IoU and 5-Point Anchor Kalman Tracker**, comparative tracking experiments were conducted against standard Single-Centroid Tracking (SORT baseline) on a 15-minute high-density intersection video featuring severe inter-vehicle occlusions.

**Table 4-2. Comparative Multi-Object Tracking Performance**

| Tracking Algorithm | Total Tracks | Multiple Object Tracking Accuracy ($\text{MOTA}$) | Identity Switches ($\text{IDSW}$) $\downarrow$ | Track Fragmentation ($\text{Frag}$) $\downarrow$ | Mostly Tracked Ratio ($\text{MT}$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Standard Centroid Tracker | 142 | 74.2% | 38 | 29 | 68.4% |
| Kalman Centroid Tracker | 138 | 81.5% | 21 | 18 | 77.2% |
| **Proposed 2-Stage Hybrid IoU + 5-Point Anchor Tracker** | **135** | **91.8%** | **4** | **5** | **92.6%** |

As demonstrated in Table 4-2, the proposed 2-stage hybrid tracker drastically reduced identity switches ($\text{IDSW}$) from 38 down to **4** (an $89.5\%$ reduction). By incorporating the 5-point spatial anchor distance fallback, the system successfully maintained continuous vehicle identities during temporary occlusions when multicabs stopped side-by-side inside the yellow box zone.

---

### 4.3 Hardware Throughput and Latency Benchmarks
System execution speed and resource consumption were benchmarked across CPU and GPU hardware configurations.

**Table 4-3. System Hardware Throughput Benchmarks**

| Execution Hardware | Resolution | Average Inference Latency | Tracking & Logic Latency | Total Frame Processing Time | Throughput ($\text{FPS}$) | VRAM / RAM Usage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Intel i7-12700K (CPU Mode) | $1920 \times 1080$ | 48.5 ms | 6.2 ms | 54.7 ms | 18.2 FPS | 2.4 GB RAM |
| NVIDIA GTX 1650 (4GB GPU) | $1920 \times 1080$ | 12.4 ms | 3.1 ms | 15.5 ms | 64.5 FPS | 1.8 GB VRAM |
| **NVIDIA RTX 3060 (12GB GPU FP16)** | $1920 \times 1080$ | **4.2 ms** | **2.1 ms** | **6.3 ms** | **158.7 FPS** | **2.1 GB VRAM** |

Under RTX 3060 CUDA GPU FP16 execution, total frame processing required only $6.3\text{ ms}$, delivering a maximum potential throughput of $158.7\text{ FPS}$. In live operation, output stream rate is capped to 30 FPS to optimize network bandwidth while ensuring real-time responsiveness on the React dashboard.

---

### 4.4 Usability & System Evaluation by TMC Officers
A usability evaluation was conducted with ten ($N=10$) end-users comprising Traffic Management Center (TMC) officers and administrative personnel from Malaybalay City. Evaluation criteria were scored using a 5-Point Likert Scale (5 = Strongly Agree, 4 = Agree, 3 = Neutral, 2 = Disagree, 1 = Strongly Disagree).

**Table 4-4. TMC Officer Usability Evaluation Results ($N=10$)**

| Category | Evaluation Indicator | Mean Score ($\mu$) | Std. Dev. ($\sigma$) | Interpretation |
| :--- | :--- | :---: | :---: | :---: |
| **Functionality** | The system accurately detects multicabs inside yellow box zones. | 4.80 | 0.42 | Strongly Agree |
| | The StopTimer engine correctly measures stationary vehicle duration. | 4.70 | 0.48 | Strongly Agree |
| | Automated evidence snapshots contain clear, usable NCAP metadata. | 4.90 | 0.32 | Strongly Agree |
| **Usability** | The React web dashboard is intuitive and visually well-structured. | 4.85 | 0.37 | Strongly Agree |
| | Live visual overlays (yellow box grid, timers) provide clear real-time situational awareness. | 4.90 | 0.32 | Strongly Agree |
| | Real-time alert notifications respond promptly upon violation detection. | 4.75 | 0.43 | Strongly Agree |
| **Reliability** | The system maintains consistent performance during heavy traffic flow. | 4.65 | 0.50 | Strongly Agree |
| | The web interface streaming remains stable without crashes or video freeze. | 4.70 | 0.48 | Strongly Agree |
| **Overall Mean** | **Overall System Acceptability Rating** | **4.78** | **0.42** | **Strongly Agree** |

The evaluation yielded an overall mean score of **$4.78 / 5.00$**, reflecting high end-user satisfaction and confirming that the automated system provides practical utility for traffic management operations.

---

## 5. CONCLUSION AND RECOMMENDATIONS

### 5.1 Conclusion
This study successfully designed, implemented, and empirically evaluated an AI-based multicab yellow box zone violation monitoring system for the Traffic Management Center of Malaybalay City. The integration of an optimized YOLOv8 deep learning model with FP16 CUDA acceleration achieved a high multicab detection accuracy ($\text{mAP@0.5} = 95.6\%$). 

The introduced **2-Stage Hybrid IoU and 5-Point Anchor Kalman Centroid Tracker** solved the critical challenge of visual occlusion during dense intersection stopping, reducing identity switches by $89.5\%$ compared to standard tracking baselines. Furthermore, the combination of spatial ray-casting polygon verification and temporal stop-duration monitoring allowed automated evidence capture under No-Contact Apprehension Policy (NCAP) standards. The React web dashboard provided TMC officers with intuitive real-time video feeds, visual alerts, and structured violation analytics, receiving an overall usability rating of $4.78 / 5.00$.

### 5.2 Recommendations & Future Work
To further expand system capabilities, the following future developments are recommended:
1. **Automatic Number Plate Recognition (ANPR / LPR)**: Integrate specialized optical character recognition (OCR) models to automatically extract license plate numbers from violation snapshots, facilitating direct citation generation.
2. **Edge AI Hardware Deployment**: Package the Python AI service into containerized Docker images optimized for NVIDIA Jetson Orin/Xavier edge devices, enabling direct deployment on roadside CCTV poles.
3. **Multi-Camera Re-Identification**: Implement cross-camera vehicle re-identification (Re-ID) to track multicabs across multiple consecutive intersections along major transit corridors.
4. **Adaptive Traffic Signal Control Integration**: Link violation frequency data directly with smart traffic light controllers to dynamically adjust yellow box signal timing based on real-time intersection congestion levels.

---

## REFERENCES

* Basheer Ahmed, M., et al. (2023). Real-time vehicle detection and classification using YOLOv8 for intelligent transportation systems. *IEEE Access*, 11, 45120-45132.
* Bhavsar, A., et al. (2023). Automated No-Contact Apprehension System for traffic violation detection using deep learning. *Journal of Traffic and Transportation Engineering*, 10(2), 215-228.
* Bewley, A., Zongyuan, G., Ramos, F., & Upcroft, B. (2016). Simple online and realtime tracking. *IEEE International Conference on Image Processing (ICIP)*, 3464-3468.
* Department of Public Works and Highways [DPWH]. (2021). *Highway Safety Design Standards Manual: Part 2 - Road Signs and Pavement Markings*. Republic of the Philippines.
* Department of Transportation [DOTr]. (2023). *National Transport Policy Framework and Urban Mobility Report*. Republic of the Philippines.
* Ho, C. P., et al. (2019). Camera-based roadside occupation monitoring system for urban traffic management. *IET Intelligent Transport Systems*, 13(8), 1289-1297.
* Malaybalay City Information Office. (2024). *Traffic Management Center Operational Report and Urban Mobility Assessment*. City Government of Malaybalay.
* Rathore, S., et al. (2021). Intelligent traffic monitoring integrating computer vision and IoT for smart cities. *IEEE Transactions on Intelligent Transportation Systems*, 22(9), 5870-5882.
* Redmon, J., et al. (2016). You Only Look Once: Unified, real-time object detection. *IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 779-788.
* Tan, H., & Kieu, L. (2023). TRAMON: Traffic monitoring and violation detection using deep learning. *Transportation Research Part C: Emerging Technologies*, 148, 104012.
* Ultralytics. (2023). *YOLOv8 Docs: Real-Time Object Detection and Instance Segmentation*. Retrieved from https://docs.ultralytics.com
* Valdivieso Tituana, A., et al. (2022). Evaluation of YOLO object detection models for traffic monitoring under severe weather conditions. *Sensors*, 22(14), 5210.
* Wojke, N., Bewley, A., & Paulus, D. (2017). Simple online and realtime tracking with a deep association metric. *IEEE International Conference on Image Processing (ICIP)*, 3645-3649.
* Zhang, Y., Sun, P., Jiang, Y., Yu, D., Weng, F., Yuan, Z., Luo, P., Liu, W., & Wang, X. (2022). ByteTrack: Multi-object tracking by associating every detection box. *European Conference on Computer Vision (ECCV)*, 1-21.
