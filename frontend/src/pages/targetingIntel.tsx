import React from 'react';
import TargetingIntel from '../components/Targetingintel';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TargetingIntelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Targeting Intelligence</h1>
              <p className="text-gray-600">Advanced audience insights and targeting strategies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <TargetingIntel />
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500 pb-8">
        <p>Data last updated: {new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p className="mt-2">AI-powered insights update every 24 hours</p>
      </div>
    </div>
  );
};

export default TargetingIntelPage;