import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import clsx from 'clsx';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo,
  Undo,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AARTiptapEditorProps {
  content: string;
  onUpdate: (html: string) => void;
}

const toolbarButtons = [
  {
    icon: Bold,
    label: 'Bold',
    command: 'toggleBold' as const,
    active: 'bold',
  },
  {
    icon: Italic,
    label: 'Italic',
    command: 'toggleItalic' as const,
    active: 'italic',
  },
  {
    icon: Heading2,
    label: 'Heading 2',
    command: 'toggleHeading' as const,
    commandArgs: { level: 2 as const },
    active: 'heading',
    activeAttrs: { level: 2 },
  },
  {
    icon: Heading3,
    label: 'Heading 3',
    command: 'toggleHeading' as const,
    commandArgs: { level: 3 as const },
    active: 'heading',
    activeAttrs: { level: 3 },
  },
  {
    icon: List,
    label: 'Bullet list',
    command: 'toggleBulletList' as const,
    active: 'bulletList',
  },
  {
    icon: ListOrdered,
    label: 'Ordered list',
    command: 'toggleOrderedList' as const,
    active: 'orderedList',
  },
  { icon: Undo, label: 'Undo', command: 'undo' as const },
  { icon: Redo, label: 'Redo', command: 'redo' as const },
] as const;

export function AARTiptapEditor({ content, onUpdate }: AARTiptapEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    coreExtensionOptions: {
      clipboardTextSerializer: {
        blockSeparator: '\n',
      },
    },
    content,
    onUpdate: ({ editor: ed }) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(ed.getHTML());
      }, 500);
    },
  });

  // Force re-render on selection change so toolbar active states update
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const onSelectionUpdate = () => setTick((t) => t + 1);
    editor.on('selectionUpdate', onSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', onSelectionUpdate);
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      if (editor) onUpdateRef.current(editor.getHTML());
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded-md border border-trim overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-trim bg-panel">
        {toolbarButtons.map((btn) => {
          const isActive =
            'active' in btn
              ? editor.isActive(
                  btn.active,
                  'activeAttrs' in btn ? btn.activeAttrs : undefined,
                )
              : false;

          return (
            <button
              key={btn.label}
              type="button"
              onClick={() => {
                const chain = editor.chain().focus();
                if ('commandArgs' in btn && btn.commandArgs) {
                  // biome-ignore lint/suspicious/noExplicitAny: TipTap chain commands have varied signatures
                  (chain as any)[btn.command](btn.commandArgs).run();
                } else {
                  // biome-ignore lint/suspicious/noExplicitAny: TipTap chain commands have varied signatures
                  (chain as any)[btn.command]().run();
                }
              }}
              title={btn.label}
              className={clsx(
                'p-1.5 rounded transition-colors',
                isActive
                  ? 'bg-accent-dim/20 text-accent'
                  : 'text-dim hover:text-body hover:bg-overlay',
              )}
            >
              <btn.icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="aar-editor-content bg-page text-body text-sm min-h-75 px-4 py-3 prose-headings:font-display prose-headings:text-strong prose-headings:uppercase prose-headings:tracking-wide"
      />
    </div>
  );
}
