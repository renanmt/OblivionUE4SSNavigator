<script lang="ts">
    import type { Entity } from '$lib/services/dataLoader';

    export let entity: Entity;
    export let properties: any[] = [];
    export let entityNameCache: Map<number, string>;

    function getEntityLink(id: number): string {
        return `/entity/${id}`;
    }
</script>

<div class="mb-6 border-l-4 border-[#3a4577] pl-4">
    <p>
        <span class="font-medium text-gray-300">Type:</span>
        <span class="text-gray-100">{entity?.type || 'Unknown'}</span>
    </p>
    <p>
        <span class="font-medium text-gray-300">Parent:</span>
        {#if entity?.hasParent && entity.parent !== null}
            <a
                href={getEntityLink(entity.parent)}
                class="text-[#3a4577] hover:text-blue-400 hover:underline"
            >
                {entityNameCache.get(entity.parent) || `UObject`}
            </a>
        {:else}
            <span class="text-gray-400">None</span>
        {/if}
    </p>
    <p>
        <span class="font-medium text-gray-300">Childs:</span>
        <span class="text-gray-100">{entity?.childs ? entity.childs.length : 0}</span>
    </p>
    <p>
        <span class="font-medium text-gray-300">References:</span>
        <span class="text-gray-100">{entity?.references ? entity.references.length : 0}</span>
    </p>
    <p>
        <span class="font-medium text-gray-300">Properties:</span>
        <span class="text-gray-100">{properties.length}</span>
    </p>
</div> 