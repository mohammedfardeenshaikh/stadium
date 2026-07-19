import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log("Gemini client initialized with API key.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found. Running in Offline/Deterministic Mode.");
}

// Distress/safety language pattern
export function containsDistressOrSafetyLanguage(message) {
  const msg = (message || '').toLowerCase();
  const distressWords = [
    'hurt', 'medical', 'bleeding', 'bleed', 'heart', 'chest pain', 'unconscious',
    'lost my kid', 'lost my daughter', 'lost my son', 'lost child', 'missing child',
    'fire', 'smoke', 'evacuate', 'exit', 'fight', 'aggressive', 'weapon', 'police',
    'ambulance', 'doctor', 'paramedic', 'nursing', 'danger', 'help now', 'emergency'
  ];
  return distressWords.some(word => msg.includes(word));
}

// DETERMINISTIC CLASSIFIER (Fallback)
function classifyIntentOffline(message, isStaff = false) {
  if (containsDistressOrSafetyLanguage(message)) {
    return 'emergency';
  }

  const msg = message.toLowerCase();

  if (isStaff) {
    if (msg.includes('incident') || msg.includes('log') || msg.includes('report')) {
      return 'incident_log';
    }
    if (msg.includes('crowd') || msg.includes('density') || msg.includes('busy') || msg.includes('people')) {
      return 'crowd_status';
    }
    if (msg.includes('gate') || msg.includes('wait') || msg.includes('shortest') || msg.includes('line')) {
      return 'gate_status';
    }
    if (msg.includes('lookup') || msg.includes('where is') || msg.includes('find')) {
      return 'lookup';
    }
    return 'lookup'; // default staff fallback
  } else {
    if (msg.includes('where') || msg.includes('how') || msg.includes('get to') || msg.includes('closest') || msg.includes('nearest') || msg.includes('bathroom') || msg.includes('restroom') || msg.includes('elevator') || msg.includes('escalator') || msg.includes('atm') || msg.includes('charger') || msg.includes('gate') || msg.includes('section')) {
      return 'navigation';
    }
    if (msg.includes('score') || msg.includes('game') || msg.includes('clock') || msg.includes('quarter') || msg.includes('down') || msg.includes('giants') || msg.includes('jets') || msg.includes('football') || msg.includes('penalty') || msg.includes('timeout')) {
      return 'football';
    }
    if (msg.includes('eat') || msg.includes('merch') || msg.includes('drink') || msg.includes('food') || msg.includes('photo') || msg.includes('jersey') || msg.includes('suggest') || msg.includes('recommend') || msg.includes('hungry')) {
      return 'recommendation';
    }
    // simple small talk detection
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('thanks') || msg.includes('thank you') || msg.includes('help')) {
      return 'small_talk';
    }
    return 'small_talk';
  }
}

// REAL LLM CLASSIFIER
export async function classifyIntent(message, isStaff = false) {
  // Emergency check ALWAYS pre-empts
  if (containsDistressOrSafetyLanguage(message)) {
    return 'emergency';
  }

  if (!ai) {
    return classifyIntentOffline(message, isStaff);
  }

  try {
    const labels = isStaff
      ? ['crowd_status', 'incident_log', 'gate_status', 'lookup', 'emergency']
      : ['emergency', 'navigation', 'football', 'recommendation', 'small_talk'];

    const prompt = `Classify this message from a MetLife Stadium visitor or staff member.
Message: "${message}"
Candidate labels: ${labels.join(', ')}
Respond with EXACTLY one of the candidate labels, and nothing else. No punctuation, no explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const result = response.text.trim().toLowerCase();
    if (labels.includes(result)) {
      return result;
    }
    return classifyIntentOffline(message, isStaff);
  } catch (error) {
    console.error("Gemini classification failed, falling back to offline:", error);
    return classifyIntentOffline(message, isStaff);
  }
}

// Phrase final reply using Gemini if active, else return original
export async function phraseReply(systemContext, inputMessage, baseReply, style = "friendly, concise") {
  if (!ai) {
    return baseReply;
  }

  try {
    const prompt = `Rewrite this stadium assistant response to make it sound natural, polite, and fit the style: "${style}".
Input message from user: "${inputMessage}"
Raw information to convey: "${baseReply}"
Guidelines:
1. Ground your response 100% in the raw information provided.
2. Do not invent any new facts, gates, sections, or locations that are not in the raw information.
3. Keep it brief (max 2-3 sentences).
Rewritten response:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini response phrasing failed, returning base reply:", error);
    return baseReply;
  }
}
