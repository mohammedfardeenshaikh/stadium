'use client';

import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';

export default function NavigationPage() {
  const { 
    currentLocation, 
    accessibilityNeeds, 
    updateLocation, 
    updateAccessibility 
  } = useSession();

  const [origin, setOrigin] = useState(currentLocation);
  const [destination, setDestination] = useState('');
  const [directions, setDirections] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const gates = [
    { id: 'amex_gate', name: 'AMEX Gate (North)', cx: 250, cy: 70, color: '#4facfe' },
    { id: 'hcltech_gate', name: 'HCLTech Gate (Northeast)', cx: 380, cy: 130, color: '#00f2fe' },
    { id: 'verizon_gate', name: 'Verizon Gate (East)', cx: 430, cy: 250, color: '#4facfe' },
    { id: 'metlife_gate', name: 'MetLife Gate (South)', cx: 250, cy: 430, color: '#7f00ff' },
    { id: 'moodys_gate', name: 'Moody\'s Gate (Southwest)', cx: 120, cy: 370, color: '#e100ff' }
  ];

  const sections = [
    { num: '144', cx: 160, cy: 330 },
    { num: '143', cx: 180, cy: 350 },
    { num: '142', cx: 200, cy: 370 },
    { num: '140', cx: 230, cy: 385 },
    { num: '139', cx: 250, cy: 390 },
    { num: '137', cx: 270, cy: 385 },
    { num: '135', cx: 300, cy: 370 },
    { num: '134', cx: 320, cy: 350 },
    { num: '133', cx: 340, cy: 330 }
  ];

  const landmarks = [
    { id: 'east_hall', name: 'East Hall', cx: 250, cy: 150, type: 'retail_hub' },
    { id: 'metlife_west_hall', name: 'MetLife West Hall', cx: 250, cy: 330, type: 'retail_hub' },
    { id: 'metlife_50_club', name: 'MetLife 50 Club', cx: 250, cy: 360, type: 'club' },
    { id: 'east_vip', name: 'East VIP Entrance', cx: 390, cy: 180, type: 'vip_entrance' },
    { id: 'west_vip', name: 'West VIP Entrance', cx: 390, cy: 310, type: 'vip_entrance' },
    { id: 'ramp_west', name: 'Ramp (West)', cx: 90, cy: 250, type: 'ramp' },
    { id: 'ramp_east', name: 'Ramp (East)', cx: 410, cy: 220, type: 'ramp' }
  ];

  const amenities = [
    { id: 'restroom_133_134', name: 'Restroom 133-134', cx: 350, cy: 360, type: 'restroom' },
    { id: 'restroom_134_east', name: 'Restroom 134 East', cx: 360, cy: 320, type: 'restroom' },
    { id: 'family_restroom_moodys', name: 'Family Restroom Moody\'s', cx: 100, cy: 340, type: 'family_restroom' },
    { id: 'nursing_station_144', name: 'Nursing Station 144', cx: 140, cy: 300, type: 'nursing_station' },
    { id: 'reverse_atm_s_center', name: 'Reverse ATM South', cx: 210, cy: 360, type: 'reverse_atm' },
    { id: 'charging_station_amex', name: 'Phone Charger AMEX', cx: 280, cy: 80, type: 'charging_station' },
    { id: 'elevator_east_vip', name: 'Elevator East VIP', cx: 370, cy: 190, type: 'elevator' },
    { id: 'elevator_west_vip', name: 'Elevator West VIP', cx: 370, cy: 300, type: 'elevator' },
    { id: 'elevator_sw', name: 'Elevator Southwest', cx: 110, cy: 390, type: 'elevator' }
  ];

  const handleMapClick = (nodeName) => {
    // If origin is empty or clicked, set origin, else destination
    if (!origin) {
      setOrigin(nodeName);
      updateLocation(nodeName);
    } else {
      setDestination(nodeName);
    }
  };

  const handleRouteSearch = async (e) => {
    e.preventDefault();
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const res = await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          accessibility_needs: accessibilityNeeds
        })
      });
      const data = await res.json();
      setDirections(data.reply);
      // Sync origin back to global session context
      updateLocation(origin);
    } catch (err) {
      setDirections("Could not calculate directions at this time.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setDirections('');
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>MetLife Plaza Concourse Map</h1>

      <div className="map-view-container">
        
        {/* Interactive Map Visual */}
        <div className="glass-card map-svg-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>💡 Click map nodes to set origin/destination</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`btn-secondary`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: activeTab === 'all' ? 'rgba(79, 172, 254, 0.15)' : '' }} onClick={() => setActiveTab('all')}>All</button>
              <button className={`btn-secondary`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: activeTab === 'amenity' ? 'rgba(79, 172, 254, 0.15)' : '' }} onClick={() => setActiveTab('amenity')}>Amenities</button>
              <button className={`btn-secondary`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: activeTab === 'gate' ? 'rgba(79, 172, 254, 0.15)' : '' }} onClick={() => setActiveTab('gate')}>Gates</button>
            </div>
          </div>
          
          <svg viewBox="0 0 500 500" className="interactive-stadium-map">
            {/* Outer Concourse Ring */}
            <circle cx="250" cy="250" r="220" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="40" />
            <circle cx="250" cy="250" r="200" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="5,5" />
            
            {/* Inner Field Bowl Representation */}
            <ellipse cx="250" cy="250" rx="100" ry="140" fill="rgba(16, 185, 129, 0.03)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="4" />
            <text x="250" y="250" fill="rgba(255,255,255,0.1)" fontSize="18" fontWeight="bold" textAnchor="middle">FIELD BOWL</text>
            
            {/* Gates */}
            {(activeTab === 'all' || activeTab === 'gate') && gates.map(gate => (
              <g key={gate.id} className="map-clickable-zone" onClick={() => handleMapClick(gate.name)}>
                <circle cx={gate.cx} cy={gate.cy} r="14" fill={gate.color} opacity="0.8" />
                <circle cx={gate.cx} cy={gate.cy} r="18" fill="none" stroke={gate.color} strokeWidth="1" opacity="0.5" />
                <text x={gate.cx} y={gate.cy + 4} fill="#0a0f1d" fontSize="9" fontWeight="bold" textAnchor="middle">G</text>
                <text x={gate.cx} y={gate.cy > 250 ? gate.cy + 30 : gate.cy - 20} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">{gate.name}</text>
              </g>
            ))}

            {/* Seating Sections (Level 100 South) */}
            {(activeTab === 'all') && sections.map(sec => (
              <g key={sec.num} className="map-clickable-zone" onClick={() => handleMapClick(`Section ${sec.num}`)}>
                <rect x={sec.cx - 10} y={sec.cy - 8} width="20" height="16" rx="3" fill="#1e293b" stroke="var(--accent-cyan)" strokeWidth="1" />
                <text x={sec.cx} y={sec.cy + 3} fill="var(--accent-cyan)" fontSize="8" fontWeight="bold" textAnchor="middle">{sec.num}</text>
              </g>
            ))}

            {/* Landmarks */}
            {(activeTab === 'all') && landmarks.map(lm => (
              <g key={lm.id} className="map-clickable-zone" onClick={() => handleMapClick(lm.name)}>
                <rect x={lm.cx - 24} y={lm.cy - 10} width="48" height="20" rx="4" fill="rgba(127, 0, 255, 0.2)" stroke="var(--accent-purple)" strokeWidth="1.5" />
                <text x={lm.cx} y={lm.cy + 3} fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">{lm.name}</text>
              </g>
            ))}

            {/* Amenities */}
            {(activeTab === 'all' || activeTab === 'amenity') && amenities.map(am => {
              let emoji = '🚻';
              if (am.type === 'family_restroom') emoji = '🚼';
              if (am.type === 'nursing_station') emoji = '🍼';
              if (am.type === 'reverse_atm') emoji = '🏧';
              if (am.type === 'charging_station') emoji = '⚡';
              if (am.type === 'elevator') emoji = '🛗';
              return (
                <g key={am.id} className="map-clickable-zone" onClick={() => handleMapClick(am.name)}>
                  <circle cx={am.cx} cy={am.cy} r="10" fill="#1e293b" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <text x={am.cx} y={am.cy + 3} fontSize="10" textAnchor="middle">{emoji}</text>
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div className="map-legend-list">
            <div className="legend-item"><span className="legend-dot" style={{ background: '#4facfe' }}></span> Gates (Entry/Exit)</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-purple)' }}></span> Concourse Hubs</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-cyan)' }}></span> Seating bowl 100s</div>
            <div className="legend-item">🚻 Bathrooms</div>
            <div className="legend-item">🛗 Elevators</div>
            <div className="legend-item">🚼 Family restrooms</div>
          </div>
        </div>

        {/* Wayfinding Form panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>🧭 Wayfinding Router</h2>
          
          <form onSubmit={handleRouteSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label">Origin Location</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Click map or type gate/section..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Destination Amenity/Section</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Click map or type: restroom, section 144..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div className="form-group switch-container">
              <span className="form-label" style={{ marginBottom: 0 }}>Prefer accessible (step-free) path</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={accessibilityNeeds}
                  onChange={(e) => updateAccessibility(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ flex: 2, justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'Routing...' : 'Find Route'}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleClear}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Clear
              </button>
            </div>
          </form>

          {directions && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0, 242, 254, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 242, 254, 0.15)', borderLeft: '4px solid var(--accent-cyan)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>🧭 Directions:</h3>
              <p style={{ color: '#ffffff', fontSize: '0.95rem', lineHeight: '1.6' }}>{directions}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
