<script lang="ts">
  import { dataStore, type Entity } from '$lib/services/dataLoader';
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
      filtered = filtered.filter(entity => 
        entity.name.toLowerCase().includes(query) || 
        entity.type.toLowerCase().includes(query)
      );
    }
    
    if (typeFilter !== 'All') {
      filtered = filtered.filter(entity => entity.type === typeFilter);
    }
    
    filteredEntities = filtered;
    totalPages = Math.max(1, Math.ceil(filteredEntities.length / itemsPerPage));
    
    // Reset to first page when filters change
    if (currentPage > totalPages) {
      currentPage = 1;
    }
  }
  
  $: currentEntities = filteredEntities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
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
      entities.forEach(entity => types.add(entity.type));
      availableTypes = Array.from(types).sort();
      
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Browse Entities - Oblivion UE4SS Navigator</title>
</svelte:head>

<div class="mb-8">
  <h1 class="text-3xl font-bold mb-4 text-gray-100">Browse Entities</h1>
  
  {#if $dataStore.loading || isLoading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3a4577] mx-auto"></div>
      <p class="mt-4 text-gray-300">Loading entities...</p>
    </div>
  {:else}
    <div class="bg-[#0f121e] p-4 rounded-lg shadow-md border border-[#15192b] mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label for="searchQuery" class="block text-sm font-medium text-gray-300 mb-1">Search</label>
          <input 
            type="text" 
            id="searchQuery"
            bind:value={searchQuery}
            placeholder="Search by name or type..." 
            class="w-full p-2 border rounded bg-[#15192b] text-gray-100 border-[#15192b] placeholder-gray-500 focus:ring-2 focus:ring-[#3a4577] focus:border-[#3a4577] focus:outline-none"
          />
        </div>
        <div class="md:w-1/3">
          <label for="typeFilter" class="block text-sm font-medium text-gray-300 mb-1">Filter by Type</label>
          <select 
            id="typeFilter"
            bind:value={typeFilter}
            class="w-full p-2 border rounded bg-[#15192b] text-gray-100 border-[#15192b] focus:ring-2 focus:ring-[#3a4577] focus:border-[#3a4577] focus:outline-none"
          >
            <option value="All">All Types</option>
            {#each availableTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </div>
        <div class="md:w-auto flex items-end">
          <button 
            on:click={clearFilters}
            class="w-full md:w-auto px-4 py-2 bg-[#111422] text-gray-300 rounded hover:bg-[#15192b] transition-colors border border-[#15192b]"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
    
    <div class="bg-[#0f121e] rounded-lg shadow-md border border-[#15192b] mb-4">
      <div class="p-4 border-b border-[#15192b]">
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
            class="mt-4 px-4 py-2 bg-[#3a4577] text-white rounded hover:bg-[#4a559a] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-[#111422]">
                <th class="text-left p-4 text-gray-300">Name</th>
                <th class="text-left p-4 text-gray-300">Type</th>
                <th class="text-left p-4 text-gray-300">Has Parent</th>
                <th class="text-left p-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each currentEntities as entity}
                <tr class="border-t border-[#15192b] hover:bg-[#15192b]">
                  <td class="p-4 text-gray-100">{entity.name}</td>
                  <td class="p-4 text-gray-100">{entity.type}</td>
                  <td class="p-4 text-gray-100">
                    {#if entity.hasParent && entity.parent !== null}
                      <a href={getEntityLink(entity.parent)} class="text-[#3a4577] hover:text-[#4a559a] hover:underline">
                        {$dataStore.database.entityMap.get(entity.parent)?.name || `Parent (${entity.parent})`}
                      </a>
                    {:else}
                      <span class="text-gray-400">No</span>
                    {/if}
                  </td>
                  <td class="p-4">
                    <a 
                      href={getEntityLink(entity.id)} 
                      class="inline-flex items-center px-3 py-1 bg-[#111422] text-[#3a4577] rounded hover:bg-[#15192b] transition-colors border border-[#15192b]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
          <div class="p-4 flex justify-center">
            <nav class="flex items-center">
              <button 
                on:click={() => goToPage(Math.max(1, currentPage - 1))}
                class="px-3 py-1 border border-[#15192b] rounded-l bg-[#111422] text-gray-300 hover:bg-[#15192b] {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              {#each paginationRange as page}
                {#if page === -1}
                  <span class="px-3 py-1 border-t border-b border-[#15192b] text-gray-500">...</span>
                {:else}
                  <button 
                    on:click={() => goToPage(page)}
                    class="px-3 py-1 border-t border-b border-r border-[#15192b] {currentPage === page ? 'bg-[#3a4577] text-white' : 'bg-[#111422] text-gray-300 hover:bg-[#15192b]'}"
                  >
                    {page}
                  </button>
                {/if}
              {/each}
              
              <button 
                on:click={() => goToPage(Math.min(totalPages, currentPage + 1))}
                class="px-3 py-1 border border-[#15192b] rounded-r bg-[#111422] text-gray-300 hover:bg-[#15192b] {currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
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