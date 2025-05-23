<script lang="ts">
    import type { Entity } from '$lib/services/dataLoader';
    import FilterInput from '../common/FilterInput.svelte';

    export let entity: Entity;
    export let entityNameCache: Map<number, string>;
    let childsFilter = '';

    $: filteredChilds = entity?.childs?.filter((childId) => {
        if (childsFilter === '') return true;
        const childName = entityNameCache.get(childId)?.toLowerCase();
        return childName && childName.includes(childsFilter.toLowerCase());
    }) || [];

    function clearChildsFilter() {
        childsFilter = '';
    }

    function getEntityLink(id: number): string {
        return `/entity/${id}`;
    }
</script>

<h2 class="mb-4 text-xl font-semibold text-gray-100">Childs</h2>

<FilterInput
    value={childsFilter}
    placeholder="Filter child entities..."
    onClear={clearChildsFilter}
/>

{#if entity?.childs && filteredChilds.length > 0}
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredChilds as childId}
            <a
                href={getEntityLink(childId)}
                class="block rounded border border-[#15192b] bg-[#0f121e] p-3 text-gray-100 transition-colors hover:bg-[#15192b]"
            >
                {entityNameCache.get(childId) || `Entity ${childId}`}
            </a>
        {/each}
    </div>
{:else}
    <p class="text-gray-400">
        {entity?.childs && entity.childs.length > 0
            ? 'No child entities match the filter'
            : 'No child entities found'}
    </p>
{/if} 