export interface DiscordUser {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string;
    discriminator: string;
    email?: string;
}

export interface AuthStore {
    isAuthenticated: boolean;
    user: DiscordUser | null;
    loading: boolean;
    error: string | null;
} 