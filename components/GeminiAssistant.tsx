
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
        <div className="flex h-[500px] w-[350px] flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
          <div className="flex items-center justify-between bg-blue-600 p-4 rounded-t-2xl text-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                <span className="text-blue-600 font-bold">TX</span>
              </div>
              <span className="font-outfit font-semibold">TuttoXAndroid AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-75">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <p className="text-sm">Ciao! Sono l'assistente di TuttoXAndroid. Come posso aiutarti oggi?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm border border-gray-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 rounded-2xl px-4 py-2 text-sm shadow-sm border border-gray-100 italic">
                  Sto pensando...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Chiedimi aiuto..."
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-transform hover:scale-110"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}
    </div>
  );
};

export default GeminiAssistant;
