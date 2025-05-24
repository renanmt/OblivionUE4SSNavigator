import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // You can add Cloudflare-specific logic here if needed
    // For example, handling Cloudflare headers, etc.
    
    const response = await resolve(event);
    return response;
}; 