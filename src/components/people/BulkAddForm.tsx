import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';

interface BulkAddFormProps {
  onSubmit: (entries: { name: string; rank?: string }[]) => void;
  onCancel: () => void;
  /** Existing ranks from the roster, used for suggestions. */
  existingRanks?: string[];
}

function parseNames(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function BulkAddForm({
  onSubmit,
  onCancel,
  existingRanks = [],
}: BulkAddFormProps) {
  const [rank, setRank] = useState('');
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const names = useMemo(() => parseNames(text), [text]);
  const trimmedRank = rank.trim() || undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names.length === 0) return;
    onSubmit(names.map((name) => ({ name, rank: trimmedRank })));
  };

  // Deduplicated, sorted rank suggestions
  const rankSuggestions = useMemo(() => {
    const unique = [...new Set(existingRanks.filter(Boolean))];
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [existingRanks]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <TextInput
          label="Rank (optional — applies to all)"
          placeholder="e.g. SGT, Sqn Ldr, CPT"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          autoComplete="off"
          list="rank-suggestions"
        />
        {rankSuggestions.length > 0 && (
          <datalist id="rank-suggestions">
            {rankSuggestions.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bulk-input" className="text-sm text-gray-400">
          Names — one per line
        </label>
        <textarea
          ref={textareaRef}
          id="bulk-input"
          className="bg-[#0f0f23] border border-[#2a2a4a] rounded-md px-3 py-2 text-gray-200 text-sm placeholder:text-gray-600 focus-visible:outline-none focus-visible:border-green-400/50 focus-visible:ring-1 focus-visible:ring-green-400/25 resize-none font-mono leading-relaxed"
          rows={8}
          placeholder={`John Smith\nJane Doe\nMike Johnson`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Live preview */}
      {names.length > 0 && (
        <div className="border border-[#2a2a4a] rounded-md bg-[#0f0f23]/50 max-h-40 overflow-y-auto overscroll-contain">
          <div className="px-3 py-2 border-b border-[#2a2a4a] flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Preview
            </span>
            <span className="text-xs text-green-400 tabular-nums">
              {names.length} {names.length === 1 ? 'person' : 'people'}
            </span>
          </div>
          <ul className="divide-y divide-[#2a2a4a]/50">
            {names.map((name, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: preview list from ephemeral parsed data
                key={i}
                className="px-3 py-1.5 flex items-center gap-2 text-sm"
              >
                {trimmedRank && (
                  <span className="text-green-400 font-mono text-xs bg-green-400/10 px-1.5 py-0.5 rounded">
                    {trimmedRank}
                  </span>
                )}
                <span className="text-gray-300">{name}</span>
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
          Add {names.length || ''} {names.length === 1 ? 'Person' : 'People'}
        </Button>
      </div>
    </form>
  );
}
