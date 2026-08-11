import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Database, Activity, ArrowRight, Camera } from 'lucide-react';

const features = [
  { icon: Shield, title: 'AI-Powered Detection', desc: 'Real-time vehicle identification using YOLOv8 computer vision.' },
  { icon: Eye, title: 'Zone Monitoring', desc: 'Automated monitoring of yellow box intersections for parking violations.' },
  { icon: Database, title: 'Evidence Capture', desc: 'Every violation is captured with a timestamp and saved image.' },
  { icon: Activity, title: 'Live Analytics', desc: 'Charts and reports for reviewing violation trends over time.' }
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] bg-background relative overflow-hidden flex flex-col items-center justify-center px-8 py-20">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl text-center space-y-8 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur mb-6">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">TMC Malaybalay City • AI Operations</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
          Traffic <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-yellow-400">Enforcement</span><br />
          Powered by AI
        </h1>

        <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          The AI-Based Yellow Box Zone Monitoring System is built for the Traffic Management Center (TMC)
          of Malaybalay City to detect, record, and reduce intersection gridlock automatically.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-10 py-5 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-slate-950 rounded-[2rem] font-black text-lg transition-all shadow-xl shadow-primary/25 flex items-center gap-3 group"
          >
            Launch Command Center
            <ArrowRight className="group-hover:translate-x-1 transition-transform stroke-[3]" />
          </button>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mt-32 relative z-10">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="glass p-8 rounded-[2rem] hover:border-white/20 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <f.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3">{f.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
