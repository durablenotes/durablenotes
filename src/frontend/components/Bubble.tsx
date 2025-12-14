import type { Note } from "../../types";

interface BubbleProps {
    note: Note;
    onClick: (note: Note) => void;
}

export function Bubble({ note, onClick }: BubbleProps) {
    // Implicit States (Visual)
    // Alive: High opacity, subtle shadow
    // Warming: Slightly reduced opacity
    // Cooling: Low opacity, very flat
    // Archived: Hidden (handled by parent filter usually)

    const stateStyles = {
        alive: "bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-md opacity-100",
        warming: "bg-white/80 border border-gray-100 text-gray-700 opacity-90 hover:opacity-100",
        cooling: "bg-white/40 border border-transparent text-gray-400 opacity-60 hover:opacity-100 hover:bg-white hover:border-gray-200",
        archived: "hidden",
    };

    return (
        <button
            onClick={() => onClick(note)}
            className={`
                group inline-flex items-center px-5 py-2.5 
                rounded-full transition-all duration-500 ease-out
                cursor-pointer outline-none focus:ring-2 focus:ring-gray-200
                animate-in zoom-in-95 fade-in duration-300
                max-w-md truncate
                ${stateStyles[note.status]}
            `}
        >
            <span className="truncate text-base font-normal tracking-wide leading-relaxed">
                {note.content}
            </span>
        </button>
    );
}
