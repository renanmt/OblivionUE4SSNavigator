import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY } from '$env/static/private';

const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        persistSession: false
    }
});

export async function POST({ request, params }: RequestEvent) {
    try {
        const entityId = parseInt(params.id!);
        if (isNaN(entityId)) {
            return json({ error: 'Invalid entity ID' }, { status: 400 });
        }

        const { description, author } = await request.json();
        if (!description || !author) {
            return json({ error: 'Description and author are required' }, { status: 400 });
        }

        // Get current description to update contributors
        const { data: currentData } = await supabase
            .from('LatestEntityDescription')
            .select('contributors')
            .eq('entityId', entityId)
            .single();

        const contributors = currentData?.contributors || [];
        if (!contributors.includes(author)) {
            contributors.push(author);
        }

        // Insert new description
        const { data, error } = await supabase
            .from('EntityDescription')
            .insert([
                {
                    entityId,
                    description,
                    lastEditedBy: author,
                    createdAt: new Date().toISOString(),
                    contributors
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return json({ error: 'Failed to save description' }, { status: 500 });
        }

        return json(data);
    } catch (error) {
        console.error('Server error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
