import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Note, NoteIntent } from '../../types';

export function useNotes(activeSpaceId: string) {
    const { token, logout, user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = useCallback(() => {
        const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
        const impersonateId = localStorage.getItem("impersonate_id");
        if (impersonateId) {
            headers["X-Impersonate-ID"] = impersonateId;
        }
        return headers;
    }, [token]);

    const fetchNotes = useCallback(async () => {
        if (!token) return;
        setFetching(true);
        setError(null);
        try {
            const res = await fetch(`/api/notes?space=${activeSpaceId}`, {
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
    }, [activeSpaceId, token, getHeaders, logout]);

    const createNote = async (content: string, intent: NoteIntent) => {
        if (!token) return;

        // Optimistic Update
        const tempId = crypto.randomUUID();
        const tempNote: Note = {
            id: tempId,
            content,
            intent,
            space: activeSpaceId,
            userId: user?.sub || 'me',
            status: 'warming',
            createdAt: Date.now() / 1000,
            updatedAt: Date.now() / 1000
        };

        setNotes(prev => [...prev, tempNote]);

        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders()
                },
                body: JSON.stringify({ id: tempId, content, intent, space: activeSpaceId }),
            });

            if (res.status === 401) {
                logout();
                return;
            }

            if (!res.ok) throw new Error("Failed to save");

            const newNote = await res.json() as Note;
            // Replace local note with confirmed server note (though IDs should match now)
            setNotes(prev => prev.map(n => n.id === tempId ? newNote : n));

        } catch (error) {
            console.error("Failed to create note", error);
            setNotes(prev => prev.filter(n => n.id !== tempId));
            throw error; // Let caller handle UI feedback if needed
        }
    };

    const updateNote = async (id: string, content: string) => {
        if (!token) return;
        setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));

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
            fetchNotes(); // Revert/Refresh on error
        }
    };

    const archiveNote = async (id: string, summary?: string) => {
        if (!token) return;
        setNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'archived' } : n));
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
            fetchNotes(); // Revert/Refresh on error
        }
    };

    return {
        notes,
        fetching,
        error,
        actions: {
            fetchNotes,
            createNote,
            updateNote,
            archiveNote
        }
    };
}
