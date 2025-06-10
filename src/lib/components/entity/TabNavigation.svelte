<script context="module" lang="ts">
    export type TabType =
        | 'description'
        | 'properties'
        | 'methods'
        | 'values'
        | 'childs'
        | 'references'
        | 'code'
        | 'function';
</script>

<script lang="ts">
    import { EntityType, type Entity } from '$lib/types';

    export let entity: Entity;
    export let activeTab: TabType;
    export let onTabChange: (tab: TabType) => void;

    $: isClass = entity.type === EntityType.Class;
    $: isEnum = entity.type === EntityType.Enum;
    $: isAlias = entity.type === EntityType.Alias;
    $: isGlobalFunction = entity.type === EntityType.GlobalFunction;

    const commonTabs: { id: TabType; label: string }[] = [
        { id: 'description' as const, label: 'Description' }
    ];

    $: tabs = [
        ...commonTabs,
        ...(entity.type === EntityType.Class
            ? [
                  { id: 'properties' as const, label: 'Properties' },
                  { id: 'methods' as const, label: 'Methods' }
              ]
            : []),
        ...(entity.type === EntityType.Enum || entity.type === EntityType.Alias
            ? [{ id: 'values' as const, label: 'Values' }]
            : []),
        ...(entity.type === EntityType.GlobalFunction ? [{ id: 'function' as const, label: 'Function' }] : []),
        ...(entity.type === EntityType.Class ? [{ id: 'childs' as const, label: 'Childs' }] : []),
        { id: 'references' as const, label: 'References' },
        { id: 'code' as const, label: 'Code' }
    ];
</script>

<nav class="mt-6">
    <div class="space-y-1">
        {#each tabs as tab}
            <button
                class="w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors {activeTab === tab.id
                    ? 'bg-[#15192b] text-white'
                    : 'text-gray-300 hover:bg-[#15192b] hover:text-white'}"
                on:click={() => onTabChange(tab.id)}
            >
                {tab.label}
            </button>
        {/each}
    </div>
</nav> 