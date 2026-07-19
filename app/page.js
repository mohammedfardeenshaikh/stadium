'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="hero-section">
      <div className="hero-tag">MetLife Stadium Plaza concourse assistant</div>
      <h1 className="hero-title">Navigate MetLife Stadium Like a Pro</h1>
      <p className="hero-subtitle">
        Your virtual stadium guide for the Plaza Level. Get real-time directions, check game scores, log concerns, or request immediate assistance in one tap.
      </p>

      <div className="hero-ctas">
        <Link href="/chat" className="btn-primary">
          💬 Open AI Chat
        </Link>
        <Link href="/navigation" className="btn-secondary">
          🗺️ View Navigation Map
        </Link>
      </div>

      <div className="features-grid">
        <div className="glass-card feature-card">
          <div className="feature-icon">🧭</div>
          <h3 className="feature-title">Wayfinding</h3>
          <p>Find bathrooms, concession hubs, elevators, and gate exits. Supports step-free accessibility path routing.</p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon">🏈</div>
          <h3 className="feature-title">Live Score Feed</h3>
          <p>Get instant updates on the live Jets/Giants game clock, scores, timeouts, and rules clarifications.</p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon">🍕</div>
          <h3 className="feature-title">Smart Suggestions</h3>
          <p>Receive location-aware food, merch, and event recommendation cards dynamically mapped near your section.</p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon">🚨</div>
          <h3 className="feature-title">Immediate Help</h3>
          <p>distress language is force-routed to emergency guidelines to give you instant safety steps without delay.</p>
        </div>
      </div>
    </div>
  );
}
