'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';

export default function StaffDashboard() {
  const router = useRouter();
  const { staffSession, updateStaffSession } = useSession();

  const [crowdFeedOffline, setCrowdFeedOffline] = useState(false);
  const [crowdStatus, setCrowdStatus] = useState(null);
  const [redirects, setRedirects] = useState([]);
  const [loadingCrowd, setLoadingCrowd] = useState(false);
  const [crowdError, setCrowdError] = useState('');

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [logZone, setLogZone] = useState('AMEX Gate');
  const [logDesc, setLogDesc] = useState('');
  const [logSuccessMessage, setLogSuccessMessage] = useState('');

  // Staff Assistant Chat
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: "Operations command center active. You can log incidents here, query line lengths, or check crowd metrics." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Guard Dashboard: Redirect to login if not logged in
  useEffect(() => {
    // If mounted and no session is active, go to login
    if (!staffSession) {
      router.push('/staff/login');
    }
  }, [staffSession]);

  const fetchCrowd = async () => {
    setLoadingCrowd(true);
    setCrowdError('');
    try {
      const res = await fetch(`/api/staff/crowd?unavailable=${crowdFeedOffline}`);
      const data = await res.json();
      if (res.ok) {
        setCrowdStatus(data.zone_status);
        setRedirects(data.redirect_suggestions);
      } else {
        setCrowdError(data.message || "Failed to query crowd status");
        setCrowdStatus(null);
        setRedirects([]);
      }
    } catch (e) {
      setCrowdError("Network error querying crowd feed.");
    } finally {
      setLoadingCrowd(false);
    }
  };

  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const res = await fetch('/api/staff/incident');
      const data = await res.json();
      if (data.success) {
        setIncidents(data.incidents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (staffSession) {
      fetchCrowd();
      fetchIncidents();
    }
  }, [staffSession, crowdFeedOffline]);

  // Log Incident
  const handleLogIncident = async (e) => {
    e.preventDefault();
    if (!logDesc) return;
    setLogSuccessMessage('');
    try {
      const res = await fetch('/api/staff/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: logZone, description: logDesc })
      });
      const data = await res.json();
      if (data.success) {
        setLogSuccessMessage(data.summary);
        setLogDesc('');
        fetchIncidents();
      } else {
        setLogSuccessMessage(`Error: ${data.summary}`);
      }
    } catch (err) {
      setLogSuccessMessage("Failed to log incident onto disk.");
    }
  };

  // Staff Assistant Chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setChatMessages(prev => [...prev, { sender: 'staff', text: msg }]);

    try {
      const res = await fetch('/api/staff/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
      
      // If we logged an incident via chat, refresh incidents list!
      if (data.intent === 'incident_log') {
        fetchIncidents();
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: "Error executing command." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    updateStaffSession(null);
    // Delete local storage is handled by updateStaffSession(null)
    // Clear staff cookie by calling mock api or just replacing cookie
    document.cookie = "staff_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/staff/login');
  };

  if (!staffSession) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Access Denied: Authenticated Staff Session Required</h2>
        <button onClick={() => router.push('/staff/login')} className="btn-primary" style={{ marginTop: '1rem' }}>Go to Login</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Staff Operations Command Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Logged in as: <strong>{staffSession.staff_id}</strong> | Assignment: <strong>{staffSession.zone_assignment}</strong></p>
        </div>
        <button onClick={handleLogout} className="btn-danger">
          🚪 Logout
        </button>
      </div>

      <div className="dashboard-grid">
        
        {/* Left Side: Crowd Status & Redirect suggestions */}
        <div className="dashboard-sidebar">
          
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem' }}>📊 Crowd Density Status</h2>
              <button onClick={fetchCrowd} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Refresh</button>
            </div>

            {/* Test Toggle for Feed Failure */}
            <div className="form-group switch-container" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <span className="form-label" style={{ fontSize: '0.8rem', marginBottom: 0 }}>Simulate Feed Offline</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={crowdFeedOffline} 
                  onChange={(e) => setCrowdFeedOffline(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {loadingCrowd ? (
              <p>Fetching density status...</p>
            ) : crowdError ? (
              <div style={{ color: 'var(--status-critical)', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--status-critical)', fontSize: '0.85rem' }}>
                ⚠️ {crowdError}
              </div>
            ) : crowdStatus ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {Object.entries(crowdStatus).map(([zone, data]) => (
                  <div key={zone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{zone.toUpperCase()}</span>
                    <span className={`status-badge ${data.label}`}>{data.label} ({data.pct}%)</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Load-balancing Suggestions */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>🔄 Redirect Suggestions</h2>
            {crowdError ? (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Unavailable: Crowd feed is offline.</p>
            ) : redirects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {redirects.map((red, idx) => (
                  <div key={idx} style={{ padding: '0.8rem', background: 'rgba(79, 172, 254, 0.05)', borderLeft: '3px solid var(--accent-blue)', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <strong>{red.congested_zone.toUpperCase()} Overflow:</strong> {red.suggestion}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>All gate line densities are running normal. No redirect recommendations.</p>
            )}
          </div>
          
        </div>

        {/* Right Side: Incident Logs & Assistant Chat */}
        <div className="dashboard-main">
          
          {/* Incident Logging Form */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>📝 Report New Incident</h2>
            <form onSubmit={handleLogIncident}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Zone / Gate</label>
                  <select value={logZone} onChange={(e) => setLogZone(e.target.value)}>
                    <option value="AMEX Gate">AMEX Gate</option>
                    <option value="HCLTech Gate">HCLTech Gate</option>
                    <option value="Verizon Gate">Verizon Gate</option>
                    <option value="MetLife Gate">MetLife Gate</option>
                    <option value="Moody's Gate">Moody's Gate</option>
                    <option value="East VIP">East VIP</option>
                    <option value="West VIP">West VIP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description of event</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={logDesc} 
                    onChange={(e) => setLogDesc(e.target.value)} 
                    placeholder="e.g. Broken escalator near East Hall, minor slip and fall"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">
                Log Incident (Write to JSON)
              </button>
            </form>

            {logSuccessMessage && (
              <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', color: 'var(--status-low)' }}>
                ✅ {logSuccessMessage}
              </div>
            )}
          </div>

          {/* Active Incidents List (read from file) */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>📋 Active Venue Incident Log</h2>
            {loadingIncidents ? (
              <p>Loading incidents...</p>
            ) : incidents.length > 0 ? (
              <div className="incidents-list">
                {incidents.slice().reverse().map((inc) => (
                  <div key={inc.id} className="incident-item">
                    <div className="incident-header">
                      <span>📍 {inc.zone}</span>
                      <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ color: '#ffffff', fontSize: '0.9rem' }}>{inc.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      <span>ID: {inc.id}</span>
                      <span>Logged by: {inc.staff_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>No incidents currently logged for this event.</p>
            )}
          </div>

          {/* Operations Command Chat Assistant */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem' }}>🛡️ Staff Operations Chat Assistant</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'staff' ? 'flex-end' : 'flex-start', padding: '0.6rem 1rem', background: msg.sender === 'staff' ? 'rgba(127, 0, 255, 0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', maxWidth: '80%', fontSize: '0.85rem' }}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ask assistant to log incidents, check capacity, etc..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.2rem' }} disabled={chatLoading}>
                Send
              </button>
            </form>
          </div>

        </div>
        
      </div>
    </div>
  );
}
