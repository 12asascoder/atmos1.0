import React from 'react';
import { Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    id: number;
    type: 'bot' | 'user';
    content: string;
    timestamp: string;
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        message.type === 'bot' 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
          : 'bg-slate-200'
      }`}>
        {message.type === 'bot' ? (
          <Sparkles className="w-4 h-4 text-white" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-slate-400" />
        )}
      </div>
      <div className={`flex-1 ${message.type === 'user' ? 'flex justify-end' : ''}`}>
        <div className={`inline-block max-w-2xl ${
          message.type === 'bot' 
            ? 'bg-slate-50 rounded-2xl rounded-tl-sm' 
            : 'bg-indigo-500 text-white rounded-2xl rounded-tr-sm'
        } px-5 py-3.5`}>
          <p className={`text-sm leading-relaxed ${message.type === 'bot' ? 'text-slate-700' : 'text-white'}`}>
            {message.content}
          </p>
          <span className={`text-xs mt-2 block ${
            message.type === 'bot' ? 'text-slate-400' : 'text-indigo-200'
          }`}>
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;