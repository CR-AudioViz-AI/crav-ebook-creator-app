import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'link',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container">
      {editable && (
        <div className="editor-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'active' : ''}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <span className="separator">|</span>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={
              editor.isActive('heading', { level: 1 }) ? 'active' : ''
            }
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive('heading', { level: 2 }) ? 'active' : ''
            }
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={
              editor.isActive('heading', { level: 3 }) ? 'active' : ''
            }
            title="Heading 3"
          >
            H3
          </button>
          <span className="separator">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
            title="Numbered List"
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'active' : ''}
            title="Quote"
          >
            " Quote
          </button>
          <span className="separator">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            ↷ Redo
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="editor-content" />

      <style jsx global>{`
        .editor-container {
          border: 1px solid #2a2d3b;
          border-radius: 8px;
          background: #0f1117;
          overflow: hidden;
        }

        .editor-toolbar {
          display: flex;
          gap: 4px;
          padding: 8px;
          border-bottom: 1px solid #2a2d3b;
          background: #151822;
          flex-wrap: wrap;
        }

        .editor-toolbar button {
          background: transparent;
          border: 1px solid transparent;
          color: #9ca3af;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .editor-toolbar button:hover:not(:disabled) {
          background: #1f2937;
          color: #fff;
          border-color: #374151;
        }

        .editor-toolbar button.active {
          background: #1f2937;
          color: #6ee7b7;
          border-color: #6ee7b7;
        }

        .editor-toolbar button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .editor-toolbar .separator {
          width: 1px;
          background: #2a2d3b;
          margin: 4px 6px;
        }

        .editor-content {
          padding: 16px;
          min-height: 400px;
        }

        .ProseMirror {
          outline: none;
          color: #e6e6e6;
          line-height: 1.6;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0 0.5em;
          color: #fff;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.8em 0 0.4em;
          color: #fff;
        }

        .ProseMirror h3 {
          font-size: 1.2em;
          font-weight: bold;
          margin: 0.6em 0 0.3em;
          color: #fff;
        }

        .ProseMirror p {
          margin: 0.5em 0;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #6ee7b7;
          padding-left: 1em;
          margin: 1em 0;
          color: #9ca3af;
          font-style: italic;
        }

        .ProseMirror code {
          background: #1f2937;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .ProseMirror pre {
          background: #1f2937;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
        }

        .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        .ProseMirror a.link {
          color: #6ee7b7;
          text-decoration: underline;
          cursor: pointer;
        }

        .ProseMirror a.link:hover {
          color: #86efac;
        }

        .ProseMirror strong {
          font-weight: bold;
          color: #fff;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
