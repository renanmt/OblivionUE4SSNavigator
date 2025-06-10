<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Entity, Property, Method, Parameter } from '$lib/types';
    import { dataStore } from '$lib/services/dataLoader';

    const dispatch = createEventDispatcher<{
        search: {
            query: string;
            filters: string[];
            results: SearchResults;
            isRegex: boolean;
        };
    }>();

    let searchQuery = '';
    let filters = [
        'classes',
        'enums',
        'aliases',
        'global_functions',
        'methods',
        'properties',
        'parameters'
    ].sort();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isRegexError = false;
    let regexErrorMessage = '';

    export let autoSearch = false;
    export let debounceMs = 500;

    type SearchResults = {
        entities: Entity[];
        properties: Property[];
        functions: Method[];
        params: Parameter[];
        totalResults: number;
    };

    let searchResults: SearchResults = {
        entities: [],
        properties: [],
        functions: [],
        params: [],
        totalResults: 0
    };

    // Filter button configuration for consistent order
    const filterButtons = [
        { id: 'classes', label: 'Classes' },
        { id: 'enums', label: 'Enums' },
        { id: 'aliases', label: 'Aliases' },
        { id: 'global_functions', label: 'Global Functions' },
        { id: 'methods', label: 'Methods' },
        { id: 'properties', label: 'Properties' },
        { id: 'parameters', label: 'Parameters' }
    ].sort((a, b) => a.label.localeCompare(b.label));

    function isRegexPattern(query: string): boolean {
        return query.startsWith('/') && query.length > 1 && query.endsWith('/');
    }

    function getRegexFromPattern(pattern: string): RegExp | null {
        // Remove leading and trailing slashes
        const regexStr = pattern.slice(1, -1);
        try {
            return new RegExp(regexStr);
        } catch (error) {
            isRegexError = true;
            regexErrorMessage = error instanceof Error ? error.message : 'Invalid regex pattern';
            return null;
        }
    }

    function performSearch() {
        isRegexError = false;
        regexErrorMessage = '';

        if (!searchQuery.trim()) {
            searchResults = {
                entities: [],
                properties: [],
                functions: [],
                params: [],
                totalResults: 0
            };
            dispatch('search', { query: '', filters, results: searchResults, isRegex: false });
            return;
        }

        const isRegex = isRegexPattern(searchQuery);
        let finalQuery = searchQuery;
        let regex: RegExp | null = null;

        if (isRegex) {
            regex = getRegexFromPattern(searchQuery);
            if (!regex) {
                searchResults = {
                    entities: [],
                    properties: [],
                    functions: [],
                    params: [],
                    totalResults: 0
                };
                dispatch('search', { query: searchQuery, filters, results: searchResults, isRegex });
                return;
            }
            finalQuery = regex.source;
        }

        // Map filters to search options
        const results = dataStore.search(finalQuery, {
            includeClasses: filters.includes('classes'),
            includeEnums: filters.includes('enums'),
            includeAliases: filters.includes('aliases'),
            includeGlobalFunctions: filters.includes('global_functions'),
            includeProperties: filters.includes('properties'),
            includeMethods: filters.includes('methods'),
            includeParameters: filters.includes('parameters'),
            isRegex
        });

        // Map results to UI structure
        searchResults = {
            entities: results.entities,
            properties: results.properties,
            functions: results.methods as unknown as Method[],
            params: results.parameters as unknown as Parameter[],
            totalResults:
                results.entities.length + results.properties.length + results.methods.length + results.parameters.length
        };

        dispatch('search', { query: searchQuery, filters, results: searchResults, isRegex });
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
        isRegexError = false;
        regexErrorMessage = '';
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
        dispatch('search', { query: '', filters, results: searchResults, isRegex: false });
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
            class="w-full rounded-lg border {isRegexError ? 'border-red-500' : 'border-[#15192b]'} bg-[#15192b] p-3 pr-12 pl-10 text-gray-100 placeholder-gray-500 shadow-sm focus:border-[#3a4577] focus:ring-2 focus:ring-[#3a4577] focus:outline-none"
            placeholder="Search for anything... (Use /pattern/ for regex)"
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

    {#if isRegexError}
        <div class="mt-2 text-sm text-red-500">
            {regexErrorMessage}
        </div>
    {/if}

    <div class="mt-3 mb-4 flex flex-wrap gap-2">
        {#each filterButtons as button}
            <button
                class="rounded-full px-3 py-1 text-sm {filters.includes(button.id)
                    ? 'bg-[#3a4577] text-white'
                    : 'border border-[#15192b] bg-[#111422] text-gray-300'}"
                on:click={() => toggleFilter(button.id)}
            >
                {button.label}
            </button>
        {/each}
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
