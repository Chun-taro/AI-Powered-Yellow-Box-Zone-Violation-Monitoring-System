/**
 * Google Apps Script to Automatically Create the TMC Officer Usability Survey Google Form.
 * 
 * HOW TO USE:
 * 1. Open Google Apps Script: https://script.google.com/
 * 2. Click "+ New Project"
 * 3. Copy and Paste this code into Code.gs
 * 4. Click "Run" (▶️)
 * 5. Check the Execution Log at the bottom for your live Form URLs!
 */

function createTMCUsabilityForm() {
  var form = FormApp.create('TMC Officer Usability & System Evaluation Survey');
  
  form.setDescription(
    'Official evaluation survey instrument for Traffic Management Center (TMC) officers, enforcement personnel, and administrators (N=10).\n\n' +
    'This survey collects empirical user evaluation data to assess Functionality, Usability, and Reliability for the AI-Powered Yellow Box Zone Monitoring System in Malaybalay City.'
  );
  
  form.setConfirmationMessage('Thank you for completing the TMC System Usability Evaluation! Your feedback has been recorded for the research benchmark analysis.');

  // --- SECTION 1: RESPONDENT DEMOGRAPHIC PROFILE ---
  var item1 = form.addTextItem();
  item1.setTitle('Evaluator Full Name (Optional)');
  item1.setRequired(false);

  var item2 = form.addMultipleChoiceItem();
  item2.setTitle('Current Designation / Role')
       .setChoiceValues([
         'Traffic Management Officer / Enforcer',
         'Surveillance & Camera System Operator',
         'TMC Administrative Supervisor / IT Staff'
       ])
       .showOtherOption(true)
       .setRequired(true);

  var item3 = form.addMultipleChoiceItem();
  item3.setTitle('Years of Traffic Monitoring / Enforcement Experience')
       .setChoiceValues([
         'Less than 1 Year',
         '1 – 3 Years',
         '4 – 6 Years',
         'More than 6 Years'
       ])
       .setRequired(true);

  // --- SECTION 2: SYSTEM FUNCTIONALITY ---
  form.addPageBreakItem()
      .setTitle('Part II - Section A: System Functionality')
      .setHelpText('Measures vehicle detection accuracy, StopTimer dwell-time tracking, and automated NCAP evidence snapshot clarity.');

  var f1 = form.addScaleItem();
  f1.setTitle('F1. The system accurately detects vehicles (car, truck, bus, motorcycle) in yellow box zones.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  var f2 = form.addScaleItem();
  f2.setTitle('F2. The StopTimer engine correctly measures stationary vehicle duration inside yellow box zones.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  var f3 = form.addScaleItem();
  f3.setTitle('F3. Automated evidence snapshots contain clear, usable NCAP metadata.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  // --- SECTION 3: SYSTEM USABILITY ---
  form.addPageBreakItem()
      .setTitle('Part II - Section B: System Usability & Interface Design')
      .setHelpText('Measures user interface layout, visual overlays, and real-time alert notification responsiveness.');

  var u1 = form.addScaleItem();
  u1.setTitle('U1. The React web dashboard is intuitive and visually well-structured.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  var u2 = form.addScaleItem();
  u2.setTitle('U2. Live visual overlays (yellow box grid, timers) provide clear situational awareness.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  var u3 = form.addScaleItem();
  u3.setTitle('U3. Real-time alert notifications respond promptly upon vehicle violation detection.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  // --- SECTION 4: SYSTEM RELIABILITY ---
  form.addPageBreakItem()
      .setTitle('Part II - Section C: System Reliability & Stability')
      .setHelpText('Measures continuous operating performance, stream stability, and system robustness under dense traffic conditions.');

  var r1 = form.addScaleItem();
  r1.setTitle('R1. The system maintains consistent performance during heavy traffic flow.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  var r2 = form.addScaleItem();
  r2.setTitle('R2. The web interface streaming remains stable without crashes or video freeze.')
    .setBounds(1, 5)
    .setLabels('1 (Strongly Disagree)', '5 (Strongly Agree)')
    .setRequired(true);

  // --- SECTION 5: QUALITATIVE FEEDBACK ---
  form.addPageBreakItem()
      .setTitle('Part III: Operational Feedback & Recommendations');

  var q1 = form.addParagraphTextItem();
  q1.setTitle('What are the main strengths of the Yellow Box AI Monitoring System?');

  var q2 = form.addParagraphTextItem();
  q2.setTitle('What areas or features need improvement or encountered difficulties during operations?');

  var q3 = form.addParagraphTextItem();
  q3.setTitle('General Comments & Recommendations for future enforcement rollout:');

  Logger.log('====================================================');
  Logger.log('SUCCESS! TMC Usability Survey Form Created.');
  Logger.log('Form Edit URL: ' + form.getEditUrl());
  Logger.log('Respondent Form URL: ' + form.getPublishedUrl());
  Logger.log('====================================================');
}
