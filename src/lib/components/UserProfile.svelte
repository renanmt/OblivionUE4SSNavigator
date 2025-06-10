<script lang="ts">
    import { authStore, login, logout } from '$lib/services/authStore';

    function getAvatarUrl(user: any) {
        if (!user?.avatar) return 'https://cdn.discordapp.com/embed/avatars/0.png';
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }

    function getDisplayName(user: any) {
        console.log(user);
        return user?.global_name || user?.username || 'Unknown User';
    }
</script>

<div class="flex items-center gap-4">
    {#if $authStore.loading}
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3a4577]"></div>
    {:else if $authStore.isAuthenticated && $authStore.user}
        <div class="flex items-center gap-2">
            <img src={getAvatarUrl($authStore.user)} alt="User avatar" class="h-8 w-8 rounded-full" />
            <span class="text-gray-200">{getDisplayName($authStore.user)}</span>
            <button
                on:click={logout}
                class="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-[#15192b] hover:text-gray-200"
                aria-label="Logout"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </div>
    {:else}
        <button on:click={login} class="rounded bg-[#5865F2] px-4 py-2 font-medium text-white hover:bg-[#4752C4]">
            Login with Discord
        </button>
    {/if}
</div>
