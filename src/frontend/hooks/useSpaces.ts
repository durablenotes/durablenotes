import { useState, useCallback } from 'react';
import type { Space } from '../../types';

const DEFAULT_SPACES: Space[] = [
    { id: 'main', label: 'Stream', icon: 'Home' },
    { id: 'work', label: 'Work', icon: 'Briefcase' },
    { id: 'ideas', label: 'Ideas', icon: 'Lightbulb' },
    { id: 'personal', label: 'Personal', icon: 'User' },
];

export function useSpaces() {
    const [spaces, setSpaces] = useState<Space[]>(DEFAULT_SPACES);

    const addSpace = useCallback((label: string) => {
        const newSpace: Space = {
            id: label.toLowerCase().replace(/\s+/g, '-'),
            label,
            icon: 'Hash', // Default icon for new spaces
            color: 'bg-gray-100' // potential future use
        };
        setSpaces(prev => [...prev, newSpace]);
        return newSpace;
    }, []);

    const getSpace = useCallback((id: string) => {
        return spaces.find(s => s.id === id) || spaces[0];
    }, [spaces]);

    return {
        spaces,
        addSpace,
        getSpace
    };
}
