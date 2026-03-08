import clsx from 'clsx';
import { Pencil, Trash2 } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { memo } from 'react';
import type { Person } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

// Extends HTMLAttributes so the card can accept drag-and-drop attributes,
// data attributes, aria props, etc. when reused in the ORBAT builder.
interface PersonCardProps extends HTMLAttributes<HTMLDivElement> {
  person: Person;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export const PersonCard = memo(function PersonCard({
  person,
  onEdit,
  onDelete,
  className,
  ...rest
}: PersonCardProps) {
  return (
    <div
      className={clsx('card p-4', 'flex flex-col gap-1.5', className)}
      {...rest}
    >
      {/* Rank and actions */}
      <div className="flex items-center gap-1 min-w-0">
        {person.rank && <Badge variant="green">{person.rank}</Badge>}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 ml-auto">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(person)}
                aria-label={`Edit ${person.name}`}
                title="Edit"
              >
                <Pencil size={14} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(person)}
                aria-label={`Delete ${person.name}`}
                title="Delete"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="font-display text-gray-200 font-semibold text-lg leading-tight truncate pl-2 pt-1.5 border-t border-[#2a2a4a]">
        {person.name}
      </span>
    </div>
  );
});
