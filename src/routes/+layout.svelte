<script lang="ts">
    import '../app.css';
    import UserProfile from '$lib/components/UserProfile.svelte';
</script>

<div class="flex min-h-screen flex-col bg-[#0d101b] text-gray-100">
    <header class="sticky top-0 z-10 border-b border-[#15192b] bg-[#080a11] shadow-md">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 items-center justify-between">
                <div class="flex items-center gap-3">
                    <img src="/favicon.png" alt="Oblivion Icon" class="h-14 w-14 rounded-full" />
                    <a href="/" class="text-xl font-bold text-gray-100">Oblivion UE4SS Navigator</a>
                </div>
                <div class="flex items-center space-x-4">
                    <nav class="flex space-x-4">
                        <a
                            href="/"
                            class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#15192b] hover:text-white"
                        >
                            Home
                        </a>
                        <a
                            href="/browse"
                            class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#15192b] hover:text-white"
                        >
                            Browse
                        </a>
                    </nav>
                    <div class="ml-4 border-l border-[#15192b] pl-4">
                        <UserProfile />
                    </div>
                </div>
            </div>
        </div>
    </header>

    <main class="flex-1 overflow-auto">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <slot />
        </div>
    </main>

    <footer class="border-t border-[#15192b] bg-[#080a11]">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center gap-2 text-center">
                <p class="text-sm text-gray-400">
                    Oblivion UE4SS Navigator - A tool for exploring Oblivion Remastered's object structure
                </p>
                <p class="text-xs text-gray-500">
                    Author: <a
                        href="https://next.nexusmods.com/profile/LomboAgridoce"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hover:text-gray-400">Lombo Agridoce</a
                    >
                </p>
                <p class="text-xs text-gray-500">
                    Icon by <a
                        href="https://www.nexusmods.com/oblivionremastered/mods/4169"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hover:text-gray-400">Tivoko</a
                    >
                </p>
            </div>
        </div>
    </footer>
</div>
