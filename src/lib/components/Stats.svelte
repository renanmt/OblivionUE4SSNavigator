<script lang="ts">
  import { dataStore } from '$lib/services/dataLoader';
</script>

{#if $dataStore.loading}
  <div class="text-center py-8">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3a4577] mx-auto"></div>
    <p class="mt-4 text-gray-300">Loading statistics...</p>
  </div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-[#0f121e] p-6 rounded-lg shadow-md border border-[#15192b]">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-100">Classes</h3>
        <span class="text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </span>
      </div>
      <div class="text-3xl font-bold text-gray-100">{$dataStore.database.classes.length.toLocaleString()}</div>
      <p class="text-sm text-gray-400 mt-2">Total classes in the system</p>
    </div>
    
    <div class="bg-[#0f121e] p-6 rounded-lg shadow-md border border-[#15192b]">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-100">Properties</h3>
        <span class="text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </span>
      </div>
      <div class="text-3xl font-bold text-gray-100">{$dataStore.database.properties.length.toLocaleString()}</div>
      <p class="text-sm text-gray-400 mt-2">Total properties defined</p>
    </div>
    
    <div class="bg-[#0f121e] p-6 rounded-lg shadow-md border border-[#15192b]">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-100">Methods</h3>
        <span class="text-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </span>
      </div>
      <div class="text-3xl font-bold text-gray-100">{$dataStore.database.methods.length.toLocaleString()}</div>
      <p class="text-sm text-gray-400 mt-2">Total methods available</p>
    </div>
    
    <div class="bg-[#0f121e] p-6 rounded-lg shadow-md border border-[#15192b]">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-100">Global Functions</h3>
        <span class="text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
        </span>
      </div>
      <div class="text-3xl font-bold text-gray-100">{$dataStore.database.globalFunctions.length.toLocaleString()}</div>
      <p class="text-sm text-gray-400 mt-2">Total global functions</p>
    </div>
  </div>
{/if} 