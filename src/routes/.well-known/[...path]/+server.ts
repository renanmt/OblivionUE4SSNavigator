import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function GET({ params }: RequestEvent) {
    // Return empty JSON for any .well-known requests
    return json({});
} 