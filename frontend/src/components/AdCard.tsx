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
  };
}

const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  return (
    <div className="flex-shrink-0 w-[240px] cursor-pointer group">
      <div className="relative rounded-xl overflow-hidden mb-3">
        {/* Promoted Badge */}
        {ad.type && (
          <div className="absolute top-3 left-0 z-10">
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-r-md font-mulish">
              {ad.type}
            </div>
          </div>
        )}
        
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md">
          <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-white text-xs font-semibold font-mulish">{ad.rating}/5</span>
          <span className="text-white/70 text-xs font-mulish">{ad.votes}</span>
        </div>
      </div>

      {/* Card Info */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2 font-stack group-hover:text-cyan-600 transition-colors">
          {ad.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {ad.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-mulish"
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