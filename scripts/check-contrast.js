#!/usr/bin/env node

/**
 * WCAG contrast ratio checker for theme tokens.
 * Run: node scripts/check-contrast.js
 *
 * Thresholds:
 *   AA normal text: 4.5:1
 *   AA large text / UI components: 3.0:1
 */

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const [R, G, B] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Theme definitions (keep in sync with src/index.css) ──────────────

const themes = {
  midnight: {
    page: '#0f0f23',
    panel: '#1a1a2e',
    'panel-alt': '#16213e',
    trim: '#2a2a4a',
    'trim-hover': '#3a3a5a',
    'trim-active': '#4a4a6a',
    accent: '#4ade80',
    'accent-dim': '#15803d',
    'accent-mid': '#16a34a',
    strong: '#f3f4f6',
    body: '#e5e7eb',
    sub: '#d1d5db',
    dim: '#9ca3af',
    faint: '#6b7280',
    chrome: '#374151',
  },
  olive: {
    page: '#141612',
    panel: '#1e211a',
    'panel-alt': '#252a1e',
    trim: '#353a2e',
    'trim-hover': '#4a5040',
    'trim-active': '#606754',
    accent: '#a3be8c',
    'accent-dim': '#5b7a3a',
    'accent-mid': '#7d9c56',
    strong: '#ebeee6',
    body: '#dce0d5',
    sub: '#c2c7b9',
    dim: '#959b8a',
    faint: '#6e7463',
    chrome: '#3a4030',
  },
  sand: {
    page: '#faf8f5',
    panel: '#ffffff',
    'panel-alt': '#f5f0ea',
    trim: '#d6d3cd',
    'trim-hover': '#b8b5ae',
    'trim-active': '#9a978f',
    accent: '#a34d08',
    'accent-dim': '#92400e',
    'accent-mid': '#d97706',
    strong: '#1c1917',
    body: '#292524',
    sub: '#44403c',
    dim: '#78716c',
    faint: '#a8a29e',
    chrome: '#d6d3cd',
  },
};

// ── Pairs to check: [fg, bg, description, isLargeText] ───────────────

const pairs = [
  ['strong', 'page', 'Headings on page bg', true],
  ['strong', 'panel', 'Headings on panel bg', true],
  ['body', 'page', 'Primary text on page bg', false],
  ['body', 'panel', 'Primary text on panel bg', false],
  ['sub', 'page', 'Secondary text on page bg', false],
  ['sub', 'panel', 'Secondary text on panel bg', false],
  ['dim', 'page', 'Tertiary text on page bg', false],
  ['dim', 'panel', 'Tertiary text on panel bg', false],
  ['faint', 'page', 'Muted text on page bg', false],
  ['faint', 'panel', 'Muted text on panel bg', false],
  ['accent', 'page', 'Accent text on page bg', false],
  ['accent', 'panel', 'Accent text on panel bg', false],
  ['accent', 'panel-alt', 'Accent on panel-alt bg', false],
  ['chrome', 'page', 'Decorative on page bg', false],
  ['chrome', 'panel', 'Decorative on panel bg', false],
  ['trim', 'page', 'Border on page bg (UI)', true],
  ['trim', 'panel', 'Border on panel bg (UI)', true],
  ['trim-hover', 'page', 'Hover border on page (UI)', true],
  ['trim-hover', 'panel', 'Hover border on panel (UI)', true],
  ['body', 'trim', 'Secondary btn text on trim bg', false],
];

// ── Run checks ───────────────────────────────────────────────────────

let totalFails = 0;

for (const [themeName, colors] of Object.entries(themes)) {
  console.log(`\n=== ${themeName.toUpperCase()} ===`);
  for (const [fg, bg, desc, isLarge] of pairs) {
    const ratio = contrast(colors[fg], colors[bg]);
    const threshold = isLarge ? 3.0 : 4.5;
    const label = isLarge ? 'AA-large' : 'AA';
    const pass = ratio >= threshold;
    const status = pass ? 'PASS' : 'FAIL';
    if (!pass) totalFails++;
    const flag = pass ? '' : ' <<<';
    console.log(
      `  ${status} ${ratio.toFixed(2)}:1  ${desc} (${fg} on ${bg}, need ${threshold}:1 ${label})${flag}`,
    );
  }

  // White on accent buttons
  const whiteOnDim = contrast('#ffffff', colors['accent-dim']);
  const s1 = whiteOnDim >= 4.5 ? 'PASS' : 'FAIL';
  if (s1 === 'FAIL') totalFails++;
  console.log(
    `  ${s1} ${whiteOnDim.toFixed(2)}:1  White on accent-dim button${s1 === 'FAIL' ? ' <<<' : ''}`,
  );

  const whiteOnMid = contrast('#ffffff', colors['accent-mid']);
  const s2 = whiteOnMid >= 3.0 ? 'PASS' : 'FAIL';
  if (s2 === 'FAIL') totalFails++;
  console.log(
    `  ${s2} ${whiteOnMid.toFixed(2)}:1  White on accent-mid hover btn (AA-large)${s2 === 'FAIL' ? ' <<<' : ''}`,
  );
}

console.log(
  `\n${totalFails === 0 ? 'All checks passed!' : `${totalFails} failure(s) found.`}\n`,
);
process.exit(totalFails > 0 ? 1 : 0);
