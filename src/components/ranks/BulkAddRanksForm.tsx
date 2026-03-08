import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../common/Button';

interface BulkAddRanksFormProps {
  onSubmit: (names: string[]) => void;
  onCancel: () => void;
}

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function BulkAddRanksForm({
  onSubmit,
  onCancel,
}: BulkAddRanksFormProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const names = useMemo(() => parseLines(text), [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names.length === 0) return;
    onSubmit(names);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="bulk-ranks-input" className="text-sm text-dim">
          Ranks — one per line
        </label>
        <textarea
          ref={textareaRef}
          id="bulk-ranks-input"
          className="bg-page border border-trim rounded-md px-3 py-2 text-body text-sm placeholder:text-faint focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-1 focus-visible:ring-accent/25 resize-none font-mono leading-relaxed"
          rows={8}
          placeholder={`Pvt.\nCpl.\nSgt.\nLt.\nCapt.\n…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {names.length > 0 && (
        <div className="border border-trim rounded-md bg-page/50 max-h-40 overflow-y-auto overscroll-contain">
          <div className="px-3 py-2 border-b border-trim flex items-center justify-between">
            <span className="text-xs text-dim uppercase tracking-wide font-medium">
              Preview
            </span>
            <span className="text-xs text-accent tabular-nums">
              {names.length} {names.length === 1 ? 'rank' : 'ranks'}
            </span>
          </div>
          <ul className="divide-y divide-trim/50">
            {names.map((name, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: preview list from ephemeral parsed data
                key={i}
                className="px-3 py-1.5 text-sm text-sub"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={names.length === 0}>
          Add {names.length || ''} {names.length === 1 ? 'Rank' : 'Ranks'}
        </Button>
      </div>
    </form>
  );
}
