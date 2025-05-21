<script lang="ts">
  import Stats from '$lib/components/Stats.svelte';
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
  
  function handleSearch(event: CustomEvent<{query: string, filters: string[], results: typeof searchResults}>) {
    searchResults = event.detail.results;
  }
</script>

<svelte:head>
  <title>Oblivion UE4SS Navigator</title>
</svelte:head>

{#if $dataStore.loading}
  <div class="text-center py-12">
    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3a4577] mx-auto"></div>
    <p class="mt-4 text-xl text-gray-300">Loading data...</p>
    <p class="text-gray-400">This may take a moment as we load all the data files.</p>
  </div>
{:else if $dataStore.error}
  <div class="bg-[#111422] border border-red-700 text-red-400 px-4 py-3 rounded relative" role="alert">
    <strong class="font-bold">Error Loading Data:</strong>
    <span class="block sm:inline">{$dataStore.error}</span>
  </div>
{:else}
  <section class="mb-10">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-100">Oblivion UE4SS Navigator</h1>
      <p class="mt-2 text-gray-300">Explore Oblivion Remastered's internal structure</p>
    </div>
    
    <Stats />
  </section>
  
  <section class="mb-8">
    <h2 class="text-2xl font-bold mb-4 text-gray-100">Quick Search</h2>
    <Search autoSearch={true} debounceMs={500} on:search={handleSearch} />
    
    {#if searchResults.totalResults > 0}
      <div class="mt-4 bg-[#0f121e] p-4 rounded-lg shadow-md border border-[#15192b]">
        <p class="text-gray-300 mb-2">Found {searchResults.totalResults} results</p>
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
    <h2 class="text-2xl font-bold mb-4 text-gray-100">Getting Started</h2>
    <div class="bg-[#0f121e] p-6 rounded-lg shadow-md border border-[#15192b]">
      <p class="mb-4 text-gray-300">This tool allows you to explore the internal structure of Oblivion Remastered:</p>
      <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-300">
        <li>Use the <strong>Search</strong> feature to find specific entities, properties, functions, or parameters</li>
        <li>Navigate to the <strong>Browse</strong> page to explore all entities in a structured way</li>
        <li>Click on type references to navigate between related entities</li>
      </ul>
      <p class="text-gray-300">All data is loaded from the CSV files exported from the game.</p>
    </div>
  </section>
{/if}
