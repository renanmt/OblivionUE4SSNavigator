<script lang="ts">
  import Search from '$lib/components/Search.svelte';
  import SearchResults from '$lib/components/SearchResults.svelte';
  import { dataStore } from '$lib/services/dataLoader';
  import type { Entity, Property, Function, FunctionParam } from '$lib/services/dataLoader';
  
  let searchResults = {
    entities: [] as Entity[],
    properties: [] as Property[],
    functions: [] as Function[],
    params: [] as FunctionParam[],
    totalResults: 0
  };
  
  let currentQuery = '';
  let currentFilters: string[] = [];
  
  function handleSearch(event: CustomEvent<{query: string, filters: string[], results: typeof searchResults}>) {
    searchResults = event.detail.results;
    currentQuery = event.detail.query;
    currentFilters = [...event.detail.filters];
  }
</script>

<svelte:head>
  <title>Search - Oblivion UE4SS Navigator</title>
</svelte:head>

<div class="mb-8">
  <h1 class="text-3xl font-bold mb-4">Search</h1>
  <p class="text-gray-600 mb-6">
    Search for entities, properties, functions, and parameters. Use the filter buttons to narrow your search.
  </p>
  
  {#if $dataStore.isLoading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading data...</p>
    </div>
  {:else}
    <Search on:search={handleSearch} debounceMs={500} />
    
    {#if searchResults.totalResults > 0}
      <div class="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 class="text-xl font-semibold mb-2">Results for "{currentQuery}"</h2>
        <p class="text-gray-600 mb-4">
          Found {searchResults.totalResults} results
          {#if currentFilters.length < 4}
            in categories: {currentFilters.join(', ')}
          {/if}
        </p>
        
        <SearchResults 
          entities={searchResults.entities}
          properties={searchResults.properties}
          functions={searchResults.functions}
          params={searchResults.params}
        />
      </div>
    {:else if currentQuery}
      <div class="mt-6 bg-white p-8 rounded-lg shadow-sm text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900">No results found</h3>
        <p class="mt-2 text-gray-500">Try adjusting your search terms or filters.</p>
      </div>
    {/if}
  {/if}
</div> 