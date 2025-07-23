import React, { useState, useRef, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:8000/chat';

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const userAvatar = (
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold shadow border-2 border-white">U</div>
);
const botAvatar = (
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center text-white font-bold shadow border-2 border-white">B</div>
);

function cleanBotOutput(text: string) {
  return text.replace(/<think>|<\/think>/gi, '').trim();
}

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "👋 Hi! I'm your AI assistant. Ask me anything!",
  time: formatTime(new Date())
};

const Chat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string, time: string}[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const now = formatTime(new Date());
    setMessages([...messages, { role: 'user', content: input, time: now }]);
    setLoading(true);
    setError(null);
    let response = '';
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const reader = res.body?.getReader();
      if (reader) {
        let decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            response += decoder.decode(value);
            setMessages(msgs => [
              ...msgs.filter((m, i) => i !== msgs.length - 1 || m.role !== 'assistant'),
              { role: 'assistant', content: response, time: formatTime(new Date()) }
            ]);
          }
        }
      } else {
        setError('No response body from backend.');
      }
    } catch (err: any) {
      setError('Error: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
    setInput('');
  };

  return (
    <div className="min-h-screen h-screen w-screen bg-gradient-to-br from-primary-light via-white to-primary-light flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-6 border-b border-primary/10 bg-gradient-to-r from-primary-light to-white w-full">
        <svg className="w-8 h-8 text-primary-dark" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8a9 9 0 100-18 9 9 0 000 18z" /></svg>
        <h2 className="text-2xl font-extrabold text-primary-dark tracking-tight">Chatbot</h2>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-0 sm:px-16 py-8 space-y-6 bg-transparent custom-scrollbar w-full">
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3 w-full`}> 
              {msg.role === 'assistant' && botAvatar}
              <div className={`flex flex-col items-${msg.role === 'user' ? 'end' : 'start'} max-w-[70%] w-fit`}>
                <span className={`mb-1 text-xs font-semibold ${msg.role === 'user' ? 'text-primary' : 'text-primary-dark'}`}>{msg.role === 'user' ? 'You' : 'Gemini AI'}</span>
                <div className={`rounded-2xl px-6 py-4 text-base shadow-md border transition-all duration-200 whitespace-pre-line break-words ${msg.role === 'user' ? 'bg-primary text-white border-primary' : 'bg-primary-light text-primary-dark border-primary-light'}`}>
                  {msg.role === 'assistant' ? cleanBotOutput(msg.content) : msg.content}
                </div>
                <span className="mt-1 text-[10px] text-primary-dark/60">{msg.time}</span>
              </div>
              {msg.role === 'user' && userAvatar}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-end gap-3 w-full">
              {botAvatar}
              <div className="flex flex-col items-start max-w-[70%] w-fit">
                <span className="mb-1 text-xs font-semibold text-primary-dark">Gemini AI</span>
                <div className="rounded-2xl px-6 py-4 text-base shadow-md border bg-primary-light text-primary-dark border-primary-light animate-pulse">
                  <span className="italic">Bot is typing...</span>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm font-semibold">{error}</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input Bar */}
      <form
        className="flex items-center gap-2 px-8 py-6 border-t border-primary/10 bg-white/90 sticky bottom-0 z-10 w-full"
        onSubmit={e => { e.preventDefault(); sendMessage(); }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          className="flex-1 rounded-lg border border-primary/40 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary text-base bg-white text-black disabled:bg-primary-light shadow-sm transition-all duration-200"
          placeholder="Type your message..."
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-4 rounded-lg shadow transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          disabled={loading || !input.trim()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
          Send
        </button>
      </form>
      {/* Footer */}
      <div className="w-full text-center text-primary-dark text-xs opacity-80 select-none py-2 bg-transparent">
        Powered by DeepSeek-R1:7b & Ollama • React + FastAPI + TailwindCSS
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; background: #fff0; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fca5a5; border-radius: 8px; }
      `}</style>
    </div>
  );
};

export default Chat;  