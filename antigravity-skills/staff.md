# Skill: staff

## Purpose
Support venue staff (guest services, ushers, operations) with the
higher-context tools fans shouldn't see: crowd density by concourse zone,
incident logging, gate-load balancing suggestions, and quick lookups
against the same Plaza Level map data fans use, but with operational
detail layered on top.

## Trigger phrases (staff-authenticated sessions only)
- "What's the crowd status near section 133-134?"
- "Log an incident at Moody's Gate"
- "Which gate has the shortest line right now?"
- "Suggest a bag-check redirect for the west side"

## Data source
- `data/plaza_level_map.json` for zone/gate/amenity structure.
- Live crowd-density feed (external, staff-only).
- Incident log (write access — staff only).

## Reasoning steps
1. **Confirm staff context.** This skill only activates in an authenticated
   staff session (see `staff_assistant.yaml`); if invoked without that
   context, decline and route the user to the fan-facing skills instead.
2. **Crowd/zone questions**: map the requested zone to the nearest gates
   and amenity clusters in the data file, then report live density from
   the feed against that zone.
3. **Load-balancing suggestions**: when a gate or restroom cluster is
   over capacity, suggest the nearest under-capacity alternative from the
   same data file (e.g., redirecting overflow from West VIP restrooms to
   the sections 133-134 restroom cluster).
4. **Incident logging**: capture gate/zone, timestamp, and a short
   description; confirm back to staff what was logged before closing the
   loop. Never log an incident silently.
5. Keep responses operational and terse — staff need actionable output,
   not narrative.

## Output rules
- Never expose raw incident logs or crowd data to a fan-facing session.
- Always confirm writes (incident logs) back to the staff member before
  considering the action complete.
- If live feed data is unavailable, say so explicitly rather than
  estimating crowd levels.

## Example
**Staff:** "Shortest line right now?"
**Response:** "Moody's Gate and Verizon Gate are both under 5-minute waits;
AMEX Gate is running about 15 minutes. Consider directing overflow toward
Moody's or Verizon."
