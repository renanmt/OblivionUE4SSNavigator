<script lang="ts">
    import { dataStore, type Entity, type Property, type Function, type FunctionParam } from '$lib/services/dataLoader';
    import { onMount } from 'svelte';
    import PropertyTable from './PropertyTable.svelte';
    import TypeRef from './TypeRef.svelte';
    import hljs from 'highlight.js/lib/core';
    import lua from 'highlight.js/lib/languages/lua';
    import 'highlight.js/styles/atom-one-dark.css';
    import { EntityType } from '$lib/types';

    export let entityId: string;

    // Convert the string ID to a number since our new data structure uses numeric IDs
    $: numericId = parseInt(entityId, 10);

    let entity: Entity | undefined;
    let properties: Property[] = [];
    let methods: Function[] = [];
    let referencedBy: { entity: Entity; referenceType: string }[] = [];
    let isLoading = true;
    let entityCode: string = '';
    let highlightedCode: string = '';

    // Cache for entity names to avoid multiple lookups
    let entityNameCache = new Map<number, string>();

    // Tab management
    type TabType = 'properties' | 'methods' | 'childs' | 'references' | 'code';
    let activeTab: TabType = 'properties';

    // Filter states
    let propertiesFilter = '';
    let methodsFilter = '';
    let childsFilter = '';
    let referencesFilter = '';
    let codeFilter = '';

    // Filtered data
    $: filteredProperties = properties.filter(
        (p) => propertiesFilter === '' || p.name.toLowerCase().includes(propertiesFilter.toLowerCase())
    );

    $: filteredMethods = methods.filter(
        (m) => methodsFilter === '' || m.name.toLowerCase().includes(methodsFilter.toLowerCase())
    );

    $: filteredChilds =
        entity?.childs?.filter((childId) => {
            if (childsFilter === '') return true;
            const childName = entityNameCache.get(childId)?.toLowerCase();
            return childName && childName.includes(childsFilter.toLowerCase());
        }) || [];

    $: filteredReferences =
        entity?.references?.filter((ref) => {
            if (referencesFilter === '') return true;
            const refName = entityNameCache.get(ref.id)?.toLowerCase();
            return refName && refName.includes(referencesFilter.toLowerCase());
        }) || [];

    $: filteredReferencedBy = referencedBy.filter(
        (ref) => referencesFilter === '' || ref.entity.name.toLowerCase().includes(referencesFilter.toLowerCase())
    );

    // Apply code filter and syntax highlighting
    $: {
        if (codeFilter) {
            const filteredLines = entityCode
                .split('\n')
                .filter((line) => line.toLowerCase().includes(codeFilter.toLowerCase()));
            const filteredText = filteredLines.join('\n');
            highlightedCode = highlightLuaCode(filteredText);
        } else {
            highlightedCode = highlightLuaCode(entityCode);
        }
    }

    // Function to highlight Lua code using highlight.js
    function highlightLuaCode(code: string): string {
        if (!code) return '';
        try {
            return hljs.highlight(code, { language: 'lua' }).value;
        } catch (e) {
            console.error('Error highlighting code:', e);
            return code;
        }
    }

    // Clear filter helpers
    function clearPropertiesFilter() {
        propertiesFilter = '';
    }

    function clearMethodsFilter() {
        methodsFilter = '';
    }

    function clearChildsFilter() {
        childsFilter = '';
    }

    function clearReferencesFilter() {
        referencesFilter = '';
    }

    function clearCodeFilter() {
        codeFilter = '';
    }

    // Wait until the database is loaded
    async function waitForDatabase() {
        const { loading } = $dataStore;
        if (loading) {
            return new Promise<void>((resolve) => {
                const unsubscribe = dataStore.subscribe((value) => {
                    if (!value.loading) {
                        unsubscribe();
                        resolve();
                    }
                });
            });
        }
    }

    // Get entity source code from fileContents
    function getEntitySourceCode(entity: Entity): string {
        if (!entity || entity.file === undefined || entity.lineStart === undefined || entity.lineEnd === undefined) {
            return `// No source code available for ${entity?.name || 'this entity'}`;
        }

        try {
            const { database } = $dataStore;
            if (!database || !database.fileContents || entity.file >= database.fileContents.length) {
                return `// Source file index ${entity.file} not found`;
            }

            const fileContent = database.fileContents[entity.file];
            if (!fileContent) {
                return `// Source file content not available`;
            }

            return fileContent.slice(entity.lineStart, entity.lineEnd + 1).join('\n');
        } catch (error) {
            console.error('Error getting entity source code:', error);
            return `// Error retrieving source code: ${error}`;
        }
    }

    // Load an entity by ID
    async function loadEntityData(id: number) {
        isLoading = true;

        // Reset all filters when loading a new entity
        propertiesFilter = '';
        methodsFilter = '';
        childsFilter = '';
        referencesFilter = '';
        codeFilter = '';

        try {
            // Make sure database is loaded
            await waitForDatabase();

            // Get direct access to the loaded database
            const { database } = $dataStore;

            // Get the entity directly
            entity = database.entityMap.get(id);

            if (entity) {
                const entityId = entity.id; // Store id to avoid TypeScript errors

                // Get properties, methods, and references directly
                properties = database.properties.filter((p) => p.parent === entityId);
                methods = database.methods.filter((m) => m.parent === entityId);

                // Find referencing entities
                referencedBy = [];
                for (const refEntity of database.entities) {
                    if (refEntity.references && refEntity.references.some((ref) => ref.id === entityId)) {
                        const reference = refEntity.references.find((ref) => ref.id === entityId);
                        if (reference) {
                            referencedBy.push({
                                entity: refEntity,
                                referenceType: reference.type
                            });
                        }
                    }
                }

                // Get entity source code
                entityCode = getEntitySourceCode(entity);

                // Highlight the code
                highlightedCode = highlightLuaCode(entityCode);

                // Cache the names of all related entities
                cacheEntityNames();
            } else {
                properties = [];
                methods = [];
                referencedBy = [];
                entityCode = '// Entity not found';
                highlightedCode = entityCode;
            }
        } catch (error) {
            console.error('Error loading entity data:', error);
            entity = undefined;
            properties = [];
            methods = [];
            referencedBy = [];
            entityCode = `// Error: ${error}`;
            highlightedCode = entityCode;
        } finally {
            isLoading = false;
        }
    }

    // Build cache of entity names for display
    function cacheEntityNames() {
        if (!entity) return;

        const { database } = $dataStore;
        if (!database || !database.entityMap) return;

        const idsToCache = new Set<number>();

        // Add parent if exists
        if (entity.hasParent && entity.parent !== null) {
            idsToCache.add(entity.parent);
        }

        // Add alias if it's a reference to another entity
        if (entity.aliasFor !== undefined && typeof entity.aliasFor === 'number') {
            idsToCache.add(entity.aliasFor);
        }

        // Add all child entities
        if (entity.childs && entity.childs.length > 0) {
            for (const id of entity.childs) idsToCache.add(id);
        }

        // Add all referenced entities
        if (entity.references && entity.references.length > 0) {
            for (const ref of entity.references) idsToCache.add(ref.id);
        }

        // Add all entity names at once from the database
        for (const id of idsToCache) {
            const relatedEntity = database.entityMap.get(id);
            if (relatedEntity) entityNameCache.set(id, relatedEntity.name);
            else entityNameCache.set(id, `Entity ${id}`);
        }
    }

    function setActiveTab(tab: TabType) {
        activeTab = tab;
    }

    // Initialize data when component mounts or ID changes
    onMount(() => {
        // Register Lua language
        hljs.registerLanguage('lua', lua);

        if (numericId) {
            loadEntityData(numericId);
        }
    });

    // Watch for entityId changes and update data
    $: if (numericId) {
        loadEntityData(numericId);
    }

    function getEntityLink(id: number): string {
        return `/entity/${id}`;
    }

    function getParamsForFunction(funcId: number): FunctionParam[] {
        return dataStore.getParamsForFunction(funcId);
    }

    function getReferenceTypeLabel(type: string): string {
        switch (type) {
            case 'prop':
                return 'Property';
            case 'func':
                return 'Method Return';
            case 'gfunc':
                return 'Global Function Return';
            case 'param':
                return 'Parameter';
            default:
                return type;
        }
    }
</script>

{#if isLoading}
    <div class="p-4 text-center">
        <div class="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
        <p class="mt-2">Loading entity data...</p>
    </div>
{:else if !entity}
    <div class="p-4">
        <p class="text-red-600">Entity not found</p>
    </div>
{:else}
    <div class="bg-[#0d101b] p-4 text-gray-100">
        <!-- Main Title -->
        <h1 class="mb-4 flex items-center text-3xl font-bold text-gray-100">
            {#if entity?.type === EntityType.Class}
                <span class="mr-3 text-blue-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </span>
            {:else if entity?.type === EntityType.Enum}
                <span class="mr-3 text-green-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                    </svg>
                </span>
            {:else if entity?.type === EntityType.Alias}
                <span class="mr-3 text-purple-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                </span>
            {:else if entity?.type === EntityType.GlobalFunction}
                <span class="mr-3 text-yellow-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
                        />
                    </svg>
                </span>
            {/if}
            {entity?.name || 'Unknown Entity'}
        </h1>

        <div class="flex">
            <!-- Left Sidebar - Entity Info and Navigation -->
            <div class="w-60 pr-6">
                <!-- Entity Info -->
                <div class="mb-6 border-l-4 border-[#3a4577] pl-4">
                    <p>
                        <span class="font-medium text-gray-300">Type:</span>
                        <span class="text-gray-100">{entity?.type || 'Unknown'}</span>
                    </p>
                    <p>
                        <span class="font-medium text-gray-300">Parent:</span>
                        {#if entity?.hasParent && entity.parent !== null}
                            <a
                                href={getEntityLink(entity.parent)}
                                class="text-[#3a4577] hover:text-blue-400 hover:underline"
                            >
                                {entityNameCache.get(entity.parent) || `UObject`}
                            </a>
                        {:else}
                            <span class="text-gray-400">None</span>
                        {/if}
                    </p>
                    <p>
                        <span class="font-medium text-gray-300">Childs:</span>
                        <span class="text-gray-100">{entity?.childs ? entity.childs.length : 0}</span>
                    </p>
                    <p>
                        <span class="font-medium text-gray-300">References:</span>
                        <span class="text-gray-100">{entity?.references ? entity.references.length : 0}</span>
                    </p>
                    <p>
                        <span class="font-medium text-gray-300">Properties:</span>
                        <span class="text-gray-100">{properties.length}</span>
                    </p>
                    <p>
                        <span class="font-medium text-gray-300">Methods:</span>
                        <span class="text-gray-100">{methods.length}</span>
                    </p>
                </div>

                <!-- Tab Navigation - Vertical Buttons -->
                <div class="flex flex-col space-y-2">
                    <button
                        class="w-full rounded border px-4 py-2 text-center text-sm transition-colors duration-150"
                        class:bg-[#3a4577]={activeTab === 'properties'}
                        class:text-white={activeTab === 'properties'}
                        class:border-[#3a4577]={activeTab === 'properties'}
                        class:bg-[#0f121e]={activeTab !== 'properties'}
                        class:text-gray-300={activeTab !== 'properties'}
                        class:border-[#15192b]={activeTab !== 'properties'}
                        on:click={() => setActiveTab('properties')}
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
                        on:click={() => setActiveTab('methods')}
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
                        on:click={() => setActiveTab('childs')}
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
                        on:click={() => setActiveTab('references')}
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
                        on:click={() => setActiveTab('code')}
                    >
                        Code
                    </button>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 rounded-lg border-l border-[#15192b] bg-[#0f121e] p-4 pl-6">
                {#if activeTab === 'properties'}
                    <!-- Tab Title -->
                    <h2 class="mb-4 text-xl font-semibold text-gray-100">Properties</h2>

                    <!-- Properties Filter -->
                    <div class="relative mb-4">
                        <input
                            type="text"
                            placeholder="Filter properties..."
                            class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 pr-10 text-gray-100 placeholder-gray-500 focus:border-[#3a4577] focus:outline-none"
                            bind:value={propertiesFilter}
                        />
                        {#if propertiesFilter}
                            <button
                                class="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                                on:click={clearPropertiesFilter}
                            >
                                ×
                            </button>
                        {/if}
                    </div>

                    {#if filteredProperties.length > 0}
                        <PropertyTable
                            items={filteredProperties}
                            emptyMessage="No properties found"
                            headerClass="bg-[#111422] text-gray-300"
                            rowClass="hover:bg-[#15192b] transition-colors duration-100"
                            cellClass="px-4 py-2 text-gray-100"
                        />
                    {:else}
                        <p class="text-gray-400">
                            {properties.length > 0 ? 'No properties match the filter' : 'No properties found'}
                        </p>
                    {/if}
                {:else if activeTab === 'methods'}
                    <!-- Tab Title -->
                    <h2 class="mb-4 text-xl font-semibold text-gray-100">Methods</h2>

                    <!-- Methods Filter -->
                    <div class="relative mb-4">
                        <input
                            type="text"
                            placeholder="Filter methods..."
                            class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 pr-10 text-gray-100 placeholder-gray-500 focus:border-[#3a4577] focus:outline-none"
                            bind:value={methodsFilter}
                        />
                        {#if methodsFilter}
                            <button
                                class="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                                on:click={clearMethodsFilter}
                            >
                                ×
                            </button>
                        {/if}
                    </div>

                    {#if filteredMethods.length > 0}
                        <div class="space-y-6">
                            {#each filteredMethods as method}
                                <div class="rounded border border-[#15192b] bg-[#0f121e] p-4">
                                    <h3 class="text-lg font-bold text-gray-100">
                                        {method.name}
                                    </h3>
                                    <div class="mt-1 text-sm text-gray-300">
                                        Returns: <span class="text-[#3a4577]"><TypeRef typeInfo={method.return} /></span
                                        >
                                    </div>

                                    <!-- Parameters Section -->
                                    <div class="mt-2">
                                        {#if getParamsForFunction(method.id).length > 0}
                                            <h4 class="mb-1 font-medium text-gray-300">Parameters:</h4>
                                            <PropertyTable
                                                items={getParamsForFunction(method.id)}
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
                {:else if activeTab === 'childs'}
                    <!-- Tab Title -->
                    <h2 class="mb-4 text-xl font-semibold text-gray-100">Childs</h2>

                    <!-- Childs Filter -->
                    <div class="relative mb-4">
                        <input
                            type="text"
                            placeholder="Filter child entities..."
                            class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 pr-10 text-gray-100 placeholder-gray-500 focus:border-[#3a4577] focus:outline-none"
                            bind:value={childsFilter}
                        />
                        {#if childsFilter}
                            <button
                                class="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                                on:click={clearChildsFilter}
                            >
                                ×
                            </button>
                        {/if}
                    </div>

                    {#if entity?.childs && filteredChilds.length > 0}
                        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {#each filteredChilds as childId}
                                <a
                                    href={getEntityLink(childId)}
                                    class="block rounded border border-[#15192b] bg-[#0f121e] p-3 text-gray-100 transition-colors hover:bg-[#15192b]"
                                >
                                    {entityNameCache.get(childId) || `Entity ${childId}`}
                                </a>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-gray-400">
                            {entity?.childs && entity.childs.length > 0
                                ? 'No child entities match the filter'
                                : 'No child entities found'}
                        </p>
                    {/if}
                {:else if activeTab === 'references'}
                    <!-- Tab Title -->
                    <h2 class="mb-4 text-xl font-semibold text-gray-100">References</h2>

                    <!-- References Filter -->
                    <div class="relative mb-4">
                        <input
                            type="text"
                            placeholder="Filter references..."
                            class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 pr-10 text-gray-100 placeholder-gray-500 focus:border-[#3a4577] focus:outline-none"
                            bind:value={referencesFilter}
                        />
                        {#if referencesFilter}
                            <button
                                class="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                                on:click={clearReferencesFilter}
                            >
                                ×
                            </button>
                        {/if}
                    </div>

                    {#if entity?.references && filteredReferences.length > 0}
                        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {#each filteredReferences as ref}
                                <a
                                    href={getEntityLink(ref.id)}
                                    class="block rounded border border-[#15192b] bg-[#0f121e] p-3 text-gray-100 transition-colors hover:bg-[#15192b]"
                                >
                                    {entityNameCache.get(ref.id) || `Entity ${ref.id}`}
                                    <span class="text-gray-400">({getReferenceTypeLabel(ref.type)})</span>
                                </a>
                            {/each}
                        </div>
                    {:else if entity?.references}
                        <p class="text-gray-400">No references match the filter</p>
                    {/if}

                    {#if filteredReferencedBy.length > 0}
                        <h2 class="mt-6 mb-2 text-xl font-semibold text-gray-100">Referenced By</h2>
                        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {#each filteredReferencedBy as ref}
                                <a
                                    href={getEntityLink(ref.entity.id)}
                                    class="block rounded border border-[#15192b] bg-[#0f121e] p-3 text-gray-100 transition-colors hover:bg-[#15192b]"
                                >
                                    {ref.entity.name}
                                    <span class="text-gray-400">({getReferenceTypeLabel(ref.referenceType)})</span>
                                </a>
                            {/each}
                        </div>
                    {:else if referencedBy.length > 0}
                        <h2 class="mt-6 mb-2 text-xl font-semibold text-gray-100">Referenced By</h2>
                        <p class="text-gray-400">No references match the filter</p>
                    {/if}

                    {#if (!entity?.references || entity.references.length === 0) && referencedBy.length === 0}
                        <p class="text-gray-400">No references found</p>
                    {/if}
                {:else if activeTab === 'code'}
                    <!-- Tab Title -->
                    <h2 class="mb-4 text-xl font-semibold text-gray-100">Code</h2>

                    <!-- Code Filter -->
                    <div class="relative mb-4">
                        <input
                            type="text"
                            placeholder="Filter code..."
                            class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 pr-10 text-gray-100 placeholder-gray-500 focus:border-[#3a4577] focus:outline-none"
                            bind:value={codeFilter}
                        />
                        {#if codeFilter}
                            <button
                                class="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                                on:click={clearCodeFilter}
                            >
                                ×
                            </button>
                        {/if}
                    </div>

                    <div class="overflow-x-auto rounded border border-[#15192b] bg-[#080a11] p-4 text-gray-200">
                        {#if entity?.file !== undefined}
                            <div class="mb-2 text-sm text-gray-400">
                                Source File: {entity.file}, Lines: {entity.lineStart}-{entity.lineEnd}
                            </div>
                        {/if}
                        <pre class="whitespace-pre-wrap"><code class="hljs language-lua">{@html highlightedCode}</code
                            ></pre>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
