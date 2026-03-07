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
        <label htmlFor="bulk-ranks-input" className="text-sm text-gray-400">
          Ranks — one per line
        </label>
        <textarea
          ref={textareaRef}
          id="bulk-ranks-input"
          className="bg-[#0f0f23] border border-[#2a2a4a] rounded-md px-3 py-2 text-gray-200 text-sm placeholder:text-gray-600 focus-visible:outline-none focus-visible:border-green-400/50 focus-visible:ring-1 focus-visible:ring-green-400/25 resize-none font-mono leading-relaxed"
          rows={8}
          placeholder={`Pvt.\nCpl.\nSgt.\nLt.\nCapt.\n…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {names.length > 0 && (
        <div className="border border-[#2a2a4a] rounded-md bg-[#0f0f23]/50 max-h-40 overflow-y-auto overscroll-contain">
          <div className="px-3 py-2 border-b border-[#2a2a4a] flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Preview
            </span>
            <span className="text-xs text-green-400 tabular-nums">
              {names.length} {names.length === 1 ? 'rank' : 'ranks'}
            </span>
          </div>
          <ul className="divide-y divide-[#2a2a4a]/50">
            {names.map((name, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: preview list from ephemeral parsed data
                key={i}
                className="px-3 py-1.5 text-sm text-gray-300"
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
