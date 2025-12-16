// src/pages/AdDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Globe, Award, Play, Users, TrendingUp, ArrowLeft, Download, Share2, Bookmark, ChevronRight } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const AdDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ad, setAd] = useState<any>(null);
  const [exampleAds, setExampleAds] = useState<any[]>([]);
  const [relatedAds, setRelatedAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sample data - in real app, this would come from an API
  const allAds = [
    {
      id: 1,
      title: 'Emotional / Storytelling Ads',
      type: 'PROMOTED',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
      rating: '4.8',
      votes: '234K',
      tags: ['Digital', 'Social'],
      genre: 'Drama',
      description: 'Compelling emotional narratives that connect brands with audiences on a deep level',
      duration: '2h 15m',
      platform: 'Global Campaign',
      budget: '$500K - $2M'
    },
    {
      id: 2,
      title: 'Humorous / Comedy Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
      rating: '4.6',
      votes: '189K',
      tags: ['Video', 'Display'],
      genre: 'Comedy',
      description: 'Light-hearted and funny campaigns that entertain while delivering brand messages',
      duration: '1h 45m',
      platform: 'Social Media',
      budget: '$300K - $1.5M'
    },
    {
      id: 3,
      title: 'Informative / Educational Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop',
      rating: '4.9',
      votes: '312K',
      tags: ['Social', 'Influencer'],
      genre: 'Documentary',
      description: 'Educational content that informs audiences while building brand authority',
      duration: '2h 30m',
      platform: 'YouTube & Educational',
      budget: '$400K - $1.8M'
    },
    {
      id: 4,
      title: 'Lifestyle Ads',
      type: null,
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
      rating: '4.7',
      votes: '267K',
      tags: ['Email', 'Digital'],
      genre: 'Lifestyle',
      description: 'Showcasing products within aspirational lifestyle contexts',
      duration: '1h 30m',
      platform: 'Instagram & Pinterest',
      budget: '$350K - $1.2M'
    }
  ];

  useEffect(() => {
    const fetchAdData = () => {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const foundAd = allAds.find(ad => ad.id.toString() === id);
        if (foundAd) {
          setAd(foundAd);
          
          // Get example ads for this genre
          const examples = getExampleAdsForGenre(foundAd.genre);
          setExampleAds(examples);
          
          // Get related ads (excluding current)
          const related = allAds.filter(item => 
            item.genre === foundAd.genre && item.id !== foundAd.id
          ).slice(0, 3);
          setRelatedAds(related);
        }
        setIsLoading(false);
      }, 500);
    };

    fetchAdData();
  }, [id]);

  const getExampleAdsForGenre = (genre: string) => {
    const exampleAdsMap: Record<string, any[]> = {
      'Drama': [
        {
          id: 101,
          title: 'Nike: Never Stop Dreaming',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
          rating: '4.9',
          votes: '156K',
          engagement: '98%',
          description: 'Emotional storytelling through sports achievements'
        },
        {
          id: 102,
          title: 'Apple: The Underdogs',
          image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
          rating: '4.8',
          votes: '142K',
          engagement: '95%',
          description: 'Heartwarming stories of innovation'
        }
      ],
      'Comedy': [
        {
          id: 201,
          title: 'Old Spice: The Man Your Man',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          rating: '4.8',
          votes: '189K',
          engagement: '96%',
          description: 'Hilarious takes on masculinity'
        },
        {
          id: 202,
          title: 'Doritos: Super Bowl Laughs',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
          rating: '4.7',
          votes: '167K',
          engagement: '94%',
          description: 'Funny snack time scenarios'
        }
      ],
      'Lifestyle': [
        {
          id: 301,
          title: 'Lululemon: Everyday Athlete',
          image: 'https://images.unsplash.com/photo-1594736797933-d010d5c6d5e4?w=400&h=300&fit=crop',
          rating: '4.8',
          votes: '178K',
          engagement: '93%',
          description: 'Activewear for daily life'
        },
        {
          id: 302,
          title: 'Airbnb: Live Anywhere',
          image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop',
          rating: '4.9',
          votes: '195K',
          engagement: '96%',
          description: 'Authentic travel experiences'
        }
      ],
      'Documentary': [
        {
          id: 601,
          title: 'National Geographic: Our Planet',
          image: 'https://images.unsplash.com/photo-1610878180933-123728745d22?w=400&h=300&fit=crop',
          rating: '4.9',
          votes: '245K',
          engagement: '97%',
          description: 'Environmental awareness series'
        },
        {
          id: 602,
          title: 'Google: Year in Search',
          image: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=400&h=300&fit=crop',
          rating: '4.8',
          votes: '198K',
          engagement: '96%',
          description: 'Annual search trends documentary'
        }
      ]
    };

    return exampleAdsMap[genre] || exampleAdsMap['Drama'];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading campaign details...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Campaign Not Found</h1>
            <p className="text-slate-600 mb-8">The campaign you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800">
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white mb-8 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Campaigns
          </button>
          
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Left Column - Main Info */}
            <div className="md:col-span-2">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold text-white mb-4">{ad.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/80">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-bold">{ad.rating}/5</span>
                      <span className="text-white/60">({ad.votes} votes)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-5 h-5" />
                      <span>{ad.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-5 h-5" />
                      <span>{ad.platform}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-5 h-5" />
                      <span className="font-medium text-cyan-300">{ad.genre}</span>
                    </div>
                  </div>
                </div>
                
                {/* Promoted Badge */}
                {ad.type && (
                  <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2">
                    <span className="text-sm font-semibold text-white">{ad.type}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-lg">
                  <Play className="w-5 h-5" />
                  Book This Campaign
                </button>
                <button className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold hover:bg-white/30 transition-all border border-white/30">
                  <Download className="w-5 h-5" />
                  Download Media Kit
                </button>
                <button className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold hover:bg-white/30 transition-all border border-white/30">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                <button className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold hover:bg-white/30 transition-all border border-white/30">
                  <Bookmark className="w-5 h-5" />
                  Save
                </button>
              </div>
              
              {/* Description */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-4">Campaign Description</h3>
                <p className="text-white/90 leading-relaxed">{ad.description}</p>
              </div>
            </div>
            
            {/* Right Column - Quick Info */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Campaign Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Budget Range</p>
                    <p className="text-white font-semibold text-lg">{ad.budget}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Target Duration</p>
                    <p className="text-white font-semibold text-lg">3-6 months</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Best For</p>
                    <p className="text-white font-semibold text-lg">{getBestForGenre(ad.genre)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">ROI Expectation</p>
                    <p className="text-emerald-300 font-semibold text-lg">4.2x - 5.8x</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-amber-300" />
                  <h3 className="text-xl font-bold text-white">Awards</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <span className="text-white/90">Cannes Lions 2024</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <span className="text-white/90">Webby Awards Winner</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <span className="text-white/90">Clio Awards Finalist</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Example Ads Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-cyan-600" />
              <h2 className="text-3xl font-bold text-slate-800">Example {ad.genre} Campaigns</h2>
            </div>
            <button className="text-cyan-600 font-semibold hover:text-cyan-700 flex items-center gap-2">
              View All
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {exampleAds.map((exampleAd) => (
              <div 
                key={exampleAd.id} 
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/ads/${exampleAd.id}`)}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={exampleAd.image}
                    alt={exampleAd.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold">
                      {exampleAd.engagement} engagement
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-bold text-white">{exampleAd.rating}</span>
                    <span className="text-white/80">({exampleAd.votes})</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{exampleAd.title}</h3>
                  <p className="text-slate-600 mb-4">{exampleAd.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-cyan-600">Case Study Available</span>
                    <span className="text-slate-500 text-sm">View Details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 border border-cyan-200">
              <p className="text-cyan-800 text-sm mb-2">Average Impressions</p>
              <p className="text-3xl font-bold text-cyan-900">24.5M</p>
              <p className="text-cyan-700 text-sm mt-2">Per campaign cycle</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
              <p className="text-emerald-800 text-sm mb-2">Engagement Rate</p>
              <p className="text-3xl font-bold text-emerald-900">3.8%</p>
              <p className="text-emerald-700 text-sm mt-2">Above industry average</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <p className="text-purple-800 text-sm mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-900">12.6%</p>
              <p className="text-purple-700 text-sm mt-2">High intent audience</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
              <p className="text-amber-800 text-sm mb-2">ROI Multiplier</p>
              <p className="text-3xl font-bold text-amber-900">4.8x</p>
              <p className="text-amber-700 text-sm mt-2">Average return</p>
            </div>
          </div>
        </div>

        {/* Related Campaigns */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Similar Campaigns</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedAds.map((relatedAd) => (
              <div 
                key={relatedAd.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/ads/${relatedAd.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={relatedAd.image}
                    alt={relatedAd.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <div className="px-2 py-1 rounded-full bg-black/80 backdrop-blur-sm text-white text-xs font-bold">
                      {relatedAd.rating}/5
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">{relatedAd.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-cyan-600 text-sm font-medium">{relatedAd.genre}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 text-sm">{relatedAd.votes} votes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {relatedAd.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">What makes this campaign type effective?</h3>
              <p className="text-slate-600">
                {ad.genre} campaigns are particularly effective because they {getGenreDescription(ad.genre)}. 
                This approach has been proven to increase brand recall by 42% and engagement rates by 65% compared 
                to traditional advertising methods.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">What is the typical timeline?</h3>
              <p className="text-slate-600">
                Most {ad.genre} campaigns run for 3-6 months, with planning taking 2-4 weeks, production taking 
                4-6 weeks, and the campaign run lasting 8-12 weeks. We recommend a minimum 3-month commitment 
                for optimal results.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">What kind of results can I expect?</h3>
              <p className="text-slate-600">
                Based on historical data, {ad.genre} campaigns typically achieve an average ROI of 4.2x, 
                with engagement rates between 3.5-5.2% and conversion rates of 8-15%. Exact results depend 
                on your specific industry and target audience.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Helper functions
const getGenreDescription = (genre: string): string => {
  const descriptions: Record<string, string> = {
    'Drama': 'create deep emotional connections with audiences through compelling storytelling',
    'Comedy': 'use humor to make brands more relatable and memorable',
    'Lifestyle': 'show products in real-life contexts that resonate with target audiences',
    'Documentary': 'build trust and authority through informative, educational content'
  };
  return descriptions[genre] || 'deliver impactful brand messages';
};

const getBestForGenre = (genre: string): string => {
  const bestFor: Record<string, string> = {
    'Drama': 'Brand building & emotional connection',
    'Comedy': 'Viral potential & audience engagement',
    'Lifestyle': 'Product launches & influencer marketing',
    'Documentary': 'B2B & thought leadership'
  };
  return bestFor[genre] || 'Various marketing objectives';
};

export default AdDetailPage;