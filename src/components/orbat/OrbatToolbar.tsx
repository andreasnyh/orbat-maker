import {
  ArrowLeft,
  Check,
  Clipboard,
  FileText,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { memo } from 'react';
import type { Page } from '../../types';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';
import { Toggle } from '../common/Toggle';

interface OrbatToolbarProps {
  orbatName: string;
  onNavigate: (page: Page, id?: string) => void;
  editingName: boolean;
  nameValue: string;
  onNameValueChange: (value: string) => void;
  onNameEditStart: () => void;
  onNameCommit: () => void;
  onNameKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  hasTemplate: boolean;
  templateName?: string;
  showEquipment: boolean;
  onShowEquipmentChange: (value: boolean) => void;
  hasAssignments: boolean;
  onClearClick: () => void;
  copiedTarget: 'discord' | 'teamspeak' | null;
  onCopy: (target: 'discord' | 'teamspeak') => void;
  onAARsClick: () => void;
}

const copyTargets = [
  { key: 'discord', label: 'Discord' },
  { key: 'teamspeak', label: 'TeamSpeak' },
] as const;

export const OrbatToolbar = memo(function OrbatToolbar({
  orbatName,
  onNavigate,
  editingName,
  nameValue,
  onNameValueChange,
  onNameEditStart,
  onNameCommit,
  onNameKeyDown,
  hasTemplate,
  templateName,
  showEquipment,
  onShowEquipmentChange,
  hasAssignments,
  onClearClick,
  copiedTarget,
  onCopy,
  onAARsClick,
}: OrbatToolbarProps) {
  const copyButtons = copyTargets.map(({ key, label }) => (
    <Button
      key={key}
      variant="secondary"
      size="sm"
      onClick={() => onCopy(key)}
      disabled={copiedTarget != null}
      title={`Copy formatted ORBAT for ${label}`}
    >
      {copiedTarget === key ? (
        <Check size={14} className="text-accent" />
      ) : (
        <Clipboard size={14} />
      )}
      {label}
    </Button>
  ));

  const clearButton = hasAssignments && (
    <Button
      variant="danger"
      size="sm"
      onClick={onClearClick}
      title="Clear all assignments"
    >
      <RotateCcw size={14} />
      Clear
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Back button + ORBAT name */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('orbats')}
          className="shrink-0"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">ORBATs</span>
        </Button>

        {/* Editable ORBAT name */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <TextInput
              value={nameValue}
              onChange={(e) => onNameValueChange(e.target.value)}
              onBlur={onNameCommit}
              onKeyDown={onNameKeyDown}
              autoFocus
              className="text-xl font-bold"
            />
          ) : (
            <button
              type="button"
              className="font-display text-xl font-bold text-strong uppercase tracking-wide truncate cursor-pointer hover:text-accent transition-colors inline-flex items-center gap-2 group/name"
              onClick={onNameEditStart}
              title="Click to rename"
            >
              <span className="truncate">{orbatName}</span>
              <Pencil
                size={14}
                className="shrink-0 text-faint group-hover/name:text-accent transition-colors"
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {/* Toggle, copy & clear — inline on desktop */}
        {hasTemplate && (
          <div className="shrink-0 hidden lg:flex items-stretch gap-4 divide-x divide-trim">
            <div className="flex items-center gap-4 pr-4">
              <Toggle
                checked={showEquipment}
                onChange={onShowEquipmentChange}
                label="Show equipment"
                size="md"
              />
              {clearButton}
            </div>
            <div className="flex items-center gap-2">
              {copyButtons}
              <Button
                variant="secondary"
                size="sm"
                onClick={onAARsClick}
                title="After Action Reports"
              >
                <FileText size={14} />
                AARs
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Action buttons on mobile */}
      {hasTemplate && (
        <div className="flex lg:hidden flex-col-reverse gap-4">
          <div className="flex items-center justify-between">
            <Toggle
              checked={showEquipment}
              onChange={onShowEquipmentChange}
              label="Show equipment"
              size="md"
            />
            {clearButton}
          </div>
          <div className="flex items-center gap-2 *:flex-1">
            {copyButtons}
            <Button
              variant="secondary"
              size="sm"
              onClick={onAARsClick}
              title="After Action Reports"
            >
              <FileText size={14} />
              AARs
            </Button>
          </div>
        </div>
      )}

      {/* Template meta */}
      {templateName && (
        <div className="text-xs text-dim hidden sm:flex items-center gap-2">
          <span>{templateName}</span>
        </div>
      )}
    </div>
  );
});
