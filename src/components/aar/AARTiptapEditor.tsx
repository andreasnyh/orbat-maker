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
import { useCallback, useEffect, useRef } from 'react';

interface AARTiptapEditorProps {
  content: string;
  onUpdate: (html: string) => void;
}

export function AARTiptapEditor({ content, onUpdate }: AARTiptapEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const tb = useCallback(
    (
      action: () => boolean | undefined,
      isActive?: string,
      attrs?: Record<string, unknown>,
    ) => ({
      onClick: () => {
        action();
        editor?.chain().focus().run();
      },
      active: isActive ? (editor?.isActive(isActive, attrs) ?? false) : false,
    }),
    [editor],
  );

  if (!editor) return null;

  const buttons: {
    icon: typeof Bold;
    label: string;
    props: ReturnType<typeof tb>;
  }[] = [
    {
      icon: Bold,
      label: 'Bold',
      props: tb(() => editor.chain().focus().toggleBold().run(), 'bold'),
    },
    {
      icon: Italic,
      label: 'Italic',
      props: tb(() => editor.chain().focus().toggleItalic().run(), 'italic'),
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      props: tb(
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        'heading',
        { level: 2 },
      ),
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      props: tb(
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        'heading',
        { level: 3 },
      ),
    },
    {
      icon: List,
      label: 'Bullet list',
      props: tb(
        () => editor.chain().focus().toggleBulletList().run(),
        'bulletList',
      ),
    },
    {
      icon: ListOrdered,
      label: 'Ordered list',
      props: tb(
        () => editor.chain().focus().toggleOrderedList().run(),
        'orderedList',
      ),
    },
    {
      icon: Undo,
      label: 'Undo',
      props: tb(() => editor.chain().focus().undo().run()),
    },
    {
      icon: Redo,
      label: 'Redo',
      props: tb(() => editor.chain().focus().redo().run()),
    },
  ];

  return (
    <div className="flex flex-col rounded-md border border-trim overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-trim bg-panel">
        {buttons.map(({ icon: Icon, label, props: { onClick, active } }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            title={label}
            className={clsx(
              'p-1.5 rounded transition-colors',
              active
                ? 'bg-accent-dim/20 text-accent'
                : 'text-dim hover:text-body hover:bg-overlay',
            )}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="aar-editor-content bg-page text-body text-sm min-h-75 px-4 py-3 prose-headings:font-display prose-headings:text-strong prose-headings:uppercase prose-headings:tracking-wide"
      />
    </div>
  );
}
