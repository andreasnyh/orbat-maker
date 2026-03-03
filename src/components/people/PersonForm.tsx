import { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';

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
  const [name, setName] = useState(initialName);
  const [rank, setRank] = useState(initialRank);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEditMode = initialName !== '';

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit(trimmedName, rank.trim() || undefined);
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
      <TextInput
        label="Rank (optional)"
        placeholder="e.g. SGT, CPT, LTC"
        value={rank}
        onChange={(e) => setRank(e.target.value)}
        autoComplete="off"
      />
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!name.trim()}>
          {isEditMode ? 'Save Changes' : 'Add Person'}
        </Button>
      </div>
    </form>
  );
}
