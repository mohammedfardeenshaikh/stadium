import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { classifyIntent, phraseReply } from '@/lib/llm';
import { 
  findNavigationRoute, 
  analyzeCrowdStatus, 
  logIncident, 
  getEmergencyResponse,
  getMapData 
} from '@/lib/stadium';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey) {
  try { ai = new GoogleGenAI({ apiKey }); } catch(e) {}
}

function getStaffSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('staff_session');
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(sessionCookie.value);
    if (session.role === 'staff') return session;
  } catch (e) {}
  return null;
}

async function extractIncidentDetails(message) {
  let zone = 'MetLife Gate';
  let description = message;

  if (ai) {
    try {
      const mapData = getMapData();
      const prompt = `Extract incident zone and description from this staff message.
Message: "${message}"
Available zones: ${mapData.gates.map(g => g.name).join(', ')}, ${mapData.landmarks.map(l => l.name).join(', ')}

Return a JSON object ONLY:
{
  "zone": "string",
  "description": "string"
}
Do not add markdown formatting other than raw JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const resText = response.text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(resText);
      if (json.zone) zone = json.zone;
      if (json.description) description = json.description;
    } catch (e) {
      console.error("Gemini incident detail extraction failed:", e);
    }
  } else {
    // Fallback parsing
    const msg = message.toLowerCase();
    if (msg.includes('amex')) zone = 'AMEX Gate';
    else if (msg.includes('hcltech') || msg.includes('hcl')) zone = 'HCLTech Gate';
    else if (msg.includes('verizon')) zone = 'Verizon Gate';
    else if (msg.includes('moody')) zone = 'Moody\'s Gate';
    else if (msg.includes('metlife')) zone = 'MetLife Gate';
    else if (msg.includes('east hall')) zone = 'East Hall';
    else if (msg.includes('west hall')) zone = 'MetLife West Hall';
    
    // Description is the text after "log", "incident", "report", etc.
    const cleanMsg = message.replace(/(?:log|incident|report|at|near|gate|status)/gi, '').trim();
    if (cleanMsg.length > 5) {
      description = cleanMsg;
    }
  }

  return { zone, description };
}

export async function POST(request) {
  // Guard: Ensure staff session
  const session = getStaffSession();
  if (!session) {
    return NextResponse.json({ 
      reply: "This tool is for authenticated staff sessions only.", 
      success: false 
    }, { status: 401 });
  }

  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ reply: "Received empty message." });
    }

    // 1. Classify intent
    const intent = await classifyIntent(message, true);

    let reply = "";
    let flowSuccess = true;

    // 2. Branch
    if (intent === 'emergency') {
      const emergencyRes = getEmergencyResponse(message, session.zone_assignment);
      reply = `[STAFF EMERGENCY WARNING] ${emergencyRes.reply}`;
    } else if (intent === 'crowd_status' || intent === 'gate_status') {
      const crowdRes = analyzeCrowdStatus(false);
      if (!crowdRes.success) {
        reply = "Crowd feed offline — falling back to manual reports only.";
        flowSuccess = false;
      } else {
        // Summarize status
        let statusLines = Object.entries(crowdRes.zone_status)
          .map(([k, v]) => `- **${k.toUpperCase()}**: ${v.label.toUpperCase()} (${v.pct}% capacity)`)
          .join('\n');
        
        let suggestLines = crowdRes.redirect_suggestions
          .map(s => `- ${s.suggestion}`)
          .join('\n');

        reply = `**Zone Status Report**:\n${statusLines}\n\n**Redirect Suggestions**:\n${suggestLines || 'None. Flows are normal.'}`;
      }
    } else if (intent === 'incident_log') {
      const { zone, description } = await extractIncidentDetails(message);
      const logRes = logIncident(session.staff_id, zone, description);
      
      if (logRes.success) {
        // Follow staff_assistant.yaml confirmation format exactly
        reply = `Logged: ${logRes.summary} — anything else to add?`;
      } else {
        reply = `Failed to log incident: ${logRes.summary}`;
        flowSuccess = false;
      }
    } else {
      // map lookup / navigation for staff
      const navRes = findNavigationRoute(session.zone_assignment || 'MetLife Gate', message, false);
      reply = navRes.reply;
      flowSuccess = navRes.success;
    }

    return NextResponse.json({
      reply,
      intent,
      success: flowSuccess
    });

  } catch (error) {
    console.error("Staff Chat API error:", error);
    return NextResponse.json({ 
      reply: "Operations center encountered an error processing that message.",
      intent: "unknown",
      success: false 
    }, { status: 500 });
  }
}
export async function GET() {
  const session = getStaffSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, session });
}
