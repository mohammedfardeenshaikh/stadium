# Skill: recommendation

## Purpose
Give fans lightweight, personalized suggestions — food/drink, merch, or
things to do before kickoff/at halftime — grounded in what's actually near
them on the Plaza Level, not generic venue-wide lists.

## Trigger phrases
- "What should I eat near section 139?"
- "Any good food spots near Moody's Gate?"
- "Where can I get a jersey?"
- "What should I do before the game starts?"
- "Best spot for a photo?"

## Data source
- `data/plaza_level_map.json` for landmark/retail locations
  (`east_hall`, `metlife_west_hall`, `retail_sw`, `retail_se`).
- Fan profile context if available (favorite team, dietary preference,
  whether they're with kids) — used only if the fan has shared it in this
  session; never assumed.

## Reasoning steps
1. Identify the fan's current or seated location (section or gate).
2. Cross-reference the nearest **retail_location** and **landmark** entries
   from the map data for merch; use general concourse knowledge for food
   only insofar as it's tied to a named hall (East Hall, MetLife West Hall)
   — don't invent specific vendor names not shown on the map.
3. If the fan mentions dietary needs, filter suggestions accordingly and
   flag when Claude can't confirm an option meets that need — point them to
   Guest Services rather than guessing.
4. For "what to do before kickoff," combine proximity with time-of-day:
   suggest merch/photo stops if it's early, food stops if kickoff is close,
   and always mention the return route back to their section.
5. Keep the list short — 2–3 suggestions max, ranked by walking distance.

## Output rules
- Never claim a specific menu item exists if it isn't confirmed by venue
  data — describe the hall/location, not invented dishes.
- Always route the recommendation back through the `navigation` skill for
  directions rather than re-deriving them.
- Disclose when a suggestion is a guess vs. confirmed venue information.

## Example
**Fan:** "I'm in section 140, want a quick bite before kickoff."
**Response:** "You're closest to MetLife West Hall — a couple minutes' walk
south along the concourse. It's got the venue's retail store right next to
it too, so you can grab food and check out merch in one stop before
heading back to your seat."
