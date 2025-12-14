import { Clock, Zap, RefreshCw } from "lucide-react";
import type { Note } from "../../types";

interface NoteCardProps {
    note: Note;
    onArchive: (id: string, summary?: string) => void;
}

export function NoteCard({ note, onArchive }: NoteCardProps) {
    const intentIcons = {
        thinking: Zap,
        planning: Clock,
        building: RefreshCw,
        writing: RefreshCw,
        shared: RefreshCw,
    };

    const Icon = intentIcons[note.intent] || Zap;

    // Visual cues based on status (Text Color / Opacity instead of Border)
    const statusStyles = {
        alive: "text-gray-900 font-normal",
        warming: "text-gray-500",
        cooling: "text-gray-400",
        archived: "hidden",
    };

    return (
        <div className={`group relative py-3 px-4 transition-all hover:bg-gray-100 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className="flex items-start gap-4 mx-auto max-w-3xl">
                {/* Icon Column */}
                <div className="mt-1 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-black" />
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                    <div className={`text-base leading-relaxed whitespace-pre-wrap ${statusStyles[note.status]}`}>
                        {note.content}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                            onClick={() => onArchive(note.id)}
                            className="hover:text-black transition-colors"
                        >
                            Archive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
