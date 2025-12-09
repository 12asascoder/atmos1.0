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

interface CampaignContext {
  brand: string;
  product: string;
  category: string;
  market: string;
  pricing: string;
  objective: string;
  kpi: string;
  budget: string;
  timeline: string;
  stage: string;
  channels: string;
  competitors: string;
  constraints: string;
}

const CommandCenter: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Welcome to the Command Center. I\'m your intelligent advertising assistant. Tell me about your campaign goals, and I\'ll help you create a comprehensive strategy tailored to your needs.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [currentAction, setCurrentAction] = useState('chat');
  
  // Campaign context state
  const [context, setContext] = useState<CampaignContext>({
    brand: '',
    product: '',
    category: '',
    market: '',
    pricing: '',
    objective: '',
    kpi: '',
    budget: '',
    timeline: '',
    stage: '',
    channels: '',
    competitors: '',
    constraints: 'none'
  });

  const quickActions = [
    { label: 'Launch campaign for new product', icon: Zap, action: 'launch_campaign' },
    { label: 'Analyze audience insights', icon: Target, action: 'analyze_audience' },
    { label: 'Review competitor positioning', icon: Eye, action: 'review_competitors' },
    { label: 'Generate creative concepts', icon: Sparkles, action: 'generate_creatives' }
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    
    // Set chat as started when first message is sent
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }
    
    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleResponseReceived = (response: string) => {
    const botMessage: Message = {
      id: messages.length + 1,
      type: 'bot',
      content: response,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, botMessage]);
    
    // Reset action to 'chat' after response
    setCurrentAction('chat');
  };

  const handleQuickAction = (label: string, action: string) => {
    setMessage(label);
    setCurrentAction(action);
  };

  return (
    <div className={`min-h-screen ${colors.background.gradient}`}>
      <Navigation />
      
      <div className={`transition-all duration-700 ease-in-out ${
        hasStartedChat ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-96 opacity-100'
      }`}>
        <Header />
      </div>
      
      <div className={`transition-all duration-700 ease-in-out ${
        hasStartedChat 
          ? 'mx-0 my-0' 
          : 'max-w-7xl mx-auto px-6 py-6'
      }`}>
        <div 
          className={`${colors.background.card} ${colors.neutral.border} border shadow-sm flex flex-col transition-all duration-700 ease-in-out ${
            hasStartedChat 
              ? 'rounded-none h-[calc(100vh-64px)]' 
              : 'rounded-2xl'
          }`}
          style={!hasStartedChat ? { height: 'calc(100vh - 240px)' } : {}}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className={`px-6 py-4 ${colors.neutral.borderLight} border-t ${colors.neutral[50]}/50`}>
            <p className={`text-xs font-medium ${colors.neutral.textLight} mb-3`}>Quick actions:</p>
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((item, idx) => (
                <QuickAction
                  key={idx}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => handleQuickAction(item.label, item.action)}
                />
              ))}
            </div>
          </div>

          {/* Input - Now with context and action props */}
          <ChatInput
            value={message}
            onChange={setMessage}
            onSend={handleSend}
            onResponseReceived={handleResponseReceived}
            action={currentAction}
            context={context}
          />
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;