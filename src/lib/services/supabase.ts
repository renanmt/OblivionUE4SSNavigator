import { createClient } from '@supabase/supabase-js';

// Create a single instance of the Supabase client
export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false
        },
        global: {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    }
); 