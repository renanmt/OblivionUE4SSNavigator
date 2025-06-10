import { writable } from 'svelte/store';
import type { AuthStore } from '$lib/types/discord';

const initialState: AuthStore = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthStore>(initialState);

    // Initialize from cookie if it exists
    if (typeof window !== 'undefined') {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('discord_user='));
        
        if (userCookie) {
            try {
                const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
                set({
                    isAuthenticated: true,
                    user: userData,
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Error parsing user cookie:', error);
            }
        }
    }

    return {
        subscribe,
        login: async () => {
            const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
            const redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI;
            const scope = 'identify';
            
            update(state => ({ ...state, loading: true, error: null }));
            
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope
            });

            window.location.href = `https://discord.com/api/oauth2/authorize?${params}`;
        },
        logout: () => {
            // Clear cookies
            document.cookie = 'discord_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'discord_user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            set(initialState);
        }
    };
}

export const authStore = createAuthStore();
export const { login, logout } = authStore; 