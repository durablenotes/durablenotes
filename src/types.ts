export type NoteStatus = 'alive' | 'warming' | 'cooling' | 'archived';
export type NoteIntent = 'thinking' | 'planning' | 'building' | 'writing' | 'shared';

export interface Note {
    id: string;
    userId: string;
    content: string;
    status: NoteStatus;
    intent: NoteIntent;
    createdAt: number;
    updatedAt: number;
    closedAt?: number;
    summary?: string;
    space: string;
}

export type ApiResponse = {
    notes: Note[];
};

export interface Space {
    id: string;
    label: string;
    icon: string; // lucide icon name or generic type
    color?: string;
}
