<script lang="ts">
  // Generic type T to allow this component to work with different data types
  export let items: any[] = [];
  export let columns: {key: string, header: string}[] = [];
  
  // Optional customizations
  export let emptyMessage: string = "No items found";
  export let renderCell: (item: any, column: {key: string, header: string}) => string | HTMLElement = 
    (item, column) => item[column.key]?.toString() || '';
  
  // Theming with dark mode defaults
  export let headerClass: string = "bg-[#111422] text-gray-300";
  export let rowClass: string = "hover:bg-[#15192b] transition-colors duration-100";
  export let cellClass: string = "px-4 py-2 text-gray-100";
</script>

{#if items.length === 0}
  <p class="text-gray-400 py-3">{emptyMessage}</p>
{:else}
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead class="{headerClass}">
        <tr>
          {#each columns as column}
            <th class="{cellClass} text-left font-medium">{column.header}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <tr class="{rowClass} border-b border-[#15192b]">
            {#each columns as column}
              <td class="{cellClass}">{@html renderCell(item, column)}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if} 