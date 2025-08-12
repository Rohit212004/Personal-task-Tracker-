import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

const AiChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY as string });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', text: input };
    setChatLog((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

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
      setChatLog((prev) => [
        ...prev,
        { role: 'model', text: 'Error: Could not get response.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '2rem auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '2rem',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: 8, fontWeight: 700, fontSize: 28 }}>
        🤖 AI Chat
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
        Chat with Gemini – your AI assistant!
      </p>
      <div
        style={{
          border: '1px solid #e0e0e0',
          background: '#f9fafd',
          borderRadius: 12,
          padding: '1rem',
          marginBottom: '1.5rem',
          maxHeight: '350px',
          minHeight: '180px',
          overflowY: 'auto',
          transition: 'border 0.2s',
        }}
      >
        {chatLog.length === 0 && !loading && (
          <div style={{ color: '#aaa', textAlign: 'center', marginTop: 60 }}>
            Start the conversation!
          </div>
        )}
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              margin: '0.5rem 0',
            }}
          >
            <div
              style={{
                background: msg.role === 'user' ? '#4f8cff' : '#e6eaf3',
                color: msg.role === 'user' ? '#fff' : '#222',
                padding: '0.7rem 1.1rem',
                borderRadius: 18,
                maxWidth: '75%',
                fontSize: 16,
                boxShadow: msg.role === 'user'
                  ? '0 2px 8px rgba(79,140,255,0.08)'
                  : '0 2px 8px rgba(230,234,243,0.08)',
                wordBreak: 'break-word',
              }}
            >
              <span style={{ fontWeight: 500 }}>
                {msg.role === 'user' ? 'You' : 'Gemini'}
              </span>
              <span style={{ display: 'block', fontWeight: 400, marginTop: 2 }}>
                {msg.role === 'model' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#aaa', textAlign: 'center', margin: '1rem 0' }}>
            Gemini is thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 20,
            border: '1px solid #d0d7e2',
            fontSize: 16,
            outline: 'none',
            transition: 'border 0.2s',
          }}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 20,
            border: 'none',
            background: '#4f8cff',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(79,140,255,0.08)',
            transition: 'background 0.2s',
          }}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AiChat;