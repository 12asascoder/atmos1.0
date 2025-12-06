import React from 'react';
import { Send } from 'lucide-react';
import { colors, getInputClasses, getButtonClasses } from '../styles/colors';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  value, 
  onChange, 
  onSend, 
  placeholder = 'Describe your campaign goals...' 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`p-6 ${colors.neutral.border} border-t`}>
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={`flex-1 px-5 py-3.5 rounded-xl border ${getInputClasses()} outline-none transition-all text-sm placeholder:${colors.neutral.textLight}`}
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className={`px-6 py-3.5 rounded-xl ${getButtonClasses('primary')} disabled:${colors.neutral[200]} disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md`}
        >
          <Send className="w-4 h-4" />
          <span className="text-sm">Send</span>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;