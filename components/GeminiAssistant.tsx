import React, { useState, useRef, useEffect } from 'react';
import { getTechAssistantResponse } from '../services/geminiService';

const GeminiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await getTechAssistantResponse(userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse || '' }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex h-[550px] w-[380px] flex-col rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header Brandificato */}
          <div className="flex items-center justify-between bg-black p-6 text-white border-b-4 border-editorial-red">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-editorial-red flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xs">TX</span>
              </div>
              <div className="flex flex-col">
                <span className="font-condensed font-black text-2xl uppercase leading-none tracking-tight">TXA ASSISTANT</span>
                <span className="text-[9px] font-bold text-tech-green uppercase tracking-widest">Powered by Gemini AI</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Area Chat */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <svg className="w-8 h-8 text-editorial-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Chiedi all'esperto</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed uppercase tracking-wider">Qual è il miglior smartphone oggi? Come installo una ROM? Chiedimelo qui.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3 text-sm font-medium shadow-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-black text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-tech-green text-black rounded-[1.5rem] rounded-bl-none px-5 py-3 text-[10px] font-black uppercase tracking-widest shadow-sm border border-tech-green/20 animate-pulse">
                  Sto analizzando...
                </div>
              </div>
            )}
          </div>

          {/* Input Brandificato */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digita qui la tua domanda tech..."
                className="flex-1 rounded-2xl border-2 border-gray-50 bg-gray-50 px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-editorial-red focus:bg-white transition-all placeholder:text-gray-400"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="rounded-2xl bg-editorial-red p-3.5 text-white hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="group flex h-16 w-16 items-center justify-center rounded-[2rem] bg-black text-white shadow-2xl hover:bg-editorial-red transition-all duration-300 hover:scale-110 active:scale-90 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-tech-green translate-y-full group-hover:translate-y-[90%] transition-transform duration-500 opacity-20"></div>
          <svg className="h-8 w-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}
    </div>
  );
};

export default GeminiAssistant;
