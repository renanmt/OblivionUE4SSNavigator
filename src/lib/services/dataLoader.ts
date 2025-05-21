import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Entity, Method, Parameter, Property, TypeInfo } from '$lib/types';
import { TypeExtractor, type TypeDatabase } from './type-extractor';

// Export types for use in components
export type { Entity, Property, TypeInfo };
export type Function = Method;
export type FunctionParam = Parameter;

// Create a default empty database structure to use before data is loaded
const emptyDatabase: TypeDatabase = {
    classNameId: [],
    enumNameId: [],
    aliasNameId: [],
    globalFunctionNameId: [],
    entityNameId: [],
    propertyNameId: [],
    methodNameId: [],
    parammeterNameId: [],
    entityMap: new Map(),
    entities: [],
    classes: [],
    enums: [],
    aliases: [],
    globalFunctions: [],
    properties: [],
    methods: [],
    fileContents: []
};

export const files = {
    0: 'Types.lua',
    1: 'oblivion_types.lua'
};

// Create a singleton data store to prevent reloading on each page navigation
let storeInstance: ReturnType<typeof createInternalStore> | null = null;
let dataLoadPromise: Promise<void> | null = null;

function createInternalStore() {
    // Create the store with initial loading state
    const store = writable<{ database: TypeDatabase; loading: boolean; error: string | null }>({
        database: emptyDatabase,
        loading: true,
        error: null
    });

    // Initialize the store data if in browser
    if (browser) {
        dataLoadPromise = loadData().catch((error) => {
            console.error('Error loading type data:', error);
            store.set({ database: emptyDatabase, loading: false, error: error.message || 'Unknown error' });
        });
    }

    async function loadData() {
        console.log('Loading type data...');
        try {
            // Fetch the Lua files
            const [typesResponse, oblivionTypesResponse] = await Promise.all([
                fetch(`/data/${files[0]}`),
                fetch(`/data/${files[1]}`)
            ]);

            if (!typesResponse.ok || !oblivionTypesResponse.ok) {
                throw new Error('Failed to fetch type definition files');
            }

            // Get the file contents as text
            const [typesContent, oblivionTypesContent] = await Promise.all([
                typesResponse.text(),
                oblivionTypesResponse.text()
            ]);

            // Create a TypeExtractor instance and build the database
            const extractor = new TypeExtractor();
            const database = extractor.build([typesContent, oblivionTypesContent]);

            // Update the store with the database
            store.set({ database, loading: false, error: null });
            console.log('Type data loaded successfully');
        } catch (error) {
            console.error('Error building type database:', error);
            throw error;
        }
    }

    // Get the current value from the store
    function get() {
        let current: { database: TypeDatabase; loading: boolean; error: string | null } | undefined;
        store.subscribe((value) => {
            current = value;
        })();
        return current!;
    }

    return {
        subscribe: store.subscribe,

        // Get an entity by its ID
        getEntityById: async (id: number) => {
            const { database, loading } = get();

            // If we're still loading and have a pending data load promise, wait for it
            if (loading && dataLoadPromise) {
                await dataLoadPromise;
                // Now get the updated database after loading
                const updatedStore = get();
                return updatedStore.database.entityMap.get(id);
            }

            return database.entityMap.get(id);
        },

        // Get an entity by its name
        getEntityByName: async (name: string) => {
            const { database, loading } = get();

            // If we're still loading and have a pending data load promise, wait for it
            if (loading && dataLoadPromise) {
                await dataLoadPromise;
                // Now get the updated database after loading
                const updatedStore = get();
                if (!name) return null;

                const lowerName = name.toLowerCase();
                const nameId = updatedStore.database.entityNameId.find(
                    (e: { id: number; name: string }) => e.name === lowerName
                );
                return nameId ? updatedStore.database.entityMap.get(nameId.id) : null;
            }

            if (!name) return null;

            const lowerName = name.toLowerCase();
            const nameId = database.entityNameId.find((e: { id: number; name: string }) => e.name === lowerName);
            return nameId ? database.entityMap.get(nameId.id) : null;
        },

        // Get all properties for an entity
        getPropertiesForEntity: async (entityId: number) => {
            const { database, loading } = get();

            // If we're still loading and have a pending data load promise, wait for it
            if (loading && dataLoadPromise) {
                await dataLoadPromise;
                // Now get the updated database after loading
                const updatedStore = get();
                if (!entityId) return [];
                return updatedStore.database.properties.filter((p) => p.parent === entityId);
            }

            if (!entityId) return [];
            return database.properties.filter((p) => p.parent === entityId);
        },

        // Get all methods for an entity
        getMethodsForEntity: async (entityId: number) => {
            const { database, loading } = get();

            // If we're still loading and have a pending data load promise, wait for it
            if (loading && dataLoadPromise) {
                await dataLoadPromise;
                // Now get the updated database after loading
                const updatedStore = get();
                if (!entityId) return [];
                return updatedStore.database.methods.filter((m) => m.parent === entityId);
            }

            if (!entityId) return [];
            return database.methods.filter((m) => m.parent === entityId);
        },

        // Get parameters for a method
        getParametersForMethod: (method: Method) => {
            if (!method) return [];
            return method.params || [];
        },

        // Get return type for a method
        getReturnTypeForMethod: (method: Method) => {
            if (!method) return null;
            return method.return;
        },

        // Search for entities by name
        search: (
            query: string,
            filters: {
                includeEntities?: boolean;
                includeProperties?: boolean;
                includeMethods?: boolean;
                includeParameters?: boolean;
            } = {
                includeEntities: true,
                includeProperties: false,
                includeMethods: false,
                includeParameters: false
            }
        ) => {
            const { database, loading } = get();
            if (loading || !query)
                return {
                    entities: [],
                    properties: [],
                    methods: [],
                    parameters: []
                };

            const lowerQuery = query.toLowerCase();
            const results = {
                entities: [] as Entity[],
                properties: [] as Property[],
                methods: [] as Method[],
                parameters: [] as Parameter[]
            };

            // Search through entities if included in filters
            if (filters.includeEntities) {
                results.entities = [
                    ...database.classes,
                    ...database.enums,
                    ...database.aliases,
                    ...database.globalFunctions
                ].filter((entity) => entity.name.toLowerCase().includes(lowerQuery));
            }

            // Search through properties if included in filters
            if (filters.includeProperties) {
                results.properties = database.properties.filter((property) =>
                    property.name.toLowerCase().includes(lowerQuery)
                );
            }

            // Search through methods if included in filters
            if (filters.includeMethods) {
                results.methods = database.methods.filter((method) => method.name.toLowerCase().includes(lowerQuery));
            }

            // Search through parameters if included in filters
            if (filters.includeParameters) {
                // For parameters, we need to go through all methods and their parameters
                const paramResults = [];

                // First check method parameters
                for (const method of database.methods) {
                    const matchingParams = method.params.filter((param) =>
                        param.name.toLowerCase().includes(lowerQuery)
                    );
                    paramResults.push(...matchingParams);
                }

                // Then check global function parameters
                for (const func of database.globalFunctions) {
                    if (func.params) {
                        const matchingParams = func.params.filter((param) =>
                            param.name.toLowerCase().includes(lowerQuery)
                        );
                        paramResults.push(...matchingParams);
                    }
                }

                results.parameters = paramResults;
            }

            return results;
        },

        // Get database loading state
        isLoading: () => {
            return get().loading;
        },

        // Get database error state
        getError: () => {
            return get().error;
        },

        // Get the type of a search result
        getResultType: (
            result: any
        ): 'class' | 'enum' | 'alias' | 'globalFunction' | 'property' | 'method' | 'parameter' | 'unknown' => {
            if (!result) return 'unknown';

            // Check if it's an entity
            if (result.type) {
                switch (result.type) {
                    case 'Class':
                        return 'class';
                    case 'Enum':
                        return 'enum';
                    case 'Alias':
                        return 'alias';
                    case 'GlobalFunction':
                        return 'globalFunction';
                    default:
                        return 'unknown';
                }
            }

            // Check if it's a property
            if ('isArray' in result && 'value' in result && result.parent !== undefined) {
                return 'property';
            }

            // Check if it's a method
            if ('params' in result && Array.isArray(result.params) && 'return' in result) {
                return 'method';
            }

            // Check if it's a parameter
            if ('isOptional' in result && result.parent !== undefined) {
                // Check if the parent is a method or global function
                const { database } = get();
                const parent =
                    database.methods.find((m) => m.id === result.parent) ||
                    database.globalFunctions.find((f) => f.id === result.parent);

                if (parent) {
                    return 'parameter';
                }
            }

            return 'unknown';
        },

        // Get appropriate icon for a search result type
        getResultIcon: (resultType: string): string => {
            switch (resultType) {
                case 'class':
                    return 'cube';
                case 'enum':
                    return 'list-check';
                case 'alias':
                    return 'shuffle';
                case 'globalFunction':
                    return 'function';
                case 'property':
                    return 'tag';
                case 'method':
                    return 'code';
                case 'parameter':
                    return 'input';
                default:
                    return 'question';
            }
        },

        // Get entities that reference this entity
        getReferencingEntities: async (entityId: number) => {
            const { database, loading } = get();

            // If we're still loading and have a pending data load promise, wait for it
            if (loading && dataLoadPromise) {
                await dataLoadPromise;
                // Now get the updated database after loading
                const updatedStore = get();
                if (!entityId) return [];

                const referencingEntities = [];

                // Loop through all entities to find ones that reference this entity
                for (const entity of updatedStore.database.entities) {
                    if (entity.references && entity.references.some((ref) => ref.id === entityId)) {
                        // Find the reference type
                        const reference = entity.references.find((ref) => ref.id === entityId);
                        if (reference) {
                            referencingEntities.push({
                                entity,
                                referenceType: reference.type
                            });
                        }
                    }
                }

                return referencingEntities;
            }

            if (!entityId) return [];

            const referencingEntities = [];

            // Loop through all entities to find ones that reference this entity
            for (const entity of database.entities) {
                if (entity.references && entity.references.some((ref) => ref.id === entityId)) {
                    // Find the reference type
                    const reference = entity.references.find((ref) => ref.id === entityId);
                    if (reference) {
                        referencingEntities.push({
                            entity,
                            referenceType: reference.type
                        });
                    }
                }
            }

            return referencingEntities;
        },

        // Get parameters for a function by ID
        getParamsForFunction: (functionId: number) => {
            const { database } = get();
            if (!functionId) return [];

            // Look in methods first
            const method = database.methods.find((m) => m.id === functionId);
            if (method) {
                return method.params || [];
            }

            // Look in global functions
            const globalFunc = database.globalFunctions.find((f) => f.id === functionId);
            if (globalFunc && globalFunc.params) {
                return globalFunc.params;
            }

            return [];
        },

        // Get return type for a function by ID
        getReturnTypeForFunction: (functionId: number) => {
            const { database } = get();
            if (!functionId) return null;

            // Look in methods first
            const method = database.methods.find((m) => m.id === functionId);
            if (method) {
                return method.return;
            }

            // Look in global functions
            const globalFunc = database.globalFunctions.find((f) => f.id === functionId);
            if (globalFunc) {
                return globalFunc.return;
            }

            return null;
        },

        // Get a string representation of a type
        getTypeDisplay: (typeInfo: any): string => {
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
                const { database } = get();
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
    };
}

function createDataLoader() {
    // Only create a new store if one doesn't already exist
    if (!storeInstance) {
        storeInstance = createInternalStore();
    }
    return storeInstance;
}

export const dataStore = createDataLoader();
