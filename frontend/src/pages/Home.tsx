import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import HeroBanner from '../components/HeroBanner';
import AdCarousel from '../components/AdCarousel';
import AdDetailModal from '../components/AdDetailModal'; // Add this import
import QuickFilters from '../components/QuickFilters';
import { colors } from '../styles/colors';
import Footer from '@/components/Footer';

const Home: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedAd, setSelectedAd] = useState<any>(null); // Track selected ad
  const [relatedAds, setRelatedAds] = useState<any[]>([]); // Related ads based on genre

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sample data for related ads based on genre
  const allAds = [
    {
      id: 1,
      title: 'Emotional / Storytelling Ads',
      type: 'PROMOTED',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=500&fit=crop',
      rating: '4.8',
      votes: '234K',
      tags: ['Digital', 'Social'],
      genre: 'Drama'
    },
    {
      id: 2,
      title: 'Humorous / Comedy Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=500&fit=crop',
      rating: '4.6',
      votes: '189K',
      tags: ['Video', 'Display'],
      genre: 'Comedy'
    },
    {
      id: 3,
      title: 'Informative / Educational Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=500&fit=crop',
      rating: '4.9',
      votes: '312K',
      tags: ['Social', 'Influencer'],
      genre: 'Documentary'
    },
    {
      id: 4,
      title: 'Lifestyle Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=500&fit=crop',
      rating: '4.7',
      votes: '267K',
      tags: ['Email', 'Digital'],
      genre: 'Lifestyle'
    },
    {
      id: 5,
      title: 'Aspirational / Luxury Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=500&fit=crop',
      rating: '4.5',
      votes: '198K',
      tags: ['Social', 'Video'],
      genre: 'Luxury'
    },
    {
      id: 6,
      title: 'User-Generated Content (UGC) Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=500&fit=crop',
      rating: '4.8',
      votes: '289K',
      tags: ['Display', 'Retargeting'],
      genre: 'UGC'
    }
  ];

  const handleCardClick = (ad: any) => {
  setSelectedAd(ad);
  
  // Get example ads for this genre (these would come from your backend/API)
  // For now, we'll filter from allAds and take top 3 by rating
  const filtered = allAds
    .filter(item => item.genre === ad.genre && item.id !== ad.id)
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 3);
  
  setRelatedAds(filtered);
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
};

  const handleCloseModal = () => {
    setSelectedAd(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Navigation */}
      <Navigation />
      
      {/* Subtle Background Effects */}
      <div className="pointer-events-none fixed inset-0">
        <div 
          className="absolute h-72 w-72 rounded-full bg-gradient-to-r from-purple-200/30 to-pink-200/30 blur-3xl"
          style={{
            left: `${mousePosition.x / window.innerWidth * 100}%`,
            top: `${mousePosition.y / window.innerHeight * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Hero Banner */}
      <HeroBanner />

      {/* Quick Filters */}
      <QuickFilters />

      {/* Recommended Campaigns Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Recommended Campaigns
            </h2>
            <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold">
              See All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <AdCarousel 
            category="recommended" 
            onCardClick={handleCardClick}
          />
        </div>
      </section>

      {/* Trending Now Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Trending Now
            </h2>
            <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold">
              See All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <AdCarousel 
            category="trending" 
            onCardClick={handleCardClick}
          />
        </div>
      </section>

      {/* Top Performers Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Top Performers
            </h2>
            <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold">
              See All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <AdCarousel 
            category="top" 
            onCardClick={handleCardClick}
          />
        </div>
      </section>

      {/* Ad Detail Modal */}
      {selectedAd && (
        <AdDetailModal
          ad={selectedAd}
          onClose={handleCloseModal}
          relatedAds={relatedAds}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;