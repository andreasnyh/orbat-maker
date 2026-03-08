import { X } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Native <dialog> fires "cancel" on Escape
  const handleCancel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: native <dialog> handles Escape via onCancel
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onCancel={handleCancel}
      aria-labelledby="modal-title"
      className="backdrop:bg-black/60 bg-transparent p-0 max-w-lg w-full m-auto outline-none animate-fade-in backdrop:animate-fade-in"
    >
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg shadow-xl max-h-[85vh] overflow-y-auto overscroll-contain mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a4a]">
          <h2
            id="modal-title"
            className="font-display text-lg font-semibold text-gray-200 uppercase"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 rounded"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}
