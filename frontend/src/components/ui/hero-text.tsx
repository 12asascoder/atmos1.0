"use client";
import { Sparkles, Stars } from 'lucide-react';
import { motion } from 'framer-motion';

export const HeroText = () => {
  return (
    <>
      {/* Animated Badge */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500/10 to-teal-600/10 border border-cyan-200/50 rounded-full group hover:bg-cyan-100/50 transition-all duration-300 cursor-pointer backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
          <span className="text-sm font-medium text-cyan-700">Introducing Marketing OS</span>
        </div>
      </motion.div>

      {/* Main Headline */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
          <span className="block">Marketing OS is the</span>
          <span className="relative inline-block mt-4">
            <span className="bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent animate-gradient-x bg-300%">
              new way forward
            </span>
            <Stars className="absolute -top-4 -right-8 w-6 h-6 text-amber-400 animate-bounce hidden lg:block" />
          </span>
        </h1>
        
        {/* Animated Underline */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full animate-pulse" />
        </div>
      </motion.div>

      {/* Subheadline */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="text-center mb-12 max-w-3xl mx-auto px-4"
      >
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
          AI-powered advertising strategy platform that transforms how you build campaigns. 
          <span className="text-cyan-600 font-semibold"> Generate comprehensive strategies </span>
          with audience insights, creative concepts, and channel recommendations in seconds.
        </p>
      </motion.div>
    </>
  );
};