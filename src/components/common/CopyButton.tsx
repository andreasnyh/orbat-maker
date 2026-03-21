import { Check, Clipboard } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '../../lib/clipboard';
import { Button } from './Button';

interface CopyButtonProps {
  getText: () => string;
  label?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({
  getText,
  label = 'Copy',
  size = 'sm',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const handleClick = useCallback(async () => {
    if (copied) return;
    const ok = await copyToClipboard(getText());
    if (ok) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    }
  }, [copied, getText]);

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={handleClick}
      disabled={copied}
      title={`Copy as plain text`}
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
