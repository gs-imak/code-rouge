// Débriefing slide builder — pure functions over the computed SessionStats.
//
// No React, no I/O: turns the aggregated stats (+ the GM's manually-entered
// Espace-1 suspects) into a projector-ready deck MODEL, and serialises that
// model to a standalone HTML string. Kept pure so it is unit-tested headlessly
// alongside the stats engine (the project's highest-leverage test area).
//
// Scope note (M2): this is the data → deck → HTML pipeline. The final visual
// design of the projected slides arrives with the GM maquettes (graphiste);
// until then App.tsx renders the deck as a plain functional preview and the
// HTML below is the export format. The eventual on-device projector path
// (render the HTML in a react-native-webview, capture to images) is a typed
// seam — NOT built here, because adding the native WebView dep can't be
// verified from this environment (CONTEXT discipline: no unverifiable native
// changes). `renderDeckHtml` produces exactly what that WebView would load.

import type { SessionStats } from '../stats/index.js'

/** One projected slide: a heading plus ordered text lines. */
export interface DebriefSlide {
  /** Stable id (slide key / log searchability), ASCII. */
  readonly id: string
  /** Player/GM-facing heading — French. */
  readonly title: string
  /** Ordered body lines — French. */
  readonly lines: readonly string[]
}

export interface DebriefDeck {
  readonly slides: readonly DebriefSlide[]
}

/**
 * Build the debrief deck from the session stats and the GM's suspect list.
 * Always emits a title slide and a global-summary slide; one slide per team;
 * and a suspects slide when the GM entered any. Deterministic — no clock, no
 * randomness — so it is snapshot-testable.
 */
export function buildDebriefDeck(
  stats: SessionStats,
  suspects: readonly string[] = [],
): DebriefDeck {
  const slides: DebriefSlide[] = []

  slides.push({
    id: 'title',
    title: 'Débriefing — Code Rouge',
    lines: [
      `${stats.global.teamCount} équipe${stats.global.teamCount > 1 ? 's' : ''}`,
      `${stats.global.completedCount} terminée${stats.global.completedCount > 1 ? 's' : ''}`,
    ],
  })

  const g = stats.global
  const globalLines = [
    `Score moyen : ${g.averageScore}`,
    `Meilleure équipe : ${g.bestTeamId === null ? '—' : `équipe ${g.bestTeamId}`}`,
    `Clics phishing (total) : ${g.totalPhishingClicks}`,
    g.hardestEnigme === null
      ? 'Énigme la plus difficile : —'
      : `Énigme la plus difficile : ${g.hardestEnigme.step} (${g.hardestEnigme.errors} erreur${g.hardestEnigme.errors > 1 ? 's' : ''})`,
  ]
  slides.push({ id: 'global', title: 'Vue d’ensemble', lines: globalLines })

  for (const t of stats.teams) {
    slides.push({
      id: `team-${t.teamId}`,
      title: `Équipe ${t.teamId}`,
      lines: [
        `Score : ${t.score}${t.completed ? '' : ' (partie inachevée)'}`,
        `Énigmes résolues : ${t.solvedCount}`,
        `Erreurs : ${t.errorCount}`,
        `Clics phishing : ${t.phishingClicks}`,
      ],
    })
  }

  const cleaned = normalizeSuspectList(suspects)
  if (cleaned.length > 0) {
    slides.push({
      id: 'suspects',
      title: 'Suspects identifiés (Espace 1)',
      lines: cleaned,
    })
  }

  return { slides }
}

/** Trim, drop empties, dedupe (case-insensitive), preserve first-seen order. */
export function normalizeSuspectList(suspects: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of suspects) {
    const value = raw.trim()
    if (value === '') continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  return out
}

/** Escape the five XML/HTML metacharacters for safe interpolation into markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Serialise a deck to a single standalone HTML document — the export format the
 * vidéoprojecteur path renders (one `<section class="slide">` per slide). All
 * dynamic content is HTML-escaped. Styling is intentionally minimal here; the
 * real slide design lands with the GM maquettes.
 */
export function renderDeckHtml(deck: DebriefDeck): string {
  const sections = deck.slides
    .map((slide) => {
      const items = slide.lines
        .map((line) => `      <li>${escapeHtml(line)}</li>`)
        .join('\n')
      return [
        `  <section class="slide" id="slide-${escapeHtml(slide.id)}">`,
        `    <h1>${escapeHtml(slide.title)}</h1>`,
        items === '' ? '    <ul></ul>' : `    <ul>\n${items}\n    </ul>`,
        '  </section>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <title>Débriefing — Code Rouge</title>',
    '</head>',
    '<body>',
    sections,
    '</body>',
    '</html>',
    '',
  ].join('\n')
}
