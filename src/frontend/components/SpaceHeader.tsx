import { Plus } from 'lucide-react';
import type { Space } from '../../types';

interface SpaceHeaderProps {
    space: Space;
}

export function SpaceHeader({ space }: SpaceHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 md:px-12 py-4 bg-white/50 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-100">
            {/* Space Info */}
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-medium text-gray-900 tracking-tight">{space.label}</h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wider">
                    Private
                </span>
            </div>

            {/* Collaborator Demo UI */}
            <div className="flex items-center gap-2">

                {/* Facepile Mock */}
                <div className="flex -space-x-2 mr-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 cursor-help" title="Just You">
                        ME
                    </div>
                </div>

                {/* Invite Button (Demo) */}
                <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                    title="Feature Unavailable (Demo)"
                >
                    <Plus className="w-3 h-3" />
                    <span>Invite</span>
                </button>
            </div>
        </div>
    );
}
