import React, { useState } from 'react';
import { Users, TrendingUp, MapPin, Briefcase, Heart, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const AudienceStep: React.FC = () => {
  const [selectedDemographics, setSelectedDemographics] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState([25, 45]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['United States']);

  const demographics = [
    { id: 'male', label: 'Male', percentage: '45%' },
    { id: 'female', label: 'Female', percentage: '55%' },
    { id: 'all', label: 'All Genders', percentage: '100%' }
  ];

  const interests = [
    { id: 'fitness', label: 'Fitness & Wellness', icon: Heart, color: 'from-rose-400 to-pink-600' },
    { id: 'sports', label: 'Sports Enthusiasts', icon: TrendingUp, color: 'from-blue-400 to-indigo-600' },
    { id: 'fashion', label: 'Fashion & Lifestyle', icon: Briefcase, color: 'from-purple-400 to-violet-600' },
    { id: 'running', label: 'Running Community', icon: Users, color: 'from-emerald-400 to-teal-600' }
  ];

  const topLocations = [
    { name: 'United States', users: '45M', growth: '+12%' },
    { name: 'United Kingdom', users: '8M', growth: '+8%' },
    { name: 'Canada', users: '6M', growth: '+15%' },
    { name: 'Australia', users: '4M', growth: '+10%' }
  ];

  const toggleDemographic = (id: string) => {
    setSelectedDemographics(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Audience Targeting</h2>
        <p className="text-slate-600">Define your target audience and demographics for optimal campaign performance</p>
      </div>

      {/* Demographics Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-600" />
          Demographics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {demographics.map((demo) => (
            <motion.button
              key={demo.id}
              onClick={() => toggleDemographic(demo.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedDemographics.includes(demo.id)
                  ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{demo.label}</span>
                <span className="text-sm text-cyan-600 font-medium">{demo.percentage}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Age Range */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Age Range: {ageRange[0]} - {ageRange[1]} years
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="18"
              max="65"
              value={ageRange[0]}
              onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <input
              type="range"
              min="18"
              max="65"
              value={ageRange[1]}
              onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>
        </div>
      </div>

      {/* Interests Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-cyan-600" />
          Interests & Behaviors
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interests.map((interest) => {
            const Icon = interest.icon;
            const isSelected = selectedInterests.includes(interest.id);
            
            return (
              <motion.button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${interest.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 mb-1">{interest.label}</h4>
                    <p className="text-sm text-slate-500">High engagement audience</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Locations Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-cyan-600" />
          Geographic Targeting
        </h3>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search countries, cities, or regions..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-3">
          {topLocations.map((location) => (
            <div
              key={location.name}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-cyan-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{location.name}</h4>
                  <p className="text-sm text-slate-500">{location.users} potential reach</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-emerald-600 text-sm font-medium">{location.growth}</span>
                <p className="text-xs text-slate-500">growth</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">AI Audience Insights</h4>
            <p className="text-slate-700 mb-3">
              Based on your selections, we've identified an audience of <strong className="text-cyan-700">23.4M users</strong> with high purchase intent. 
              This audience has shown <strong className="text-cyan-700">2.3x higher engagement</strong> with similar campaigns.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border border-cyan-200">
                Avg. Age: 32
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border border-cyan-200">
                Peak Activity: 6-9 PM
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border border-cyan-200">
                Device: 78% Mobile
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AudienceStep;