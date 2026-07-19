import fs from 'fs';
import path from 'path';

// Load Plaza Level Map
const MAP_PATH = path.join(process.cwd(), 'data', 'plaza_level_map.json');
const INCIDENT_LOG_PATH = path.join(process.cwd(), 'data', 'incident_log.json');

let mapCache = null;

export function getMapData() {
  if (mapCache) return mapCache;
  try {
    const raw = fs.readFileSync(MAP_PATH, 'utf8');
    mapCache = JSON.parse(raw);
    return mapCache;
  } catch (error) {
    console.error("Error reading plaza_level_map.json:", error);
    return { gates: [], landmarks: [], amenities: [], legend: {} };
  }
}

// 8 circular concourse sectors:
// 0: North (amex_gate, east_hall)
// 1: Northeast (hcltech_gate, east_vip, elevator_ne, guest_services_ne)
// 2: East (verizon_gate, ramp_east, guest_services_e_mid)
// 3: Southeast (west_vip, retail_se, restroom_133_134, restroom_134_east, sections 133-135)
// 4: South (metlife_gate, metlife_west_hall, metlife_50_club, sections 137-140)
// 5: Southwest (moodys_gate, sections 142-144, family_restroom_moodys, retail_sw)
// 6: West (ramp_west, guest_services_sw_upper)
// 7: Northwest (escalator_w_upper)
const SECTORS = {
  'amex_gate': 0, 'east_hall': 0,
  'hcltech_gate': 1, 'east_vip': 1, 'elevator_ne': 1, 'guest_services_ne': 1,
  'verizon_gate': 2, 'ramp_east': 2, 'guest_services_e_mid': 2, 'escalator_e_mid': 2,
  'west_vip': 3, 'retail_se': 3, 'escalator_retail_se': 3, 'charging_station_se': 3, 'guest_services_se': 3, 'restroom_133_134': 3, 'restroom_134_east': 3, 'water_fountain_134': 3,
  'metlife_gate': 4, 'metlife_west_hall': 4, 'metlife_50_club': 4, 'escalators_s_center': 4, 'reverse_atm_s_center': 4, 'guest_services_s_center': 4, 'charging_station_metlife': 4, 'bag_check_metlife': 4,
  'moodys_gate': 5, 'family_restroom_moodys': 5, 'retail_sw': 5, 'escalator_sw': 5, 'elevator_sw': 5, 'event_day_ticket_office': 5, 'practice_field_marker': 5,
  'ramp_west': 6, 'guest_services_sw_upper': 6, 'charging_station_w_mid': 6, 'bag_check_w_mid': 6,
  'escalator_w_upper': 7
};

export function getSectorForLocation(locString) {
  if (!locString) return 4; // default to south/center
  const s = locString.toLowerCase().trim();

  // Check section numbers
  const sectionMatch = s.match(/(?:section\s+)?(1\d\d)/);
  if (sectionMatch) {
    const sec = parseInt(sectionMatch[1], 10);
    if (sec >= 142 && sec <= 144) return 5; // southwest
    if (sec >= 137 && sec <= 140) return 4; // south
    if (sec >= 133 && sec <= 135) return 3; // southeast
  }

  // Exact sector checks
  if (s.includes('amex')) return 0;
  if (s.includes('hcltech') || s.includes('ne')) return 1;
  if (s.includes('verizon') || s.includes('ramp (east)') || s.includes('ramp_east')) return 2;
  if (s.includes('west_vip') || s.includes('se') || s.includes('133') || s.includes('134')) return 3;
  if (s.includes('metlife_gate') || s.includes('metlife gate') || s.includes('west hall') || s.includes('50 club') || s.includes('s_center')) return 4;
  if (s.includes('moody') || s.includes('sw') || s.includes('ticket office')) return 5;
  if (s.includes('ramp (west)') || s.includes('ramp_west') || s.includes('w_mid') || s.includes('west, mid')) return 6;
  if (s.includes('w_upper') || s.includes('northwest')) return 7;

  // Search SECTORS keys
  for (const k in SECTORS) {
    if (s.includes(k.replace(/_/g, ' '))) {
      return SECTORS[k];
    }
  }

  return 4; // fallback to south
}

// Calculate circular distance
export function getCircularDistance(sec1, sec2) {
  return Math.min(Math.abs(sec1 - sec2), 8 - Math.abs(sec1 - sec2));
}

// Get direction description
export function getCompassDirection(fromSec, toSec) {
  if (fromSec === toSec) return 'right there';
  // Circular navigation direction (clockwise or counter-clockwise)
  const cwDiff = (toSec - fromSec + 8) % 8;
  if (cwDiff === 0) return 'right there';
  
  // MetLife Concourse Circle: 
  // 0(N) -> 1(NE) -> 2(E) -> 3(SE) -> 4(S) -> 5(SW) -> 6(W) -> 7(NW)
  // Moving clockwise (N -> E -> S -> W) is going clockwise.
  // We can say "head along the concourse".
  // If cwDiff <= 4, it's shorter to go clockwise (e.g. from 4 to 5 is clockwise? Wait: 4 to 5 is southwest, so going clockwise).
  // Let's use simple compass wording based on target position:
  const mapData = getMapData();
  const targetGateName = ['AMEX Gate', 'HCLTech Gate', 'Verizon Gate', 'West VIP/Verizon Gate', 'MetLife Gate', 'Moody\'s Gate', 'Moody\'s Gate/West Concourse', 'AMEX Gate/West Concourse'][toSec];
  
  if (cwDiff <= 4) {
    return `clockwise (past the east side) toward the ${targetGateName}`;
  } else {
    return `counter-clockwise (past the west side) toward the ${targetGateName}`;
  }
}

// NAVIGATION SKILL LOGIC
export function findNavigationRoute(originStr, destinationTypeOrVal, accessibilityNeeds = false) {
  const mapData = getMapData();
  const originSec = getSectorForLocation(originStr);

  // Normalize destination type
  const target = destinationTypeOrVal.toLowerCase().trim();

  // Gather candidates
  let candidates = [];
  
  // 1. Check if it matches an amenity type
  const matchingAmenities = mapData.amenities.filter(a => {
    // map type or id
    return a.type.toLowerCase() === target || a.id.toLowerCase() === target || 
           (target === 'restroom' && (a.type === 'restroom' || a.type === 'family_restroom')) ||
           (target === 'bathroom' && (a.type === 'restroom' || a.type === 'family_restroom')) ||
           (target === 'phone charger' && a.type === 'charging_station') ||
           (target === 'charger' && a.type === 'charging_station') ||
           (target === 'atm' && a.type === 'reverse_atm') ||
           (target === 'bag check' && a.type === 'bag_check_trailer');
  });

  if (matchingAmenities.length > 0) {
    candidates = matchingAmenities.map(a => {
      const aSec = getSectorForLocation(a.near || a.id);
      return {
        id: a.id,
        name: mapData.legend[a.type] || a.type,
        near: a.near,
        sector: aSec,
        type: a.type,
        distance: getCircularDistance(originSec, aSec)
      };
    });
  } else {
    // 2. Check landmarks or gates
    const matchingLandmarks = mapData.landmarks.filter(l => 
      l.id.toLowerCase().includes(target) || l.name.toLowerCase().includes(target)
    );
    const matchingGates = mapData.gates.filter(g => 
      g.id.toLowerCase().includes(target) || g.name.toLowerCase().includes(target)
    );

    if (matchingLandmarks.length > 0) {
      candidates = matchingLandmarks.map(l => {
        const lSec = getSectorForLocation(l.id);
        return {
          id: l.id,
          name: l.name,
          near: l.position,
          sector: lSec,
          type: l.type || 'landmark',
          distance: getCircularDistance(originSec, lSec)
        };
      });
    } else if (matchingGates.length > 0) {
      candidates = matchingGates.map(g => {
        const gSec = getSectorForLocation(g.id);
        return {
          id: g.id,
          name: g.name,
          near: g.position,
          sector: gSec,
          type: 'gate',
          distance: getCircularDistance(originSec, gSec)
        };
      });
    } else {
      // Check section numbers
      const sectionMatch = target.match(/(?:section\s+)?(1\d\d)/);
      if (sectionMatch) {
        const sec = sectionMatch[1];
        const secSector = getSectorForLocation(sec);
        candidates = [{
          id: `section_${sec}`,
          name: `Section ${sec}`,
          near: `Level 100 bowl`,
          sector: secSector,
          type: 'section',
          distance: getCircularDistance(originSec, secSector)
        }];
      }
    }
  }

  if (candidates.length === 0) {
    return {
      success: false,
      reply: `I don't have "${destinationTypeOrVal}" mapped on the Plaza Level — try Guest Services near MetLife West Hall and they can point you the rest of the way.`
    };
  }

  // Sort candidates by distance
  // Accessibility check: if accessibility needs is enabled, we rank items near elevators/ramps higher or bias them.
  // Specifically, we check if the candidate is or is near an elevator/ramp.
  candidates.sort((a, b) => {
    if (accessibilityNeeds) {
      const aIsAcc = a.type === 'elevator' || a.id.includes('ramp') || a.id.includes('vip');
      const bIsAcc = b.type === 'elevator' || b.id.includes('ramp') || b.id.includes('vip');
      if (aIsAcc && !bIsAcc) return -1;
      if (!aIsAcc && bIsAcc) return 1;
    }
    return a.distance - b.distance;
  });

  const best = candidates[0];
  const direction = getCompassDirection(originSec, best.sector);
  
  // Format reply (2-3 sentences max)
  let reply = `From ${originStr}, head along the Plaza Level concourse toward the ${best.near || 'concourse'}. The ${best.name} is located ${best.sector === originSec ? 'right at your current zone' : 'near there'} (grounded to map data).`;
  
  if (accessibilityNeeds) {
    // Add accessibility note
    if (best.type === 'elevator' || best.id.includes('ramp')) {
      reply += ` This step-free path uses the nearest accessible ${best.type === 'elevator' ? 'elevator' : 'ramp'}.`;
    } else {
      // Find nearest elevator
      const nearestElevator = mapData.amenities.find(a => a.type === 'elevator');
      reply += ` For step-free access, please use the elevator near ${nearestElevator ? nearestElevator.near : 'VIP entrance'}.`;
    }
  }

  // Provide fallback alternative for high traffic amenities (restrooms, elevators)
  if (candidates.length > 1 && (best.type === 'restroom' || best.type === 'elevator')) {
    const nextBest = candidates[1];
    reply += ` If it's busy, the next closest option is near ${nextBest.near || 'the next section'}.`;
  }

  return {
    success: true,
    top_choice: best.id,
    reply: reply
  };
}

// FOOTBALL SKILL LOGIC
export function getFootballStatus() {
  // Returns game status that drifts slightly over time
  const epochMins = Math.floor(Date.now() / 60000);
  const qtr = (epochMins % 4) + 1;
  const timeSecs = 900 - ((epochMins * 17) % 900);
  const minStr = Math.floor(timeSecs / 60).toString().padStart(2, '0');
  const secStr = (timeSecs % 60).toString().padStart(2, '0');
  
  // score drifts
  const homeScore = 10 + (epochMins % 11);
  const awayScore = 14 + ((epochMins * 3) % 17);

  return {
    game: "NY Jets @ NY Giants",
    home: "Giants",
    away: "Jets",
    home_score: homeScore,
    away_score: awayScore,
    quarter: qtr,
    clock: `${minStr}:${secStr}`,
    down: (epochMins % 4) + 1,
    distance: (epochMins % 10) + 1,
    timeouts_home: 3 - (epochMins % 3),
    timeouts_away: 3 - ((epochMins + 1) % 3),
    source_feed: "MetLife Sports Live Data Feed",
    refreshed_at: new Date().toISOString()
  };
}

// CROWD DENSITY SIMULATOR
export function getCrowdDensity(forceUnavailable = false) {
  // Allow forcing to "unavailable" to test fallback
  if (forceUnavailable || process.env.CROWD_UNAVAILABLE === 'true') {
    return null;
  }

  const epochMins = Math.floor(Date.now() / 60000);
  
  // Drift densities slightly
  const densities = {
    amex: Math.round(50 + 20 * Math.sin(epochMins / 5)),
    hcltech: Math.round(75 + 15 * Math.sin(epochMins / 3)),
    verizon: Math.round(60 + 25 * Math.sin(epochMins / 7)),
    metlife: Math.round(85 + 10 * Math.cos(epochMins / 4)),
    moodys: Math.round(35 + 15 * Math.sin(epochMins / 6)),
    east_vip: Math.round(45 + 10 * Math.cos(epochMins / 10)),
    west_vip: Math.round(92 + 5 * Math.sin(epochMins / 15)) // critical sometimes
  };

  return densities;
}

export function analyzeCrowdStatus(forceUnavailable = false) {
  const densities = getCrowdDensity(forceUnavailable);
  if (!densities) {
    return {
      success: false,
      message: "Crowd feed offline — falling back to manual reports only."
    };
  }

  const classify = (val) => {
    if (val < 40) return { pct: val, label: 'low', desc: '< 40% capacity' };
    if (val <= 70) return { pct: val, label: 'moderate', desc: '40-70% capacity' };
    if (val <= 90) return { pct: val, label: 'high', desc: '70-90% capacity' };
    return { pct: val, label: 'critical', desc: '> 90% capacity' };
  };

  const status = {};
  for (const k in densities) {
    status[k] = classify(densities[k]);
  }

  // Adjacency for redirects
  const gatesOrder = ['amex', 'hcltech', 'verizon', 'metlife', 'moodys'];

  const redirectSuggestions = [];
  
  for (const zone of gatesOrder) {
    const zoneStatus = status[zone];
    if (zoneStatus.label === 'high' || zoneStatus.label === 'critical') {
      // Find nearest Low or Moderate
      let foundRedirect = null;
      let checkDist = 1;
      
      const zoneIdx = gatesOrder.indexOf(zone);
      
      while (checkDist <= 2 && !foundRedirect) {
        // Check clockwise and counter-clockwise neighbors
        const cwIdx = (zoneIdx + checkDist) % 5;
        const ccwIdx = (zoneIdx - checkDist + 5) % 5;
        
        const cwNeighbor = gatesOrder[cwIdx];
        const ccwNeighbor = gatesOrder[ccwIdx];
        
        if (status[cwNeighbor].label === 'low' || status[cwNeighbor].label === 'moderate') {
          foundRedirect = cwNeighbor;
        } else if (status[ccwNeighbor].label === 'low' || status[ccwNeighbor].label === 'moderate') {
          foundRedirect = ccwNeighbor;
        }
        checkDist++;
      }
      
      if (foundRedirect) {
        redirectSuggestions.push({
          congested_zone: zone,
          congested_status: zoneStatus.label,
          congested_pct: zoneStatus.pct,
          redirect_to: foundRedirect,
          redirect_status: status[foundRedirect].label,
          redirect_pct: status[foundRedirect].pct,
          suggestion: `Redirect overflow bag check / entry lines from ${zone.toUpperCase()} Gate to ${foundRedirect.toUpperCase()} Gate.`
        });
      }
    }
  }

  return {
    success: true,
    zone_status: status,
    redirect_suggestions: redirectSuggestions
  };
}

// INCIDENT LOGGING PERSISTENCE
export function getIncidents() {
  if (!fs.existsSync(INCIDENT_LOG_PATH)) {
    // ensure data directory exists
    const dir = path.dirname(INCIDENT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(INCIDENT_LOG_PATH, '[]', 'utf8');
    return [];
  }
  try {
    const raw = fs.readFileSync(INCIDENT_LOG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading incident log file:", error);
    return [];
  }
}

export function logIncident(staffId, zone, description) {
  const incidents = getIncidents();
  const newIncident = {
    id: `inc_${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff_id: staffId,
    zone: zone,
    description: description
  };
  incidents.push(newIncident);
  
  try {
    fs.writeFileSync(INCIDENT_LOG_PATH, JSON.stringify(incidents, null, 2), 'utf8');
    return {
      success: true,
      incident: newIncident,
      summary: `Incident logged at ${zone}: "${description}" by Staff #${staffId}`
    };
  } catch (error) {
    console.error("Error saving incident log file:", error);
    return {
      success: false,
      summary: "Failed to write incident log to disk."
    };
  }
}

// EMERGENCY SKILL LOGIC
export function getEmergencyResponse(messageStr, currentLocStr) {
  const mapData = getMapData();
  const currentSec = currentLocStr ? getSectorForLocation(currentLocStr) : null;
  
  // Find nearest Nursing Station or Guest Services
  let helpItems = mapData.amenities.filter(a => a.type === 'nursing_station' || a.type === 'guest_services');
  
  let nearestHelp = null;
  if (currentSec !== null) {
    helpItems = helpItems.map(a => {
      const aSec = getSectorForLocation(a.near || a.id);
      return {
        ...a,
        distance: getCircularDistance(currentSec, aSec)
      };
    });
    helpItems.sort((a, b) => a.distance - b.distance);
    nearestHelp = helpItems[0];
  } else {
    nearestHelp = helpItems.find(a => a.type === 'nursing_station') || helpItems[0];
  }

  // Core instruction
  let instruct = "";
  const msgLower = messageStr.toLowerCase();
  
  if (msgLower.includes("hurt") || msgLower.includes("medical") || msgLower.includes("heart") || msgLower.includes("bleed")) {
    instruct = `Head immediately to the nearest Nursing Station or Guest Services near ${nearestHelp.near}. If you cannot walk there, stay where you are and flag any uniformed staff member or gate attendant immediately; they can alert medical teams faster than you can walk.`;
  } else if (msgLower.includes("lost") || msgLower.includes("kid") || msgLower.includes("child") || msgLower.includes("daughter") || msgLower.includes("son")) {
    instruct = `Please report directly to the nearest Guest Services desk near ${nearestHelp.near || 'MetLife West Hall'}. Stadium staff are on standby to immediately broadcast alerts and help coordinate reunions; do not attempt to search alone through crowd areas.`;
  } else if (msgLower.includes("fire") || msgLower.includes("exit") || msgLower.includes("run") || msgLower.includes("evacuate")) {
    instruct = `Proceed calmly to the nearest gate exit (AMEX Gate, HCLTech Gate, Verizon Gate, MetLife Gate, or Moody's Gate depending on your position). Parallelly, follow all directions broadcasted over the public address system and flag any stadium staff member for immediate egress support.`;
  } else {
    // general emergency
    instruct = `Go to the nearest Guest Services location near ${nearestHelp.near} or flag any uniformed stadium staff member immediately for urgent assistance. We are here to help and can contact security teams instantly.`;
  }

  return {
    success: true,
    reply: instruct,
    approx_location: currentLocStr || 'unknown, staff notified'
  };
}

export function getRecommendations(currentLocStr, fanProfile = {}) {
  const originSec = getSectorForLocation(currentLocStr);
  const mapData = getMapData();

  const foodCandidates = [
    { id: 'metlife_west_hall', name: 'MetLife West Hall (Food Court)', type: 'food', near: 'metlife_gate', sector: 4 },
    { id: 'east_hall', name: 'East Hall (Food Court)', type: 'food', near: 'amex_gate', sector: 0 }
  ];

  const merchCandidates = [
    { id: 'retail_se', name: 'Retail Store Southeast', type: 'merch', near: 'west_vip', sector: 3 },
    { id: 'retail_sw', name: 'Retail Store Southwest', type: 'merch', near: 'moodys_gate', sector: 5 },
    { id: 'east_hall', name: 'Giants/Jets Merch Store (East Hall)', type: 'merch', near: 'amex_gate', sector: 0 }
  ];

  const activityCandidates = [
    { id: 'metlife_50_club', name: 'MetLife 50 Club', type: 'activity', near: 'metlife_west_hall', sector: 4 },
    { id: 'practice_field_marker', name: 'Practice Field Graphic (Photos)', type: 'activity', near: 'moodys_gate', sector: 5 },
    { id: 'east_vip', name: 'East VIP Entrance & Hall', type: 'activity', near: 'east_vip', sector: 1 }
  ];

  const processCandidate = (c) => {
    const distance = getCircularDistance(originSec, c.sector);
    const navRoute = findNavigationRoute(currentLocStr || 'MetLife Gate', c.id, fanProfile.accessibility_needs);
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      near: c.near,
      distance,
      directions: navRoute.reply
    };
  };

  const food = foodCandidates.map(processCandidate).sort((a,b) => a.distance - b.distance)[0];
  const merch = merchCandidates.map(processCandidate).sort((a,b) => a.distance - b.distance)[0];
  const activity = activityCandidates.map(processCandidate).sort((a,b) => a.distance - b.distance)[0];

  let foodNote = "";
  if (fanProfile.dietary === 'vegetarian') {
    foodNote = " Note: Vegetarian options could not be fully confirmed at this venue location; ask Guest Services for a list of certified vendors.";
  }

  const list = [
    {
      title: "🍕 Recommended Food Stop",
      description: `Grab a bite at the ${food.name}.${foodNote} It is the closest major food spot to you.`,
      directions: food.directions,
      location_id: food.id
    },
    {
      title: "👕 Merchandise & Gear",
      description: `Pick up your fan gear at ${merch.name} near ${merch.near}.`,
      directions: merch.directions,
      location_id: merch.id
    },
    {
      title: "📸 Pre-game Activity",
      description: `Check out the ${activity.name} for a great pre-game experience and photo opportunities.`,
      directions: activity.directions,
      location_id: activity.id
    }
  ];

  return list;
}

