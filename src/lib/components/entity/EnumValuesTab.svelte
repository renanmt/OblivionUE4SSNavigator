<script lang="ts">
    import type { EnumValue } from '$lib/types';
    import FilterInput from '../common/FilterInput.svelte';

    export let values: EnumValue[] = [];
    let valuesFilter = '';

    $: filteredValues = values.filter(
        (v) => valuesFilter === '' || v.name.toLowerCase().includes(valuesFilter.toLowerCase())
    );

    function clearValuesFilter() {
        valuesFilter = '';
    }
</script>

<h2 class="mb-4 text-xl font-semibold text-gray-100">Values</h2>

<FilterInput
    bind:value={valuesFilter}
    placeholder="Filter enum values..."
    onClear={clearValuesFilter}
/>

{#if filteredValues.length > 0}
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead>
                <tr class="bg-[#111422]">
                    <th class="p-2 text-left text-gray-300">Name</th>
                    <th class="p-2 text-left text-gray-300">Value</th>
                </tr>
            </thead>
            <tbody>
                {#each filteredValues as enumValue}
                    <tr class="border-b border-[#15192b] hover:bg-[#15192b]">
                        <td class="p-2 text-gray-100">{enumValue.name}</td>
                        <td class="p-2 text-gray-100">{enumValue.value}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{:else}
    <p class="text-gray-400">
        {values.length > 0 ? 'No values match the filter' : 'No values found'}
    </p>
{/if} 