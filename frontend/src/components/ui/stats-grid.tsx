import { TrendingUp, Zap, Rocket, LineChart } from 'lucide-react';

const stats = [
  { value: "350%", label: "Average ROAS Increase", icon: TrendingUp },
  { value: "85%", label: "Time Saved on Planning", icon: Zap },
  { value: "10x", label: "Faster Campaign Launch", icon: Rocket },
  { value: "40%", label: "Lower Customer Acquisition", icon: LineChart },
];

export const StatsGrid = () => {
  return (
    <div className="bg-gradient-to-r from-white/80 to-cyan-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 mb-16 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center group cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/30">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 font-medium">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};