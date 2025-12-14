import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const banners = [
    {
      id: 1,
      title: 'Launch Your Next Campaign',
      subtitle: 'AI-Powered Strategy Builder',
      gradient: 'from-purple-600 via-pink-600 to-red-600',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop'
    },
    {
      id: 2,
      title: 'Performance Analytics',
      subtitle: 'Track ROI in Real-Time',
      gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop'
    },
    {
      id: 3,
      title: 'Creative Studio',
      subtitle: 'Design Stunning Ad Creatives',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <div className="relative h-[280px] sm:h-[320px] md:h-[380px] rounded-2xl overflow-hidden group">
        {/* Slides */}
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} opacity-90`} />
            <img 
              src={banner.image} 
              alt={banner.title}
              className="w-full h-full object-cover mix-blend-overlay"
            />
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center px-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 font-stack">{banner.title}</h1>
                <p className="text-base sm:text-lg md:text-xl font-mulish">{banner.subtitle}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
        >
          <ChevronRight className="w-5 h-5 text-slate-800" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
