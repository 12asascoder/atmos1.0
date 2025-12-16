// src/components/AdCarousel.tsx
import React, { useRef } from 'react';
import AdCard from './AdCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdCarouselProps {
  category: 'recommended' | 'trending' | 'top';
}

const AdCarousel: React.FC<AdCarouselProps> = ({ category }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const ads = [
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 -ml-6"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex space-x-6 overflow-x-auto scrollbar-hide px-4 py-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 -mr-6"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>
    </div>
  );
};

export default AdCarousel;