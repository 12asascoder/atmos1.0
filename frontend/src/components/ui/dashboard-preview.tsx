"use client";
import { Sparkles, Rocket, Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardPreview = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative rounded-3xl border-2 border-slate-200/80 shadow-2xl overflow-hidden bg-gradient-to-br from-slate-50/90 to-cyan-50/90 backdrop-blur-sm hover:shadow-cyan-500/20 transition-all duration-500 group"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
      
      {/* Floating Elements */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-slate-700 border border-slate-200">
        <Sparkles className="w-4 h-4 text-cyan-600" />
        AI Command Centre
      </div>
      
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-emerald-500/10 backdrop-blur-sm rounded-full text-sm font-medium text-emerald-700 border border-emerald-200">
        LIVE
      </div>

      <div className="p-8 pt-16">
        {/* Chat Interface */}
        <div className="max-w-4xl mx-auto">
          {/* AI Message */}
          <div className="flex items-start gap-4 mb-6 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30 animate-pulse">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                <div className="text-sm font-medium text-cyan-600">Marketing OS AI</div>
              </div>
              <p className="text-slate-700 leading-relaxed">
                I've analyzed your campaign goals and market data. Ready to deploy a comprehensive strategy with <span className="font-semibold text-cyan-600">5x higher engagement</span> than industry benchmarks?
              </p>
            </div>
          </div>

          {/* User Message */}
          <div className="flex justify-end mb-6 animate-fade-in delay-150">
            <div className="max-w-lg">
              <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-2xl px-6 py-4 shadow-lg shadow-cyan-500/30 group-hover:shadow-xl group-hover:shadow-cyan-500/40 transition-shadow">
                <p className="text-sm">
                  "Launch a campaign for a new tech product targeting millennials with sustainable values"
                </p>
              </div>
            </div>
          </div>

          {/* Strategy Generated Card */}
          <div className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl p-6 border border-cyan-100 shadow-xl animate-fade-in delay-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg text-slate-900">Campaign Strategy Generated</h4>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    Ready to Launch
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-slate-700">Target Audience:</span>
                    </div>
                    <p className="text-sm text-slate-600 pl-4">Tech-savvy millennials, 25-40 years old</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-slate-700">Budget Allocation:</span>
                    </div>
                    <p className="text-sm text-slate-600 pl-4">Meta 40% | TikTok 30% | Instagram 20%</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-slate-700">Creative Concepts:</span>
                    </div>
                    <p className="text-sm text-slate-600 pl-4">5 unique angles generated with scripts</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-slate-700">Expected ROAS:</span>
                    </div>
                    <p className="text-sm text-slate-600 pl-4">350-400% with projected growth</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-md flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Strategy generated in 4.2 seconds</span>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
                    Deploy Campaign
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};