# TMC OFFICER USABILITY & SYSTEM EVALUATION QUESTIONNAIRE
**ISO/IEC 25010 Software Quality Evaluation Standard**
*AI-Powered Yellow Box Zone Violation Monitoring System Using AI-Based Camera Detection*  
*Traffic Management Center (TMC) – City Government of Malaybalay, Bukidnon*

---

### RESEARCH PROJECT OVERVIEW & INSTRUCTIONS

**Project Title:** AI-Powered Yellow Box Zone Violation Monitoring System Using Real-Time Camera Detection  
**Evaluation Standard:** ISO/IEC 25010 Systems and Software Quality Requirements and Evaluation (SQuaRE)  
**Target Participants:** Traffic Management Center (TMC) Officers, Enforcement Personnel, and System Administrators ($N = 10$)  
**Purpose:** This research survey instrument collects empirical user evaluation data across six core ISO/IEC 25010 software quality characteristics (**Functional Suitability**, **Usability**, **Performance Efficiency & Reliability**, **Security & Maintainability**, and **Operational Quality-in-Use**) to evaluate the deployed automated yellow box zone monitoring platform.

#### Rating Scale (5-Point Likert Scale)
Please evaluate each metric based on your actual operational experience with the system dashboard, live overlays, and evidence reports. Mark your response with a checkmark ($\checkmark$) or cross ($X$) in the corresponding box:

| Rating | Score | Description | Scale Range | Verbal Interpretation |
| :---: | :---: | :--- | :---: | :--- |
| **SA** | **5** | **Strongly Agree** | 4.21 – 5.00 | Excellent / Fully Satisfactory |
| **A** | **4** | **Agree** | 3.41 – 4.20 | Good / Satisfactory |
| **N** | **3** | **Neutral** | 2.61 – 3.40 | Moderate / Acceptable |
| **D** | **2** | **Disagree** | 1.81 – 2.60 | Poor / Needs Improvement |
| **SD** | **1** | **Strongly Disagree** | 1.00 – 1.80 | Very Poor / Unsatisfactory |

---

### PART I: RESPONDENT DEMOGRAPHIC & OPERATIONAL PROFILE

1. **Evaluator Full Name (Optional):** __________________________________________________
2. **Current Designation / Role:**  
   [ ] Traffic Management Officer / Enforcer  
   [ ] Surveillance & Camera System Operator  
   [ ] TMC Administrative Supervisor / IT Staff  
   [ ] Research Evaluator / Guest Tester  
   [ ] Other (Please specify): ______________________
3. **Years of Traffic Monitoring / Enforcement Experience:**  
   [ ] Less than 1 Year  
   [ ] 1 – 3 Years  
   [ ] 4 – 6 Years  
   [ ] More than 6 Years
4. **Primary Duty Shift:**  
   [ ] Day Shift (6:00 AM – 2:00 PM)  
   [ ] Afternoon Shift (2:00 PM – 10:00 PM)  
   [ ] Night Shift (10:00 PM – 6:00 AM)  
   [ ] Rotating / Full Day Oversight
5. **Primary Operational Environment:**  
   [ ] Central Control Room Workstation  
   [ ] Field Operations (Mobile / Tablet)  
   [ ] Hybrid (Control Room & On-Site Enforcement)
6. **Date of Evaluation:** ______________________

---

### PART II: ISO/IEC 25010 SOFTWARE QUALITY EVALUATION

#### Category 1: Functional Suitability (ISO/IEC 25010 §4.1)
*Evaluates the degree to which the system functions meet stated and implied needs under specified operational conditions.*

| # | ISO Metric | Specific Assessment Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **F1** | Functional Correctness | The system accurately detects vehicles (`car` including multicabs, `truck`, `bus`, `motorcycle`) in yellow box zones. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2** | Functional Accuracy | The StopTimer engine correctly measures stationary vehicle duration inside yellow box grid lines. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3** | Functional Completeness | Automated evidence snapshots contain clear, complete NCAP metadata (timestamps, duration, bounding overlays). | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F4** | Functional Appropriateness | The system effectively distinguishes between moving vehicles passing through and illegal stationary stopping. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F5** | Spatial Precision | Yellow box polygon zone boundaries accurately align with physical intersection road pavement markings. | [ ] | [ ] | [ ] | [ ] | [ ] |

#### Category 2: Usability & User Interface Aesthetics (ISO/IEC 25010 §4.4)
*Evaluates the degree to which the product can be used by specified users to achieve specified goals with effectiveness, efficiency, and satisfaction.*

| # | ISO Metric | Specific Assessment Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **U1** | UI Aesthetics | The React web dashboard is intuitive, visually well-structured, and easy to navigate. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **U2** | Operability | Live visual overlays (yellow box polygon grid, vehicle timers, bounding boxes) provide clear situational awareness. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **U3** | Error Protection | Real-time alert notifications respond promptly upon vehicle violation detection. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **U4** | Learnability | Filtering, searching, and reviewing historical violation logs in the web interface is fast and user-friendly. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **U5** | Accessibility | Generating and exporting analytical violation reports (daily/weekly trends) is clear and straightforward. | [ ] | [ ] | [ ] | [ ] | [ ] |

#### Category 3: Performance Efficiency & Reliability (ISO/IEC 25010 §4.2 & §4.5)
*Evaluates time behavior, resource utilization, maturity, availability, and fault tolerance.*

| # | ISO Metric | Specific Assessment Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **R1** | Fault Tolerance | The system maintains consistent detection performance during heavy traffic flow and inter-vehicle occlusions. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **R2** | Availability | The web interface streaming remains stable without crashes, frame drops, or video freezes. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **R3** | Adaptability | The system maintains reliable detection under varying lighting and weather conditions (daylight, night, rain, shadows). | [ ] | [ ] | [ ] | [ ] | [ ] |
| **R4** | Time Behaviour | Low inference latency ensures real-time video dashboard updates without noticeable delay. | [ ] | [ ] | [ ] | [ ] | [ ] |

#### Category 4: Security & Maintainability (ISO/IEC 25010 §4.6 & §4.7)
*Evaluates information integrity, accountability, modifiability, and re-configurability.*

| # | ISO Metric | Specific Assessment Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **S1** | Data Integrity | NCAP violation snapshot records and audit timestamps cannot be tampered with or modified. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **S2** | Modifiability | Yellow box polygon zone coordinates can be easily calibrated and reconfigured for new camera angles. | [ ] | [ ] | [ ] | [ ] | [ ] |

#### Category 5: Operational Quality-in-Use (ISO/IEC 25010 Quality in Use)
*Evaluates effectiveness, efficiency, freedom from risk, and context coverage in actual enforcement operations.*

| # | ISO Metric | Specific Assessment Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **E1** | Workload Efficiency | Automated NCAP evidence collection significantly reduces manual monitoring workload for TMC officers. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **E2** | Traffic Compliance Impact | Implementing this AI monitoring system improves intersection clearance and traffic compliance in Malaybalay City. | [ ] | [ ] | [ ] | [ ] | [ ] |

---

### PART III: STATISTICAL SUMMARY BENCHMARK (ISO/IEC 25010 METRICS)
*(To be computed by Research Investigator upon collection)*

$$ \text{Mean Score } (\mu) = \frac{\sum x_i}{N}, \quad \text{Standard Deviation } (\sigma) = \sqrt{\frac{\sum (x_i - \mu)^2}{N - 1}} $$

| ISO 25010 Category | Target Mean ($\mu$) Baseline | Benchmark Target ($\sigma$) | Research Paper Baseline Interpretation |
| :--- | :---: | :---: | :--- |
| **Category 1: Functional Suitability (F1 - F5)** | **4.81** | 0.40 | **Strongly Agree** |
| **Category 2: Usability & UI Aesthetics (U1 - U5)** | **4.83** | 0.37 | **Strongly Agree** |
| **Category 3: Performance Efficiency & Reliability (R1 - R4)** | **4.66** | 0.48 | **Strongly Agree** |
| **Category 4: Security & Maintainability (S1 - S2)** | **4.85** | 0.35 | **Strongly Agree** |
| **Category 5: Operational Quality-in-Use (E1 - E2)** | **4.87** | 0.33 | **Strongly Agree** |
| **Overall ISO 25010 Acceptability Rating** | **4.80** | **0.39** | **Strongly Agree** |

---

### PART IV: QUALITATIVE FEEDBACK & OPERATIONAL RECOMMENDATIONS

1. **System Strengths (Functional & Usability Strengths):**  
   ____________________________________________________________________________________________________  
   ____________________________________________________________________________________________________

2. **Areas for Improvement (Operational Difficulties or False Alerts Observed):**  
   ____________________________________________________________________________________________________  
   ____________________________________________________________________________________________________

3. **General Comments & ISO Standard Feature Recommendations:**  
   ____________________________________________________________________________________________________  
   ____________________________________________________________________________________________________

---
**Evaluator Signature:** ______________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Date:** ______________________
