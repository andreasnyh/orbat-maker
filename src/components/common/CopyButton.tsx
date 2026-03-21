import { Check, Clipboard } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { copyToClipboard } from '../../lib/clipboard';
import { Button } from './Button';

interface CopyButtonProps {
  getText: () => string;
  label?: string;
  title?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({
  getText,
  label = 'Copy',
  title,
  size = 'sm',
}: CopyButtonProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const handleClick = useCallback(async () => {
    if (copied) return;
    const ok = await copyToClipboard(getText());
    if (ok) {
      toast.success('Copied');
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error('Failed to copy — clipboard not available');
    }
  }, [copied, getText, toast]);

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={handleClick}
      disabled={copied}
      title={title ?? `Copy ${label}`}
    >
      {copied ? (
        <Check size={14} className="text-accent" />
      ) : (
        <Clipboard size={14} />
      )}
      {label}
    </Button>
  );
}
