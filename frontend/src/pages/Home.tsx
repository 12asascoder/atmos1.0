import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import HeroBanner from '../components/HeroBanner';
import AdCarousel from '../components/AdCarousel';
import AdDetailModal from '../components/AdDetailModal';
import QuickFilters from '../components/QuickFilters';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [relatedAds, setRelatedAds] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('recommended');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sample data for all ads
  const allAds = [
    // Sports ads
    {
      id: 101,
      title: 'Nike: Just Do It Campaign',
      type: 'PROMOTED',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
      rating: '4.9',
      votes: '256K',
      tags: ['Athletic', 'Motivational'],
      genre: 'Sports'
    },
    // Food ads
    {
      id: 201,
      title: "McDonald's: I'm Lovin' It",
      type: 'PROMOTED',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=500&fit=crop',
      rating: '4.6',
      votes: '298K',
      tags: ['Fast Food', 'Family'],
      genre: 'Food'
    },
    // Fashion ads
    {
      id: 301,
      title: 'Zara: Fast Fashion Leader',
      type: 'PROMOTED',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop',
      rating: '4.7',
      votes: '289K',
      tags: ['Trendy', 'Affordable'],
      genre: 'Fashion'
    },
    // ... other ads
  ];

  const handleCardClick = (ad: any) => {
    setSelectedAd(ad);
    
    // Get related ads based on genre
    const filtered = allAds
      .filter(item => item.genre === ad.genre && item.id !== ad.id)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 3);
    
    setRelatedAds(filtered);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedAd(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
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

      <HeroBanner />

      {/* Quick Filters with category selection */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h3>
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('sports')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              selectedCategory === 'sports'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏈 Sports
          </button>
          <button
            onClick={() => setSelectedCategory('food')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              selectedCategory === 'food'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍔 Food
          </button>
          <button
            onClick={() => setSelectedCategory('fashion')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              selectedCategory === 'fashion'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👗 Fashion
          </button>
          <button
            onClick={() => setSelectedCategory('recommended')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              selectedCategory === 'recommended'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💫 Recommended
          </button>
        </div>
      </div>

      {/* Dynamic Category Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {selectedCategory === 'sports' && '🏈 Sports Campaigns'}
              {selectedCategory === 'food' && '🍔 Food Campaigns'}
              {selectedCategory === 'fashion' && '👗 Fashion Campaigns'}
              {selectedCategory === 'recommended' && '💫 Recommended Campaigns'}
            </h2>
            <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold">
              See All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <AdCarousel 
            category={selectedCategory as any}
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

      <Footer />
    </div>
  );
};

export default Home;