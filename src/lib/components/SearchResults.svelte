<script lang="ts">
    import { dataStore } from '$lib/services/dataLoader';
    import {
        type Entity,
        type Property,
        type Method,
        type Parameter,
        type Class,
        type Enum,
        type Alias,
        type GlobalFunction,
        EntityType
    } from '$lib/types';
    import TypeRef from './TypeRef.svelte';

    export let entities: Entity[] = [];
    export let properties: Property[] = [];
    export let functions: Method[] = [];
    export let params: Parameter[] = [];

    $: classes = entities.filter((e) => e.type === EntityType.Class) as Class[];
    $: enums = entities.filter((e) => e.type === EntityType.Enum) as Enum[];
    $: aliases = entities.filter((e) => e.type === EntityType.Alias) as Alias[];
    $: globalFunctions = entities.filter((e) => e.type === EntityType.GlobalFunction) as GlobalFunction[];

    // Tab management
    type TabType = 'classes' | 'enums' | 'aliases' | 'global_functions' | 'methods' | 'properties' | 'params';
    let activeTab: TabType = 'classes';

    // Set initial active tab to first tab with results
    $: {
        if (classes.length > 0) activeTab = 'classes';
        else if (enums.length > 0) activeTab = 'enums';
        else if (aliases.length > 0) activeTab = 'aliases';
        else if (globalFunctions.length > 0) activeTab = 'global_functions';
        else if (functions.length > 0) activeTab = 'methods';
        else if (properties.length > 0) activeTab = 'properties';
        else if (params.length > 0) activeTab = 'params';
    }

    function setActiveTab(tab: TabType) {
        activeTab = tab;
    }

    function getEntityLink(id: number): string {
        return `/entity/${id}`;
    }

    function getEntityName(id: number): string {
        // Use direct database access from the store instead of async function
        const { database } = $dataStore;
        const entity = database.entityMap.get(id);
        return entity?.name || `Unknown (${id})`;
    }

    function truncateName(name: string, maxLength: number = 50): string {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 3) + '...';
    }
</script>

{#if !entities.length && !properties.length && !functions.length && !params.length}
    <div class="py-6 text-center text-gray-400">No results found</div>
{:else}
    <div class="my-6">
        <!-- Tabs -->
        <div class="mb-4 border-b border-[#15192b]">
            <ul class="-mb-px flex flex-wrap">
                {#if classes.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'classes'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('classes')}
                        >
                            Classes ({classes.length})
                        </button>
                    </li>
                {/if}
                {#if enums.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'enums'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('enums')}
                        >
                            Enums ({enums.length})
                        </button>
                    </li>
                {/if}
                {#if aliases.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'aliases'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('aliases')}
                        >
                            Aliases ({aliases.length})
                        </button>
                    </li>
                {/if}
                {#if globalFunctions.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'global_functions'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('global_functions')}
                        >
                            Global Functions ({globalFunctions.length})
                        </button>
                    </li>
                {/if}
                {#if functions.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'methods'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('methods')}
                        >
                            Methods ({functions.length})
                        </button>
                    </li>
                {/if}
                {#if properties.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'properties'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('properties')}
                        >
                            Properties ({properties.length})
                        </button>
                    </li>
                {/if}
                {#if params.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'params'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('params')}
                        >
                            Parameters ({params.length})
                        </button>
                    </li>
                {/if}
            </ul>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
            <!-- Classes Tab -->
            {#if activeTab === 'classes' && classes.length > 0}
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {#each classes as entity}
                        <a
                            href={getEntityLink(entity.id)}
                            class="rounded-lg border border-[#15192b] bg-[#0f121e] p-3 transition-shadow hover:bg-[#15192b] hover:shadow-md"
                            title={entity.name}
                        >
                            <h3 class="overflow-hidden font-medium text-ellipsis text-gray-100">
                                {truncateName(entity.name)}
                            </h3>
                            <p class="text-sm text-gray-400">{entity.type}</p>
                            {#if entity.hasParent && entity.parent !== null}
                                <p class="mt-1 text-xs text-gray-400">
                                    Parent: {getEntityName(entity.parent as number)}
                                </p>
                            {/if}
                        </a>
                    {/each}
                </div>
            {/if}

            <!-- Enums Tab -->
            {#if activeTab === 'enums' && enums.length > 0}
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {#each enums as entity}
                        <a
                            href={getEntityLink(entity.id)}
                            class="rounded-lg border border-[#15192b] bg-[#0f121e] p-3 transition-shadow hover:bg-[#15192b] hover:shadow-md"
                            title={entity.name}
                        >
                            <h3 class="overflow-hidden font-medium text-ellipsis text-gray-100">
                                {truncateName(entity.name)}
                            </h3>
                            <p class="text-sm text-gray-400">{entity.type}</p>
                        </a>
                    {/each}
                </div>
            {/if}

            <!-- Aliases Tab -->
            {#if activeTab === 'aliases' && aliases.length > 0}
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {#each aliases as entity}
                        <a
                            href={getEntityLink(entity.id)}
                            class="rounded-lg border border-[#15192b] bg-[#0f121e] p-3 transition-shadow hover:bg-[#15192b] hover:shadow-md"
                            title={entity.name}
                        >
                            <h3 class="overflow-hidden font-medium text-ellipsis text-gray-100">
                                {truncateName(entity.name)}
                            </h3>
                            <p class="text-sm text-gray-400">{entity.type}</p>
                        </a>
                    {/each}
                </div>
            {/if}

            <!-- Global Functions Tab -->
            {#if activeTab === 'global_functions' && globalFunctions.length > 0}
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {#each globalFunctions as entity}
                        <a
                            href={getEntityLink(entity.id)}
                            class="rounded-lg border border-[#15192b] bg-[#0f121e] p-3 transition-shadow hover:bg-[#15192b] hover:shadow-md"
                            title={entity.name}
                        >
                            <h3 class="overflow-hidden font-medium text-ellipsis text-gray-100">
                                {truncateName(entity.name)}
                            </h3>
                            <p class="text-sm text-gray-400">{entity.type}</p>
                        </a>
                    {/each}
                </div>
            {/if}

            <!-- Methods Tab -->
            {#if activeTab === 'methods' && functions.length > 0}
                <div class="space-y-3">
                    {#each functions as func}
                        <div class="rounded-lg border border-[#15192b] bg-[#0f121e] p-3">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h3 class="font-medium text-gray-100" title={func.name}>
                                        {truncateName(func.name, 60)}
                                    </h3>
                                    <p class="text-sm text-gray-400">
                                        Returns: <TypeRef typeInfo={func.return} />
                                    </p>
                                </div>
                                <a
                                    href={getEntityLink(func.parent)}
                                    class="text-sm text-[#3a4577] hover:text-[#4a559a] hover:underline"
                                >
                                    {getEntityName(func.parent)}
                                </a>
                            </div>

                            {#if func.params && func.params.length > 0}
                                <div class="mt-2 text-sm text-gray-300">
                                    <span class="text-gray-400">Parameters:</span>
                                    {#each func.params as param, i}
                                        <span>
                                            {param.name}: <TypeRef typeInfo={param} />
                                            {i < func.params.length - 1 ? ', ' : ''}
                                        </span>
                                    {/each}
                                </div>
                            {:else}
                                <div class="mt-2 text-sm text-gray-400">No parameters</div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Properties Tab -->
            {#if activeTab === 'properties' && properties.length > 0}
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-[#111422]">
                                <th class="p-2 text-left text-gray-300">Name</th>
                                <th class="p-2 text-left text-gray-300">Type</th>
                                <th class="p-2 text-left text-gray-300">Parent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each properties as property}
                                <tr class="border-b border-[#15192b] hover:bg-[#15192b]">
                                    <td class="p-2 text-gray-100" title={property.name}>
                                        {truncateName(property.name, 40)}
                                    </td>
                                    <td class="p-2 text-gray-100">
                                        <TypeRef typeInfo={property} />
                                    </td>
                                    <td class="p-2">
                                        <a
                                            href={getEntityLink(property.parent)}
                                            class="text-[#3a4577] hover:text-[#4a559a] hover:underline"
                                            title={getEntityName(property.parent)}
                                        >
                                            {truncateName(getEntityName(property.parent), 30)}
                                        </a>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

            <!-- Parameters Tab -->
            {#if activeTab === 'params' && params.length > 0}
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-[#111422]">
                                <th class="p-2 text-left text-gray-300">Name</th>
                                <th class="p-2 text-left text-gray-300">Type</th>
                                <th class="p-2 text-left text-gray-300">Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each params as param}
                                <tr class="border-b border-[#15192b] hover:bg-[#15192b]">
                                    <td class="p-2 text-gray-100" title={param.name}>
                                        {truncateName(param.name, 40)}
                                    </td>
                                    <td class="p-2 text-gray-100">
                                        <TypeRef typeInfo={param} />
                                    </td>
                                    <td class="p-2">
                                        {#if param.parent}
                                            <a
                                                href={getEntityLink(
                                                    $dataStore.database.methodMap.get(param.parent)?.parent!
                                                )}
                                                class="text-[#3a4577] hover:text-[#4a559a] hover:underline"
                                            >
                                                {truncateName(
                                                    `${$dataStore.database.classMap.get($dataStore.database.methodMap.get(param.parent)!.parent)?.name}:
                                                    ${
                                                        $dataStore.database.methodMap.get(param.parent)?.name ||
                                                        'Unknown'
                                                    }`,
                                                    40
                                                )}
                                            </a>
                                        {:else}
                                            <span class="text-gray-400">Unknown</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    </div>
{/if}
