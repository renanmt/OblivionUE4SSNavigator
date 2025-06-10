<script lang="ts">
    import { dataStore } from '$lib/services/dataLoader';
    import FilterInput from '../common/FilterInput.svelte';
    import type { Entity } from '$lib/types';

    export let entity: Entity;
    export let referencedBy: { entity: Entity; referenceType: string }[] = [];
    let referencesFilter = '';

    $: filteredReferences =
        entity?.references?.filter((ref) => {
            if (referencesFilter === '') return true;
            const refName = $dataStore.database.entityMap.get(ref.id)?.name.toLowerCase();
            return refName && refName.includes(referencesFilter.toLowerCase());
        }) || [];

    $: filteredReferencedBy = referencedBy.filter(
        (ref) => referencesFilter === '' || ref.entity.name.toLowerCase().includes(referencesFilter.toLowerCase())
    );

    function clearReferencesFilter() {
        referencesFilter = '';
    }

    function getEntityLink(id: number): string {
        return `/entity/${id}`;
    }

    function getReferenceTypeLabel(type: string): string {
        switch (type) {
            case 'prop':
                return 'Property';
            case 'func':
                return 'Method Return';
            case 'gfunc':
                return 'Global Function Return';
            case 'param':
                return 'Parameter';
            default:
                return type;
        }
    }
</script>

<h2 class="mb-4 text-xl font-semibold text-gray-100">References</h2>

<FilterInput bind:value={referencesFilter} placeholder="Filter references..." onClear={clearReferencesFilter} />

{#if entity?.references && filteredReferences.length > 0}
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredReferences as ref}
            <a
                href={getEntityLink(ref.id)}
                class="block rounded border border-[#15192b] bg-[#0f121e] p-3 text-gray-100 transition-colors hover:bg-[#15192b]"
            >
                {$dataStore.database.entityMap.get(ref.id)?.name || `Entity ${ref.id}`}
                <span class="text-gray-400">({getReferenceTypeLabel(ref.type)})</span>
            </a>
        {/each}
    </div>
{:else if entity?.references}
    <p class="text-gray-400">No references match the filter</p>
{/if}

{#if filteredReferencedBy.length > 0}
    <h2 class="mt-6 mb-2 text-xl font-semibold text-gray-100">Referenced By</h2>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredReferencedBy as ref}
            <a
                href={getEntityLink(ref.entity.id)}
                class="block rounded border border-[#15192b] bg-[#0f121e] p-3 text-gray-100 transition-colors hover:bg-[#15192b]"
            >
                {ref.entity.name}
                <span class="text-gray-400">({getReferenceTypeLabel(ref.referenceType)})</span>
            </a>
        {/each}
    </div>
{:else if referencedBy.length > 0}
    <h2 class="mt-6 mb-2 text-xl font-semibold text-gray-100">Referenced By</h2>
    <p class="text-gray-400">No references match the filter</p>
{/if}

{#if (!entity?.references || entity.references.length === 0) && referencedBy.length === 0}
    <p class="text-gray-400">No references found</p>
{/if}
