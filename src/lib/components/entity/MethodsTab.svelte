<script lang="ts">
    import PropertyTable from '../PropertyTable.svelte';
    import TypeRef from '../TypeRef.svelte';
    import FilterInput from '../common/FilterInput.svelte';
    import type { GlobalFunction, Method } from '$lib/types';

    export let methods: (Method | GlobalFunction)[] = [];
    let methodsFilter = '';

    $: filteredMethods = methods.filter(
        (m) => methodsFilter === '' || m.name.toLowerCase().includes(methodsFilter.toLowerCase())
    );

    function clearMethodsFilter() {
        methodsFilter = '';
    }
</script>

<h2 class="mb-4 text-xl font-semibold text-gray-100">Methods</h2>

<FilterInput value={methodsFilter} placeholder="Filter methods..." onClear={clearMethodsFilter} />

{#if filteredMethods.length > 0}
    <div class="space-y-6">
        {#each filteredMethods as method}
            <div class="rounded border border-[#15192b] bg-[#0f121e] p-4">
                <h3 class="text-lg font-bold text-gray-100">
                    {method.name}
                </h3>
                <div class="mt-1 text-sm text-gray-300">
                    Returns: <span class="text-[#3a4577]"><TypeRef typeInfo={method.return} /></span>
                </div>

                <!-- Parameters Section -->
                <div class="mt-2">
                    {#if method.params?.length > 0}
                        <h4 class="mb-1 font-medium text-gray-300">Parameters:</h4>
                        <PropertyTable
                            items={method.params}
                            emptyMessage="No parameters"
                            headerClass="bg-[#111422] text-gray-300 text-sm"
                            rowClass="hover:bg-[#15192b] transition-colors duration-100"
                            cellClass="px-2 py-1 text-sm text-gray-100"
                        />
                    {:else}
                        <div class="text-sm text-gray-400">No parameters</div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{:else}
    <p class="text-gray-400">
        {methods.length > 0 ? 'No methods match the filter' : 'No methods found'}
    </p>
{/if}
