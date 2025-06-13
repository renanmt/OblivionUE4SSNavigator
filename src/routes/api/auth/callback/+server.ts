import type { RequestEvent } from '@sveltejs/kit';
import { DISCORD_CLIENT_SECRET } from '$env/static/private';

export const GET = async ({ url, cookies }: RequestEvent) => {
    const code = url.searchParams.get('code');

    if (!code) {
        console.error('No code provided in callback URL');
        return new Response(null, {
            status: 302,
            headers: { Location: '/?auth_error=no_code' }
        });
    }

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: import.meta.env.VITE_DISCORD_REDIRECT_URI
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(
                `Failed to get token: ${tokenData.error_description || tokenData.error || 'Unknown error'}`
            );
        }

        // Get the user's information
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            throw new Error(`Failed to get user data: ${userData.message || 'Unknown error'}`);
        }

        try {
            // Set the token in a secure HTTP-only cookie
            cookies.set('discord_token', tokenData.access_token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            // Store user data in a cookie so we can access it client-side
            const userDataForCookie = {
                id: userData.id,
                username: userData.username,
                global_name: userData.global_name,
                avatar: userData.avatar,
                discriminator: userData.discriminator
            };

            cookies.set('discord_user', JSON.stringify(userDataForCookie), {
                path: '/',
                httpOnly: false,
                secure: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
        } catch (error: any) {
            console.error('Failed to set cookies:', error);
            throw new Error(`Cookie error: ${error?.message || 'Unknown cookie error'}`);
        }

        // Use basic Response for redirect
        return new Response(null, {
            status: 302,
            headers: { Location: '/' }
        });
    } catch (error) {
        console.error('Auth error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        return new Response(null, {
            status: 302,
            headers: {
                Location: `/?auth_error=${encodeURIComponent(error instanceof Error ? error.message : 'unknown')}`
            }
        });
    }
};
