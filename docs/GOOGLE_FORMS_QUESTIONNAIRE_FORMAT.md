# GOOGLE FORMS QUESTIONNAIRE SETUP GUIDE (ISO/IEC 25010 SOFTWARE QUALITY STANDARD)
**AI-Powered Yellow Box Zone Violation Monitoring System Using AI-Based Camera Detection**
*Traffic Management Center (TMC) – City Government of Malaybalay, Bukidnon*

This document provides the exact question text (structured strictly by **ISO/IEC 25010 Software Quality Characteristics**), question types, and structure for setting up the **TMC Officer Usability Evaluation Survey** directly in **Google Forms** (or using the automated Google Apps Script below).

---

## 📋 METHOD 1: AUTOMATED GOOGLE APPS SCRIPT SETUP (RECOMMENDED)

You can automatically generate this complete ISO/IEC 25010 Google Form in your Google Drive in less than 30 seconds using Google Apps Script:

### Step-by-Step Instructions:
1. Open [Google Apps Script](https://script.google.com/) (sign in with your Google account).
2. Click **+ New Project** at the top left.
3. Replace all existing code in the editor with the updated script code found in [`scripts/create_google_form.js`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/scripts/create_google_form.js).
4. Click the **Save** icon (💾), then click **Run** (▶️).
5. Grant permissions if prompted by Google.
6. Look at the **Execution Log** at the bottom — it will output the live **Google Form Edit URL** and **Published Respondent URL**!

---

## ✍️ METHOD 2: MANUAL GOOGLE FORMS COPY-PASTE GUIDE

If you prefer to create the form manually on [Google Forms](https://forms.google.com/):

### Form Settings:
- **Form Title:** TMC Officer Usability & System Evaluation Survey (ISO/IEC 25010 Standard)
- **Form Description:**
  > Formal research evaluation survey instrument for Traffic Management Center (TMC) personnel (N=10) structured according to ISO/IEC 25010 Systems and Software Quality Requirements and Evaluation (SQuaRE). Evaluates Functional Suitability, Usability, Performance Efficiency, Reliability, Security, and Operational Quality-in-Use for the AI Yellow Box Zone Monitoring System in Malaybalay City.

---

### SECTION 1 OF 7: RESPONDENT DEMOGRAPHIC & OPERATIONAL PROFILE
*Section Title:* **Part I: Evaluator Demographic & Operational Profile**

1. **Question:** Evaluator Full Name (Optional) | **Type:** Short Answer | **Required:** No
2. **Question:** Current Designation / Role | **Type:** Multiple Choice (TMC Officer, Operator, Supervisor, Research Evaluator, Other) | **Required:** Yes
3. **Question:** Years of Enforcement Experience | **Type:** Multiple Choice (<1 yr, 1-3 yrs, 4-6 yrs, >6 yrs) | **Required:** Yes
4. **Question:** Primary Duty Shift | **Type:** Multiple Choice (Day Shift, Afternoon Shift, Night Shift, Rotating) | **Required:** Yes
5. **Question:** Primary Operational Environment | **Type:** Multiple Choice (Control Room, Field Mobile, Hybrid) | **Required:** Yes

---

### SECTION 2 OF 7: CATEGORY 1 - FUNCTIONAL SUITABILITY (ISO 25010 §4.1)
*Section Title:* **Part II - Category 1: Functional Suitability (ISO/IEC 25010 §4.1)**  
*Section Description:* *Evaluates functional correctness, accuracy, completeness, appropriateness, and spatial precision.*

6. **Question:** F1 [Functional Correctness]. The system accurately detects vehicles (car, truck, bus, motorcycle) in yellow box zones.  
   - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

7. **Question:** F2 [Functional Accuracy]. The StopTimer engine correctly measures stationary vehicle duration inside yellow box grid lines.  
   - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

8. **Question:** F3 [Functional Completeness]. Automated evidence snapshots contain clear, complete NCAP metadata (timestamps, duration, bounding boxes).  
   - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

9. **Question:** F4 [Functional Appropriateness]. The system effectively distinguishes between moving vehicles passing through and illegal stationary stopping.  
   - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

10. **Question:** F5 [Spatial Precision]. Yellow box polygon zone boundaries accurately align with physical intersection road pavement markings.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

---

### SECTION 3 OF 7: CATEGORY 2 - USABILITY & UI AESTHETICS (ISO 25010 §4.4)
*Section Title:* **Part II - Category 2: Usability & User Interface Aesthetics (ISO/IEC 25010 §4.4)**  
*Section Description:* *Evaluates UI aesthetics, operability, error protection, learnability, and accessibility.*

11. **Question:** U1 [UI Aesthetics]. The React web dashboard is intuitive, visually well-structured, and easy to navigate.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

12. **Question:** U2 [Operability]. Live visual overlays (yellow box grid, vehicle timers, bounding boxes) provide clear situational awareness.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

13. **Question:** U3 [Error Protection]. Real-time alert notifications respond promptly upon vehicle violation detection.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

14. **Question:** U4 [Learnability]. Filtering, searching, and reviewing historical violation logs in the web interface is fast and user-friendly.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

15. **Question:** U5 [Accessibility]. Generating and exporting analytical violation reports (daily/weekly trends) is clear and straightforward.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

---

### SECTION 4 OF 7: CATEGORY 3 - PERFORMANCE EFFICIENCY & RELIABILITY (ISO 25010 §4.2 & §4.5)
*Section Title:* **Part II - Category 3: Performance Efficiency & Reliability (ISO/IEC 25010 §4.2 & §4.5)**  
*Section Description:* *Evaluates fault tolerance, availability, environmental adaptability, and time behaviour latency.*

16. **Question:** R1 [Fault Tolerance]. The system maintains consistent detection performance during heavy traffic flow and inter-vehicle occlusions.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

17. **Question:** R2 [Availability]. The web interface streaming remains stable without crashes, frame drops, or video freezes.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

18. **Question:** R3 [Environmental Adaptability]. The system maintains reliable detection under varying lighting and weather conditions (daylight, night, rain, shadows).  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

19. **Question:** R4 [Time Behaviour]. Low inference latency ensures real-time video dashboard updates without noticeable delay.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

---

### SECTION 5 OF 7: CATEGORY 4 - SECURITY & MAINTAINABILITY (ISO 25010 §4.6 & §4.7)
*Section Title:* **Part II - Category 4: Security & Maintainability (ISO/IEC 25010 §4.6 & §4.7)**  
*Section Description:* *Evaluates data integrity, non-repudiation accountability, and zone re-configurability.*

20. **Question:** S1 [Data Integrity]. NCAP violation snapshot records and audit timestamps cannot be tampered with or modified.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

21. **Question:** S2 [Modifiability]. Yellow box polygon zone coordinates can be easily calibrated and reconfigured for new camera angles.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

---

### SECTION 6 OF 7: CATEGORY 5 - OPERATIONAL QUALITY-IN-USE (ISO 25010 Quality in Use)
*Section Title:* **Part II - Category 5: Operational Quality-in-Use (ISO/IEC 25010)**  
*Section Description:* *Evaluates manual monitoring workload reduction and intersection traffic compliance impact.*

22. **Question:** E1 [Workload Efficiency]. Automated NCAP evidence collection significantly reduces manual monitoring workload for TMC officers.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

23. **Question:** E2 [Traffic Compliance Impact]. Implementing this AI monitoring system improves intersection clearance and traffic compliance in Malaybalay City.  
    - **Type:** Linear Scale (1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree) | **Required:** Yes

---

### SECTION 7 OF 7: QUALITATIVE FEEDBACK & RECOMMENDATIONS
*Section Title:* **Part III: Qualitative Feedback & Operational Recommendations**

24. **Question:** System Strengths (What features work best for your enforcement tasks?) | **Type:** Paragraph | **Required:** No
25. **Question:** Areas for Improvement (What difficulties or false alerts occurred?) | **Type:** Paragraph | **Required:** No
26. **Question:** General Comments & Feature Recommendations | **Type:** Paragraph | **Required:** No
