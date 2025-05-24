<script lang="ts">
    import TypeRef from './TypeRef.svelte';

    // Generic type T to allow this component to work with different data types
    export let items: any[] = [];

    // Optional customizations
    export let emptyMessage: string = 'No items found';

    // Theming with dark mode defaults
    export let headerClass: string = 'bg-[#111422] text-gray-300';
    export let rowClass: string = 'hover:bg-[#15192b] transition-colors duration-100';
    export let cellClass: string = 'px-4 py-2 text-gray-100';
</script>

{#if items.length === 0}
    <p class="py-3 text-gray-400">{emptyMessage}</p>
{:else}
    <div class="overflow-x-auto">
        <table class="w-full border-collapse table-fixed">
            <colgroup>
                <col class="w-1/2">
                <col class="w-1/2">
            </colgroup>
            <thead class={headerClass}>
                <tr>
                    <th class="{cellClass} text-left font-medium">Name</th>
                    <th class="{cellClass} text-left font-medium">Type</th>
                </tr>
            </thead>
            <tbody>
                {#each items as item}
                    <tr class="{rowClass} border-b border-[#15192b]">
                        <td class="{cellClass} truncate">{item.name}</td>
                        <td class="{cellClass} truncate"><TypeRef typeInfo={item} /></td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}
