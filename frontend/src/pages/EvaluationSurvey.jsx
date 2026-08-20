import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Star, 
  Award, 
  FileText, 
  Printer, 
  RotateCcw, 
  Send, 
  ShieldCheck, 
  BarChart3, 
  HelpCircle,
  UserCheck,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

const SURVEY_ITEMS = [
  {
    id: 'F1',
    category: 'Functionality',
    statement: 'The system accurately detects vehicles (car, truck, bus, motorcycle) in yellow box zones.',
    paperBenchmark: 4.80,
    paperStdDev: 0.42
  },
  {
    id: 'F2',
    category: 'Functionality',
    statement: 'The StopTimer engine correctly measures stationary vehicle duration.',
    paperBenchmark: 4.70,
    paperStdDev: 0.48
  },
  {
    id: 'F3',
    category: 'Functionality',
    statement: 'Automated evidence snapshots contain clear, usable NCAP metadata.',
    paperBenchmark: 4.90,
    paperStdDev: 0.32
  },
  {
    id: 'U1',
    category: 'Usability',
    statement: 'The React web dashboard is intuitive and visually well-structured.',
    paperBenchmark: 4.85,
    paperStdDev: 0.37
  },
  {
    id: 'U2',
    category: 'Usability',
    statement: 'Live visual overlays (yellow box grid, timers) provide clear situational awareness.',
    paperBenchmark: 4.90,
    paperStdDev: 0.32
  },
  {
    id: 'U3',
    category: 'Usability',
    statement: 'Real-time alert notifications respond promptly upon violation detection.',
    paperBenchmark: 4.75,
    paperStdDev: 0.43
  },
  {
    id: 'R1',
    category: 'Reliability',
    statement: 'The system maintains consistent performance during heavy traffic flow.',
    paperBenchmark: 4.65,
    paperStdDev: 0.50
  },
  {
    id: 'R2',
    category: 'Reliability',
    statement: 'The web interface streaming remains stable without crashes or video freeze.',
    paperBenchmark: 4.70,
    paperStdDev: 0.48
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
  const [responses, setResponses] = useState({
    F1: 5, F2: 5, F3: 5,
    U1: 5, U2: 5, U3: 5,
    R1: 4, R2: 5
  });
  const [feedback, setFeedback] = useState('');
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
    ['Functionality', 'Usability', 'Reliability'].forEach((cat) => {
      const catItems = SURVEY_ITEMS.filter((i) => i.category === cat);
      const catScores = catItems.map((i) => responses[i.id] || 0);
      const catMean = catScores.reduce((a, b) => a + b, 0) / catScores.length;
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
    toast.success('System evaluation questionnaire submitted successfully!');
    localStorage.setItem('tmc_last_evaluation', JSON.stringify({
      evaluatorName,
      role,
      experience,
      responses,
      stats,
      feedback,
      date: new Date().toISOString()
    }));
  };

  const handleReset = () => {
    setResponses({
      F1: 5, F2: 5, F3: 5,
      U1: 5, U2: 5, U3: 5,
      R1: 4, R2: 5
    });
    setFeedback('');
    setSubmitted(false);
    toast.success('Form reset to default baseline ratings.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <ClipboardCheck className="w-4 h-4" />
              TMC Officer Evaluation Instrument (Table 4-4)
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Usability & System Evaluation Survey
            </h1>
            <p className="text-muted text-sm max-w-2xl">
              Official evaluation questionnaire for Traffic Management Center (TMC) personnel to evaluate Functionality, Usability, and Reliability metrics ($N=10$) for the AI-Powered Yellow Box Zone Monitoring System.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-white/10 text-white font-semibold text-sm transition-all duration-200 border border-white/10"
            >
              <Printer className="w-4 h-4 text-accent" />
              Print Form
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-white/10 text-muted hover:text-white font-semibold text-sm transition-all duration-200 border border-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Live Benchmark Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-white/10 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted tracking-wider">Overall Acceptability</span>
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{stats.mean.toFixed(2)}</span>
            <span className="text-sm text-muted">/ 5.00</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${getVerbalInterpretation(stats.mean).color}`}>
              {getVerbalInterpretation(stats.mean).text}
            </span>
            <span className="text-[11px] text-muted font-medium">Std Dev: σ = {stats.stdDev.toFixed(2)}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted tracking-wider">Functionality Mean</span>
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.categories['Functionality']?.mean.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">(Paper: 4.80)</span>
          </div>
          <p className="mt-2 text-xs text-muted">Vehicle Detection, StopTimer & NCAP</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted tracking-wider">Usability Mean</span>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.categories['Usability']?.mean.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">(Paper: 4.83)</span>
          </div>
          <p className="mt-2 text-xs text-muted">React Dashboard, Overlays & Alerts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted tracking-wider">Reliability Mean</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.categories['Reliability']?.mean.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">(Paper: 4.68)</span>
          </div>
          <p className="mt-2 text-xs text-muted">Heavy Traffic & Stream Stability</p>
        </motion.div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Evaluator Profile Section */}
        <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Part I: Evaluator Profile</h2>
              <p className="text-xs text-muted">Demographic context for research sample validation ($N=10$)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <option value="Traffic Management Officer">Traffic Management Officer / Enforcer</option>
                <option value="Camera System Operator">Surveillance & Camera System Operator</option>
                <option value="TMC Supervisor / IT Staff">TMC Supervisor / IT Staff</option>
                <option value="Research Evaluator">Research Evaluator / Guest Tester</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Enforcement Experience
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors text-sm"
              >
                <option value="Less than 1 Year">Less than 1 Year</option>
                <option value="1 – 3 Years">1 – 3 Years</option>
                <option value="4 – 6 Years">4 – 6 Years</option>
                <option value="More than 6 Years">More than 6 Years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Survey Items Matrix Section */}
        <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 text-accent">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Part II: Assessment Indicators (Table 4-4 Matrix)</h2>
                <p className="text-xs text-muted">5-Point Likert Scale (1 = Strongly Disagree to 5 = Strongly Agree)</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-muted font-medium">
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">1: SD</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">2: D</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">3: N</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">4: A</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">5: SA</span>
            </div>
          </div>

          {['Functionality', 'Usability', 'Reliability'].map((category) => (
            <div key={category} className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {category} Evaluation Metrics
              </h3>

              <div className="space-y-3">
                {SURVEY_ITEMS.filter((item) => item.category === category).map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-black/30 border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-mono font-bold text-xs">
                          {item.id}
                        </span>
                        <p className="text-sm font-medium text-white/90">{item.statement}</p>
                      </div>
                      <p className="text-[11px] text-muted italic">
                        Research Paper Target Benchmark Score: <span className="text-white font-semibold">{item.paperBenchmark.toFixed(2)}</span> (σ = {item.paperStdDev.toFixed(2)})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      {LIKERT_OPTIONS.map((opt) => {
                        const isSelected = responses[item.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleRatingChange(item.id, opt.value)}
                            className={`w-11 h-11 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center border ${
                              isSelected
                                ? 'bg-primary text-black border-primary shadow-lg shadow-primary/30 scale-105'
                                : `bg-black/40 text-muted border-white/10 ${opt.color}`
                            }`}
                            title={opt.fullName}
                          >
                            <span>{opt.value}</span>
                            <span className="text-[9px] opacity-75 font-normal">{opt.label}</span>
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
        <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Part III: Operational Feedback & Recommendations</h2>
              <p className="text-xs text-muted">Qualitative insights for future system expansion & NCAP deployment</p>
            </div>
          </div>

          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience, observed strengths, or suggestions for improving yellow box camera detection and dashboard overlays..."
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-muted/50 focus:outline-none focus:border-primary transition-colors text-sm resize-none"
          />
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-black font-extrabold text-sm transition-all shadow-lg shadow-primary/25"
            >
              <Send className="w-4 h-4" />
              {submitted ? 'Update Questionnaire' : 'Submit Evaluation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
