"use client";
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  "Launch campaigns 10x faster",
  "Data-driven audience targeting",
  "Multi-channel strategy generation",
  "Compliance & policy checking",
  "Creative concept generation",
  "Competitor positioning analysis"
];

export const BenefitsSection = () => {
  return (
    <div className="grid md:grid-cols-2 gap-16 items-center">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-bold text-slate-900 mb-6">
          Built for modern marketing teams
        </h2>
        <p className="text-lg text-slate-600 mb-8">
          Stop spending hours on campaign planning. Marketing OS helps you launch data-driven campaigns in minutes, not days.
        </p>
        <div className="space-y-3">
          {benefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 group"
            >
              <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-700 group-hover:text-cyan-600 transition-colors">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="relative"
      >
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
              <span className="font-medium text-slate-700">Campaign ROI</span>
              <span className="text-2xl font-bold text-cyan-600">+350%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
              <span className="font-medium text-slate-700">Time Saved</span>
              <span className="text-2xl font-bold text-cyan-600">85%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
              <span className="font-medium text-slate-700">CAC Reduction</span>
              <span className="text-2xl font-bold text-cyan-600">-40%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};