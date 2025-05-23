<script lang="ts">
    import { dataStore } from '$lib/services/dataLoader';
</script>

{#if $dataStore.loading}
    <div class="py-8 text-center">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#3a4577]"></div>
        <p class="mt-4 text-gray-300">Loading statistics...</p>
    </div>
{:else}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-[#15192b] bg-[#0f121e] p-6 shadow-md">
            <div class="mb-2 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-100">Classes</h3>
                <span class="text-blue-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-gray-100">{$dataStore.database.classes.length.toLocaleString()}</div>
            <p class="mt-2 text-sm text-gray-400">Total classes in the system with</p>
            <div class="text-xl font-bold text-gray-100">
                {$dataStore.database.properties.length.toLocaleString()}
                <span class="text-sm font-normal text-gray-400">properties</span>
            </div>
            <div class="text-xl font-bold text-gray-100">
                {$dataStore.database.methods.length.toLocaleString()}
                <span class="text-sm font-normal text-gray-400">methods</span>
            </div>
        </div>

        <div class="rounded-lg border border-[#15192b] bg-[#0f121e] p-6 shadow-md">
            <div class="mb-2 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-100">Enums</h3>
                <span class="text-green-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                    </svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-gray-100">{$dataStore.database.enums.length.toLocaleString()}</div>
            <p class="mt-2 text-sm text-gray-400">Total enums defined</p>
        </div>

        <div class="rounded-lg border border-[#15192b] bg-[#0f121e] p-6 shadow-md">
            <div class="mb-2 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-100">Aliases</h3>
                <span class="text-purple-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-gray-100">{$dataStore.database.aliases.length.toLocaleString()}</div>
            <p class="mt-2 text-sm text-gray-400">Total aliases defined</p>
        </div>

        <div class="rounded-lg border border-[#15192b] bg-[#0f121e] p-6 shadow-md">
            <div class="mb-2 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-100">Global Functions</h3>
                <span class="text-yellow-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
                        />
                    </svg>
                </span>
            </div>
            <div class="text-3xl font-bold text-gray-100">
                {$dataStore.database.globalFunctions.length.toLocaleString()}
            </div>
            <p class="mt-2 text-sm text-gray-400">Total global functions</p>
        </div>
    </div>
{/if}
