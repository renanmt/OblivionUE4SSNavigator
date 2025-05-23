<script lang="ts">
    import type { Property } from '$lib/services/dataLoader';
    import PropertyTable from '../PropertyTable.svelte';
    import FilterInput from '../common/FilterInput.svelte';

    export let properties: Property[] = [];
    let propertiesFilter = '';

    $: filteredProperties = properties.filter(
        (p) => propertiesFilter === '' || p.name.toLowerCase().includes(propertiesFilter.toLowerCase())
    );

    function clearPropertiesFilter() {
        propertiesFilter = '';
    }
</script>

<h2 class="mb-4 text-xl font-semibold text-gray-100">Properties</h2>

<FilterInput
    value={propertiesFilter}
    placeholder="Filter properties..."
    onClear={clearPropertiesFilter}
/>

{#if filteredProperties.length > 0}
    <PropertyTable
        items={filteredProperties}
        emptyMessage="No properties found"
        headerClass="bg-[#111422] text-gray-300"
        rowClass="hover:bg-[#15192b] transition-colors duration-100"
        cellClass="px-4 py-2 text-gray-100"
    />
{:else}
    <p class="text-gray-400">
        {properties.length > 0 ? 'No properties match the filter' : 'No properties found'}
    </p>
{/if} 