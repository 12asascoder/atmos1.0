import React from 'react';

interface AdCardProps {
  ad: {
    id: number;
    title: string;
    type: string | null;
    image: string;
    rating: string;
    votes: string;
    tags: string[];
    genre?: string; // Add genre property
  };
  onClick: () => void; // Add onClick handler
}

const AdCard: React.FC<AdCardProps> = ({ ad, onClick }) => {
  return (
    <div 
      className="relative w-64 flex-shrink-0 cursor-pointer transform transition-transform hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl">
        {/* Promoted Badge */}
        {ad.type && (
          <div className="absolute top-2 left-2 z-20">
            <div className="rounded-full bg-purple-600 px-3 py-1">
              <span className="text-xs font-semibold text-white">
                {ad.type}
              </span>
            </div>
          </div>
        )}
        
        {/* Image Container */}
        <div className="relative h-80 overflow-hidden">
          <img
            src={ad.image}
            alt={ad.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-24 right-3 z-20 flex items-center gap-1 rounded-full bg-black/80 px-3 py-1.5 backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">{ad.rating}/5</span>
          <span className="ml-1 text-xs text-gray-300">({ad.votes})</span>
        </div>
      </div>

      {/* Card Info */}
      <div className="mt-3 px-1">
        <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-gray-900">
          {ad.title}
        </h3>
        <div className="flex flex-wrap gap-1">
          {ad.tags.map((tag, idx) => (
            <span
              key={idx}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdCard;