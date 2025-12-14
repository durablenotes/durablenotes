import { useState, useEffect } from "react";
import { X, Archive, Check } from "lucide-react";
import type { Note } from "../../types";

interface NoteOverlayProps {
    note: Note;
    onClose: () => void;
    onUpdate: (id: string, content: string) => Promise<void>;
    onArchive: (id: string, summary?: string) => Promise<void>;
}

export function NoteOverlay({ note, onClose, onUpdate, onArchive }: NoteOverlayProps) {
    const [content, setContent] = useState(note.content);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setContent(note.content);
        setIsDirty(false);
    }, [note]);

    const handleSave = async () => {
        if (!isDirty) return;
        setSaving(true);
        await onUpdate(note.id, content);
        setSaving(false);
        setIsDirty(false);
    };

    const handleArchive = async () => {
        setSaving(true);
        await onArchive(note.id);
        setSaving(false);
        onClose();
    };

    // Auto-save on unmount/close? 
    // "Updates bubble in place". Let's auto-save when closing or clicking out.
    // For now, explicit save or "enter to save" feels right for a "Thinking" app? 
    // Actually simplicity: Blur saves? 
    // Let's add a "Done" button.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-2xl p-10 rounded-3xl shadow-2xl flex flex-col gap-8 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="flex justify-between items-center text-gray-300">
                    <button onClick={handleArchive} className="hover:text-red-400 transition-colors" title="Archive">
                        <Archive className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="hover:text-gray-900 transition-colors" title="Close">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Editor */}
                <div className="flex-1 min-h-[50vh] flex flex-col">
                    <textarea
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            setIsDirty(true);
                        }}
                        className="w-full flex-1 bg-transparent text-3xl font-normal text-gray-900 placeholder-gray-200 border-none focus:ring-0 outline-none resize-none leading-loose scrollbar-hide selection:bg-gray-100"
                        placeholder="Empty thought..."
                        autoFocus
                    />
                </div>

                {/* Footer Status */}
                <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-300 uppercase tracking-widest font-medium">
                        {note.intent} • {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-900 transition-all opacity-100 disabled:opacity-50 shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5"
                        >
                            {saving ? "Saving..." : <><Check className="w-4 h-4" /> Save Update</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Click backdrop to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
