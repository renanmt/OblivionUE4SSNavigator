<script context="module" lang="ts">
    export type TabType = 'properties' | 'methods' | 'childs' | 'references' | 'code' | 'values' | 'function';
</script>

<script lang="ts">
    import { EntityType, type Entity } from '$lib/types';

    export let activeTab: TabType;
    export let onTabChange: (tab: TabType) => void;
    export let entity: Entity;

    $: isClass = entity.type === EntityType.Class;
    $: isEnum = entity.type === EntityType.Enum;
    $: isAlias = entity.type === EntityType.Alias;
    $: isGlobalFunction = entity.type === EntityType.GlobalFunction;
</script>

<div class="flex flex-col space-y-2">
    {#if isClass}
        <button
            class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
            class:bg-[#3a4577]={activeTab === 'properties'}
            class:text-white={activeTab === 'properties'}
            class:border-[#3a4577]={activeTab === 'properties'}
            class:bg-[#0f121e]={activeTab !== 'properties'}
            class:text-gray-300={activeTab !== 'properties'}
            class:border-[#15192b]={activeTab !== 'properties'}
            on:click={() => onTabChange('properties')}
        >
            Properties
        </button>
        <button
            class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
            class:bg-[#3a4577]={activeTab === 'methods'}
            class:text-white={activeTab === 'methods'}
            class:border-[#3a4577]={activeTab === 'methods'}
            class:bg-[#0f121e]={activeTab !== 'methods'}
            class:text-gray-300={activeTab !== 'methods'}
            class:border-[#15192b]={activeTab !== 'methods'}
            on:click={() => onTabChange('methods')}
        >
            Methods
        </button>
        <button
            class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
            class:bg-[#3a4577]={activeTab === 'childs'}
            class:text-white={activeTab === 'childs'}
            class:border-[#3a4577]={activeTab === 'childs'}
            class:bg-[#0f121e]={activeTab !== 'childs'}
            class:text-gray-300={activeTab !== 'childs'}
            class:border-[#15192b]={activeTab !== 'childs'}
            on:click={() => onTabChange('childs')}
        >
            Childs
        </button>
    {:else if isEnum || isAlias}
        <button
            class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
            class:bg-[#3a4577]={activeTab === 'values'}
            class:text-white={activeTab === 'values'}
            class:border-[#3a4577]={activeTab === 'values'}
            class:bg-[#0f121e]={activeTab !== 'values'}
            class:text-gray-300={activeTab !== 'values'}
            class:border-[#15192b]={activeTab !== 'values'}
            on:click={() => onTabChange('values')}
        >
            Values
        </button>
    {:else if isGlobalFunction}
        <button
            class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
            class:bg-[#3a4577]={activeTab === 'function'}
            class:text-white={activeTab === 'function'}
            class:border-[#3a4577]={activeTab === 'function'}
            class:bg-[#0f121e]={activeTab !== 'function'}
            class:text-gray-300={activeTab !== 'function'}
            class:border-[#15192b]={activeTab !== 'function'}
            on:click={() => onTabChange('function')}
        >
            Function Details
        </button>
    {/if}
    <button
        class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
        class:bg-[#3a4577]={activeTab === 'references'}
        class:text-white={activeTab === 'references'}
        class:border-[#3a4577]={activeTab === 'references'}
        class:bg-[#0f121e]={activeTab !== 'references'}
        class:text-gray-300={activeTab !== 'references'}
        class:border-[#15192b]={activeTab !== 'references'}
        on:click={() => onTabChange('references')}
    >
        References
    </button>
    <button
        class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
        class:bg-[#3a4577]={activeTab === 'code'}
        class:text-white={activeTab === 'code'}
        class:border-[#3a4577]={activeTab === 'code'}
        class:bg-[#0f121e]={activeTab !== 'code'}
        class:text-gray-300={activeTab !== 'code'}
        class:border-[#15192b]={activeTab !== 'code'}
        on:click={() => onTabChange('code')}
    >
        Code
    </button>
</div> 