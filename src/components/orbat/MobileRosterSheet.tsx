import clsx from 'clsx';
import { memo, useEffect, useRef } from 'react';
import type { Assignment, Slot } from '../../types';
import { RosterSidebar } from './RosterSidebar';

interface MobileRosterSheetProps {
  open: boolean;
  onClose: () => void;
  assignments: Assignment[];
  tapTargetSlot?: Slot;
  tapTargetSlotId: string | null;
  onPersonTap?: (personId: string) => void;
}

export const MobileRosterSheet = memo(function MobileRosterSheet({
  open,
  onClose,
  assignments,
  tapTargetSlot,
  tapTargetSlotId,
  onPersonTap,
}: MobileRosterSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      {/* Semi-transparent backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet panel — sits above the 4rem MobileNav on mobile, at bottom on tablet */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Personnel roster"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        inert={!open || undefined}
        className={clsx(
          'fixed left-0 right-0 z-50 lg:hidden bg-panel border-t border-trim rounded-t-xl shadow-2xl',
          'transition-transform duration-300 flex flex-col overflow-hidden p-4',
          'bottom-16 md:bottom-0 max-h-[calc(70dvh-4rem)] md:max-h-[70dvh]',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{
          overscrollBehavior: 'contain',
        }}
        aria-hidden={!open}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center mb-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-trim" />
        </div>

        {/* Tap-assign banner */}
        {tapTargetSlot && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-3 shrink-0">
            <span className="text-sm text-accent">
              Assigning to: <strong>{tapTargetSlot.roleLabel}</strong>
            </span>
          </div>
        )}

        <RosterSidebar
          assignments={assignments}
          onPersonTap={tapTargetSlotId ? onPersonTap : undefined}
          hideSearch
          className="flex-1 min-h-0 overflow-hidden"
        />
      </div>
    </>
  );
});
