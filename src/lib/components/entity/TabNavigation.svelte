<script context="module" lang="ts">
    export type TabType = 'properties' | 'methods' | 'childs' | 'references' | 'code';
</script>

<script lang="ts">
    export let activeTab: TabType;
    export let onTabChange: (tab: TabType) => void;
</script>

<div class="flex flex-col space-y-2">
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