import React from 'react';
import { Send } from 'lucide-react';

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
    <div className="p-6 border-t border-slate-200">
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm placeholder:text-slate-400"
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm">Send</span>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;