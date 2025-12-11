"use client";
import { Sparkles, Target, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Strategy",
    description: "Generate comprehensive campaign strategies in seconds with our intelligent assistant"
  },
  {
    icon: Target,
    title: "Audience Intelligence",
    description: "Deep insights into your target audience with psychographic and demographic analysis"
  },
  {
    icon: Zap,
    title: "Instant Creative Concepts",
    description: "Get multiple creative concepts with hooks, scripts, and CTAs ready to deploy"
  },
  {
    icon: TrendingUp,
    title: "Performance Optimization",
    description: "Real-time recommendations to maximize ROAS and minimize customer acquisition costs"
  }
];

export const FeaturesSection = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <>
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium mb-4">
          Core Capabilities
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          Everything you need to launch faster
        </h2>
        <p className="text-xl text-slate-600">
          Powered by advanced AI and years of marketing expertise
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="group p-6 rounded-2xl border border-slate-200 bg-white hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className={`
              w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 
              transition-transform duration-300
              ${hoveredCard === idx ? 'scale-110 rotate-12' : 'group-hover:scale-110'}
            `}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">
              {feature.title}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </>
  );
};