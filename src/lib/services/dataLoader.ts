import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Entity, Method, Parameter, Property } from '$lib/types';
import { TypeExtractor, type TypeDatabase } from './type-extractor';

// Create a default empty database structure to use before data is loaded
const emptyDatabase: TypeDatabase = {
    classMap: new Map(),
    enumMap: new Map(),
    aliasMap: new Map(),
    globalFunctionMap: new Map(),
    propertyMap: new Map(),
    methodMap: new Map(),
    parameterMap: new Map(),
    unknownMap: new Map(),
    entityMap: new Map(),
    entities: [],
    classes: [],
    enums: [],
    aliases: [],
    globalFunctions: [],
    properties: [],
    methods: [],
    unknowns: [],
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

        // Search for entities by name
        search: (
            query: string,
            filters: {
                includeClasses?: boolean;
                includeEnums?: boolean;
                includeAliases?: boolean;
                includeGlobalFunctions?: boolean;
                includeProperties?: boolean;
                includeMethods?: boolean;
                includeParameters?: boolean;
                isRegex?: boolean;
            } = {
                includeClasses: true,
                includeEnums: true,
                includeAliases: true,
                includeGlobalFunctions: true,
                includeProperties: false,
                includeMethods: false,
                includeParameters: false,
                isRegex: false
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

            let matcher: (str: string) => boolean;
            if (filters.isRegex) {
                try {
                    const regex = new RegExp(query);
                    matcher = (str: string) => regex.test(str);
                } catch (error) {
                    console.error('Invalid regex pattern:', error);
                    return {
                        entities: [],
                        properties: [],
                        methods: [],
                        parameters: []
                    };
                }
            } else {
                const lowerQuery = query.toLowerCase();
                matcher = (str: string) => str.toLowerCase().includes(lowerQuery);
            }

            const results = {
                entities: [] as Entity[],
                properties: [] as Property[],
                methods: [] as Method[],
                parameters: [] as Parameter[]
            };

            // Search through entities based on their specific types
            if (filters.includeClasses) {
                results.entities.push(
                    ...database.classes.filter((entity) => matcher(entity.name))
                );
            }
            if (filters.includeEnums) {
                results.entities.push(
                    ...database.enums.filter((entity) => matcher(entity.name))
                );
            }
            if (filters.includeAliases) {
                results.entities.push(
                    ...database.aliases.filter((entity) => matcher(entity.name))
                );
            }
            if (filters.includeGlobalFunctions) {
                results.entities.push(
                    ...database.globalFunctions.filter((entity) => matcher(entity.name))
                );
            }

            // Sort entities by name
            results.entities.sort((a, b) => a.name.localeCompare(b.name));

            // Search through properties if included in filters
            if (filters.includeProperties) {
                results.properties = database.properties
                    .filter((property) => matcher(property.name))
                    .sort((a, b) => a.name.localeCompare(b.name));
            }

            // Search through methods if included in filters
            if (filters.includeMethods) {
                results.methods = database.methods
                    .filter((method) => matcher(method.name))
                    .sort((a, b) => a.name.localeCompare(b.name));
            }

            // Search through parameters if included in filters
            if (filters.includeParameters) {
                const paramResults = [];

                // Check method parameters
                for (const method of database.methods) {
                    const matchingParams = method.params.filter((param) =>
                        matcher(param.name)
                    );
                    paramResults.push(...matchingParams);
                }

                // Check global function parameters
                for (const func of database.globalFunctions) {
                    if (func.params) {
                        const matchingParams = func.params.filter((param) =>
                            matcher(param.name)
                        );
                        paramResults.push(...matchingParams);
                    }
                }

                // Sort parameters by name
                results.parameters = paramResults.sort((a, b) => a.name.localeCompare(b.name));
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
