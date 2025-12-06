import React, { useState } from 'react';
import { Zap, Target, Eye, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import MessageBubble from '../components/MessageBubble';
import QuickAction from '../components/QuickAction';
import ChatInput from '../components/ChatInput';

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
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        content: 'I\'m analyzing your request and preparing a customized strategy. This will include target demographics, channel recommendations, and creative direction.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <Navigation />

          {/* Chat Area */}
          <main className="col-span-9">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
              {/* Messages */}
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-medium text-slate-500 mb-3">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
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
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;