import React, { useState, useEffect } from 'react';
import Navbar from './navbar';
import { CTASection } from '../components/ui/cta-section';
import { DashboardPreview } from '../components/ui/dashboard-preview';
import { FeaturesSection } from '../components/ui/features-section';
import { BenefitsSection } from '../components/ui/benefits-section';
import { FinalCTASection } from '../components/ui/final-cta-section';
import { HeroHighlight, Highlight } from '../components/ui/hero-highlight';
import { motion } from 'framer-motion';

const MarketingOSLanding = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/20 relative overflow-hidden">
      {/* Animated Background */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`
        }}
      />

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-300/20 to-teal-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/10 to-cyan-200/10 rounded-full blur-3xl" />
      </div>

      {/* Animated Grid Pattern */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          animation: 'gridMove 20s linear infinite'
        }} 
      />

      {/* Navbar */}
      <Navbar />

      {/* Hero Section with Hero Highlight */}
      <section className="relative z-10 w-full pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Highlight Container */}
          <HeroHighlight
            containerClassName="rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden min-h-[500px]"
            className="p-8 sm:p-12 md:p-16 lg:p-20"
          >
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              {/* Animated Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-teal-600/10 border border-cyan-200 rounded-full mb-8 group hover:bg-cyan-100/50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-cyan-700">🚀 Introducing Marketing OS 2.0</span>
              </motion.div>

              {/* Main Headline with Highlight Animation */}
              <motion.h1
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: [20, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 max-w-4xl leading-tight tracking-tight mb-6"
              >
                Marketing OS is the{" "}
                <Highlight className="text-white">
                  new way forward
                </Highlight>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mb-10"
              >
                AI-powered advertising strategy platform that transforms how you build campaigns.{" "}
                <span className="font-semibold text-cyan-600">
                  Generate comprehensive strategies
                </span>{" "}
                with audience insights, creative concepts, and channel recommendations in seconds.
              </motion.p>

              {/* CTA Buttons - Centered */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10"
              >
                <CTASection />
              </motion.div>
            </div>
          </HeroHighlight>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-r from-white/90 to-cyan-50/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 lg:p-8 shadow-lg shadow-cyan-500/10">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Trusted by forward-thinking marketing teams
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center group cursor-pointer"
            >
              <div className="text-4xl md:text-5xl font-bold text-cyan-600 mb-2 group-hover:scale-105 transition-transform duration-300">
                350%
              </div>
              <div className="text-sm md:text-base text-slate-600 font-medium">
                Average ROAS Increase
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center group cursor-pointer"
            >
              <div className="text-4xl md:text-5xl font-bold text-cyan-600 mb-2 group-hover:scale-105 transition-transform duration-300">
                85%
              </div>
              <div className="text-sm md:text-base text-slate-600 font-medium">
                Time Saved on Planning
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center group cursor-pointer"
            >
              <div className="text-4xl md:text-5xl font-bold text-cyan-600 mb-2 group-hover:scale-105 transition-transform duration-300">
                10x
              </div>
              <div className="text-sm md:text-base text-slate-600 font-medium">
                Faster Campaign Launch
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center group cursor-pointer"
            >
              <div className="text-4xl md:text-5xl font-bold text-cyan-600 mb-2 group-hover:scale-105 transition-transform duration-300">
                40%
              </div>
              <div className="text-sm md:text-base text-slate-600 font-medium">
                Lower Customer Acquisition
              </div>
            </motion.div>
          </div>
          
          {/* Trust Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-8 pt-6 border-t border-slate-200/50"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Trusted by 2,500+ teams</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <span>99.8% uptime</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>4.9/5 customer rating</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <DashboardPreview />
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FeaturesSection />
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 bg-gradient-to-br from-slate-50 to-cyan-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BenefitsSection />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FinalCTASection />
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 py-8 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 text-sm">
          © 2024 Marketing OS. All rights reserved.
        </div>
      </footer>

      {/* CSS animations inline */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes gridMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 60px 60px;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MarketingOSLanding;