import { useState } from 'react';
import { Home, Briefcase, Lightbulb, User, Plus, Hash, Clock, X, LogOut } from 'lucide-react';
import type { Space } from '../../types';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';

interface SidebarProps {
    activeSpace: string;
    spaces: Space[];
    onSpaceChange: (space: string) => void;
    onAddSpace: (label: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

// Map string icon names to components
const ICON_MAP: Record<string, any> = {
    Home, Briefcase, Lightbulb, User, Hash
};

export function Sidebar({ activeSpace, spaces, onSpaceChange, onAddSpace, isOpen, onClose }: SidebarProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const { user, logout } = useAuth();
    const { settings } = useBrand();

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSpaceName.trim()) {
            onAddSpace(newSpaceName);
            setNewSpaceName('');
            setIsCreating(false);
        }
    };

    const handleSpaceClick = (id: string) => {
        onSpaceChange(id);
        if (window.innerWidth < 768) {
            onClose(); // Auto-close on mobile
        }
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 border-r border-gray-200 
                transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full py-6">
                    {/* Logo Area */}
                    <div className="mb-6 px-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                            ) : (
                                <div className="bg-black text-white p-2 rounded-xl shadow-md">
                                    <Clock className="w-5 h-5" />
                                </div>
                            )}
                            <span className="font-semibold text-lg tracking-tight">{settings.site_title}</span>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-black">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 space-y-2 px-4 overflow-y-auto scrollbar-hide">
                        <div className="space-y-1">
                            {spaces.map((space) => {
                                const Icon = ICON_MAP[space.icon] || Hash;
                                const isActive = activeSpace === space.id;

                                return (
                                    <button
                                        key={space.id}
                                        onClick={() => handleSpaceClick(space.id)}
                                        className={`w-full flex items-center justify-start gap-3 p-2.5 rounded-xl transition-all ${isActive
                                            ? 'bg-white text-black shadow-sm border border-gray-200'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium truncate text-sm">{space.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* New Space Creation */}
                        <div className="pt-4 border-t border-gray-200 mt-4">
                            <div className="px-2 mb-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Spaces</span>
                            </div>
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
                                    className="w-full flex items-center justify-start gap-3 p-2.5 text-gray-400 hover:text-black hover:bg-white/50 rounded-xl transition-all group"
                                >
                                    <div className="p-1 rounded-md bg-gray-200 group-hover:bg-gray-300 transition-colors">
                                        <Plus className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm font-medium">New Space</span>
                                </button>
                            )}
                        </div>
                    </nav>

                    {/* User Profile */}
                    <div className="mt-auto px-4 pt-4 border-t border-gray-200">
                        {user && (
                            <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full border border-gray-100"
                                />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    title="Log out"
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
