import { DurableObject } from "cloudflare:workers";
import type { Note, NoteStatus, NoteIntent } from "../../types";

export class NoteStore extends DurableObject {
    state: DurableObjectState;
    env: any;

    constructor(state: DurableObjectState, env: any) {
        super(state, env);
        this.state = state;
        this.env = env; // Store env for D1 access
    }

    // Decay Logic: Alive -> Warming -> Cooling
    private calculateStatus(note: Note): NoteStatus {
        if (note.status === 'archived') return 'archived';

        const now = Date.now();
        const age = now - note.updatedAt;

        // Logic: 
        // < 1 hour: Alive
        // 1 hour - 24 hours: Warming
        // > 24 hours: Cooling
        if (age < 3600 * 1000) return 'alive';
        if (age < 24 * 3600 * 1000) return 'warming';
        return 'cooling';
    }

    // Fire-and-forget stats update
    private async updateGlobalStats(delta: number) {
        try {
            await this.env.DB.prepare(
                "UPDATE stats SET value = value + ? WHERE key = 'total_notes'"
            ).bind(delta).run();
        } catch (e) {
            console.error("Failed to update stats", e);
        }
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        // GET /api/notes
        if (request.method === "GET" && url.pathname === "/api/notes") {
            const space = url.searchParams.get("space") || "main";
            const notesMap = await this.state.storage.list<Note>();
            let notes = Array.from(notesMap.values());

            // Apply Decay & Sort & Filter
            notes = notes
                .filter(n => (n.space || 'main') === space)
                .map(n => ({ ...n, status: this.calculateStatus(n) }));

            // Sort by CreatedAt Descending (Newest First)
            // In chat, newest is typically at the bottom.
            // But visually we will flex-reverse, so this order is fine.
            notes.sort((a, b) => b.createdAt - a.createdAt);

            return new Response(JSON.stringify({ notes }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // POST /api/notes
        if (request.method === "POST" && url.pathname === "/api/notes") {
            const body = await request.json() as { content: string; intent: NoteIntent; userId: string; space?: string };
            const now = Date.now();

            const newNote: Note = {
                id: crypto.randomUUID(),
                userId: body.userId,
                content: body.content,
                intent: body.intent || 'thinking',
                status: 'alive',
                createdAt: now,
                updatedAt: now,
                space: body.space || 'main',
            };

            await this.state.storage.put(newNote.id, newNote);

            // Increment Global Stat (Fire-and-forget via waitUntil)
            this.ctx.waitUntil(this.updateGlobalStats(1));

            return new Response(JSON.stringify(newNote), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // PATCH /api/notes/:id/archive (Close Note)
        if (request.method === "PATCH" && url.pathname.match(/\/api\/notes\/.*\/archive/)) {
            const id = url.pathname.split('/')[3]; // /api/notes/:id/archive
            const note = await this.state.storage.get<Note>(id);

            if (note) {
                const body = await request.json() as { summary?: string };
                note.status = 'archived';
                note.closedAt = Date.now();
                note.updatedAt = Date.now(); // bump update to bring to top of archive? or keep original?
                // "Closure" thought
                if (body.summary) note.summary = body.summary;

                await this.state.storage.put(id, note);

                // Decrement Global Stat if it wasn't already archived
                // (Assuming we only call archive on active notes)
                this.ctx.waitUntil(this.updateGlobalStats(-1));

                return new Response(JSON.stringify(note), { headers: { "Content-Type": "application/json" } });
            }
            return new Response("Note not found", { status: 404 });
        }

        // PATCH /api/notes/:id (Update Content)
        if (request.method === "PATCH" && url.pathname.match(/\/api\/notes\/[^\/]+$/)) {
            const id = url.pathname.split('/').pop();
            if (id) {
                const note = await this.state.storage.get<Note>(id);
                if (note) {
                    const body = await request.json() as { content: string };
                    note.content = body.content;
                    note.updatedAt = Date.now();
                    note.status = 'alive'; // Bump to alive on edit
                    await this.state.storage.put(id, note);
                    return new Response(JSON.stringify(note), { headers: { "Content-Type": "application/json" } });
                }
            }
        }

        return new Response("Method Not Allowed", { status: 405 });
    }
}
