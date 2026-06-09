import clsx from 'clsx';
import { Hash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToggle } from '../../hooks/useToggle';
import { MAX_TEAMS, teamColor } from '../../lib/colors';

const TEAM_NUMBERS = Array.from({ length: MAX_TEAMS }, (_, i) => i + 1);

// Identity colors are used only for fill + edge, never for text — the digit
// uses the high-contrast `text-strong` token so it stays legible (WCAG AA) on
// every theme. Box-shadow is reserved for the focus/selected rings, so the
// swatch edge is a real border instead.
function swatchStyle(hex: string): React.CSSProperties {
  return { backgroundColor: `${hex}26`, borderColor: `${hex}80` };
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';

interface BuddyTeamBadgeProps {
  /** Current buddy-team number for this slot, if any. */
  team?: number;
  /** Set the team number, or clear it with `null`. Omit for read-only. */
  onChange?: (team: number | null) => void;
}

export function BuddyTeamBadge({ team, onChange }: BuddyTeamBadgeProps) {
  const [open, toggleOpen, setOpen] = useToggle();
  const [above, setAbove] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Move focus into the popover (selected number, else the first) on open.
  useEffect(() => {
    if (!open) return;
    const root = popoverRef.current;
    const target =
      root?.querySelector<HTMLButtonElement>('[data-selected="true"]') ??
      root?.querySelector<HTMLButtonElement>('button:not([disabled])');
    target?.focus();
  }, [open]);

  // Read-only: render a static chip (or nothing) when no handler is provided.
  if (!onChange) {
    if (team == null) return null;
    return (
      <span
        className="inline-flex items-center justify-center shrink-0 h-5 min-w-5 px-1 rounded border text-[11px] font-data font-semibold leading-none text-strong"
        style={swatchStyle(teamColor(team))}
        role="img"
        aria-label={`Buddy team ${team}`}
        title={`Buddy team ${team}`}
      >
        {team}
      </span>
    );
  }

  function close() {
    setOpen(false);
    btnRef.current?.focus();
  }

  function select(n: number | null) {
    onChange?.(n);
    close();
  }

  return (
    <span className="relative inline-flex items-center shrink-0">
      <button
        ref={btnRef}
        type="button"
        aria-label={team != null ? `Buddy team ${team}` : 'Assign buddy team'}
        title={team != null ? `Buddy team ${team}` : 'Assign buddy team'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setAbove(rect.bottom > window.innerHeight * 0.6);
            setAlignRight(rect.left > window.innerWidth * 0.5);
          }
          toggleOpen();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={clsx(
          'inline-flex items-center justify-center rounded p-2 md:p-1 transition-colors',
          focusRing,
          team == null && 'text-faint hover:text-dim',
        )}
      >
        {team != null ? (
          <span
            className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded border text-[11px] font-data font-semibold leading-none text-strong"
            style={swatchStyle(teamColor(team))}
          >
            {team}
          </span>
        ) : (
          <Hash className="size-5 md:size-4" aria-hidden="true" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={close}
            onPointerDown={(e) => e.stopPropagation()}
            aria-hidden="true"
          />
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Assign buddy team"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                close();
              }
            }}
            className={clsx(
              'absolute z-50 bg-panel border border-trim rounded-lg shadow-xl p-2',
              alignRight ? 'right-0' : 'left-0',
              above ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1 mb-1.5">
              {TEAM_NUMBERS.map((n) => {
                const selected = team === n;
                return (
                  <button
                    key={n}
                    type="button"
                    data-selected={selected ? 'true' : undefined}
                    onClick={() => select(n)}
                    className={clsx(
                      'size-8 rounded border text-[11px] font-data font-semibold leading-none text-strong flex items-center justify-center transition-transform hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100',
                      focusRing,
                      selected && 'ring-2 ring-white',
                    )}
                    style={swatchStyle(teamColor(n))}
                    title={`Buddy team ${n}`}
                    aria-label={`Buddy team ${n}`}
                    aria-pressed={selected}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => select(null)}
              disabled={team == null}
              className={clsx(
                'w-full text-left text-[11px] text-dim hover:text-body disabled:opacity-40 disabled:hover:text-dim px-1.5 py-1 rounded hover:bg-overlay transition-colors',
                focusRing,
              )}
            >
              Clear team
            </button>
          </div>
        </>
      )}
    </span>
  );
}
