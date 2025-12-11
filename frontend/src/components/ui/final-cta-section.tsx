"use client";
import { Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const FinalCTASection = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="bg-gradient-to-br from-cyan-600 to-teal-600 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }} />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-teal-500/20"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex justify-center mb-6">
          <Rocket className="w-12 h-12 text-white animate-bounce" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to transform your marketing?
        </h2>
        <p className="text-lg md:text-xl text-cyan-50 mb-8 max-w-2xl mx-auto">
          Join thousands of marketers who are launching better campaigns faster with Marketing OS.
        </p>
        <button className="group inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-white text-cyan-600 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <span className="relative z-10">Get Started for free</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </button>
      </div>
    </motion.div>
  );
};