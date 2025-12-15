import { useState, useRef, useEffect } from 'react';
import { Loader2, Brain, PenTool, Layout, Share2, MessageSquare, Maximize2, Minimize2, Bold, Italic, List, ListOrdered } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { NoteIntent } from '../../types';

interface ComposerProps {
    onCompose: (content: string, intent: NoteIntent) => Promise<void>;
    loading: boolean;
    focusTrigger?: any;
}

const INTENTS: { id: NoteIntent; label: string; icon: any }[] = [
    { id: 'thinking', label: 'Thinking', icon: Brain },
    { id: 'planning', label: 'Planning', icon: Layout },
    { id: 'building', label: 'Building', icon: PenTool },
    { id: 'writing', label: 'Writing', icon: MessageSquare },
    { id: 'shared', label: 'Shared', icon: Share2 },
];

export function Composer({ onCompose, loading, focusTrigger }: ComposerProps) {
    const [content, setContent] = useState('');
    const [intent, setIntent] = useState<NoteIntent>('thinking');
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Refs for stable access in TipTap callbacks
    const intentRef = useRef(intent);
    const onComposeRef = useRef(onCompose);

    useEffect(() => {
        intentRef.current = intent;
        onComposeRef.current = onCompose;
    }, [intent, onCompose]);

    const submitEditor = () => {
        if (!editor) return;
        const html = editor.getHTML();
        // Strip tags to check for empty content
        const text = editor.getText().trim();
        if (!text && !html.includes('<img')) return; // Basic empty check

        onComposeRef.current(html, intentRef.current);

        editor.commands.clearContent();
        setContent('');
        setIsExpanded(false);
        requestAnimationFrame(() => textareaRef.current?.focus());
    };

    // TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write your masterpiece...',
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose focus:outline-none min-h-[200px] max-h-[500px] overflow-y-auto px-4 py-3',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submitEditor();
                    return true;
                }
                return false;
            }
        },
    });

    // ... sync effects ...

    // Sync content when expanding
    useEffect(() => {
        if (isExpanded && editor && content) {
            editor.commands.setContent(content);
        }
    }, [isExpanded, editor]); // Removing content from deps to avoid loop

    // Focus triggers
    useEffect(() => {
        if (!loading && !isExpanded) {
            textareaRef.current?.focus();
        } else if (!loading && isExpanded && editor) {
            editor.commands.focus();
        }
    }, [focusTrigger, loading, isExpanded, editor]);

    const handleSubmit = async (finalContent: string) => {
        if (!finalContent.trim()) return;

        await onCompose(finalContent, intent);

        // Reset
        setContent('');
        editor?.commands.clearContent();
        setIsExpanded(false);

        // Re-focus
        requestAnimationFrame(() => {
            textareaRef.current?.focus();
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            setIsExpanded(true);
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(content);
        }
    };

    return (
        <motion.div
            layout
            className="max-w-3xl mx-auto w-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className={`relative bg-white border border-gray-200 rounded-2xl shadow-sm transition-all ${isExpanded ? 'p-0 ring-4 ring-gray-100' : 'p-2'}`}>

                {/* Collapsed View */}
                {!isExpanded && (
                    <div className="flex items-center">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a thought... (Shift+Enter to expand)"
                            className="w-full bg-transparent border-none focus:ring-0 outline-none text-base placeholder-gray-400 resize-none min-h-[44px] max-h-[200px] py-2 px-3 text-gray-900"
                            rows={1}
                        />
                        <div className="flex items-center gap-2 pr-2">
                            <button
                                type="button"
                                onClick={() => setIsExpanded(true)}
                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                title="Expand Editor"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleSubmit(content)}
                                disabled={!content.trim()}
                                className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors disabled:opacity-0"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 bg-black rounded-full" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Expanded View */}
                {isExpanded && (
                    <div className="flex flex-col">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 bg-gray-50/50 rounded-t-2xl">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                    className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200 text-black' : 'text-gray-500'}`}
                                    title="Bold"
                                    aria-label="Bold"
                                >
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                                    className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200 text-black' : 'text-gray-500'}`}
                                    title="Italic"
                                    aria-label="Italic"
                                >
                                    <Italic className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-gray-200 mx-1" />
                                <button
                                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                    className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? 'bg-gray-200 text-black' : 'text-gray-500'}`}
                                    title="Bullet List"
                                    aria-label="Bullet List"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                    className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('orderedList') ? 'bg-gray-200 text-black' : 'text-gray-500'}`}
                                    title="Ordered List"
                                    aria-label="Ordered List"
                                >
                                    <ListOrdered className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Intent Selector (Simplified for Expanded) */}
                            <div className="flex gap-1">
                                {INTENTS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setIntent(item.id)}
                                            className={`p-1.5 rounded-full ${intent === item.id ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                            title={item.label}
                                        >
                                            <Icon className="w-3 h-3" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Editor Area */}
                        <EditorContent editor={editor} />

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setContent(editor?.getText() || '');
                                    setIsExpanded(false);
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                                <Minimize2 className="w-3 h-3" />
                                Collapse
                            </button>
                            <button
                                onClick={submitEditor}
                                className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                            >
                                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                                Save Note
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Helper Text */}
            <div className="flex justify-between mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-300">
                    {isExpanded ? 'Enter to save, Shift+Enter for new line' : 'Shift+Enter to expand'}
                </span>
            </div>

        </motion.div>
    );
}
