import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { generateAIResponse } from '../services/geminiService';
import { User, Appointment, Service, ChatMessage } from '../types';

interface AIAssistantProps {
  user: User;
  appointments: Appointment[];
  services: Service[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ user, appointments, services }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Olá ${user.name}! Sou o assistente virtual da sua agenda. Quer saber seu próximo compromisso ou detalhes sobre serviços?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await generateAIResponse(userMsg.text, user, appointments, services);

    const modelMsg: ChatMessage = {
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-105 z-50 flex items-center gap-2"
      >
        <Sparkles className="w-6 h-6" />
        <span className="font-semibold hidden sm:inline">IA Assistente</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-[350px] sm:max-w-md h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      
      {/* Header */}
      <div className="bg-brand-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <div>
            <h3 className="font-bold text-sm">Concierge IA</h3>
            <p className="text-xs text-brand-100">Powered by Gemini 2.5</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-brand-700 p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!input.trim() || isLoading}
          className="!rounded-full !px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};