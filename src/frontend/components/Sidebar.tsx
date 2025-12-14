import { useState } from 'react';
import { Home, Briefcase, Lightbulb, User, Plus, Hash, Clock, X } from 'lucide-react';
import type { Space } from '../../types';

interface SidebarProps {
    activeSpace: string;
    spaces: Space[];
    onSpaceChange: (space: string) => void;
    onAddSpace: (label: string) => void;
}

// Map string icon names to components
const ICON_MAP: Record<string, any> = {
    Home, Briefcase, Lightbulb, User, Hash
};

export function Sidebar({ activeSpace, spaces, onSpaceChange, onAddSpace }: SidebarProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSpaceName.trim()) {
            onAddSpace(newSpaceName);
            setNewSpaceName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="w-16 md:w-64 border-r border-gray-200 flex flex-col items-center md:items-stretch py-8 bg-gray-50 h-full">
            <div className="mb-8 px-0 md:px-6 flex justify-center md:justify-start">
                <div className="bg-white p-2 text-black border border-gray-200 rounded-lg shadow-sm">
                    <Clock className="w-5 h-5" />
                </div>
            </div>

            <nav className="flex-1 space-y-2 px-2 md:px-4 overflow-y-auto scrollbar-hide">
                <div className="space-y-1">
                    {spaces.map((space) => {
                        const Icon = ICON_MAP[space.icon] || Hash;
                        const isActive = activeSpace === space.id;

                        return (
                            <button
                                key={space.id}
                                onClick={() => onSpaceChange(space.id)}
                                className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-all ${isActive
                                    ? 'bg-white text-black shadow-sm border border-gray-200'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="hidden md:block font-medium truncate">{space.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* New Space Creation */}
                <div className="pt-2 border-t border-gray-200 mt-2">
                    {isCreating ? (
                        <form onSubmit={handleCreate} className="px-1">
                            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2 shadow-sm animate-in fade-in zoom-in-95">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    placeholder="Name..."
                                    className="w-full text-sm bg-transparent border-none focus:ring-0 outline-none p-0 placeholder-gray-400"
                                    onBlur={() => !newSpaceName && setIsCreating(false)}
                                />
                                <button type="button" onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center justify-center md:justify-start gap-3 p-3 text-gray-400 hover:text-black hover:bg-white/50 rounded-xl transition-all group"
                        >
                            <div className="p-1 rounded-md bg-gray-200 group-hover:bg-gray-300 transition-colors">
                                <Plus className="w-3 h-3" />
                            </div>
                            <span className="hidden md:block text-sm font-medium">New Space</span>
                        </button>
                    )}
                </div>
            </nav>

            <div className="mt-auto px-4 hidden md:block pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">Durable v3.0</p>
            </div>
        </div>
    );
}
