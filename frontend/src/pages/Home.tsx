import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Target, TrendingUp, ArrowRight, Check } from 'lucide-react';

const MarketingOSLanding = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  const benefits = [
    "Launch campaigns 10x faster",
    "Data-driven audience targeting",
    "Multi-channel strategy generation",
    "Compliance & policy checking",
    "Creative concept generation",
    "Competitor positioning analysis"
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div 
        className="fixed inset-0 opacity-50 pointer-events-none"
        style={{
          background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.1), transparent 40%)`
        }}
      />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Marketing OS</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-600 hover:text-cyan-600 font-medium transition-colors">
              Log in
            </button>
            <button className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full mb-8 group hover:bg-cyan-100 transition-colors cursor-pointer">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-700">Introducing Marketing OS</span>
            <ArrowRight className="w-4 h-4 text-cyan-600 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Marketing OS is the new way
            <br />
            <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              to build campaigns.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            AI-powered advertising strategy platform. Generate comprehensive campaigns with audience insights, creative concepts, and channel recommendations in seconds.
          </p>

          {/* CTA Button */}
          <button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all hover:scale-105">
            Get Started for free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Floating Dashboard Preview */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative rounded-2xl border-2 border-slate-200 shadow-2xl overflow-hidden bg-white hover:shadow-cyan-500/20 transition-shadow">
            {/* Mock Chat Interface */}
            <div className="bg-gradient-to-br from-slate-50 to-cyan-50 p-8">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-4 max-w-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-700 leading-relaxed">
                      Welcome to Marketing OS. I'm your intelligent advertising assistant. Tell me about your campaign goals, and I'll help you create a comprehensive strategy.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                <div className="bg-cyan-600 text-white rounded-xl px-5 py-3 max-w-md shadow-lg">
                  <p className="text-sm">Launch a campaign for a new tech product targeting millennials</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2">Campaign Strategy Generated</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>✓ Target audience: Tech-savvy millennials, 25-40 years old</p>
                      <p>✓ Budget allocation: Meta 40% | Google 30% | TikTok 30%</p>
                      <p>✓ Creative concepts: 5 unique angles generated</p>
                      <p>✓ Expected ROAS: 350-400%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Everything you need to launch faster
          </h2>
          <p className="text-xl text-slate-600">
            Powered by advanced AI and years of marketing expertise
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="group p-6 rounded-2xl border border-slate-200 bg-white hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 bg-gradient-to-br from-slate-50 to-cyan-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Built for modern marketing teams
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Stop spending hours on campaign planning. Marketing OS helps you launch data-driven campaigns in minutes, not days.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl">
                    <span className="font-medium text-slate-700">Campaign ROI</span>
                    <span className="text-2xl font-bold text-cyan-600">+350%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl">
                    <span className="font-medium text-slate-700">Time Saved</span>
                    <span className="text-2xl font-bold text-cyan-600">85%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl">
                    <span className="font-medium text-slate-700">CAC Reduction</span>
                    <span className="text-2xl font-bold text-cyan-600">-40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-cyan-600 to-teal-600 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }} />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to transform your marketing?
            </h2>
            <p className="text-xl text-cyan-50 mb-8 max-w-2xl mx-auto">
              Join thousands of marketers who are launching better campaigns faster with Marketing OS.
            </p>
            <button className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-cyan-600 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all hover:scale-105">
              Get Started for free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600 text-sm">
          © 2024 Marketing OS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MarketingOSLanding;