'use client';

import React from 'react';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>About AI Stadium Companion</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>MetLife Stadium Plaza Level Wayfinding & Information Portal</p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'var(--accent-cyan)' }}>What is this app?</h2>
          <p>
            AI Stadium Companion is a premium, state-of-the-art web application designed to help fans and venue staff navigate the Plaza Level concourse of MetLife Stadium. Equipped with an interactive map, dynamic recommendations, live scoreboard widgets, and an AI chat assistant, the application provides step-by-step guidance to restrooms, concessions, elevators, and exits.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'var(--accent-blue)' }}>Map Ground Truth & Data Source</h2>
          <p style={{ marginBottom: '1rem' }}>
            All geographic queries, waypoint routing, and landmark lookups are grounded on the official Plaza Level map data:
          </p>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
            Source Concourse Chart: MetLife-Stadium-Plaza-Level-3-2-26-43215441dc.jpg<br />
            Data definition: data/plaza_level_map.json
          </div>
          <p style={{ marginTop: '1rem' }}>
            The application strictly enforces a <strong>no-fabrication policy</strong>. It will never guess a location, vendor name, or gate that is not present in the map configuration file. If a requested amenity is not mapped, it will state so explicitly.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'var(--accent-purple)' }}>Live Data Disclaimer & Caveats</h2>
          <p>
            Live scores (via the football feed) and crowd line densities (via the staff analytics dashboard) depend on real-time venue telemetry and telemetry APIs. In the event that these feeds become stale, offline, or disconnected, the system will explicitly state that the data is unavailable rather than estimating numbers, guesses, or presenting outdated snapshots as current.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Version 1.0.0 (Local Demonstration)</span>
          <span>© 2026 MetLife Stadium Operations</span>
        </div>
      </div>
    </div>
  );
}
