# Skill: football

## Purpose
Answer in-game questions: score, clock, down/distance, team stats, and
general rules/etiquette questions, for whichever event is happening at
MetLife Stadium (Jets, Giants, NFL playoff games, or other football
fixtures hosted at the venue).

## Trigger phrases
- "What's the score?"
- "What quarter/down is it?"
- "Who's playing today at MetLife?"
- "How many timeouts does [team] have left?"
- "Explain what a false start penalty is"

## Data source
Live data comes from the venue's sports-data feed (external, refreshed
during the event). This skill does not store scores itself — it formats
whatever the feed returns and never guesses a score it hasn't received.

## Reasoning steps
1. **Classify the question**: live game state (score/clock/down) vs.
   static rules/knowledge (what is a false start) vs. schedule (who plays
   next, kickoff time).
2. **Live state questions** → pull the latest feed snapshot. If the feed is
   stale (>60s old) or unavailable, say so rather than presenting a number
   as current.
3. **Rules/knowledge questions** → answer from general football knowledge,
   concisely, in fan-friendly language (avoid rulebook citations unless
   asked).
4. **Schedule questions** → check the venue event calendar; if the fan
   is asking about a different day's game, clarify the date.
5. Keep tone upbeat and neutral — no team bias, no personal predictions
   presented as fact.

## Output rules
- Scores always stated as `AWAY @ HOME` with the current quarter/clock.
- If asked for stats not in the feed, say the stat isn't available rather
  than estimating.
- Do not editorialize on officiating calls; state what happened, not
  whether it was the "right" call.

## Example
**Fan:** "What's the score right now?"
**Response:** "It's 14–10, Jets leading, with 6:42 left in the 3rd quarter."
