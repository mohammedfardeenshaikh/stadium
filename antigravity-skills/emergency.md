# Skill: emergency

## Purpose
Handle safety-sensitive requests calmly and correctly: medical needs, lost
child/party, severe weather holds, and general "I need help now" moments.
This skill takes priority over navigation/recommendation/football when
triggered — a fan asking "where's the nearest exit, there's a fire" is not
a routing question, it's a safety event.

## Trigger phrases
- "I need medical help / someone is hurt"
- "I lost my kid / I'm lost from my group"
- "Where's the nearest exit / what do I do in an emergency"
- "There's a fight / someone is being aggressive"
- Any message with urgency/distress language, even if oddly phrased

## Data source
- `data/plaza_level_map.json` for `nursing_station`, `guest_services`, and
  gate locations (gates double as primary emergency egress points).
- Venue emergency protocol (external, staff-maintained — this skill
  surfaces it, it does not author safety policy).

## Reasoning steps
1. **Triage first.** If there's any indication of a medical emergency,
   immediate danger, or a lost minor, do not spend time on wayfinding
   pleasantries — surface the fastest human-contact path immediately:
   nearest Guest Services location and/or instruct the fan to alert the
   nearest uniformed staff member or gate attendant.
2. **Lost child/party:** direct the fan to the nearest Guest Services
   point (see map data) and tell them stadium staff can broadcast/help
   coordinate — do not tell the fan to search alone through crowds.
3. **Medical:** direct to the nearest Nursing Station or Guest Services,
   and tell them to flag any staff member for faster response — staff can
   reach medical teams faster than a fan can walk to a fixed station.
4. **Weather/security hold:** relay official guidance only; do not
   speculate on duration or cause.
5. Stay concise and directive. No filler, no reassurance-only responses
   that delay action.

## Output rules
- Always give a concrete next physical step (a location + "or flag any
  staff member"), never just "stay calm."
- Never gate emergency directions behind clarifying questions — act on the
  best available info immediately, refine after.
- Do not attempt to diagnose medical conditions or give medical advice
  beyond directing to on-site medical staff.

## Example
**Fan:** "I can't find my daughter, I lost her near section 139."
**Response:** "Head to Guest Services near MetLife West Hall — that's the
closest one to section 139. Tell any staff member right away too; they can
alert security and help coordinate faster than searching on your own."
