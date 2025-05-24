<script lang="ts">
    import { EntityType } from '$lib/types';
    import type { Class, Entity } from '$lib/types';
    import FilterInput from '../common/FilterInput.svelte';
    import { dataStore } from '$lib/services/dataLoader';

    export let entity: Entity;
    let childsFilter = '';

    $: isClass = entity.type === EntityType.Class;
    $: classEntity = isClass ? (entity as Class) : null;
    $: filteredChilds =
        classEntity?.childs?.filter((childId) => {
            if (childsFilter === '') return true;
            const childName = $dataStore.database.entityMap.get(childId)?.name.toLowerCase();
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

{#if isClass}
    <FilterInput value={childsFilter} placeholder="Filter child entities..." onClear={clearChildsFilter} />

    {#if filteredChilds.length > 0}
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {#each filteredChilds as childId}
                <a
                    href={getEntityLink(childId)}
                    class="block rounded border border-[#15192b] bg-[#0f121e] p-3 text-gray-100 transition-colors hover:bg-[#15192b]"
                >
                    {$dataStore.database.entityMap.get(childId)?.name || `Entity ${childId}`}
                </a>
            {/each}
        </div>
    {:else}
        <p class="text-gray-400">
            {classEntity?.childs && classEntity.childs.length > 0
                ? 'No child entities match the filter'
                : 'No child entities found'}
        </p>
    {/if}
{:else}
    <p class="text-gray-400">Child entities are only available for classes</p>
{/if}
