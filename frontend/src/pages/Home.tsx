import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import AdCarousel from '../components/AdCarousel';
import AdDetailModal from '../components/AdDetailModal';
import QuickFilters from '../components/QuickFilters';
import Footer from '../components/Footer';

/* ✅ ADDED: AnimatedTileGrid import */
import AnimatedTileGrid from '../components/AnimatedTileGrid';

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

  const handleCardClick = (ad: any) => {
    setSelectedAd(ad);

    const allAds = [
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
      {
        id: 301,
        title: 'Zara: Fast Fashion Leader',
        type: 'PROMOTED',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop',
        rating: '4.7',
        votes: '289K',
        tags: ['Trendy', 'Affordable'],
        genre: 'Fashion'
      }
    ];

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
    <div className="min-h-screen bg-black">

      <Navigation />

      {/* ✅ ADDED: Animated Tile Grid Section */}
      <AnimatedTileGrid />

      {/* Background Effects */}
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

      

      {/* Category Section */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-200 mb-6">
          Browse by Category
        </h3>

        <div className="flex flex-wrap gap-4 mb-8">
          {['sports', 'food', 'fashion', 'recommended'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {category === 'sports' && '🏈 Sports'}
              {category === 'food' && '🍔 Food'}
              {category === 'fashion' && '👗 Fashion'}
              {category === 'recommended' && '💫 Recommended'}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <AdCarousel
          category={selectedCategory as any}
          onCardClick={handleCardClick}
        />
      </section>

      {/* Modal */}
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