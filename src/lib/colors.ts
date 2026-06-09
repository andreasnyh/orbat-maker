// Shared color palette for groups and buddy teams, so both speak the same
// visual vocabulary. These are intentionally literal swatches (an identity
// palette), which the theming guide exempts from the semantic-token rule — see
// theming.md "What NOT to theme". They are used only for fills/rings/accents,
// never for text: buddy-team numbers render in the `text-strong` token so they
// stay legible (WCAG AA) across all themes.

/** Number of selectable buddy teams; also the palette length the picker shows. */
export const MAX_TEAMS = 8;

export const GROUP_COLORS = [
  { value: undefined, label: 'Default' },
  { value: '#ef4444', label: 'Red' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ec4899', label: 'Pink' },
] as const;

/** The concrete hex colors (no "Default"), used to tint buddy-team numbers. */
export const TEAM_COLORS: string[] = GROUP_COLORS.flatMap((c) =>
  c.value ? [c.value] : [],
);

/**
 * Deterministic color for a 1-based buddy-team number, cycling through the
 * palette so the same number always reads as the same color.
 */
export function teamColor(team: number): string {
  const idx = (team - 1) % TEAM_COLORS.length;
  return TEAM_COLORS[idx >= 0 ? idx : 0];
}
