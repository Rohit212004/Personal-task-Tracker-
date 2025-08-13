import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, MessageSquare, Sparkles, AlertCircle } from 'lucide-react';

const AiChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize AI - handle missing API key gracefully
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (apiKey) {
      setAi(new GoogleGenAI({ apiKey }));
    } else {
      setError('API key not configured. Please add REACT_APP_GEMINI_API_KEY to your environment variables.');
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !ai) return;

    const userMessage = { role: 'user', text: input };
    setChatLog((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: input }] }],
      });
      
      const aiReplyText =
        response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        response?.text ||
        'No response from AI.';
      
      const aiReply = { role: 'model', text: aiReplyText };
      setChatLog((prev) => [...prev, aiReply]);
    } catch (error) {
      console.error('AI call error:', error);
      setError('Failed to get response from AI. Please try again.');
      setChatLog((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error. Please try again later.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 pl-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600 mt-1">Chat with Gemini - your intelligent AI companion.</p>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Sparkles size={16} />
          <span>Powered by Google Gemini</span>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 rounded-2xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Bot className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Chat Assistant</h2>
                    <p className="text-purple-100">Ask me anything - I'm here to help!</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-purple-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span>Natural conversation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <span>Intelligent responses</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden sm:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Chat Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Messages</h3>
              <MessageSquare className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{chatLog.length}</p>
            <p className="text-sm text-gray-500 mt-1">total messages</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">AI Model</h3>
              <Bot className="text-purple-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">Gemini</p>
            <p className="text-sm text-gray-500 mt-1">2.5 flash</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status</h3>
              <Sparkles className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? 'Busy' : 'Ready'}</p>
            <p className="text-sm text-gray-500 mt-1">{ai ? 'connected' : 'offline'}</p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50/50 to-white/50">
            {chatLog.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="text-white" size={24} />
                </div>
                <p className="text-gray-500 text-lg mb-2">Start a conversation!</p>
                <p className="text-gray-400 text-sm">Ask me anything - from coding help to creative ideas.</p>
                
                {/* Suggested prompts */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {['Explain React hooks', 'Write a poem', 'Debug my code', 'Creative ideas'].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {chatLog.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>
                
                <div className={`max-w-3xl ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white/80 text-gray-900 border border-gray-200 rounded-bl-sm'
                  }`}>
                    <div className="text-xs font-medium mb-2 opacity-70">
                      {msg.role === 'user' ? 'You' : 'Gemini AI'}
                    </div>
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm max-w-none text-gray-900">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-gray-200 rounded-bl-sm">
                  <div className="text-xs font-medium mb-2 opacity-70">Gemini AI</div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/60 backdrop-blur-sm border-t border-gray-200">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send)"
                disabled={loading || !ai}
                rows={1}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !ai}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                Send
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Press Enter to send • Shift+Enter for new line</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${ai && !loading ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{ai && !loading ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;