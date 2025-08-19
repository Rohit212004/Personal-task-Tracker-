import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, MessageSquare, Sparkles, AlertCircle } from 'lucide-react';

// Project tasks API and types
const API_URL = "http://localhost:8080/api/tasks";
interface Task {
  id: number;
  name: string;
  desc: string;
  dueDate: string;
  status: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const AiChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);

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

  // Load tasks from backend so AI answers are grounded in project data
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Task[] = await res.json();
        const tasksWithPriority = data.map((t: any) => ({
          ...t,
          priority: (t.priority || 'medium') as Task['priority'],
        }));
        setTasks(tasksWithPriority);
      } catch (e) {
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };
    loadTasks();
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
      // Hard instruction to constrain answers to project task data only
      const instruction = `You are the Task Assistant for the Personal Task Tracker project.
Only answer questions based on the tasks data provided. If the user's message is unrelated to these tasks (e.g., general knowledge, web search, unrelated topics), reply exactly with: "I can only help with tasks in this project." Keep answers concise and actionable. Use fields: name, desc, dueDate, status (completed/pending), priority (low/medium/high/urgent).`;

      // Build a compact, bounded snapshot of tasks to keep prompt size reasonable
      const maxTasks = 200;
      const snapshot = tasks.slice(0, maxTasks).map((t) => (
        `- id:${t.id} | ${t.status ? 'DONE' : 'PENDING'} | priority:${t.priority.toUpperCase()} | due:${t.dueDate} | name:${t.name} | desc:${t.desc}`
      )).join('\n');

      const prompt = `${instruction}\n\nTASKS (first ${Math.min(tasks.length, maxTasks)} of ${tasks.length}):\n${snapshot || '(no tasks available)'}\n\nUSER QUESTION:\n${input}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Task Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Ask about your project tasks: due dates, priorities, summaries, and completion.</p>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="max-w-4xl mx-auto px-0">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-700 text-white p-4 xs:p-5 sm:p-8 rounded-2xl shadow-xl mb-4 xs:mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Bot className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Task Assistant</h2>
                    <p className="text-gray-200">I only answer about your tasks in this project.</p>
                  </div>
                </div>
                
                <div className="hidden xs:flex items-center gap-3 sm:gap-6 text-purple-100">
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
                 <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 mb-4 xs:mb-6 sm:mb-8">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Messages</h3>
              <MessageSquare className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{chatLog.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">total messages</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">AI Model</h3>
              <Bot className="text-purple-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gemini</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">2.5 flash</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</h3>
              <Sparkles className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{loading ? 'Busy' : 'Ready'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ai ? 'connected' : 'offline'}</p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Chat Messages */}
          <div className="h-[58vh] xs:h-[60vh] sm:h-96 overflow-y-auto p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
            {chatLog.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="text-white" size={24} />
                </div>
                <p className="text-gray-500 text-lg mb-2">Start a conversation!</p>
                <p className="text-gray-400 text-sm">Ask me anything related to your tasks.</p>
                
                {/* Suggested prompts */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {[
                    'List urgent tasks due this week',
                    'What tasks are pending today?',
                    'Summarize completed tasks this month',
                    'Which high priority tasks are overdue?'
                  ].map((prompt) => (
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
                
                 <div className={`max-w-[85vw] sm:max-w-3xl ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-bg-gray-900/60 text-white rounded-br-sm'
                      : 'bg-bg-gray-900/60 text-gray-900 border border-gray-200 backdrop-bl-sm dark:backdrop-blur-none rounded-bl-sm'
                  }`}>
                    <div className="text-xs font-medium mb-2 opacity-70">
                      {msg.role === 'user' ? 'You' : 'Gemini AI'}
                    </div>
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm max-w-none text-gray-900 dark:text-gray-100">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">{msg.text}</p>
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
                <div className="bg-white/80 p-4 rounded-xl border border-gray-200 backdrop-blur-sm dark:backdrop-blur-none rounded-bl-sm">
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
            <div className="p-3 xs:p-4 sm:p-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-2 sm:gap-3 items-start">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send)"
                disabled={loading || !ai}
                rows={1}
                  className="flex-1 px-3 xs:px-4 py-2.5 xs:py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-200 focus:border-transparent transition-all resize-none disabled:opacity-50 text-gray-900 dark:text-gray-100"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !ai}
                  className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white rounded-xl shadow transition-all duration-200 font-medium flex items-center gap-2 disabled:cursor-not-allowed"
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