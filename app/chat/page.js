'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';

export default function AIChatPage() {
  const { currentLocation, fanProfile, accessibilityNeeds } = useSession();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hi! I'm your MetLife Stadium AI Companion. Ask me how to find concessions, bathrooms, check the score, or get help. I'm connected to the Plaza Level concourse map.",
      intent: 'small_talk'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setInputValue('');
    setLoading(true);

    // Append user message
    setMessages(prev => [...prev, { sender: 'fan', text: userText }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          session: {
            current_location: currentLocation,
            fan_profile: fanProfile,
            accessibility_needs: accessibilityNeeds
          }
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: data.reply,
        intent: data.intent 
      }]);
    } catch (error) {
      console.error("Failed to call chat endpoint:", error);
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: "I'm having trouble connecting to stadium services right now. If this is an emergency, please find the nearest uniformed staff member immediately.",
        intent: 'emergency'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card chat-container">
      <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>💬 MetLife AI Concourse Assistant</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Active Session Location: <strong>{currentLocation || 'Not Set'}</strong> 
            {accessibilityNeeds ? ' | Step-Free Enabled' : ''}
          </p>
        </div>
        <span className="status-badge low" style={{ background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-cyan)' }}>Online</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.sender} ${msg.intent === 'emergency' ? 'emergency' : ''}`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Stadium assistant is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <input 
          type="text" 
          className="chat-input"
          placeholder="Ask directions, check scores, or type 'medical help' in emergency..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" className="chat-send-btn" disabled={loading}>
          🏹
        </button>
      </form>
    </div>
  );
}
