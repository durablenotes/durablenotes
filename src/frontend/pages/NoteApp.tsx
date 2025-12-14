import { useState, useEffect, useRef } from "react";
import { Loader2, Wind } from "lucide-react";
import type { Note, NoteIntent } from "../../types";
import { Composer } from "../components/Composer";
import { Bubble } from "../components/Bubble";
import { NoteOverlay } from "../components/NoteOverlay";
import { Sidebar } from "../components/Sidebar";
import { SpaceHeader } from "../components/SpaceHeader";
import { useSpaces } from "../hooks/useSpaces";
import { useAuth } from "../context/AuthContext";

export function NoteApp() {
    const { token, logout } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [fetching, setFetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeSpaceId, setActiveSpaceId] = useState('main');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Custom Hook for Spaces
    const { spaces, addSpace, getSpace } = useSpaces();
    const currentSpace = getSpace(activeSpaceId);

    // Ref for auto-scroll
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (token) {
            fetchNotes(activeSpaceId);
        }
    }, [activeSpaceId, token]);

    // Only show active notes (Alive/Warming/Cooling)
    const activeBubbles = notes.filter(n => n.status !== 'archived');

    // Auto-scroll on new notes or active space change
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeBubbles.length, activeSpaceId]);



    // Check for impersonation
    const impersonateId = localStorage.getItem("impersonate_id");

    const getHeaders = () => {
        const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
        if (impersonateId) {
            headers["X-Impersonate-ID"] = impersonateId;
        }
        return headers;
    }

    const fetchNotes = async (space: string) => {
        if (!token) return;
        setFetching(true);
        setError(null);
        try {
            const res = await fetch(`/api/notes?space=${space}`, {
                headers: getHeaders()
            });
            if (res.status === 401) {
                logout();
                return;
            }
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const data = await res.json() as { notes: Note[] };
            const sorted = (data.notes || []).sort((a, b) => a.createdAt - b.createdAt);
            setNotes(sorted);
        } catch (error: any) {
            console.error("Failed to fetch notes", error);
            setError(error.message || "Unknown error");
        } finally {
            setFetching(false);
        }
    };

    const handleCompose = async (content: string, intent: NoteIntent) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders()
                },
                body: JSON.stringify({ content, intent, space: activeSpaceId }),
            });
            if (res.status === 401) {
                logout();
                return;
            }
            if (res.ok) {
                const newNote = await res.json() as Note;
                setNotes(prev => [...prev, newNote]);
            }
        } catch (error) {
            console.error("Failed to create note", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string, content: string) => {
        if (!token) return;
        setNotes(notes.map(n => n.id === id ? { ...n, content } : n));

        try {
            const res = await fetch(`/api/notes/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders()
                },
                body: JSON.stringify({ content })
            });
            if (res.status === 401) logout();
        } catch {
            fetchNotes(activeSpaceId);
        }
    };

    const handleArchive = async (id: string, summary?: string) => {
        if (!token) return;
        setNotes(notes.map(n => n.id === id ? { ...n, status: 'archived' } : n));
        try {
            const res = await fetch(`/api/notes/${id}/archive`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders()
                },
                body: JSON.stringify({ summary }),
            });
            if (res.status === 401) logout();
        } catch {
            fetchNotes(activeSpaceId);
        }
    };

    const exitImpersonation = () => {
        localStorage.removeItem("impersonate_id");
        window.location.reload();
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
            />
            {/* ...rest of app... */}
            <main className="flex-1 flex flex-col relative w-full h-full">

                <SpaceHeader space={currentSpace} />

                <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-12 py-4 flex flex-col custom-scrollbar">

                    <div className="flex-1" />

                    <div className="w-full max-w-3xl mx-auto flex flex-wrap items-end content-end gap-3 pb-4 shrink-0">
                        {fetching ? (
                            <div className="w-full flex justify-center py-20 opacity-30">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : error ? (
                            <div className="w-full flex flex-col items-center justify-center py-20 text-red-500 opacity-80">
                                <p>Failed to load thoughts.</p>
                                <p className="text-xs mt-2">{error}</p>
                                <button onClick={() => fetchNotes(activeSpaceId)} className="mt-4 px-4 py-2 bg-red-100 rounded-full text-sm hover:bg-red-200">Retry</button>
                            </div>
                        ) : activeBubbles.length === 0 ? (
                            <div className="w-full flex flex-col items-center justify-center py-20 opacity-40 text-gray-300">
                                <Wind className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-light tracking-wide">Mind clear. Ready for thoughts.</p>
                            </div>
                        ) : (
                            activeBubbles.map(note => (
                                <Bubble key={note.id} note={note} onClick={setSelectedNote} />
                            ))
                        )}
                        <div ref={bottomRef} className="w-full h-px" />
                    </div>

                </div>

                <div className="px-6 md:px-12 pb-8 pt-4 bg-gradient-to-t from-white via-white/90 to-transparent z-10 w-full max-w-5xl mx-auto">
                    <Composer onCompose={handleCompose} loading={loading} />
                </div>

            </main>

            {selectedNote && (
                <NoteOverlay
                    note={selectedNote}
                    onClose={() => setSelectedNote(null)}
                    onUpdate={handleUpdate}
                    onArchive={handleArchive}
                />
            )}

        </div>
    );
}
