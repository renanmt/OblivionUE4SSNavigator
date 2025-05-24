<script lang="ts">
    import { dataStore } from '$lib/services/dataLoader';
    import type { Entity } from '$lib/types';
    import { EntityType, type Class } from '$lib/types';
    import { onMount } from 'svelte';

    let isLoading = true;
    let entities: Entity[] = [];
    let filteredEntities: Entity[] = [];
    let currentPage = 1;
    let itemsPerPage = 50;
    let totalPages = 1;
    let searchQuery = '';
    let typeFilter = 'All';
    let availableTypes: string[] = [];

    $: {
        // Filter entities based on searchQuery and typeFilter
        let filtered = entities;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (entity) => entity.name.toLowerCase().includes(query) || entity.type.toLowerCase().includes(query)
            );
        }

        if (typeFilter !== 'All') {
            filtered = filtered.filter((entity) => entity.type === typeFilter);
        }

        filteredEntities = filtered;
        totalPages = Math.max(1, Math.ceil(filteredEntities.length / itemsPerPage));

        // Reset to first page when filters change
        if (currentPage > totalPages) {
            currentPage = 1;
        }
    }

    $: currentEntities = filteredEntities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    $: paginationRange = getPaginationRange(currentPage, totalPages);

    function getPaginationRange(current: number, total: number): number[] {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        if (current <= 3) {
            return [1, 2, 3, 4, 5, -1, total];
        }

        if (current >= total - 2) {
            return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
        }

        return [1, -1, current - 1, current, current + 1, -1, total];
    }

    function goToPage(page: number) {
        currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function getEntityLink(id: number): string {
        return `/entity/${id}`;
    }

    function clearFilters() {
        searchQuery = '';
        typeFilter = 'All';
    }

    onMount(() => {
        if (!$dataStore.loading) {
            // Create a flat array of all entities
            entities = [
                ...$dataStore.database.classes,
                ...$dataStore.database.enums,
                ...$dataStore.database.aliases,
                ...$dataStore.database.globalFunctions
            ].sort((a, b) => a.name.localeCompare(b.name));

            // Get unique types
            const types = new Set<string>();
            entities.forEach((entity) => types.add(entity.type));
            availableTypes = Array.from(types).sort();

            isLoading = false;
        }
    });
</script>

<svelte:head>
    <title>Browse Entities - Oblivion UE4SS Navigator</title>
</svelte:head>

<div class="mb-8">
    <h1 class="mb-4 text-3xl font-bold text-gray-100">Browse Entities</h1>

    {#if $dataStore.loading || isLoading}
        <div class="py-8 text-center">
            <div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#3a4577]"></div>
            <p class="mt-4 text-gray-300">Loading entities...</p>
        </div>
    {:else}
        <div class="mb-6 rounded-lg border border-[#15192b] bg-[#0f121e] p-4 shadow-md">
            <div class="flex flex-col gap-4 md:flex-row">
                <div class="flex-1">
                    <label for="searchQuery" class="mb-1 block text-sm font-medium text-gray-300">Search</label>
                    <input
                        type="text"
                        id="searchQuery"
                        bind:value={searchQuery}
                        placeholder="Search by name or type..."
                        class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 text-gray-100 placeholder-gray-500 focus:border-[#3a4577] focus:ring-2 focus:ring-[#3a4577] focus:outline-none"
                    />
                </div>
                <div class="md:w-1/3">
                    <label for="typeFilter" class="mb-1 block text-sm font-medium text-gray-300">Filter by Type</label>
                    <select
                        id="typeFilter"
                        bind:value={typeFilter}
                        class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 text-gray-100 focus:border-[#3a4577] focus:ring-2 focus:ring-[#3a4577] focus:outline-none"
                    >
                        <option value="All">All Types</option>
                        {#each availableTypes as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </select>
                </div>
                <div class="flex items-end md:w-auto">
                    <button
                        on:click={clearFilters}
                        class="w-full rounded border border-[#15192b] bg-[#111422] px-4 py-2 text-gray-300 transition-colors hover:bg-[#15192b] md:w-auto"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>

        <div class="mb-4 rounded-lg border border-[#15192b] bg-[#0f121e] shadow-md">
            <div class="border-b border-[#15192b] p-4">
                <h2 class="text-lg font-semibold text-gray-100">Entities ({filteredEntities.length})</h2>
                <p class="text-sm text-gray-400">
                    Showing {Math.min(filteredEntities.length, (currentPage - 1) * itemsPerPage + 1)} -
                    {Math.min(filteredEntities.length, currentPage * itemsPerPage)} of {filteredEntities.length}
                </p>
            </div>

            {#if filteredEntities.length === 0}
                <div class="p-8 text-center">
                    <p class="text-gray-400">No entities found with the current filters.</p>
                    <button
                        on:click={clearFilters}
                        class="mt-4 rounded bg-[#3a4577] px-4 py-2 text-white transition-colors hover:bg-[#4a559a]"
                    >
                        Clear Filters
                    </button>
                </div>
            {:else}
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-[#111422]">
                                <th class="p-4 text-left text-gray-300">Name</th>
                                <th class="p-4 text-left text-gray-300">Type</th>
                                <th class="p-4 text-left text-gray-300">Has Parent</th>
                                <th class="p-4 text-left text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each currentEntities as entity}
                                <tr class="border-t border-[#15192b] hover:bg-[#15192b]">
                                    <td class="p-4 text-gray-100">{entity.name}</td>
                                    <td class="p-4 text-gray-100">{entity.type}</td>
                                    <td class="p-4 text-gray-100">
                                        {#if entity.type === EntityType.Class && (entity as Class).hasParent && (entity as Class).parent !== null}
                                            <a
                                                href={getEntityLink((entity as Class).parent!)}
                                                class="link"
                                            >
                                                {$dataStore.database.entityMap.get((entity as Class).parent!)?.name ||
                                                    `Parent (${(entity as Class).parent!})`}
                                            </a>
                                        {:else}
                                            <span class="text-gray-400">No</span>
                                        {/if}
                                    </td>
                                    <td class="p-4">
                                        <a
                                            href={getEntityLink(entity.id)}
                                            class="inline-flex items-center rounded border border-[#15192b] bg-[#111422] px-3 py-1 text-[#3a4577] transition-colors hover:bg-[#15192b]"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="mr-1 h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                            View
                                        </a>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                {#if totalPages > 1}
                    <div class="flex justify-center p-4">
                        <nav class="flex items-center">
                            <button
                                on:click={() => goToPage(Math.max(1, currentPage - 1))}
                                class="rounded-l border border-[#15192b] bg-[#111422] px-3 py-1 text-gray-300 hover:bg-[#15192b] {currentPage ===
                                1
                                    ? 'cursor-not-allowed opacity-50'
                                    : ''}"
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            {#each paginationRange as page}
                                {#if page === -1}
                                    <span class="border-t border-b border-[#15192b] px-3 py-1 text-gray-500">...</span>
                                {:else}
                                    <button
                                        on:click={() => goToPage(page)}
                                        class="border-t border-r border-b border-[#15192b] px-3 py-1 {currentPage ===
                                        page
                                            ? 'bg-[#3a4577] text-white'
                                            : 'bg-[#111422] text-gray-300 hover:bg-[#15192b]'}"
                                    >
                                        {page}
                                    </button>
                                {/if}
                            {/each}

                            <button
                                on:click={() => goToPage(Math.min(totalPages, currentPage + 1))}
                                class="rounded-r border border-[#15192b] bg-[#111422] px-3 py-1 text-gray-300 hover:bg-[#15192b] {currentPage ===
                                totalPages
                                    ? 'cursor-not-allowed opacity-50'
                                    : ''}"
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
</div>
