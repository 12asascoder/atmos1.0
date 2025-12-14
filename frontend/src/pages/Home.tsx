import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import HeroBanner from '../components/HeroBanner';
import AdCarousel from '../components/AdCarousel';
import QuickFilters from '../components/QuickFilters';
import { colors } from '../styles/colors';
import Footer from '@/components/Footer';

const Home: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Subtle Background Effects */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.08), transparent 40%)`
        }}
      />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Quick Filters */}
      <QuickFilters />

      {/* Recommended Campaigns Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 font-stack">Recommended Campaigns</h2>
          <button className="text-sm font-medium text-cyan-600 hover:text-cyan-700 font-mulish flex items-center gap-1">
            See All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <AdCarousel category="recommended" />
      </section>

      {/* Trending Now Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 font-stack">Trending Now</h2>
          <button className="text-sm font-medium text-cyan-600 hover:text-cyan-700 font-mulish flex items-center gap-1">
            See All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <AdCarousel category="trending" />
      </section>

      {/* Top Performers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 font-stack">Top Performers</h2>
          <button className="text-sm font-medium text-cyan-600 hover:text-cyan-700 font-mulish flex items-center gap-1">
            See All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <AdCarousel category="top" />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;