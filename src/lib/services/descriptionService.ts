import { writable, get } from 'svelte/store';
import { supabase } from './supabase';

export interface Description {
    id: number;
    entityId: number;
    description: string;
    lastEditedBy: string;
    createdAt: string;
    contributors: string[];
}

// Create a store to cache descriptions
const descriptionCache = writable<Map<number, Description>>(new Map());

export async function fetchEntityDescription(entityId: number): Promise<Description | null> {
    try {
        // Check cache first
        const cache = get(descriptionCache);
        if (cache.has(entityId)) {
            return cache.get(entityId) || null;
        }

        // If not in cache, fetch from Supabase
        const { data, error } = await supabase
            .from('LatestEntityDescription')
            .select('id, entityId, description, lastEditedBy, createdAt, contributors')
            .eq('entityId', entityId)
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            
            throw new Error('Failed to fetch description');
        }

        if (data) {
            // Update cache
            descriptionCache.update(cache => {
                cache.set(entityId, data);
                return cache;
            });
        }

        return data;
    } catch (error) {
        console.error('Error fetching description:', error);
        throw error;
    }
}

export async function editDescription(entityId: number, description: string, author: string): Promise<Description> {
    try {
        const response = await fetch(`/api/entity/${entityId}/description`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description, author })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save description');
        }

        const data = await response.json();

        // Update cache with new description
        descriptionCache.update(cache => {
            cache.set(entityId, data);
            return cache;
        });

        return data;
    } catch (error) {
        console.error('Error editing description:', error);
        throw error;
    }
}

// Optional: Function to clear the cache if needed
export function clearDescriptionCache(): void {
    descriptionCache.set(new Map());
}
