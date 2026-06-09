import { describe, expect, it } from 'vitest'
import type { SessionStats } from '../stats/index.js'
import { buildDebriefDeck, normalizeSuspectList, renderDeckHtml } from './build-slides.js'

const STATS: SessionStats = {
  teams: [
    {
      teamId: 7,
      score: 320,
      completed: true,
      phishingClicks: 1,
      solvedCount: 5,
      errorCount: 2,
      enigmes: [],
    },
    {
      teamId: 3,
      score: 0,
      completed: false,
      phishingClicks: 0,
      solvedCount: 1,
      errorCount: 4,
      enigmes: [],
    },
  ],
  global: {
    teamCount: 2,
    averageScore: 160,
    bestTeamId: 7,
    completedCount: 1,
    totalPhishingClicks: 1,
    hardestEnigme: { step: 'bdd', errors: 4 },
  },
}

const EMPTY_STATS: SessionStats = {
  teams: [],
  global: {
    teamCount: 0,
    averageScore: 0,
    bestTeamId: null,
    completedCount: 0,
    totalPhishingClicks: 0,
    hardestEnigme: null,
  },
}

describe('normalizeSuspectList', () => {
  it('trims, drops empties, and dedupes case-insensitively preserving order', () => {
    expect(normalizeSuspectList(['  Alice ', 'bob', 'ALICE', '', '   ', 'Bob'])).toEqual([
      'Alice',
      'bob',
    ])
  })

  it('returns an empty array for no input', () => {
    expect(normalizeSuspectList([])).toEqual([])
  })
})

describe('buildDebriefDeck', () => {
  it('always opens with a title slide then a global slide', () => {
    const deck = buildDebriefDeck(STATS)
    expect(deck.slides[0]?.id).toBe('title')
    expect(deck.slides[1]?.id).toBe('global')
    expect(deck.slides[1]?.lines).toContain('Score moyen : 160')
    expect(deck.slides[1]?.lines).toContain('Meilleure équipe : équipe 7')
    expect(deck.slides[1]?.lines).toContain('Énigme la plus difficile : bdd (4 erreurs)')
  })

  it('emits one slide per team with its figures', () => {
    const deck = buildDebriefDeck(STATS)
    const team7 = deck.slides.find((s) => s.id === 'team-7')
    expect(team7?.lines).toContain('Score : 320')
    const team3 = deck.slides.find((s) => s.id === 'team-3')
    expect(team3?.lines).toContain('Score : 0 (partie inachevée)')
  })

  it('appends a suspects slide only when suspects were entered', () => {
    expect(buildDebriefDeck(STATS, []).slides.some((s) => s.id === 'suspects')).toBe(false)
    const deck = buildDebriefDeck(STATS, ['Alice', 'alice', ' Bob '])
    const suspects = deck.slides.find((s) => s.id === 'suspects')
    expect(suspects?.lines).toEqual(['Alice', 'Bob'])
  })

  it('handles an empty session (no teams) without crashing', () => {
    const deck = buildDebriefDeck(EMPTY_STATS)
    expect(deck.slides[0]?.id).toBe('title')
    expect(deck.slides.some((s) => s.id.startsWith('team-'))).toBe(false)
    expect(deck.slides.find((s) => s.id === 'global')?.lines).toContain('Meilleure équipe : —')
  })
})

describe('renderDeckHtml', () => {
  it('emits one <section class="slide"> per slide with the title as <h1>', () => {
    const html = renderDeckHtml(buildDebriefDeck(STATS))
    const sectionCount = [...html.matchAll(/<section class="slide"/g)].length
    expect(sectionCount).toBe(buildDebriefDeck(STATS).slides.length)
    expect(html).toContain('<h1>Vue d’ensemble</h1>')
    expect(html.startsWith('<!doctype html>')).toBe(true)
  })

  it('escapes HTML metacharacters in dynamic content', () => {
    const html = renderDeckHtml(buildDebriefDeck(STATS, ['<script>alert(1)</script>', 'A & B']))
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('A &amp; B')
    expect(html).not.toContain('<script>alert(1)</script>')
  })
})
