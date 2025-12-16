import React, { useState } from 'react';
import { Zap, Target, Eye, Sparkles } from 'lucide-react';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import MessageBubble from '../components/MessageBubble';
import QuickAction from '../components/QuickAction';
import ChatInput from '../components/ChatInput';
import { colors } from '../styles/colors';

interface Message {
  id: number;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
}

const CommandCenter: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Welcome to the Command Center. I\'m your intelligent advertising assistant. Tell me about your campaign goals, and I\'ll help you create a comprehensive strategy tailored to your needs.',
      timestamp: '09:24'
    }
  ]);

  const quickActions = [
    { label: 'Launch campaign for new product', icon: Zap },
    { label: 'Analyze audience insights', icon: Target },
    { label: 'Review competitor positioning', icon: Eye },
    { label: 'Generate creative concepts', icon: Sparkles }
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  // This function receives the AI response from ChatInput
  const handleResponseReceived = (response: string) => {
    const botMessage: Message = {
      id: messages.length + 1,
      type: 'bot',
      content: response,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  return (
    <div className={`min-h-screen ${colors.background.gradient}`}>
      <Navigation />
      
      <div className="max-w-7xl mx-auto">
        <Header />
        
        {/* Main Content */}
        <div className="px-6 py-6">
          <div className={`${colors.background.card} rounded-2xl ${colors.neutral.border} border shadow-sm overflow-hidden`} 
               style={{ height: 'calc(100vh - 240px)' }}>
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>

              {/* Quick Actions */}
              <div className={`px-6 py-4 ${colors.neutral.borderLight} border-t ${colors.neutral[50]}/50`}>
                <p className={`text-xs font-medium ${colors.neutral.textLight} mb-3`}>Quick actions:</p>
                <div className="grid grid-cols-4 gap-2">
                  {quickActions.map((action, idx) => (
                    <QuickAction
                      key={idx}
                      label={action.label}
                      icon={action.icon}
                      onClick={() => setMessage(action.label)}
                    />
                  ))}
                </div>
              </div>

              {/* Input */}
              <ChatInput
                value={message}
                onChange={setMessage}
                onSend={handleSend}
                onResponseReceived={handleResponseReceived}  // Add this prop
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;