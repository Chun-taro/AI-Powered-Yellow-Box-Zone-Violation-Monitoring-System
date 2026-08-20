/**
 * Google Apps Script to Automatically Create the ISO/IEC 25010 TMC Officer Usability Survey Google Form.
 * 
 * HOW TO USE:
 * 1. Open Google Apps Script: https://script.google.com/
 * 2. Click "+ New Project"
 * 3. Copy and Paste this code into Code.gs
 * 4. Click "Run" (▶️)
 * 5. Check the Execution Log at the bottom for your live Form URLs!
 */

function createTMCUsabilityForm() {
  var form = FormApp.create('TMC Officer Usability & System Evaluation Survey (ISO/IEC 25010)');
  
  form.setDescription(
    'Official evaluation survey instrument for Traffic Management Center (TMC) officers, enforcement personnel, and administrators (N=10).\n\n' +
    'Structured according to ISO/IEC 25010 Systems and Software Quality Requirements and Evaluation (SQuaRE).\n' +
    'Evaluates Functional Suitability (§4.1), Usability (§4.4), Performance Efficiency (§4.2), Reliability (§4.5), Security (§4.6), Maintainability (§4.7), and Operational Quality-in-Use for the AI Yellow Box Zone Monitoring System in Malaybalay City.'
  );
  
  form.setConfirmationMessage('Thank you for completing the TMC System Usability Evaluation! Your feedback has been recorded for the ISO/IEC 25010 research benchmark analysis.');

  // --- SECTION 1: RESPONDENT DEMOGRAPHIC PROFILE ---
  form.addTextItem().setTitle('Evaluator Full Name (Optional)').setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('Current Designation / Role')
      .setChoiceValues([
        'Traffic Management Officer / Enforcer',
        'Surveillance & Camera System Operator',
        'TMC Administrative Supervisor / IT Staff',
        'Research Evaluator / Guest Tester'
      ])
      .showOtherOption(true)
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Years of Traffic Monitoring / Enforcement Experience')
      .setChoiceValues([
        'Less than 1 Year',
        '1 – 3 Years',
        '4 – 6 Years',
        'More than 6 Years'
      ])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Primary Duty Shift')
      .setChoiceValues([
        'Day Shift (6:00 AM – 2:00 PM)',
        'Afternoon Shift (2:00 PM – 10:00 PM)',
        'Night Shift (10:00 PM – 6:00 AM)',
        'Rotating / Full Day Oversight'
      ])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Primary Operational Environment')
      .setChoiceValues([
        'Central Control Room Workstation',
        'Field Operations (Mobile / Tablet)',
        'Hybrid (Control Room & On-Site Enforcement)'
      ])
      .setRequired(true);

  // --- SECTION 2: CATEGORY 1 - FUNCTIONAL SUITABILITY (ISO 25010 §4.1) ---
  form.addPageBreakItem()
      .setTitle('Part II - Category 1: Functional Suitability (ISO/IEC 25010 §4.1)')
      .setHelpText('Evaluates functional correctness, accuracy, completeness, appropriateness, and spatial precision.');

  form.addScaleItem()
      .setTitle('F1 [Functional Correctness]. The system accurately detects vehicles (car, truck, bus, motorcycle) in yellow box zones.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('F2 [Functional Accuracy]. The StopTimer engine correctly measures stationary vehicle duration inside yellow box grid lines.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('F3 [Functional Completeness]. Automated evidence snapshots contain clear, complete NCAP metadata (timestamps, duration, bounding boxes).')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('F4 [Functional Appropriateness]. The system effectively distinguishes between moving vehicles passing through and illegal stationary stopping.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('F5 [Spatial Precision]. Yellow box polygon zone boundaries accurately align with physical intersection road pavement markings.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  // --- SECTION 3: CATEGORY 2 - USABILITY & UI AESTHETICS (ISO 25010 §4.4) ---
  form.addPageBreakItem()
      .setTitle('Part II - Category 2: Usability & User Interface Aesthetics (ISO/IEC 25010 §4.4)')
      .setHelpText('Evaluates UI aesthetics, operability, error protection, learnability, and accessibility.');

  form.addScaleItem()
      .setTitle('U1 [UI Aesthetics]. The React web dashboard is intuitive, visually well-structured, and easy to navigate.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('U2 [Operability]. Live visual overlays (yellow box grid, vehicle timers, bounding boxes) provide clear situational awareness.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('U3 [Error Protection]. Real-time alert notifications respond promptly upon vehicle violation detection.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('U4 [Learnability]. Filtering, searching, and reviewing historical violation logs in the web interface is fast and user-friendly.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('U5 [Accessibility]. Generating and exporting analytical violation reports (daily/weekly trends) is clear and straightforward.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  // --- SECTION 4: CATEGORY 3 - PERFORMANCE EFFICIENCY & RELIABILITY (ISO 25010 §4.2 & §4.5) ---
  form.addPageBreakItem()
      .setTitle('Part II - Category 3: Performance Efficiency & Reliability (ISO/IEC 25010 §4.2 & §4.5)')
      .setHelpText('Evaluates fault tolerance, availability, environmental adaptability, and time behaviour latency.');

  form.addScaleItem()
      .setTitle('R1 [Fault Tolerance]. The system maintains consistent detection performance during heavy traffic flow and inter-vehicle occlusions.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('R2 [Availability]. The web interface streaming remains stable without crashes, frame drops, or video freezes.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('R3 [Environmental Adaptability]. The system maintains reliable detection under varying lighting and weather conditions (daylight, night, rain, shadows).')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('R4 [Time Behaviour]. Low inference latency ensures real-time video dashboard updates without noticeable delay.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  // --- SECTION 5: CATEGORY 4 - SECURITY & MAINTAINABILITY (ISO 25010 §4.6 & §4.7) ---
  form.addPageBreakItem()
      .setTitle('Part II - Category 4: Security & Maintainability (ISO/IEC 25010 §4.6 & §4.7)')
      .setHelpText('Evaluates data integrity, non-repudiation accountability, and zone re-configurability.');

  form.addScaleItem()
      .setTitle('S1 [Data Integrity]. NCAP violation snapshot records and audit timestamps cannot be tampered with or modified.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('S2 [Modifiability]. Yellow box polygon zone coordinates can be easily calibrated and reconfigured for new camera angles.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  // --- SECTION 6: CATEGORY 5 - OPERATIONAL QUALITY-IN-USE ---
  form.addPageBreakItem()
      .setTitle('Part II - Category 5: Operational Quality-in-Use (ISO/IEC 25010)')
      .setHelpText('Evaluates manual monitoring workload reduction and intersection traffic compliance impact.');

  form.addScaleItem()
      .setTitle('E1 [Workload Efficiency]. Automated NCAP evidence collection significantly reduces manual monitoring workload for TMC officers.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  form.addScaleItem()
      .setTitle('E2 [Traffic Compliance Impact]. Implementing this AI monitoring system improves intersection clearance and traffic compliance in Malaybalay City.')
      .setBounds(1, 5).setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)').setRequired(true);

  // --- SECTION 7: QUALITATIVE FEEDBACK ---
  form.addPageBreakItem()
      .setTitle('Part III: Qualitative Feedback & Operational Recommendations');

  form.addParagraphTextItem().setTitle('What are the main strengths of the Yellow Box AI Monitoring System?');
  form.addParagraphTextItem().setTitle('What areas or features need improvement or encountered difficulties during operations?');
  form.addParagraphTextItem().setTitle('General Comments & Recommendations for future enforcement rollout:');

  Logger.log('====================================================');
  Logger.log('SUCCESS! ISO/IEC 25010 TMC Usability Form Created.');
  Logger.log('Form Edit URL: ' + form.getEditUrl());
  Logger.log('Respondent Form URL: ' + form.getPublishedUrl());
  Logger.log('====================================================');
}
