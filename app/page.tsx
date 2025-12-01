'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ label: string; value: string }>;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome back! 👋\n\nI am your personal Finance Tutor. Ready to master your finances? Select a level to begin:',
      actions: [
        { label: '🌱 Beginner', value: 'set_level_beginner' },
        { label: '🚀 Intermediate', value: 'set_level_intermediate' },
        { label: '🧠 Advanced', value: 'set_level_advanced' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => `local_test_${Math.random().toString(36).substring(7)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageValue: string, displayLabel?: string) => {
    if (!messageValue.trim() || isLoading) return;

    // Use displayLabel if provided (for buttons), otherwise use the messageValue (for text input)
    const userDisplayContent = displayLabel || messageValue;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userDisplayContent,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chatInput: messageValue, // Send the actual value/command to the backend
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Clean up the response text to handle <br> tags if they exist, replacing them with newlines for markdown
      let cleanContent = data.text || 'Sorry, I could not process that.';
      cleanContent = cleanContent.replace(/<br\s*\/?>/gi, '\n');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanContent,
        actions: data.actions || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Error: Could not connect to the server.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col glass rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 relative">

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]"></div>
        </div>

        {/* Header */}
        <header className="px-6 py-5 glass-strong z-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-lg font-bold text-white">₹</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                FinSense
              </h1>
              <p className="text-xs text-slate-400 font-medium">AI Finance Tutor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-6 space-y-6 z-10 scroll-smooth">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-blue-900/20'
                  : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-200 rounded-bl-none shadow-black/10'
                  }`}
              >
                <div className={`text-[15px] leading-relaxed prose prose-invert max-w-none ${message.role === 'user' ? 'prose-p:text-white prose-a:text-white' : 'prose-p:text-slate-200 prose-a:text-blue-400'}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="whitespace-pre-wrap" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      code: ({ node, inline, ...props }) =>
                        inline ? <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm" {...props} /> : <code {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
                      li: ({ node, ...props }) => <li className="my-1" {...props} />,
                      a: ({ node, ...props }) => <a className="underline hover:opacity-80 transition-opacity" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-600 pl-4 italic my-2" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-slate-700/50 not-prose">
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(action.value, action.label)}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-600 text-slate-300 hover:text-blue-300 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-none px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 glass-strong z-10">
          <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-3xl mx-auto">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about finance..."
                className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                disabled={isLoading}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-300 -z-10 blur-sm"></div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all duration-200 hover:shadow-blue-900/40 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center min-w-[3.5rem]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 transform rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] text-slate-500">
              FinSense can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}