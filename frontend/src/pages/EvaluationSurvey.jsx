import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, 
  Award, 
  FileText, 
  Printer, 
  RotateCcw, 
  Send, 
  ShieldCheck, 
  BarChart3, 
  UserCheck,
  Zap,
  Activity,
  Layers,
  CheckSquare,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const SURVEY_ITEMS = [
  // --- ISO 25010 §4.1: FUNCTIONAL SUITABILITY (5 items) ---
  {
    id: 'F1',
    category: 'Functional Suitability (ISO 25010)',
    isoMetric: 'Functional Correctness',
    statement: 'The system accurately detects vehicles (car, truck, bus, motorcycle) in yellow box zones.',
    paperBenchmark: 4.80,
    paperStdDev: 0.42
  },
  {
    id: 'F2',
    category: 'Functional Suitability (ISO 25010)',
    isoMetric: 'Functional Accuracy',
    statement: 'The StopTimer engine correctly measures stationary vehicle duration inside yellow box zones.',
    paperBenchmark: 4.70,
    paperStdDev: 0.48
  },
  {
    id: 'F3',
    category: 'Functional Suitability (ISO 25010)',
    isoMetric: 'Functional Completeness',
    statement: 'Automated evidence snapshots contain clear, complete NCAP metadata (timestamps, duration, bounding boxes).',
    paperBenchmark: 4.90,
    paperStdDev: 0.32
  },
  {
    id: 'F4',
    category: 'Functional Suitability (ISO 25010)',
    isoMetric: 'Functional Appropriateness',
    statement: 'The system effectively distinguishes between moving vehicles passing through and illegal stationary stopping.',
    paperBenchmark: 4.85,
    paperStdDev: 0.36
  },
  {
    id: 'F5',
    category: 'Functional Suitability (ISO 25010)',
    isoMetric: 'Spatial Precision',
    statement: 'Yellow box polygon zone boundaries accurately align with physical intersection road pavement markings.',
    paperBenchmark: 4.75,
    paperStdDev: 0.43
  },

  // --- ISO 25010 §4.4: USABILITY & UI AESTHETICS (5 items) ---
  {
    id: 'U1',
    category: 'Usability & UI Aesthetics (ISO 25010)',
    isoMetric: 'User Interface Aesthetics',
    statement: 'The React web dashboard is intuitive, visually well-structured, and easy to navigate.',
    paperBenchmark: 4.85,
    paperStdDev: 0.37
  },
  {
    id: 'U2',
    category: 'Usability & UI Aesthetics (ISO 25010)',
    isoMetric: 'Operability & Situational Awareness',
    statement: 'Live visual overlays (yellow box polygon grid, vehicle timers) provide clear situational awareness.',
    paperBenchmark: 4.90,
    paperStdDev: 0.32
  },
  {
    id: 'U3',
    category: 'Usability & UI Aesthetics (ISO 25010)',
    isoMetric: 'User Error Protection & Alerting',
    statement: 'Real-time alert notifications respond promptly upon vehicle violation detection.',
    paperBenchmark: 4.75,
    paperStdDev: 0.43
  },
  {
    id: 'U4',
    category: 'Usability & UI Aesthetics (ISO 25010)',
    isoMetric: 'Learnability & Log Ergonomics',
    statement: 'Filtering, searching, and reviewing historical violation logs in the interface is fast and user-friendly.',
    paperBenchmark: 4.80,
    paperStdDev: 0.40
  },
  {
    id: 'U5',
    category: 'Usability & UI Aesthetics (ISO 25010)',
    isoMetric: 'Accessibility & Reporting',
    statement: 'Generating and exporting analytical violation reports is clear and straightforward.',
    paperBenchmark: 4.85,
    paperStdDev: 0.35
  },

  // --- ISO 25010 §4.2 & §4.5: PERFORMANCE EFFICIENCY & RELIABILITY (4 items) ---
  {
    id: 'R1',
    category: 'Performance & Reliability (ISO 25010)',
    isoMetric: 'Fault Tolerance & Occlusion Retention',
    statement: 'The system maintains consistent detection performance during heavy traffic flow and inter-vehicle occlusions.',
    paperBenchmark: 4.65,
    paperStdDev: 0.50
  },
  {
    id: 'R2',
    category: 'Performance & Reliability (ISO 25010)',
    isoMetric: 'Availability & Stream Stability',
    statement: 'The web interface video streaming remains stable without crashes, frame drops, or video freezes.',
    paperBenchmark: 4.70,
    paperStdDev: 0.48
  },
  {
    id: 'R3',
    category: 'Performance & Reliability (ISO 25010)',
    isoMetric: 'Environmental Adaptability',
    statement: 'The system maintains reliable detection under varying lighting and weather conditions (daylight, night, rain, shadows).',
    paperBenchmark: 4.60,
    paperStdDev: 0.52
  },
  {
    id: 'R4',
    category: 'Performance & Reliability (ISO 25010)',
    isoMetric: 'Time Behaviour & Inference Latency',
    statement: 'Low inference latency ensures real-time video dashboard updates without noticeable delay.',
    paperBenchmark: 4.75,
    paperStdDev: 0.44
  },

  // --- ISO 25010 §4.6 & §4.7: SECURITY & MAINTAINABILITY (2 items) ---
  {
    id: 'S1',
    category: 'Security & Maintainability (ISO 25010)',
    isoMetric: 'Accountability & Data Integrity',
    statement: 'NCAP violation snapshot records and audit timestamps cannot be tampered with or modified.',
    paperBenchmark: 4.90,
    paperStdDev: 0.30
  },
  {
    id: 'S2',
    category: 'Security & Maintainability (ISO 25010)',
    isoMetric: 'Modifiability & Re-configurability',
    statement: 'Yellow box polygon zone coordinates can be easily calibrated and reconfigured for new camera angles.',
    paperBenchmark: 4.80,
    paperStdDev: 0.41
  },

  // --- ISO 25010 QUALITY-IN-USE: OPERATIONAL EFFECTIVENESS (2 items) ---
  {
    id: 'E1',
    category: 'Operational Quality-in-Use (ISO 25010)',
    isoMetric: 'Efficiency in Use & Workload',
    statement: 'Automated NCAP evidence collection significantly reduces manual monitoring workload for TMC officers.',
    paperBenchmark: 4.90,
    paperStdDev: 0.30
  },
  {
    id: 'E2',
    category: 'Operational Quality-in-Use (ISO 25010)',
    isoMetric: 'Context Completeness & Impact',
    statement: 'Implementing this AI monitoring system improves intersection clearance and traffic compliance in Malaybalay City.',
    paperBenchmark: 4.85,
    paperStdDev: 0.37
  }
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'SD', fullName: 'Strongly Disagree', color: 'hover:bg-red-500/20 active:bg-red-500/30 text-red-400' },
  { value: 2, label: 'D', fullName: 'Disagree', color: 'hover:bg-orange-500/20 active:bg-orange-500/30 text-orange-400' },
  { value: 3, label: 'N', fullName: 'Neutral', color: 'hover:bg-yellow-500/20 active:bg-yellow-500/30 text-yellow-400' },
  { value: 4, label: 'A', fullName: 'Agree', color: 'hover:bg-blue-500/20 active:bg-blue-500/30 text-blue-400' },
  { value: 5, label: 'SA', fullName: 'Strongly Agree', color: 'hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400' }
];

export function EvaluationSurvey() {
  const [evaluatorName, setEvaluatorName] = useState('');
  const [role, setRole] = useState('Traffic Management Officer');
  const [experience, setExperience] = useState('1 – 3 Years');
  const [shift, setShift] = useState('Day Shift (6:00 AM - 2:00 PM)');
  const [environment, setEnvironment] = useState('Central Control Room');

  const [responses, setResponses] = useState({
    F1: 5, F2: 5, F3: 5, F4: 5, F5: 5,
    U1: 5, U2: 5, U3: 5, U4: 5, U5: 5,
    R1: 4, R2: 5, R3: 4, R4: 5,
    S1: 5, S2: 5,
    E1: 5, E2: 5
  });

  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleRatingChange = (id, rating) => {
    setResponses((prev) => ({ ...prev, [id]: rating }));
  };

  // Compute Statistics (Mean μ and Standard Deviation σ)
  const stats = useMemo(() => {
    const scores = Object.values(responses);
    const totalCount = scores.length;
    if (totalCount === 0) return { mean: 0, stdDev: 0, categories: {} };

    const mean = scores.reduce((a, b) => a + b, 0) / totalCount;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (totalCount > 1 ? totalCount - 1 : 1);
    const stdDev = Math.sqrt(variance);

    const categories = {};
    const catKeys = [
      'Functional Suitability (ISO 25010)',
      'Usability & UI Aesthetics (ISO 25010)',
      'Performance & Reliability (ISO 25010)',
      'Security & Maintainability (ISO 25010)',
      'Operational Quality-in-Use (ISO 25010)'
    ];

    catKeys.forEach((cat) => {
      const catItems = SURVEY_ITEMS.filter((i) => i.category === cat);
      const catScores = catItems.map((i) => responses[i.id] || 0);
      const catMean = catScores.reduce((a, b) => a + b, 0) / (catScores.length || 1);
      const catVar = catScores.reduce((a, b) => a + Math.pow(b - catMean, 2), 0) / (catScores.length > 1 ? catScores.length - 1 : 1);
      categories[cat] = {
        mean: catMean,
        stdDev: Math.sqrt(catVar)
      };
    });

    return { mean, stdDev, categories };
  }, [responses]);

  const getVerbalInterpretation = (val) => {
    if (val >= 4.21) return { text: 'Strongly Agree', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (val >= 3.41) return { text: 'Agree', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (val >= 2.61) return { text: 'Neutral', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    if (val >= 1.81) return { text: 'Disagree', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { text: 'Strongly Disagree', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('ISO 25010 TMC system evaluation questionnaire submitted successfully!');
    localStorage.setItem('tmc_last_iso25010_evaluation', JSON.stringify({
      evaluatorName,
      role,
      experience,
      shift,
      environment,
      responses,
      stats,
      strengths,
      improvements,
      feedback,
      date: new Date().toISOString()
    }));
  };

  const handleReset = () => {
    setResponses({
      F1: 5, F2: 5, F3: 5, F4: 5, F5: 5,
      U1: 5, U2: 5, U3: 5, U4: 5, U5: 5,
      R1: 4, R2: 5, R3: 4, R4: 5,
      S1: 5, S2: 5,
      E1: 5, E2: 5
    });
    setFeedback('');
    setStrengths('');
    setImprovements('');
    setSubmitted(false);
    toast.success('Form reset to baseline ratings.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ==================================================== */}
      {/* SCREEN UI VIEW (HIDDEN DURING PRINTING) */}
      {/* ==================================================== */}
      <div className="print:hidden space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl glass border border-white/10 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                <ClipboardCheck className="w-4 h-4" />
                ISO/IEC 25010 Software Quality Evaluation Standard (18 Metrics)
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Usability & System Evaluation Survey
              </h1>
              <p className="text-muted text-sm max-w-2xl">
                Formal ISO/IEC 25010 research evaluation questionnaire for Traffic Management Center (TMC) personnel assessing Functional Suitability, Usability, Performance Efficiency, Reliability, Security, and Operational Quality-in-Use ($N=10$).
              </p>
            </div>
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-accent to-primary text-black font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-accent/20 hover:opacity-90 cursor-pointer shrink-0"
              >
                <Printer className="w-4 h-4 text-black" />
                Print Clean Form
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl glass hover:bg-white/10 text-muted hover:text-white font-semibold text-xs sm:text-sm transition-all duration-200 border border-white/10 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Live Benchmark Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-3 sm:p-4 border border-white/10 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider">Overall</span>
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-white">{stats.mean.toFixed(2)}</span>
              <span className="text-[9px] sm:text-[10px] text-muted">/ 5.00</span>
            </div>
            <div className="mt-1">
              <span className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md font-semibold border ${getVerbalInterpretation(stats.mean).color}`}>
                {getVerbalInterpretation(stats.mean).text}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-3 sm:p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider">Function</span>
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {stats.categories['Functional Suitability (ISO 25010)']?.mean.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[8px] sm:text-[9px] text-muted">ISO 25010 §4.1</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-3 sm:p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider">Usability</span>
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {stats.categories['Usability & UI Aesthetics (ISO 25010)']?.mean.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[8px] sm:text-[9px] text-muted">ISO 25010 §4.4</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-3 sm:p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider">Reliability</span>
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {stats.categories['Performance & Reliability (ISO 25010)']?.mean.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[8px] sm:text-[9px] text-muted">ISO 25010 §4.2</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-3 sm:p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider">Security</span>
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {stats.categories['Security & Maintainability (ISO 25010)']?.mean.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[8px] sm:text-[9px] text-muted">ISO 25010 §4.6</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-3 sm:p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider">Impact</span>
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {stats.categories['Operational Quality-in-Use (ISO 25010)']?.mean.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[8px] sm:text-[9px] text-muted">Quality-in-Use</p>
          </motion.div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Evaluator Profile Section */}
          <div className="glass rounded-3xl p-5 sm:p-8 border border-white/10 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Part I: Evaluator Profile</h2>
                <p className="text-xs text-muted">ISO/IEC 25010 evaluator background context ($N=10$ validation)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Evaluator Name / ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Officer Juan Dela Cruz"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Designation / Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                >
                  <option value="Traffic Management Officer (TMC)">Traffic Management Officer (TMC)</option>
                  <option value="Traffic Enforcer / Field Officer">Traffic Enforcer / Field Officer</option>
                  <option value="CCTV Monitoring Specialist">CCTV Monitoring Specialist</option>
                  <option value="Municipal Transport Administrative Officer">Municipal Transport Administrative Officer</option>
                  <option value="IT Systems Administrator / Developer">IT Systems Administrator / Developer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Experience in Traffic Operations
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                >
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1 - 3 years">1 - 3 years</option>
                  <option value="3 - 5 years">3 - 5 years</option>
                  <option value="More than 5 years">More than 5 years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Primary Duty Shift
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                >
                  <option value="Day Shift (6:00 AM - 2:00 PM)">Day Shift (6:00 AM - 2:00 PM)</option>
                  <option value="Afternoon Shift (2:00 PM - 10:00 PM)">Afternoon Shift (2:00 PM - 10:00 PM)</option>
                  <option value="Night Shift (10:00 PM - 6:00 AM)">Night Shift (10:00 PM - 6:00 AM)</option>
                  <option value="Rotating / Full Oversight">Rotating / Full Day Oversight</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Primary Operational Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                >
                  <option value="Central Control Room">Central Control Room (Multi-monitor Workstation)</option>
                  <option value="Field Operations / Mobile">Field Operations (Mobile / Tablet Monitoring)</option>
                  <option value="Hybrid Operations">Hybrid (Control Room & On-Site Enforcement)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Survey Items Matrix Section */}
          <div className="glass rounded-3xl p-5 sm:p-8 border border-white/10 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 text-accent shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Part II: ISO/IEC 25010 Assessment Metrics (18 Items)</h2>
                  <p className="text-xs text-muted">5-Point Likert Scale (1 = Strongly Disagree to 5 = Strongly Agree)</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted font-medium">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">1: SD</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">2: D</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">3: N</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">4: A</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">5: SA</span>
              </div>
            </div>

            {[
              'Functional Suitability (ISO 25010)',
              'Usability & UI Aesthetics (ISO 25010)',
              'Performance & Reliability (ISO 25010)',
              'Security & Maintainability (ISO 25010)',
              'Operational Quality-in-Use (ISO 25010)'
            ].map((category) => (
              <div key={category} className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {category}
                </h3>

                <div className="space-y-3">
                  {SURVEY_ITEMS.filter((item) => item.category === category).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-mono font-bold text-xs">
                            {item.id}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-accent font-semibold">
                            {item.isoMetric}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-white/90 mt-1">{item.statement}</p>
                        <p className="text-[10px] sm:text-[11px] text-muted italic">
                          Target Benchmark: <span className="text-white font-semibold">{item.paperBenchmark.toFixed(2)}</span> (σ = {item.paperStdDev.toFixed(2)})
                        </p>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 sm:flex sm:gap-2.5 w-full sm:w-auto shrink-0 pt-2 md:pt-0">
                        {LIKERT_OPTIONS.map((opt) => {
                          const isSelected = responses[item.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleRatingChange(item.id, opt.value)}
                              className={`h-10 sm:h-11 sm:w-11 rounded-xl font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center border cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-black border-primary shadow-lg shadow-primary/30 scale-105'
                                  : `bg-black/40 text-muted border-white/10 ${opt.color}`
                              }`}
                              title={opt.fullName}
                            >
                              <span>{opt.value}</span>
                              <span className="text-[8px] sm:text-[9px] opacity-75 font-normal">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Qualitative Feedback Section */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Part III: Operational Feedback & Recommendations</h2>
                <p className="text-xs text-muted">Qualitative insights for future system expansion & NCAP deployment</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  1. System Strengths (What features work best for your enforcement tasks?)
                </label>
                <textarea
                  rows={2}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="e.g. StopTimer overlays and automatic snapshot capturing speed up violation verification..."
                  className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-muted/50 focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  2. Areas for Improvement (What difficulties or false alerts occurred?)
                </label>
                <textarea
                  rows={2}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="e.g. Heavy rain reflections sometimes alter bounding boxes..."
                  className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-muted/50 focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  3. General Comments & Feature Suggestions
                </label>
                <textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Integration with ALPR/ANPR license plate recognition would further automate processing..."
                  className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-muted/50 focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 glass rounded-3xl border border-white/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Calculated Mean: <span className="text-primary font-bold">{stats.mean.toFixed(2)} / 5.00</span>
                </p>
                <p className="text-xs text-muted">Verbal Interpretation: {getVerbalInterpretation(stats.mean).text}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-black font-extrabold text-sm transition-all shadow-lg shadow-primary/25 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitted ? 'Update Questionnaire' : 'Submit Evaluation'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ==================================================== */}
      {/* DEDICATED PRINTABLE DOCUMENT VIEW (SHOWN ONLY DURING PRINTING) */}
      {/* ==================================================== */}
      <div className="hidden print:block font-serif text-black bg-white p-4 space-y-6 leading-relaxed">
        {/* Printable Official Header */}
        <div className="text-center border-b-2 border-black pb-4 space-y-1">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            TMC OFFICER USABILITY & SYSTEM EVALUATION QUESTIONNAIRE
          </h1>
          <h2 className="text-sm font-bold italic">ISO/IEC 25010 Systems and Software Quality Requirements and Evaluation (SQuaRE)</h2>
          <p className="text-xs font-semibold">
            AI-Powered Yellow Box Zone Violation Monitoring System Using AI-Based Camera Detection
          </p>
          <p className="text-xs">
            Traffic Management Center (TMC) – City Government of Malaybalay, Bukidnon
          </p>
        </div>

        {/* Printable Demographic Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1">
            PART I: RESPONDENT DEMOGRAPHIC PROFILE
          </h3>
          <table className="w-full text-xs border-collapse border border-black">
            <tbody>
              <tr>
                <td className="p-2 border border-black font-bold w-1/4">Evaluator Name:</td>
                <td className="p-2 border border-black w-3/4">{evaluatorName || '_____________________________________________'}</td>
              </tr>
              <tr>
                <td className="p-2 border border-black font-bold">Designation / Role:</td>
                <td className="p-2 border border-black">{role}</td>
              </tr>
              <tr>
                <td className="p-2 border border-black font-bold">Years of Experience:</td>
                <td className="p-2 border border-black">{experience}</td>
              </tr>
              <tr>
                <td className="p-2 border border-black font-bold">Duty Shift & Environment:</td>
                <td className="p-2 border border-black">{shift} | {environment}</td>
              </tr>
              <tr>
                <td className="p-2 border border-black font-bold">Date of Evaluation:</td>
                <td className="p-2 border border-black">{new Date().toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Printable 18 Assessment Indicators Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1">
            PART II: ISO/IEC 25010 ASSESSMENT INDICATORS MATRIX
          </h3>
          <p className="text-[10px] italic">
            Rating Scale: 5 = Strongly Agree (SA), 4 = Agree (A), 3 = Neutral (N), 2 = Disagree (D), 1 = Strongly Disagree (SD)
          </p>
          <table className="w-full text-[10px] border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 font-bold text-center">
                <th className="p-1 border border-black w-8">#</th>
                <th className="p-1 border border-black w-28">ISO Metric</th>
                <th className="p-1 border border-black text-left">Specific Assessment Indicator</th>
                <th className="p-1 border border-black w-8">5</th>
                <th className="p-1 border border-black w-8">4</th>
                <th className="p-1 border border-black w-8">3</th>
                <th className="p-1 border border-black w-8">2</th>
                <th className="p-1 border border-black w-8">1</th>
              </tr>
            </thead>
            <tbody>
              {SURVEY_ITEMS.map((item) => {
                const userRating = responses[item.id];
                return (
                  <tr key={item.id}>
                    <td className="p-1 border border-black font-bold text-center">{item.id}</td>
                    <td className="p-1 border border-black italic font-semibold">{item.isoMetric}</td>
                    <td className="p-1 border border-black">{item.statement}</td>
                    {[5, 4, 3, 2, 1].map((val) => (
                      <td key={val} className="p-1 border border-black text-center font-bold">
                        {userRating === val ? '[ ✓ ]' : '[   ]'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Printable Statistical Summary Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1">
            PART III: COMPUTED STATISTICAL SUMMARY BENCHMARK
          </h3>
          <table className="w-full text-xs border-collapse border border-black text-center">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="p-1.5 border border-black text-left">ISO/IEC 25010 Category</th>
                <th className="p-1.5 border border-black w-24">Computed Mean (&mu;)</th>
                <th className="p-1.5 border border-black w-24">Std. Dev. (&sigma;)</th>
                <th className="p-1.5 border border-black w-36">Verbal Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.categories).map(([catName, catData]) => (
                <tr key={catName}>
                  <td className="p-1.5 border border-black text-left font-semibold">{catName}</td>
                  <td className="p-1.5 border border-black font-bold">{catData.mean.toFixed(2)}</td>
                  <td className="p-1.5 border border-black">{catData.stdDev.toFixed(2)}</td>
                  <td className="p-1.5 border border-black font-bold">{getVerbalInterpretation(catData.mean).text}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="p-1.5 border border-black text-left uppercase">Overall Acceptability Rating</td>
                <td className="p-1.5 border border-black text-sm">{stats.mean.toFixed(2)}</td>
                <td className="p-1.5 border border-black">{stats.stdDev.toFixed(2)}</td>
                <td className="p-1.5 border border-black uppercase text-sm">{getVerbalInterpretation(stats.mean).text}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Printable Qualitative Feedback */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1">
            PART IV: QUALITATIVE FEEDBACK & OPERATIONAL RECOMMENDATIONS
          </h3>
          <div className="text-xs space-y-2">
            <p><span className="font-bold">1. System Strengths:</span> {strengths || '____________________________________________________________________________________________________'}</p>
            <p><span className="font-bold">2. Areas for Improvement:</span> {improvements || '____________________________________________________________________________________________________'}</p>
            <p><span className="font-bold">3. General Comments:</span> {feedback || '____________________________________________________________________________________________________'}</p>
          </div>
        </div>

        {/* Printable Signature Block */}
        <div className="pt-8 flex justify-between items-end text-xs">
          <div>
            <p className="font-bold">Evaluator Signature: _________________________________</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Traffic Management Center (TMC) Officer / Representative</p>
          </div>
          <div>
            <p className="font-bold">Date: ________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
