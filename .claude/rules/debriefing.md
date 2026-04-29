# Rules — apps/debriefing

These rules apply when editing files under `apps/debriefing/`.

- **Target device:** Android smartphone, portrait, used by the **Game Master only**.
  Not a player device. UX prioritizes speed and clarity, not immersion.
- **Kiosk:** still required (Screen Pinning), but the GM has the unlock code.
  Less aggressive lockdown than the player apps.
- **Role:** end-of-session aggregator. At the moment a session ends:
  1. Discovers all teams' apps on the LAN (via the NUC server registry).
  2. Pulls their full `event_log` via WebSocket.
  3. Lets the GM enter manually identified suspects from Espace 1 (paper-based clues).
  4. Computes per-team and global stats.
  5. Generates slides (HTML or image set) to project via vidéoprojecteur.
- **Slides:** HTML rendered in a `WebView` that's then captured to images
  for projection. Don't try to do this with native canvas — too painful.
  Templates live in `assets/slides/`.
- **Stats logic:** in `src/stats/`, pure functions, fully unit-tested.
  This is the single highest-leverage area for unit tests in the project —
  Nathanael will demo this to clients.
- **No real-time concerns.** This app runs in-between sessions. No 60fps
  pressure, no animations beyond simple fades.
- **Connection retries:** if a player app is offline at debrief time, retry
  3× with 2s backoff, then mark "logs missing" in the slide and move on.
  Don't block the GM.
