'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';

export default function FanDashboard() {
  const {
    currentLocation,
    fanProfile,
    accessibilityNeeds,
    updateLocation,
    updateProfile,
    updateAccessibility
  } = useSession();

  // Local state for forms
  const [tempLocation, setTempLocation] = useState(currentLocation);
  const [tempTeam, setTempTeam] = useState(fanProfile.favoriteTeam || 'Giants');
  const [tempDiet, setTempDiet] = useState(fanProfile.dietary || 'standard');

  // API response states
  const [gameStatus, setGameStatus] = useState(null);
  const [loadingGame, setLoadingGame] = useState(true);
  
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const [wayfindingDest, setWayfindingDest] = useState('');
  const [wayfindingResult, setWayfindingResult] = useState('');
  const [loadingWayfinding, setLoadingWayfinding] = useState(false);

  // Sync temp variables when context loads
  useEffect(() => {
    setTempLocation(currentLocation);
  }, [currentLocation]);

  useEffect(() => {
    setTempTeam(fanProfile.favoriteTeam || 'Giants');
    setTempDiet(fanProfile.dietary || 'standard');
  }, [fanProfile]);

  // Fetch football game status
  const fetchFootball = async () => {
    setLoadingGame(true);
    try {
      const res = await fetch('/api/football');
      const data = await res.json();
      setGameStatus(data);
    } catch (e) {
      console.error("Failed to load football feed:", e);
    } finally {
      setLoadingGame(false);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await fetch('/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: currentLocation,
          fan_profile: fanProfile
        })
      });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchFootball();
    // Refresh game score every 30 seconds
    const interval = setInterval(fetchFootball, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [currentLocation, fanProfile]);

  // Handle Session Updates
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateLocation(tempLocation);
    updateProfile({ favoriteTeam: tempTeam, dietary: tempDiet });
  };

  // Quick navigation widget submit
  const handleQuickNav = async (e) => {
    e.preventDefault();
    if (!wayfindingDest) return;
    setLoadingWayfinding(true);
    try {
      const res = await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: currentLocation,
          destination: wayfindingDest,
          accessibility_needs: accessibilityNeeds
        })
      });
      const data = await res.json();
      setWayfindingResult(data.reply);
    } catch (error) {
      setWayfindingResult("Wayfinding service offline. Please consult the nearest Guest Services desk.");
    } finally {
      setLoadingWayfinding(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Fan Companion Dashboard</h1>
      
      <div className="dashboard-grid">
        
        {/* Left Side: Session Context / Profile configuration */}
        <div className="dashboard-sidebar">
          
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>🎟️ Fan Profile & Location</h2>
            
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Current Location (Gate/Section)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={tempLocation} 
                  onChange={(e) => setTempLocation(e.target.value)}
                  placeholder="e.g. Moody's Gate, Section 139"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Favorite Team</label>
                <select value={tempTeam} onChange={(e) => setTempTeam(e.target.value)}>
                  <option value="Giants">NY Giants</option>
                  <option value="Jets">NY Jets</option>
                  <option value="Other">Neutral / Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dietary Preferences</label>
                <select value={tempDiet} onChange={(e) => setTempDiet(e.target.value)}>
                  <option value="standard">Standard Menu</option>
                  <option value="vegetarian">Vegetarian Options</option>
                </select>
              </div>

              <div className="form-group switch-container">
                <span className="form-label" style={{ marginBottom: 0 }}>Prefer Step-Free Access (Ramps/Elevators)</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={accessibilityNeeds} 
                    onChange={(e) => updateAccessibility(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                Save Session Profile
              </button>
            </form>
          </div>

          {/* Quick Nav Widget (calls navigation_flow directly, no chat classifier) */}
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>🧭 Quick-Nav Finder</h2>
            <form onSubmit={handleQuickNav}>
              <div className="form-group">
                <label className="form-label">Where are you headed?</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., restroom, section 133, verizon gate" 
                  value={wayfindingDest}
                  onChange={(e) => setWayfindingDest(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn-secondary" 
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loadingWayfinding}
              >
                {loadingWayfinding ? 'Calculating...' : 'Get Directions'}
              </button>
            </form>
            {wayfindingResult && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '3px solid var(--accent-blue)', fontSize: '0.9rem' }}>
                {wayfindingResult}
              </div>
            )}
          </div>
          
        </div>

        {/* Right Side: Game Score Feed & Dynamic Recommendations */}
        <div className="dashboard-main">
          
          {/* Football Live Score (Giants / Jets score widget) */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, var(--bg-glass), rgba(127, 0, 255, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>🏈 Live Stadium Feed</h2>
              <span className="status-badge low" style={{ background: 'rgba(79, 172, 254, 0.1)', color: 'var(--accent-blue)' }}>Live Feed</span>
            </div>

            {loadingGame ? (
              <p>Refreshing match scoreboard...</p>
            ) : gameStatus ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '1.5rem 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{gameStatus.away}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{gameStatus.away_score}</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>@</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{gameStatus.home}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{gameStatus.home_score}</div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Quarter</div>
                    <div style={{ fontWeight: 'bold' }}>Q{gameStatus.quarter}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Time Remaining</div>
                    <div style={{ fontWeight: 'bold' }}>{gameStatus.clock}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Down / Dist</div>
                    <div style={{ fontWeight: 'bold' }}>{gameStatus.down} & {gameStatus.distance}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Timeouts: {gameStatus.away} ({gameStatus.timeouts_away}) | {gameStatus.home} ({gameStatus.timeouts_home})</span>
                  <span>Feed source: {gameStatus.source_feed}</span>
                </div>
              </div>
            ) : (
              <p>Sports-data feed is temporarily offline.</p>
            )}
          </div>

          {/* Dynamic Recommendations */}
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>✨ Plaza Level Recommendations</h2>
            
            {loadingRecs ? (
              <p>Gathering customized suggestions...</p>
            ) : recommendations.length > 0 ? (
              <div className="rec-cards-container">
                {recommendations.map((rec, i) => (
                  <div key={i} className="rec-card">
                    <div className="rec-card-title">{rec.title}</div>
                    <p style={{ fontSize: '0.95rem' }}>{rec.description}</p>
                    <div className="rec-card-directions">
                      <strong>Directions from {currentLocation}:</strong> {rec.directions}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Update your location to receive local concessions and activity recommendation cards.</p>
            )}
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
