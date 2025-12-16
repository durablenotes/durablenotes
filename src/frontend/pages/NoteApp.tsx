import { useState, useEffect, useRef } from "react";
import { Loader2, Wind } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { Note, NoteIntent } from "../../types";
import { Composer } from "../components/Composer";
import { Bubble } from "../components/Bubble";
import { NoteOverlay } from "../components/NoteOverlay";
import { Sidebar } from "../components/Sidebar";
import { SpaceHeader } from "../components/SpaceHeader";
import { useSpaces } from "../hooks/useSpaces";
import { useAuth } from "../context/AuthContext";

import { useNotes } from "../hooks/useNotes";

export function NoteApp() {
    const { token } = useAuth();
    const [activeSpaceId, setActiveSpaceId] = useState('main');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [focusKey, setFocusKey] = useState(0);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Custom Hook for Spaces
    const { spaces, addSpace, getSpace } = useSpaces();
    const currentSpace = getSpace(activeSpaceId);

    // Custom Hook for Notes (Business Logic Extracted)
    const { notes, fetching, error, actions } = useNotes(activeSpaceId);

    // Ref for auto-scroll
    const bottomRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        if (token) {
            actions.fetchNotes();
        }
    }, [activeSpaceId, token, actions.fetchNotes]);

    // Only show active notes (Alive/Warming/Cooling)
    const activeBubbles = notes.filter(n => n.status !== 'archived');

    // Auto-scroll on new notes or active space change
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeBubbles.length, activeSpaceId]);

    // Check for impersonation (UI only)
    const impersonateId = localStorage.getItem("impersonate_id");

    const exitImpersonation = () => {
        localStorage.removeItem("impersonate_id");
        window.location.reload();
    };

    const handleCompose = async (content: string, intent: NoteIntent) => {
        try {
            await actions.createNote(content, intent);
        } catch {
            alert("Failed to save thought. Please try again.");
        }
    };

    return (
        <div className="flex h-screen bg-white text-gray-900 font-sans selection:bg-gray-100 overflow-hidden relative">
            {impersonateId && (
                <div className="absolute top-0 right-0 left-64 z-[100] bg-indigo-600 text-white text-xs px-4 py-1 flex items-center justify-between shadow-md">
                    <span className="font-mono">🕵️ IMPERSONATING: {impersonateId}</span>
                    <button onClick={exitImpersonation} className="underline hover:text-indigo-200 font-bold uppercase tracking-wider">Exit Mode</button>
                </div>
            )}
            <Sidebar
                activeSpace={activeSpaceId}
                spaces={spaces}
                onSpaceChange={setActiveSpaceId}
                onAddSpace={(label) => {
                    const newSpace = addSpace(label);
                    setActiveSpaceId(newSpace.id);
                }}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            {/* ...rest of app... */}
            <main className="flex-1 flex flex-col relative w-full h-full">

                <SpaceHeader space={currentSpace} onOpenMenu={() => setIsMobileMenuOpen(true)} />

                <div
                    className="flex-1 min-h-0 overflow-y-auto px-6 md:px-12 py-4 flex flex-col custom-scrollbar cursor-text"
                    onClick={(e) => {
                        // Focus if clicking background
                        if (e.target === e.currentTarget) {
                            setFocusKey(Date.now());
                        }
                    }}
                >

                    <div className="flex-1" onClick={() => setFocusKey(Date.now())} />

                    <div className="w-full max-w-3xl mx-auto flex flex-wrap items-end content-end gap-3 pb-4 shrink-0">
                        {fetching ? (
                            <div className="w-full flex justify-center py-20 opacity-30">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : error ? (
                            <div className="w-full flex flex-col items-center justify-center py-20 text-red-500 opacity-80">
                                <p>Failed to load thoughts.</p>
                                <p className="text-xs mt-2">{error}</p>
                                <button onClick={() => actions.fetchNotes()} className="mt-4 px-4 py-2 bg-red-100 rounded-full text-sm hover:bg-red-200">Retry</button>
                            </div>
                        ) : activeBubbles.length === 0 ? (
                            <div className="w-full flex flex-col items-center justify-center py-20 opacity-40 text-gray-300 pointer-events-none">
                                <Wind className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-light tracking-wide">Mind clear. Ready for thoughts.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout" initial={false}>
                                {activeBubbles.map(note => (
                                    <Bubble key={note.id} note={note} onClick={setSelectedNote} />
                                ))}
                            </AnimatePresence>
                        )}
                        <div ref={bottomRef} className="w-full h-px" />
                    </div>

                </div>

                <div
                    className="px-6 md:px-12 pb-8 pt-4 bg-gradient-to-t from-white via-white/90 to-transparent z-10 w-full max-w-5xl mx-auto"
                    onClick={() => setFocusKey(Date.now())}
                >
                    <Composer
                        onCompose={handleCompose}
                        loading={false}
                        focusTrigger={[activeSpaceId, focusKey]}
                    />
                </div>

            </main>

            {selectedNote && (
                <NoteOverlay
                    note={selectedNote}
                    onClose={() => setSelectedNote(null)}
                    onUpdate={actions.updateNote}
                    onArchive={actions.archiveNote}
                />
            )}

        </div>
    );
}
