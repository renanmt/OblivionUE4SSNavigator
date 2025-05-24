<script lang="ts">
    import type { Parameter, TypeMin } from '$lib/types';
    import PropertyTable from '../PropertyTable.svelte';
    import TypeRef from '../TypeRef.svelte';
    export let params: Parameter[] = [];
    export let returnType: TypeMin;
</script>

<div class="space-y-4">
    <div class="rounded-lg border border-[#15192b] p-4">
        <h3 class="mb-2 text-lg font-semibold text-blue-400">Return Type</h3>
        <div><TypeRef typeInfo={returnType} /></div>
    </div>

    <div class="rounded-lg border border-[#15192b] p-4">
        <h3 class="mb-2 text-lg font-semibold text-blue-400">Parameters</h3>
        {#if params.length === 0}
            <p class="text-gray-400">No parameters</p>
        {:else}
            <PropertyTable
                items={params}
                emptyMessage="No parameters found"
                headerClass="bg-[#111422] text-gray-300"
                rowClass="hover:bg-[#15192b] transition-colors duration-100"
            />
        {/if}
    </div>
</div>
