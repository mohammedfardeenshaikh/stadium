import { NextResponse } from 'next/server';
import { classifyIntent, phraseReply } from '@/lib/llm';
import { 
  findNavigationRoute, 
  getFootballStatus, 
  getRecommendations, 
  getEmergencyResponse,
  getMapData
} from '@/lib/stadium';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey) {
  try { ai = new GoogleGenAI({ apiKey }); } catch(e) {}
}

// Entity extraction using Gemini or fallback
async function extractNavigationEntities(message, sessionLocation) {
  let origin = sessionLocation || null;
  let destination = null;

  if (ai) {
    try {
      const mapData = getMapData();
      const prompt = `You are a helper that extracts navigation origin and destination from a stadium fan message.
Message: "${message}"
Session Current Location: "${sessionLocation || 'none'}"

Map landmarks and gates available:
Gates: ${mapData.gates.map(g => g.name).join(', ')}
Landmarks: ${mapData.landmarks.map(l => l.name).join(', ')}
Amenities: restroom, family_restroom, retail_location, water_fountain, charging_station, reverse_atm, guest_services, bag_check_trailer, nursing_station, elevator, escalator, stairs, to_rail_station
Sections: 133 to 144

Respond with a JSON object ONLY, matching this schema:
{
  "origin": "string or null",
  "destination": "string or null"
}
Do not add markdown formatting other than raw JSON text. No explanations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const resText = response.text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(resText);
      if (json.origin) origin = json.origin;
      if (json.destination) destination = json.destination;
    } catch (error) {
      console.error("Gemini entity extraction failed, using fallback:", error);
    }
  }

  // Offline / Fallback Regex Extraction
  if (!destination) {
    const msg = message.toLowerCase();
    
    // Look for destination
    if (msg.includes('restroom') || msg.includes('bathroom') || msg.includes('toilet') || msg.includes('wc')) {
      destination = 'restroom';
    } else if (msg.includes('family restroom') || msg.includes('family bathroom')) {
      destination = 'family_restroom';
    } else if (msg.includes('charger') || msg.includes('charging') || msg.includes('phone')) {
      destination = 'charging_station';
    } else if (msg.includes('bag') || msg.includes('luggage')) {
      destination = 'bag_check_trailer';
    } else if (msg.includes('atm') || msg.includes('cash') || msg.includes('money')) {
      destination = 'reverse_atm';
    } else if (msg.includes('guest service') || msg.includes('information')) {
      destination = 'guest_services';
    } else if (msg.includes('nurse') || msg.includes('nursing') || msg.includes('baby') || msg.includes('breastfeed')) {
      destination = 'nursing_station';
    } else if (msg.includes('elevator') || msg.includes('lift')) {
      destination = 'elevator';
    } else if (msg.includes('escalator')) {
      destination = 'escalator';
    } else if (msg.includes('rail') || msg.includes('train') || msg.includes('station')) {
      destination = 'to_rail_station';
    } else if (msg.includes('water') || msg.includes('drink fountain')) {
      destination = 'water_fountain';
    } else {
      // Look for section numbers (133-144)
      const secMatch = msg.match(/(?:section\s+)?(1\d\d)/);
      if (secMatch) {
        destination = `section ${secMatch[1]}`;
      } else {
        // Look for gates
        if (msg.includes('amex')) destination = 'AMEX Gate';
        else if (msg.includes('hcltech') || msg.includes('hcl')) destination = 'HCLTech Gate';
        else if (msg.includes('verizon')) destination = 'Verizon Gate';
        else if (msg.includes('metlife')) destination = 'MetLife Gate';
        else if (msg.includes('moody')) destination = 'Moody\'s Gate';
        else if (msg.includes('east hall')) destination = 'East Hall';
        else if (msg.includes('west hall')) destination = 'MetLife West Hall';
      }
    }
  }

  // If origin not set by LLM, try to extract from message
  if (!origin || origin === 'none') {
    const msg = message.toLowerCase();
    const originMatch = msg.match(/(?:i am at|i'm at|standing near|at section|from)\s+([a-zA-Z0-9\s']{3,15})/);
    if (originMatch) {
      origin = originMatch[1].trim();
    } else {
      // Look for sections/gates directly
      const secMatch = msg.match(/(?:section\s+)?(1\d\d)/);
      if (secMatch) {
        origin = `section ${secMatch[1]}`;
      } else if (msg.includes('amex')) origin = 'AMEX Gate';
      else if (msg.includes('hcltech') || msg.includes('hcl')) origin = 'HCLTech Gate';
      else if (msg.includes('verizon')) origin = 'Verizon Gate';
      else if (msg.includes('metlife')) origin = 'MetLife Gate';
      else if (msg.includes('moody')) origin = 'Moody\'s Gate';
    }
  }

  return { origin, destination };
}

export async function POST(request) {
  try {
    const { message, session } = await request.json();
    const currentSession = session || {};
    const currentLoc = currentSession.current_location;
    const profile = currentSession.fan_profile || {};
    const accessibility = currentSession.accessibility_needs || false;

    if (!message) {
      return NextResponse.json({ reply: "I didn't receive a message. How can I help you today?" });
    }

    // 1. Classify intent
    const intent = await classifyIntent(message, false);

    let reply = "";
    let flowSuccess = true;

    // 2. Route based on intent
    if (intent === 'emergency') {
      const emergencyRes = getEmergencyResponse(message, currentLoc);
      reply = emergencyRes.reply;
    } else if (intent === 'navigation') {
      const { origin, destination } = await extractNavigationEntities(message, currentLoc);
      
      if (!origin) {
        reply = "Which gate or section are you closest to right now?";
        flowSuccess = false;
      } else if (!destination) {
        reply = `I understand you want to navigate from ${origin}. What amenity (restroom, food, charger, etc.) or section are you looking for?`;
        flowSuccess = false;
      } else {
        const navRes = findNavigationRoute(origin, destination, accessibility);
        reply = navRes.reply;
        flowSuccess = navRes.success;
      }
    } else if (intent === 'football') {
      const fStatus = getFootballStatus();
      // Formulate natural language reply
      const baseInfo = `The game is ${fStatus.game}. The score is ${fStatus.away} ${fStatus.away_score} @ ${fStatus.home} ${fStatus.home_score} in the ${fStatus.quarter}rd quarter, with ${fStatus.clock} left. It is currently ${fStatus.down} down and ${fStatus.distance} to go. Giants have ${fStatus.timeouts_home} timeouts left; Jets have ${fStatus.timeouts_away} left.`;
      
      reply = await phraseReply(
        "You are the stadium assistant answering a game status question.",
        message,
        baseInfo,
        "upbeat, neutral, stating the score as AWAY @ HOME with quarter/clock"
      );
    } else if (intent === 'recommendation') {
      const recommendations = getRecommendations(currentLoc || 'MetLife Gate', profile);
      const topChoice = recommendations[0];
      
      const baseInfo = `I suggest checking out ${topChoice.title}: ${topChoice.description} Directions: ${topChoice.directions}`;
      
      reply = await phraseReply(
        "You are the stadium assistant offering a location-aware recommendation.",
        message,
        baseInfo,
        "helpful, focusing on the closest option, mentioning the directions clearly"
      );
    } else {
      // Small talk
      reply = "I can help you find something on the concourse, check the score, get a food/merch suggestion, or get help fast if something's wrong. What do you need?";
    }

    return NextResponse.json({
      reply,
      intent,
      success: flowSuccess
    });

  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json({ 
      reply: "Sorry, I encountered an error processing that request. Please try again or flag a staff member.",
      intent: "unknown",
      success: false 
    }, { status: 500 });
  }
}
