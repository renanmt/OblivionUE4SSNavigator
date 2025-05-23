<script lang="ts">
    import { dataStore, type Entity, type Property, type Function } from '$lib/services/dataLoader';
    import { onMount } from 'svelte';
    import EntityHeader from './entity/EntityHeader.svelte';
    import EntityInfo from './entity/EntityInfo.svelte';
    import TabNavigation from './entity/TabNavigation.svelte';
    import PropertiesTab from './entity/PropertiesTab.svelte';
    import MethodsTab from './entity/MethodsTab.svelte';
    import ChildsTab from './entity/ChildsTab.svelte';
    import ReferencesTab from './entity/ReferencesTab.svelte';
    import CodeTab from './entity/CodeTab.svelte';
    import type { TabType } from './entity/TabNavigation.svelte';

    export let entityId: string;

    // Convert the string ID to a number since our new data structure uses numeric IDs
    $: numericId = parseInt(entityId, 10);

    let entity: Entity | undefined;
    let properties: Property[] = [];
    let methods: Function[] = [];
    let referencedBy: { entity: Entity; referenceType: string }[] = [];
    let isLoading = true;
    let entityCode: string = '';

    // Cache for entity names to avoid multiple lookups
    let entityNameCache = new Map<number, string>();

    // Tab management
    let activeTab: TabType = 'properties';

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

                // Cache the names of all related entities
                cacheEntityNames();
            } else {
                properties = [];
                methods = [];
                referencedBy = [];
                entityCode = '// Entity not found';
            }
        } catch (error) {
            console.error('Error loading entity data:', error);
            entity = undefined;
            properties = [];
            methods = [];
            referencedBy = [];
            entityCode = `// Error: ${error}`;
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

    // Initialize data when component mounts or ID changes
    onMount(() => {
        if (numericId) {
            loadEntityData(numericId);
        }
    });

    // Watch for entityId changes and update data
    $: if (numericId) {
        loadEntityData(numericId);
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
        <EntityHeader {entity} />

        <div class="flex">
            <!-- Left Sidebar - Entity Info and Navigation -->
            <div class="w-60 pr-6">
                <EntityInfo {entity} {properties} {entityNameCache} />
                <TabNavigation {activeTab} onTabChange={(tab) => (activeTab = tab)} />
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 rounded-lg border-l border-[#15192b] bg-[#0f121e] p-4 pl-6">
                {#if activeTab === 'properties'}
                    <PropertiesTab {properties} />
                {:else if activeTab === 'methods'}
                    <MethodsTab {methods} />
                {:else if activeTab === 'childs'}
                    <ChildsTab {entity} {entityNameCache} />
                {:else if activeTab === 'references'}
                    <ReferencesTab {entity} {entityNameCache} {referencedBy} />
                {:else if activeTab === 'code'}
                    <CodeTab {entity} {entityCode} />
                {/if}
            </div>
        </div>
    </div>
{/if}
