<script lang="ts">
    import { dataStore } from '$lib/services/dataLoader';
    import { type Entity, type Property, type Method, type Parameter, type Class, EntityType } from '$lib/types';

    export let entities: Entity[] = [];
    export let properties: Property[] = [];
    export let functions: Method[] = [];
    export let params: Parameter[] = [];

    // Tab management
    type TabType = 'entities' | 'properties' | 'functions' | 'params';
    let activeTab: TabType = 'entities';

    // Set initial active tab to first tab with results
    $: {
        if (entities.length > 0) activeTab = 'entities';
        else if (properties.length > 0) activeTab = 'properties';
        else if (functions.length > 0) activeTab = 'functions';
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

    function getTypeDisplay(typeInfo: any): string {
        if (!typeInfo) return 'unknown';

        // Handle different types of type information
        if (typeof typeInfo.type === 'string') {
            // It's a primitive type
            if (typeInfo.isArray) return `${typeInfo.type}[]`;
            if (typeInfo.isMap && typeInfo.subTypes && typeInfo.subTypes.length >= 2)
                return `Map<${typeInfo.subTypes[0]}, ${typeInfo.subTypes[1]}>`;
            if (typeInfo.isSet && typeInfo.subTypes && typeInfo.subTypes.length >= 1)
                return `Set<${typeInfo.subTypes[0]}>`;
            if (typeInfo.isUnion && typeInfo.subTypes) return typeInfo.subTypes.join(' | ');

            return typeInfo.type;
        } else if (typeof typeInfo.type === 'number') {
            // It's a reference to another entity
            const { database } = $dataStore;
            const referencedEntity = database.entityMap.get(typeInfo.type);
            if (referencedEntity) {
                if (typeInfo.isArray) return `${referencedEntity.name}[]`;
                if (typeInfo.isMap && typeInfo.subTypes && typeInfo.subTypes.length >= 2) {
                    const keyType =
                        typeof typeInfo.subTypes[0] === 'number'
                            ? database.entityMap.get(typeInfo.subTypes[0])?.name || 'unknown'
                            : typeInfo.subTypes[0];
                    const valueType =
                        typeof typeInfo.subTypes[1] === 'number'
                            ? database.entityMap.get(typeInfo.subTypes[1])?.name || 'unknown'
                            : typeInfo.subTypes[1];
                    return `Map<${keyType}, ${valueType}>`;
                }
                return referencedEntity.name;
            }
        }

        return 'unknown';
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
            <ul class="-mb-px flex">
                {#if entities.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'entities'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('entities')}
                        >
                            Entities ({entities.length})
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
                {#if functions.length > 0}
                    <li class="mr-1">
                        <button
                            class="inline-block px-4 py-2 text-center font-medium {activeTab === 'functions'
                                ? 'border-b-2 border-[#3a4577] text-[#3a4577]'
                                : 'text-gray-400 hover:text-gray-300'}"
                            on:click={() => setActiveTab('functions')}
                        >
                            Functions ({functions.length})
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
            <!-- Entities Tab -->
            {#if activeTab === 'entities' && entities.length > 0}
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {#each entities as entity}
                        <a
                            href={getEntityLink(entity.id)}
                            class="rounded-lg border border-[#15192b] bg-[#0f121e] p-3 transition-shadow hover:bg-[#15192b] hover:shadow-md"
                            title={entity.name}
                        >
                            <h3 class="overflow-hidden font-medium text-ellipsis text-gray-100">
                                {truncateName(entity.name)}
                            </h3>
                            <p class="text-sm text-gray-400">{entity.type}</p>
                            {#if entity.type === EntityType.Class && (entity as Class).hasParent && (entity as Class).parent !== null}
                                <p class="mt-1 text-xs text-gray-400">
                                    Parent: {getEntityName((entity as Class).parent as number)}
                                </p>
                            {/if}
                        </a>
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
                                        {getTypeDisplay(property)}
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

            <!-- Functions Tab -->
            {#if activeTab === 'functions' && functions.length > 0}
                <div class="space-y-3">
                    {#each functions as func}
                        <div class="rounded-lg border border-[#15192b] bg-[#0f121e] p-3">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h3 class="font-medium text-gray-100" title={func.name}>
                                        {truncateName(func.name, 60)}
                                    </h3>
                                    <p class="text-sm text-gray-400">
                                        Returns: {func.return ? getTypeDisplay(func.return) : 'void'}
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
                                        <span title={`${param.name}: ${getTypeDisplay(param)}`}>
                                            {param.name}: {getTypeDisplay(param)}
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
                                        {getTypeDisplay(param)}
                                    </td>
                                    <td class="p-2">
                                        {#if param.parent}
                                            <a
                                                href={getEntityLink(param.parent)}
                                                class="text-[#3a4577] hover:text-[#4a559a] hover:underline"
                                            >
                                                {truncateName(getEntityName(param.parent), 30)}
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
