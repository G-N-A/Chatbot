// Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast, { Toaster } from 'react-hot-toast';
import { useClipboard } from 'use-clipboard-copy';

const BACKEND_URL = 'http://localhost:8000/chat';
const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const cleanBotOutput = (txt: string) => txt.replace(/<think>|<\/think>/gi, '').trim();

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "👋 Hi! I'm your AI assistant. Ask me anything!",
  time: formatTime(new Date())
};

const MarkdownMessage = ({ content }: { content: string }) => (
  <div className="prose prose-sm prose-invert max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code(props: any) {
          const { inline, className, children, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              language={match[1]}
              style={oneDark}
              PreTag="div"
              customStyle={{ borderRadius: '0.5rem', fontSize: '0.85rem' }}
              {...rest}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-primary-light/30 px-1 py-0.5 rounded text-primary-dark" {...rest}>
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

const Chat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ ...WELCOME_MESSAGE }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clipboard = useClipboard({ copiedTimeout: 1500 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const now = formatTime(new Date());

    setMessages(prev => [...prev, { role: 'user', content: input, time: now }]);
    setLoading(true);
    setError(null);

    let response = '';
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            response += decoder.decode(value);
            setMessages(prev => {
              const updated = cleanBotOutput(response);
              const last = prev[prev.length - 1];
              return last.role === 'assistant'
                ? [...prev.slice(0, -1), { ...last, content: updated, time: formatTime(new Date()) }]
                : [...prev, { role: 'assistant', content: updated, time: formatTime(new Date()) }];
            });
          }
        }
      } else {
        throw new Error('No response body');
      }
    } catch (e: any) {
      setError('Error: ' + (e.message || 'Unknown error'));
    }

    setInput('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-light via-white to-primary-light">
      {/* Header */}
      <header className="flex items-center gap-3 px-8 py-5 border-b border-primary/10 bg-white/70 backdrop-blur-xl">
        <h1 className="text-2xl font-extrabold text-primary-dark tracking-tight">Chatbot</h1>
      </header>

      {/* Chat body */}
      <main className="flex-1 overflow-y-auto px-0 sm:px-16 py-6 custom-scrollbar">
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              <div className={`flex flex-col max-w-[80%]`}>
                <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-primary' : 'text-primary-dark'}`}>
                  {msg.role === 'user' ? 'You' : 'Gemini AI'}
                </span>

                <div
                  className={`relative rounded-2xl px-6 py-4 text-base shadow-md border whitespace-pre-wrap break-words
                    ${msg.role === 'user'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-primary-light text-primary-dark border-primary-light'}`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      <button
                        onClick={() => {
                          clipboard.copy(cleanBotOutput(msg.content));
                          toast.success('Copied to clipboard!');
                        }}
                        className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center rounded-md bg-white/60 backdrop-blur text-primary-dark p-1 hover:bg-white shadow"
                      >
                        📋
                      </button>
                      <MarkdownMessage content={cleanBotOutput(msg.content)} />
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="text-[10px] text-primary-dark/60 mt-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-dark text-white flex items-center justify-center">B</div>
              <div className="rounded-2xl px-6 py-4 shadow-md border bg-primary-light text-primary-dark border-primary-light flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-150">•</span>
                <span className="animate-bounce delay-300">•</span>
              </div>
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) sendMessage();
        }}
        className="flex items-center gap-3 px-8 py-5 border-t border-primary/10 bg-white/90 backdrop-blur sticky bottom-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          disabled={loading}
          className="flex-1 rounded-lg border px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <footer className="text-center text-xs text-primary-dark/60 py-2">Powered by DeepSeek-R1 • React + FastAPI</footer>
      <Toaster toastOptions={{ style: { background: '#fff', color: '#111' } }} />
    </div>
  );
};

export default Chat;
