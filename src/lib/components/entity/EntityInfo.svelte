<script lang="ts">
    import { EntityType } from '$lib/types';
    import type { Entity, Enum, Alias, Class } from '$lib/types';
    import { dataStore } from '$lib/services/dataLoader';

    export let entity: Entity;
    export let properties: any[] = [];

    function getEntityLink(id: number): string {
        return `/entity/${id}`;
    }

    $: isClass = entity.type === EntityType.Class;
    $: isEnum = entity.type === EntityType.Enum;
    $: isAlias = entity.type === EntityType.Alias;
    $: enumValues = isEnum ? (entity as Enum).values : [];
    $: aliasValues = isAlias ? (entity as Alias).values : [];
    $: classEntity = isClass ? (entity as Class) : null;
</script>

<div class="mb-6 border-l-4 border-[#3a4577] pl-4">
    <p>
        <span class="font-medium text-gray-300">Type:</span>
        <span class="text-gray-100">{entity?.type || 'Unknown'}</span>
    </p>
    {#if isClass}
        <p>
            <span class="font-medium text-gray-300">Parent:</span>
            {#if classEntity?.hasParent && classEntity.parent !== null}
                <a href={getEntityLink(classEntity.parent)} class="text-[#3a4577] hover:text-blue-400 hover:underline">
                    {$dataStore.database.entityMap.get(classEntity.parent)?.name || `Unknown`}
                </a>
            {:else}
                <span class="text-gray-400">None</span>
            {/if}
        </p>
        <p>
            <span class="font-medium text-gray-300">Childs:</span>
            <span class="text-gray-100">{classEntity?.childs?.length || 0}</span>
        </p>
    {/if}
    <p>
        <span class="font-medium text-gray-300">References:</span>
        <span class="text-gray-100">{entity?.references ? entity.references.length : 0}</span>
    </p>
    {#if isClass}
        <p>
            <span class="font-medium text-gray-300">Properties:</span>
            <span class="text-gray-100">{properties.length}</span>
        </p>
    {:else if isEnum}
        <p>
            <span class="font-medium text-gray-300">Values:</span>
            <span class="text-gray-100">{enumValues.length}</span>
        </p>
    {:else if isAlias}
        <p>
            <span class="font-medium text-gray-300">Values:</span>
            <span class="text-gray-100">{aliasValues.length}</span>
        </p>
    {/if}
</div>
