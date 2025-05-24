<script lang="ts">
    import '../app.css';
</script>

<div class="min-h-screen bg-[#0d101b] text-gray-100">
    <header class="border-b border-[#15192b] bg-[#080a11] shadow-md">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 items-center justify-between">
                <div class="flex items-center">
                    <a href="/" class="text-xl font-bold text-gray-100"> Oblivion UE4SS Navigator </a>
                </div>
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
            </div>
        </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
    </main>

    <footer class="border-t border-[#15192b] bg-[#080a11]">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <p class="text-center text-sm text-gray-400">
                Oblivion UE4SS Navigator - A tool for exploring Oblivion Remastered's object structure
            </p>
        </div>
    </footer>
</div>
