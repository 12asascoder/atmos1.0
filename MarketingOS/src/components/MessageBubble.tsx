import React from 'react';
import { Sparkles } from 'lucide-react';
import { colors } from '../styles/colors';

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
          ? `bg-gradient-to-br ${colors.primary.gradient}` 
          : colors.neutral[200]
      }`}>
        {message.type === 'bot' ? (
          <Sparkles className="w-4 h-4 text-white" />
        ) : (
          <div className={`w-5 h-5 rounded-full ${colors.neutral[400]}`} />
        )}
      </div>
      <div className={`flex-1 ${message.type === 'user' ? 'flex justify-end' : ''}`}>
        <div className={`inline-block max-w-2xl ${
          message.type === 'bot' 
            ? `${colors.neutral[50]} rounded-2xl rounded-tl-sm` 
            : `${colors.primary[600]} text-white rounded-2xl rounded-tr-sm`
        } px-5 py-3.5`}>
          <p className={`text-sm leading-relaxed ${message.type === 'bot' ? colors.neutral.text : 'text-white'}`}>
            {message.content}
          </p>
          <span className={`text-xs mt-2 block ${
            message.type === 'bot' ? colors.neutral.textLight : 'text-cyan-100'
          }`}>
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
