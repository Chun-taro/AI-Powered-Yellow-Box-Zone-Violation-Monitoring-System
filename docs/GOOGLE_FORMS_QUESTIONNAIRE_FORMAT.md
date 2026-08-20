# GOOGLE FORMS QUESTIONNAIRE SETUP GUIDE
**AI-Powered Yellow Box Zone Violation Monitoring System Using AI-Based Camera Detection**
*Traffic Management Center (TMC) – City Government of Malaybalay, Bukidnon*

This document provides the exact question text, question types, and structure for setting up the **TMC Officer Usability Evaluation Survey** directly in **Google Forms** (or using the automated Google Apps Script below).

---

## 📋 METHOD 1: AUTOMATED GOOGLE APPS SCRIPT SETUP (RECOMMENDED)

You can automatically generate this complete Google Form in your Google Drive in less than 30 seconds using Google Apps Script:

### Step-by-Step Instructions:
1. Open [Google Apps Script](https://script.google.com/) (sign in with your Google account).
2. Click **+ New Project** at the top left.
3. Replace all existing code in the editor with the script code found in [`scripts/create_google_form.js`](file:///d:/AI-Powered%20Yellow%20Box%20Zone%20Monitoring%20System%20Using%20AI-Based%20Camera%20Detection/scripts/create_google_form.js).
4. Click the **Save** icon (💾), then click **Run** (▶️).
5. Grant permissions if prompted by Google.
6. Look at the **Execution Log** at the bottom — it will output the live **Google Form Edit URL** and **Published Respondent URL**!

---

## ✍️ METHOD 2: MANUAL GOOGLE FORMS COPY-PASTE GUIDE

If you prefer to create the form manually on [Google Forms](https://forms.google.com/):

### Form Settings:
- **Form Title:** TMC Officer Usability & System Evaluation Survey
- **Form Description:**
  > Evaluation instrument for Traffic Management Center (TMC) officers, enforcement personnel, and administrators (N=10). This survey collects empirical evaluation data on Functionality, Usability, and Reliability for the AI-Powered Yellow Box Zone Monitoring System in Malaybalay City.

---

### SECTION 1 OF 5: RESPONDENT DEMOGRAPHIC PROFILE
*Section Title:* **Part I: Evaluator Demographic Profile**

1. **Question:** Evaluator Full Name (Optional)
   - **Question Type:** Short Answer
   - **Required:** No

2. **Question:** Current Designation / Role
   - **Question Type:** Multiple Choice
   - **Required:** Yes
   - **Options:**
     - [ ] Traffic Management Officer / Enforcer
     - [ ] Surveillance & Camera System Operator
     - [ ] TMC Administrative Supervisor / IT Staff
     - [ ] Other: *(Enable "Add 'Other'")*

3. **Question:** Years of Traffic Monitoring / Enforcement Experience
   - **Question Type:** Multiple Choice
   - **Required:** Yes
   - **Options:**
     - [ ] Less than 1 Year
     - [ ] 1 – 3 Years
     - [ ] 4 – 6 Years
     - [ ] More than 6 Years

---

### SECTION 2 OF 5: SYSTEM FUNCTIONALITY EVALUATION
*Section Title:* **Part II - Section A: System Functionality**  
*Section Description:* *Measures vehicle detection accuracy, StopTimer dwell-time tracking, and automated NCAP evidence snapshot clarity.*

4. **Question:** F1. The system accurately detects vehicles (car, truck, bus, motorcycle) in yellow box zones.
   - **Question Type:** Linear Scale
   - **Scale:** 1 to 5
   - **Label 1:** 1 (Strongly Disagree)
   - **Label 5:** 5 (Strongly Agree)
   - **Required:** Yes

5. **Question:** F2. The StopTimer engine correctly measures stationary vehicle duration inside yellow box zones.
   - **Question Type:** Linear Scale
   - **Scale:** 1 to 5
   - **Label 1:** 1 (Strongly Disagree)
   - **Label 5:** 5 (Strongly Agree)
   - **Required:** Yes

6. **Question:** F3. Automated evidence snapshots contain clear, usable NCAP metadata.
   - **Question Type:** Linear Scale
   - **Scale:** 1 to 5
   - **Label 1:** 1 (Strongly Disagree)
   - **Label 5:** 5 (Strongly Agree)
   - **Required:** Yes

---

### SECTION 3 OF 5: SYSTEM USABILITY EVALUATION
*Section Title:* **Part II - Section B: System Usability & Interface Design**  
*Section Description:* *Measures user interface layout, visual overlays, and real-time alert notification responsiveness.*

7. **Question:** U1. The React web dashboard is intuitive and visually well-structured.
   - **Question Type:** Linear Scale
   - **Scale:** 1 to 5
   - **Label 1:** 1 (Strongly Disagree)
   - **Label 5:** 5 (Strongly Agree)
   - **Required:** Yes

8. **Question:** U2. Live visual overlays (yellow box grid, timers) provide clear situational awareness.
   - **Question Type:** Linear Scale
   - **Scale:** 1 to 5
   - **Label 1:** 1 (Strongly Disagree)
   - **Label 5:** 5 (Strongly Agree)
   - **Required:** Yes

9. **Question:** U3. Real-time alert notifications respond promptly upon vehicle violation detection.
   - **Question Type:** Linear Scale
   - **Scale:** 1 to 5
   - **Label 1:** 1 (Strongly Disagree)
   - **Label 5:** 5 (Strongly Agree)
   - **Required:** Yes

---

### SECTION 4 OF 5: SYSTEM RELIABILITY EVALUATION
*Section Title:* **Part II - Section C: System Reliability & Stability**  
*Section Description:* *Measures continuous operating performance, stream stability, and system robustness under dense traffic conditions.*

10. **Question:** R1. The system maintains consistent performance during heavy traffic flow.
    - **Question Type:** Linear Scale
    - **Scale:** 1 to 5
    - **Label 1:** 1 (Strongly Disagree)
    - **Label 5:** 5 (Strongly Agree)
    - **Required:** Yes

11. **Question:** R2. The web interface streaming remains stable without crashes or video freeze.
    - **Question Type:** Linear Scale
    - **Scale:** 1 to 5
    - **Label 1:** 1 (Strongly Disagree)
    - **Label 5:** 5 (Strongly Agree)
    - **Required:** Yes

---

### SECTION 5 OF 5: QUALITATIVE FEEDBACK & RECOMMENDATIONS
*Section Title:* **Part III: Qualitative Feedback & Operational Recommendations**

12. **Question:** What are the main strengths of the Yellow Box AI Monitoring System?
    - **Question Type:** Paragraph
    - **Required:** No

13. **Question:** What areas or features need improvement or encountered difficulties during operations?
    - **Question Type:** Paragraph
    - **Required:** No

14. **Question:** General Comments & Recommendations for future enforcement rollout:
    - **Question Type:** Paragraph
    - **Required:** No
