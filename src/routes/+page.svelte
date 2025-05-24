<script lang="ts">
    import Stats from '$lib/components/Stats.svelte';
    import Search from '$lib/components/Search.svelte';
    import SearchResults from '$lib/components/SearchResults.svelte';
    import { dataStore } from '$lib/services/dataLoader';
    import type { Entity, Property, Method, Parameter } from '$lib/types';
    
    let searchResults = {
        entities: [] as Entity[],
        properties: [] as Property[],
        functions: [] as Method[],
        params: [] as Parameter[],
        totalResults: 0
    };

    function handleSearch(event: CustomEvent<{ query: string; filters: string[]; results: typeof searchResults }>) {
        searchResults = event.detail.results;
    }
</script>

<svelte:head>
    <title>Oblivion UE4SS Navigator</title>
</svelte:head>

{#if $dataStore.loading}
    <div class="py-12 text-center">
        <div class="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-[#3a4577]"></div>
        <p class="mt-4 text-xl text-gray-300">Loading data...</p>
        <p class="text-gray-400">This may take a moment as we load all the data files.</p>
    </div>
{:else if $dataStore.error}
    <div class="relative rounded border border-red-700 bg-[#111422] px-4 py-3 text-red-400" role="alert">
        <strong class="font-bold">Error Loading Data:</strong>
        <span class="block sm:inline">{$dataStore.error}</span>
    </div>
{:else}
    <section class="mb-10">
        <div class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-100">Oblivion UE4SS Navigator</h1>
            <p class="mt-2 text-gray-300">Explore Oblivion Remastered's internal structure</p>
        </div>

        <Stats />
    </section>

    <section class="mb-8">
        <h2 class="mb-4 text-2xl font-bold text-gray-100">Quick Search</h2>
        <Search autoSearch={true} debounceMs={500} on:search={handleSearch} />

        {#if searchResults.totalResults > 0}
            <div class="mt-4 rounded-lg border border-[#15192b] bg-[#0f121e] p-4 shadow-md">
                <p class="mb-2 text-gray-300">Found {searchResults.totalResults} results</p>
                <SearchResults
                    entities={searchResults.entities}
                    properties={searchResults.properties}
                    functions={searchResults.functions}
                    params={searchResults.params}
                />
            </div>
        {/if}
    </section>

    <section>
        <h2 class="mb-4 text-2xl font-bold text-gray-100">Getting Started</h2>
        <div class="rounded-lg border border-[#15192b] bg-[#0f121e] p-6 shadow-md">
            <p class="mb-4 text-gray-300">
                This tool allows you to explore the internal structure of Oblivion Remastered:
            </p>
            <ul class="mb-4 list-disc space-y-2 pl-6 text-gray-300">
                <li>
                    Use the <strong>Search</strong> feature to find specific entities, properties, functions, or parameters
                </li>
                <li>Navigate to the <strong>Browse</strong> page to explore all entities in a structured way</li>
                <li>Click on type references to navigate between related entities</li>
            </ul>
            <p class="text-gray-300">All data is loaded from the CSV files exported from the game.</p>
        </div>
    </section>
{/if}
