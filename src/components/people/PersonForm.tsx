import { useEffect, useRef, useState } from 'react';
import { useRanksState } from '../../context/AppStateContext';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';

const CUSTOM_VALUE = '__custom__';

interface PersonFormProps {
  onSubmit: (name: string, rank?: string) => void;
  onCancel: () => void;
  initialName?: string;
  initialRank?: string;
}

export function PersonForm({
  onSubmit,
  onCancel,
  initialName = '',
  initialRank = '',
}: PersonFormProps) {
  const { ranks, addRank } = useRanksState();
  const [name, setName] = useState(initialName);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEditMode = initialName !== '';

  // Determine initial select value
  const initialIsDefinedRank =
    initialRank && ranks.some((r) => r.name === initialRank);
  const [selectValue, setSelectValue] = useState(
    initialRank ? (initialIsDefinedRank ? initialRank : CUSTOM_VALUE) : '',
  );
  const [customRank, setCustomRank] = useState(
    initialRank && !initialIsDefinedRank ? initialRank : '',
  );
  const [saveCustomRank, setSaveCustomRank] = useState(true);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const resolvedRank =
    selectValue === CUSTOM_VALUE
      ? customRank.trim() || undefined
      : selectValue || undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (
      selectValue === CUSTOM_VALUE &&
      resolvedRank &&
      saveCustomRank &&
      !ranks.some((r) => r.name === resolvedRank)
    ) {
      addRank(resolvedRank);
    }
    onSubmit(trimmedName, resolvedRank);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextInput
        ref={nameRef}
        label="Name"
        placeholder="e.g. John Smith…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="off"
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="person-rank" className="text-sm text-dim">
          Rank (optional)
        </label>
        <select
          id="person-rank"
          value={selectValue}
          onChange={(e) => {
            setSelectValue(e.target.value);
            if (e.target.value !== CUSTOM_VALUE) setCustomRank('');
          }}
          className="bg-page border border-trim rounded-md px-3 py-2 text-body text-sm focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-1 focus-visible:ring-accent/25"
        >
          <option value="">(None)</option>
          {ranks.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>(Custom…)</option>
        </select>
      </div>

      {selectValue === CUSTOM_VALUE && (
        <>
          <TextInput
            label="Custom rank"
            placeholder="e.g. SGT, CPT, LTC…"
            value={customRank}
            onChange={(e) => setCustomRank(e.target.value)}
            autoComplete="off"
          />
          <label className="flex items-center gap-2 text-sm text-dim cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveCustomRank}
              onChange={(e) => setSaveCustomRank(e.target.checked)}
              className="accent-green-500"
            />
            Save to ranks list
          </label>
        </>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!name.trim()}>
          {isEditMode ? 'Save Changes' : 'Add Personnel'}
        </Button>
      </div>
    </form>
  );
}
