'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * SessionContext
 * 
 * DESIGN CHOICE / PERSISTENCE PLAN:
 * In accordance with Requirement #4, all session states including
 * - current_location
 * - fan_profile (favorite_team, dietary_prefs)
 * - accessibility_needs (step-free routing bias)
 * - staff_session (authenticated staff token/id, zone assignment)
 * are stored in a client-side React Context combined with localStorage persistence.
 * This enables the Fan Dashboard, AI Chat, Navigation map, and Staff views to seamlessly
 * share wayfinding origin points and user profiles without a backend database.
 */

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState('MetLife Gate');
  const [fanProfile, setFanProfile] = useState({ favoriteTeam: 'Giants', dietary: 'standard' });
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(false);
  const [staffSession, setStaffSession] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem('current_location');
      const savedProfile = localStorage.getItem('fan_profile');
      const savedAcc = localStorage.getItem('accessibility_needs');
      const savedStaff = localStorage.getItem('staff_session');

      if (savedLoc) setCurrentLocation(savedLoc);
      if (savedProfile) setFanProfile(JSON.parse(savedProfile));
      if (savedAcc) setAccessibilityNeeds(savedAcc === 'true');
      if (savedStaff) setStaffSession(JSON.parse(savedStaff));
    } catch (e) {
      console.error("Failed to load session from localStorage:", e);
    }
  }, []);

  // Save changes to localStorage
  const updateLocation = (loc) => {
    setCurrentLocation(loc);
    localStorage.setItem('current_location', loc);
  };

  const updateProfile = (profile) => {
    setFanProfile(profile);
    localStorage.setItem('fan_profile', JSON.stringify(profile));
  };

  const updateAccessibility = (needsAcc) => {
    setAccessibilityNeeds(needsAcc);
    localStorage.setItem('accessibility_needs', needsAcc ? 'true' : 'false');
  };

  const updateStaffSession = (session) => {
    setStaffSession(session);
    if (session) {
      localStorage.setItem('staff_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('staff_session');
    }
  };

  return (
    <SessionContext.Provider value={{
      currentLocation,
      fanProfile,
      accessibilityNeeds,
      staffSession,
      updateLocation,
      updateProfile,
      updateAccessibility,
      updateStaffSession
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
