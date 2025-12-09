import React from 'react';

interface Message {
  id: number;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.type === 'bot';
  
  const formatContent = (content: string) => {
    let formatted = content;
    
    // Convert headers
    formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h3>');
    formatted = formatted.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-slate-800 mt-3 mb-2">$1</h4>');
    formatted = formatted.replace(/^##### (.+)$/gm, '<h5 class="text-sm font-semibold text-slate-700 mt-2 mb-1">$1</h5>');
    
    // Convert bold text
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
    
    // Convert bullet points with proper nesting
    formatted = formatted.replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
    formatted = formatted.replace(/^\+ (.+)$/gm, '<li class="ml-8 mb-1 list-disc">$1</li>');
    
    // Wrap consecutive li elements in ul
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, (match) => {
      return `<ul class="list-disc space-y-1 my-2">${match}</ul>`;
    });
    
    // Convert line breaks to paragraphs
    const lines = formatted.split('\n');
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line is already formatted (contains HTML tags)
      if (trimmedLine.match(/^<(h[3-5]|ul|li)/)) {
        if (currentParagraph) {
          paragraphs.push(`<p class="mb-2 text-slate-700 leading-relaxed">${currentParagraph}</p>`);
          currentParagraph = '';
        }
        paragraphs.push(trimmedLine);
      } else if (trimmedLine === '') {
        if (currentParagraph) {
          paragraphs.push(`<p class="mb-2 text-slate-700 leading-relaxed">${currentParagraph}</p>`);
          currentParagraph = '';
        }
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
      }
    }
    
    if (currentParagraph) {
      paragraphs.push(`<p class="mb-2 text-slate-700 leading-relaxed">${currentParagraph}</p>`);
    }
    
    return paragraphs.join('');
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-3xl ${isBot ? 'mr-12' : 'ml-12'}`}>
        <div className={`rounded-2xl px-5 py-4 ${
          isBot 
            ? 'bg-slate-50 text-slate-900 border border-slate-200' 
            : 'bg-indigo-600 text-white'
        }`}>
          {isBot ? (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          ) : (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
        </div>
        <p className={`text-xs text-slate-500 mt-1.5 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;