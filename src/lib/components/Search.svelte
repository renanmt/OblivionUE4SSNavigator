<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { dataStore, type Entity, type Property, type Function, type FunctionParam } from '$lib/services/dataLoader';

    const dispatch = createEventDispatcher<{
        search: {
            query: string;
            filters: string[];
            results: SearchResults;
        };
    }>();

    let searchQuery = '';
    let filters = ['entities', 'properties', 'functions', 'params'];
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    export let autoSearch = false;
    export let debounceMs = 500;

    type SearchResults = {
        entities: Entity[];
        properties: Property[];
        functions: Function[];
        params: FunctionParam[];
        totalResults: number;
    };

    let searchResults: SearchResults = {
        entities: [],
        properties: [],
        functions: [],
        params: [],
        totalResults: 0
    };

    function performSearch() {
        if (!searchQuery.trim()) {
            searchResults = {
                entities: [],
                properties: [],
                functions: [],
                params: [],
                totalResults: 0
            };
            dispatch('search', { query: '', filters, results: searchResults });
            return;
        }

        // Use the search function with proper filters
        const results = dataStore.search(searchQuery, {
            includeEntities: filters.includes('entities'),
            includeProperties: filters.includes('properties'),
            includeMethods: filters.includes('functions'),
            includeParameters: filters.includes('params')
        });

        // Map methods to functions and parameters to params for UI consistency
        searchResults = {
            entities: results.entities,
            properties: results.properties,
            functions: results.methods as unknown as Function[],
            params: results.parameters as unknown as FunctionParam[],
            totalResults:
                results.entities.length + results.properties.length + results.methods.length + results.parameters.length
        };

        dispatch('search', { query: searchQuery, filters, results: searchResults });
    }

    function debouncedSearch() {
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            performSearch();
            debounceTimer = null;
        }, debounceMs);
    }

    function toggleFilter(filter: string) {
        if (filters.includes(filter)) {
            filters = filters.filter((f) => f !== filter);
        } else {
            filters = [...filters, filter];
        }

        if (autoSearch && searchQuery.trim()) {
            debouncedSearch();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
            performSearch();
        }
    }

    function clearSearch() {
        searchQuery = '';
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        searchResults = {
            entities: [],
            properties: [],
            functions: [],
            params: [],
            totalResults: 0
        };
        dispatch('search', { query: '', filters, results: searchResults });
    }

    $: {
        if (autoSearch && searchQuery.trim()) {
            debouncedSearch();
        }
    }
</script>

<div class="mx-auto max-w-4xl">
    <div class="relative">
        <input
            type="text"
            class="w-full rounded-lg border border-[#15192b] bg-[#15192b] p-3 pr-12 pl-10 text-gray-100 placeholder-gray-500 shadow-sm focus:border-[#3a4577] focus:ring-2 focus:ring-[#3a4577] focus:outline-none"
            placeholder="Search for anything..."
            bind:value={searchQuery}
            on:keydown={handleKeydown}
        />
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        </span>
        {#if searchQuery}
            <button
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                on:click={clearSearch}
                aria-label="Clear search"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        {/if}
    </div>

    <div class="mt-3 mb-4 flex flex-wrap gap-2">
        <button
            class="rounded-full px-3 py-1 text-sm {filters.includes('entities')
                ? 'bg-[#3a4577] text-white'
                : 'border border-[#15192b] bg-[#111422] text-gray-300'}"
            on:click={() => toggleFilter('entities')}
        >
            Entities
        </button>
        <button
            class="rounded-full px-3 py-1 text-sm {filters.includes('properties')
                ? 'bg-[#3a4577] text-white'
                : 'border border-[#15192b] bg-[#111422] text-gray-300'}"
            on:click={() => toggleFilter('properties')}
        >
            Properties
        </button>
        <button
            class="rounded-full px-3 py-1 text-sm {filters.includes('functions')
                ? 'bg-[#3a4577] text-white'
                : 'border border-[#15192b] bg-[#111422] text-gray-300'}"
            on:click={() => toggleFilter('functions')}
        >
            Functions
        </button>
        <button
            class="rounded-full px-3 py-1 text-sm {filters.includes('params')
                ? 'bg-[#3a4577] text-white'
                : 'border border-[#15192b] bg-[#111422] text-gray-300'}"
            on:click={() => toggleFilter('params')}
        >
            Parameters
        </button>
    </div>

    {#if !autoSearch}
        <div class="mt-4 text-center">
            <button
                class="rounded-lg bg-[#3a4577] px-4 py-2 text-white shadow-sm transition-colors hover:bg-[#4a559a]"
                on:click={performSearch}
            >
                Search
            </button>
        </div>
    {/if}
</div>
