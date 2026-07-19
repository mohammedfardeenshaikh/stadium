# Skill: navigation

## Purpose
Give fans and staff turn-by-turn, plain-language wayfinding around MetLife
Stadium using the **Plaza Level** concourse map as ground truth. This is the
skill every other flow calls whenever a response needs "how do I get to X."

## Trigger phrases
- "Where is the nearest bathroom / restroom / family restroom?"
- "How do I get to section 139?"
- "Closest gate to me / closest exit"
- "Where can I charge my phone / find an ATM / check my bag?"
- "Is there an elevator near here?"
- "Where's the merch store / East Hall / MetLife West Hall?"
- "I'm at [gate/section], take me to [amenity/section]"

## Data source
`data/plaza_level_map.json` — structured extraction of the Plaza Level map,
containing:
- `gates`: AMEX, HCLTech, Verizon, MetLife, Moody's, each with a compass
  position (N / NE / E / S / SW) and the amenities clustered around it.
- `landmarks`: East Hall, East VIP, West VIP, MetLife West Hall, MetLife 50
  Club, Event Day Ticket Office, east/west accessibility ramps.
- `seating_sections_level_100_south`: the visible Level 100 bowl sections
  (144, 143, 142, 140, 139, 137, 135, 134, 133), which sit on the south side
  of the field, between Moody's Gate and Verizon Gate.
- `amenities`: every icon on the legend (restroom, family restroom, retail,
  water fountain, charging station, reverse ATM, guest services, bag check
  trailer, nursing station, elevator, escalator, stairs, rail link) tagged
  with the nearest named gate or landmark.

## Reasoning steps
1. **Locate the fan.** Ask for or infer their current position: a gate name,
   a section number, or a landmark ("I just came through Moody's Gate").
   If unknown, ask exactly one clarifying question — do not guess a gate.
2. **Resolve the destination.** Map the request to an amenity type
   (`restroom`, `charging_station`, `elevator`, etc.) or a specific
   section/landmark id in the data file.
3. **Rank candidates by proximity**, using compass position as the primary
   signal (same side of the bowl > adjacent side > opposite side), then by
   whether the candidate sits directly at a named landmark the fan already
   recognizes (gate, VIP entrance, Hall).
4. **Compose the direction** in this format:
   `From <origin>, head <compass direction> along the Plaza Level concourse
   toward <landmark/gate>. <Amenity> is <right at / just past / directly
   across from> <landmark>.`
5. **Offer the next-nearest alternative** in one short clause if the first
   option could plausibly be crowded (restrooms, elevators during
   halftime).
6. **Accessibility flag.** If the fan mentions a wheelchair, stroller, or
   asks for step-free access, prefer routes via `ramp_west`/`ramp_east` and
   the elevators at East VIP / West VIP / southwest concourse over
   escalators or stairs, and say so explicitly.

## Section-to-gate quick reference
Level 100 sections 144–133 run west→east across the south end of the bowl:
- **144–142** are closest to **Moody's Gate** (southwest).
- **140–137** are closest to **MetLife Gate** and **MetLife West Hall**
  (south-center), near the Reverse ATM and MetLife 50 Club.
- **135–133** are closest to **West VIP** and **Verizon Gate** (southeast).

## Output rules
- Keep directions to 2–3 sentences unless the fan asks for more detail.
- Always name the nearest **gate or landmark**, never raw coordinates.
- If the requested amenity has no entry within a reasonable walk, say so
  plainly instead of inventing a location.
- Never fabricate an icon or amenity that isn't in `plaza_level_map.json`.

## Example
**Fan:** "I'm at the HCLTech Gate, where's the closest bathroom?"
**Response:** "From HCLTech Gate, the nearest restroom is on the east side
of the Level 100 concourse near sections 133–134 — head south along the
concourse past the escalators and Guest Services, it's just past the Level
100 entrance. If that line is long, there's another restroom cluster
further south near West VIP."
