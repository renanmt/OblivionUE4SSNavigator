import * as fs from 'fs';
import * as path from 'path';

import type { Entity, Property, Method, Parameter, TypeInfo } from '$lib/types';

const primitiveTypes = new Set<string>([
    // Basic C++ types
    'bool',
    'boolean',
    'integer',
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'byte',
    'float',
    'double',
    'string',
    'char',
    'wchar',
    'void',

    // Common UE4 container types
    'TArray',
    'TMap',
    'TSet',
    'array',
    'map',
    'set',
    'function',
    'union',

    // Additional numeric types
    'int8_t',
    'int16_t',
    'int32_t',
    'int64_t',
    'uint8_t',
    'uint16_t',
    'uint32_t',
    'uint64_t',
    'size_t',
    'ssize_t',

    // Unreal Engine specific types
    'FName',
    'FText',
    'FString',

    'any'
]);

export interface TypeDatabase {
    classNameId: { id: number; name: string }[];
    enumNameId: { id: number; name: string }[];
    aliasNameId: { id: number; name: string }[];
    globalFunctionNameId: { id: number; name: string }[];
    entityNameId: { id: number; name: string }[];
    propertyNameId: { id: number; name: string }[];
    methodNameId: { id: number; name: string }[];
    parammeterNameId: { id: number; name: string }[];
    entityMap: Map<number, Entity>;
    entities: Entity[];
    classes: Entity[];
    enums: Entity[];
    aliases: Entity[];
    globalFunctions: Entity[];
    properties: Property[];
    methods: Method[];
    fileContents: string[][];
}

export class TypeExtractor {
    private entities: Entity[] = [];
    private classes: Map<string, Entity> = new Map();
    private properties: Property[] = [];
    private functions: Method[] = [];
    private enums: Map<string, Entity> = new Map();
    private aliases: Map<string, Entity> = new Map();
    private globalFunctions: Map<string, Entity> = new Map();

    private numGlobalFunctionParams: number = 0;
    private numGlobalFunctionReturns: number = 0;
    private numFunctionParams: number = 0;
    private numFunctionReturns: number = 0;

    /**
     * Find or create an entity in the appropriate collection
     */
    private findOrCreateEntity(
        name: string,
        type: 'Class' | 'Enum' | 'Alias' | 'GlobalFunction' | 'Unknown' = 'Unknown',
        fileIndex: number,
        lineNumber: number
    ): Entity {
        // First check if entity already exists in any collection
        let entity = this.classes.get(name) || this.enums.get(name) || this.aliases.get(name);

        if (!entity) {
            // Create new entity
            entity = this.createEntity(name, type, fileIndex, lineNumber);
            this.entities.push(entity);

            // Add to appropriate collection
            switch (type) {
                case 'Class':
                    this.classes.set(name, entity);
                    break;
                case 'Enum':
                    this.enums.set(name, entity);
                    break;
                case 'Alias':
                    this.aliases.set(name, entity);
                    break;
                case 'GlobalFunction':
                    this.globalFunctions.set(name, entity);
                    break;
                default:
                    // Unknown entities go to classes by default
                    this.classes.set(name, entity);
            }
        }

        return entity;
    }

    /**
     * Process subtypes for complex types
     */
    private processSubTypes(
        subTypes: string[] | null,
        typeStr: string,
        fileIndex: number,
        lineNumber: number
    ): (string | number)[] | null {
        if (!subTypes) {
            console.warn(`Warning: ${typeStr} is marked as a complex type but has no subtypes`);
            return null;
        }

        const finalSubTypes: (string | number)[] = [];

        for (const subType of subTypes) {
            // If it's a primitive type, store as string
            if (primitiveTypes.has(subType)) {
                finalSubTypes.push(subType);
                continue;
            }

            // Otherwise look up or create an entity and store its ID
            const subTypeEntity = this.findOrCreateEntity(subType, 'Unknown', fileIndex, lineNumber);
            finalSubTypes.push(subTypeEntity.id);

            // Note: references from subtypes will be tracked when the full property/param
            // is created in the calling methods
        }

        return finalSubTypes.length ? finalSubTypes : null;
    }

    /**
     * Create a TypeInfo object for a given type
     */
    private createTypeInfo(
        id: number,
        typeName: string,
        parentId: number,
        fileIndex: number,
        lineNumber: number,
        name: string = 'unnamed'
    ): TypeInfo {
        const { baseType, isArray, isMap, isSet, isOptional, isUnion, isFunctionType, functionSignature, subTypes } =
            this.parseType(typeName);

        // Process main type - either ID or primitive name
        let finalType: string | number = baseType;

        if (!primitiveTypes.has(baseType)) {
            const typeEntity = this.findOrCreateEntity(baseType, 'Unknown', fileIndex, lineNumber);
            finalType = typeEntity.id;
        }

        // Process subtypes for complex types
        let finalSubTypes: (string | number)[] | null = null;
        if (isArray || isMap || isSet || isUnion) {
            finalSubTypes = this.processSubTypes(subTypes, typeName, fileIndex, lineNumber);
        }

        return {
            id,
            parent: parentId,
            name,
            type: finalType,
            subTypes: finalSubTypes,
            value: null,
            isArray,
            isMap,
            isSet,
            isOptional,
            isUnion,
            isFunctionType,
            functionSignature,
            file: fileIndex,
            lineNumber
        };
    }

    /**
     * Build the type database from the loaded files
     */
    public build(files: string[]): TypeDatabase {
        console.log('Starting type extraction...');

        const fileLines = files.map((file) => file.split('\n'));

        for (let i = 0; i < files.length; i++) {
            this.parseFiles(fileLines[i], i);
        }

        // Update line end for class entities
        this.updateClassEntityEndLines();

        // Print extraction statistics
        this.logExtractionStats();

        console.log('Type extraction complete!');

        const typeDatabase = this.generateTypeDatabase(fileLines);

        return typeDatabase;
    }

    private generateTypeDatabase(fileLines: string[][]) {
        const classes = this.classes.values().toArray();
        const enums = this.enums.values().toArray();
        const aliases = this.aliases.values().toArray();
        const globalFunctions = this.globalFunctions.values().toArray();
        const properties = this.properties.values().toArray();
        const methods = [...classes.flatMap((c) => c.methods)];

        const classNameId = classes
            .map((c) => ({ id: c.id, name: c.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const enumNameId = enums
            .map((e) => ({ id: e.id, name: e.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const aliasNameId = aliases
            .map((a) => ({ id: a.id, name: a.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const globalFunctionNameId = globalFunctions
            .map((g) => ({ id: g.id, name: g.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const entityNameId = this.entities
            .map((e) => ({
                id: e.id,
                name: e.name,
                type: e.type
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const propertyNameId = properties
            .map((p) => ({ id: p.id, name: p.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const methodNameId = methods
            .map((m) => ({ id: m.id, name: m.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const parammeterNameId = this.functions
            .flatMap((f) => f.params)
            .map((p) => ({ id: p.id, name: p.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const entityMap = new Map<number, Entity>();

        for (const entity of [...classes, ...enums, ...aliases, ...globalFunctions]) {
            entityMap.set(entity.id, entity);
        }

        const typeDatabase: TypeDatabase = {
            classNameId,
            enumNameId,
            aliasNameId,
            globalFunctionNameId,
            entityNameId,
            propertyNameId,
            methodNameId,
            parammeterNameId,
            entityMap,
            entities: [...classes, ...enums, ...aliases, ...globalFunctions],
            classes,
            enums,
            aliases,
            globalFunctions,
            properties,
            methods,
            fileContents: fileLines
        };

        return typeDatabase;
    }

    /**
     * Log statistics about the extracted types
     */
    private logExtractionStats() {
        console.log(`Extracted entities: ${this.entities.length}`);
        console.log(`Classes: ${this.classes.size}`);
        console.log(`Enums: ${this.enums.size}`);
        console.log(`Aliases: ${this.aliases.size}`);
        console.log(`Global Functions: ${this.globalFunctions.size}`);

        // Count all class methods
        let totalMethods = 0;
        for (const entity of this.entities) {
            if (entity.type === 'Class') {
                totalMethods += entity.methods.length;
            }
        }
        console.log(`Class Methods: ${totalMethods}`);
    }

    private parseFiles(fileLines: string[], fileIndex: number) {
        // the first thing we do is a full pass to find all the classes and enums
        // and store them in a map
        this.generateEntities(fileLines, fileIndex);

        // now that we know our entities, we can generate the properties and functions
        this.extractProperties(fileLines, fileIndex);

        // Extract class methods
        this.extractClassMethods(fileLines, fileIndex);

        // Extract global functions
        this.extractGlobalFunctions(fileLines, fileIndex);
    }

    private generateEntities(fileLines: string[], fileIndex: number) {
        let currentComplexAlias: Entity | null = null;
        let complexAliasOptions: string[] = [];

        for (let i = 0; i < fileLines.length; i++) {
            const line = fileLines[i];

            if (line.startsWith('---@class')) {
                currentComplexAlias = null; // Reset complex alias tracking

                const classMatch = line.match(/^---@class\s+([A-Za-z0-9_]+)(?:\s*:\s*([A-Za-z0-9_]+))?/);
                if (!classMatch || !classMatch[1]) continue;

                const className = classMatch[1];
                const parentName = classMatch[2] || null;

                // because we could have previously created the class for being a parent
                // we need to check if the class is already in the map
                let entity = this.classes.get(className);

                if (!entity) {
                    entity = this.createEntity(className, 'Class', fileIndex, i);
                    this.classes.set(className, entity);
                    this.entities.push(entity);
                }

                entity.type = 'Class';
                entity.lineStart = i;

                if (parentName) {
                    let parent = this.classes.get(parentName);

                    if (!parent) {
                        // since the parent is not found let's create a new entity for it
                        parent = this.createEntity(parentName, 'Unknown', fileIndex, i);
                        this.classes.set(parentName, parent);
                        this.entities.push(parent);
                    }

                    parent.childs.push(entity.id);
                    entity.hasParent = true;
                    entity.parent = parent.id;
                }
            } else if (line.startsWith('---@enum')) {
                currentComplexAlias = null; // Reset complex alias tracking

                const enumMatch = line.match(/^---@enum\s+([A-Za-z0-9_]+)/);
                if (!enumMatch || !enumMatch[1]) continue;

                const enumName = enumMatch[1];
                const entity = this.createEntity(enumName, 'Enum', fileIndex, i);
                this.enums.set(enumName, entity);
                this.entities.push(entity);
            } else if (line.startsWith('---@alias')) {
                // Handle different alias formats:
                // 1. Simple: ---@alias int8 integer
                // 2. Complex with options: ---@alias PropertyTypes (followed by ---| entries)

                const simpleAliasMatch = line.match(/^---@alias\s+([A-Za-z0-9_]+)\s+([A-Za-z0-9_|\s<>]+)/);

                if (simpleAliasMatch && simpleAliasMatch[1] && simpleAliasMatch[2]) {
                    currentComplexAlias = null; // Reset complex alias tracking

                    const aliasName = simpleAliasMatch[1];
                    const aliasType = simpleAliasMatch[2].trim();

                    // Create an entity for this alias
                    const entity = this.createEntity(aliasName, 'Alias', fileIndex, i);

                    // Set what this alias points to
                    if (primitiveTypes.has(aliasType)) {
                        entity.aliasFor = aliasType;
                    } else {
                        // Try to resolve the aliased type
                        let aliasedEntity =
                            this.classes.get(aliasType) || this.enums.get(aliasType) || this.aliases.get(aliasType);

                        if (!aliasedEntity) {
                            // Create unknown entity if it doesn't exist
                            aliasedEntity = this.createEntity(aliasType, 'Unknown', fileIndex, i);
                            this.entities.push(aliasedEntity);

                            // Determine what collection to add it to
                            if (aliasType.includes('|')) {
                                // It's a union type
                                this.aliases.set(aliasType, aliasedEntity);
                            } else {
                                // Default to class for now
                                this.classes.set(aliasType, aliasedEntity);
                            }
                        }

                        entity.aliasFor = aliasedEntity.id;
                    }

                    // Store the alias
                    this.aliases.set(aliasName, entity);
                    this.entities.push(entity);
                } else {
                    // Handle complex alias (like PropertyTypes with multiple options)
                    const complexAliasMatch = line.match(/^---@alias\s+([A-Za-z0-9_]+)\s*$/);

                    if (complexAliasMatch && complexAliasMatch[1]) {
                        const aliasName = complexAliasMatch[1];

                        // Create an entity for this complex alias
                        const entity = this.createEntity(aliasName, 'Alias', fileIndex, i);

                        // For complex aliases, we'll collect options
                        currentComplexAlias = entity;
                        complexAliasOptions = [];

                        // Store the alias
                        this.aliases.set(aliasName, entity);
                        this.entities.push(entity);
                    }
                }
            } else if (line.startsWith('---|') && currentComplexAlias) {
                // This is an option for a complex alias like PropertyTypes
                // Format: ---| `PropertyTypes.ObjectProperty`
                const optionMatch = line.match(/^---\|\s*`([^`]+)`/);
                if (optionMatch && optionMatch[1]) {
                    complexAliasOptions.push(optionMatch[1]);
                }
            } else if (currentComplexAlias && line.trim() && !line.startsWith('---')) {
                // End of complex alias (reached a non-comment line like "PropertyTypes = {}")
                if (complexAliasOptions.length > 0) {
                    // Store the collected options in the currentComplexAlias
                    const optionsProperty: Property = {
                        id: this.properties.length,
                        parent: currentComplexAlias.id,
                        name: 'options',
                        type: 'array',
                        subTypes: complexAliasOptions.map((option) => option),
                        value: null,
                        isArray: true,
                        isMap: false,
                        isSet: false,
                        isOptional: false,
                        isUnion: false,
                        isFunctionType: false,
                        functionSignature: null,
                        file: fileIndex,
                        lineNumber: i
                    };

                    currentComplexAlias.properties.push(optionsProperty);
                    this.properties.push(optionsProperty);
                }

                // Reset tracking
                currentComplexAlias = null;
                complexAliasOptions = [];
            }
        }

        // Handle case where the file ends with a complex alias
        if (currentComplexAlias && complexAliasOptions.length > 0) {
            // Store the collected options in the currentComplexAlias
            const optionsProperty: Property = {
                id: this.properties.length,
                parent: currentComplexAlias.id,
                name: 'options',
                type: 'array',
                subTypes: complexAliasOptions.map((option) => option),
                value: null,
                isArray: true,
                isMap: false,
                isSet: false,
                isOptional: false,
                isUnion: false,
                isFunctionType: false,
                functionSignature: null,
                file: fileIndex,
                lineNumber: fileLines.length - 1
            };

            currentComplexAlias.properties.push(optionsProperty);
            this.properties.push(optionsProperty);
        }
    }

    private createEntity(
        name: string,
        type: 'Class' | 'Enum' | 'Alias' | 'GlobalFunction' | 'Unknown',
        fileIndex: number,
        fileLine: number
    ): Entity {
        const entity: Entity = {
            id: this.entities.length,
            name,
            type,
            hasParent: false,
            parent: null,
            refNumber: 0,
            references: [],
            childs: [],
            aliasFor: undefined,
            properties: [],
            methods: [],
            file: fileIndex,
            lineStart: fileLine,
            lineEnd: fileLine
        };

        return entity;
    }

    /**
     * Create a property with proper type handling
     */
    private createProperty(
        name: string,
        type: string,
        parent: number,
        value: string | null,
        fileIndex: number,
        fileLine: number
    ): Property {
        // Use the createTypeInfo helper
        const typeInfo = this.createTypeInfo(this.properties.length, type, parent, fileIndex, fileLine, name);

        // Convert to a Property
        const property: Property = {
            ...typeInfo,
            value
        };

        // Track references from this property to other entities
        this.trackTypeWithSubtypesReferences(property, property.id, 'prop');

        return property;
    }

    /**
     * Parse a type string into its components
     */
    private parseType(type: string): {
        baseType: string;
        isArray: boolean;
        isMap: boolean;
        isSet: boolean;
        isOptional: boolean;
        isUnion: boolean;
        isFunctionType: boolean;
        functionSignature: string | null;
        subTypes: string[] | null;
    } {
        // Default values
        const result = {
            baseType: type.trim(), // Trim the type to remove leading/trailing spaces
            isArray: false,
            isMap: false,
            isSet: false,
            isOptional: false,
            isUnion: false,
            isFunctionType: false,
            functionSignature: null as string | null,
            subTypes: null as string[] | null
        };

        // Check for optional types (ending with ?)
        if (result.baseType.endsWith('?')) {
            result.isOptional = true;
            result.baseType = result.baseType.slice(0, -1).trim();
        }

        // Check for union types (containing |)
        if (result.baseType.includes('|')) {
            result.isUnion = true;
            result.subTypes = result.baseType.split('|').map((t) => t.trim());

            // Check if any union type is optional
            if (result.subTypes.some((t) => t.endsWith('?'))) {
                result.isOptional = true;
                result.subTypes = result.subTypes.map((t) => (t.endsWith('?') ? t.slice(0, -1).trim() : t.trim()));
            }

            // Set the base type to "union"
            result.baseType = 'union';
            return result;
        }

        // Check for array notation (ending with [])
        if (result.baseType.endsWith('[]')) {
            result.isArray = true;
            result.baseType = result.baseType.slice(0, -2).trim();
            result.subTypes = [result.baseType];
            return {
                ...result,
                baseType: 'array'
            };
        }

        // Normalize type by removing spaces between generic brackets
        result.baseType = this.normalizeGenericSpaces(result.baseType);

        // Check for TArray<>
        if (result.baseType.startsWith('TArray<')) {
            // Extract content between angle brackets, handling nested generics
            const content = this.extractGenericContent(result.baseType);

            result.isArray = true;
            result.baseType = 'TArray';
            result.subTypes = content ? [content.trim()] : null;
            return result;
        }

        // Check for TMap<>
        if (result.baseType.startsWith('TMap<')) {
            // Extract content between angle brackets, handling nested generics
            const content = this.extractGenericContent(result.baseType);

            if (content) {
                // Find the comma that separates key and value type, accounting for nesting
                const separatorIndex = this.findGenericSeparator(content);

                if (separatorIndex !== -1) {
                    const keyType = content.substring(0, separatorIndex).trim();
                    const valueType = content.substring(separatorIndex + 1).trim();

                    result.isMap = true;
                    result.baseType = 'map';
                    result.subTypes = [keyType, valueType];
                    return result;
                }
            }

            // Fallback if we couldn't properly parse the TMap
            console.warn(`Warning: Failed to parse TMap: ${result.baseType}`);
            result.isMap = true;
            result.baseType = 'map';
            return result;
        }

        // Check for TSet<>
        if (result.baseType.startsWith('TSet<')) {
            // Extract content between angle brackets, handling nested generics
            const content = this.extractGenericContent(result.baseType);

            result.isSet = true;
            result.baseType = 'set';
            result.subTypes = content ? [content.trim()] : null;
            return result;
        }

        // Check for function types
        if (result.baseType.startsWith('fun(')) {
            result.isFunctionType = true;
            result.functionSignature = result.baseType;
            result.baseType = 'function';
            return result;
        }

        return result;
    }

    /**
     * Normalize spaces in generic types to handle cases like "TMap < Key, Value >"
     */
    private normalizeGenericSpaces(type: string): string {
        // First normalize spaces around angle brackets
        let normalized = type.replace(/\s*<\s*/g, '<').replace(/\s*>\s*/g, '>');

        // For TMap, normalize spaces around the comma
        if (normalized.startsWith('TMap<') || normalized.startsWith('TArray<') || normalized.startsWith('TSet<')) {
            // Use a regex that matches commas outside of nested angle brackets
            let depth = 0;
            let result = '';

            for (let i = 0; i < normalized.length; i++) {
                const char = normalized[i];

                if (char === '<') {
                    depth++;
                    result += char;
                } else if (char === '>') {
                    depth--;
                    result += char;
                } else if (char === ',' && depth === 1) {
                    // At depth 1, we're at the top level of our generic
                    result += ','; // Add comma without spaces
                } else if (char === ' ' && normalized[i - 1] === ',' && depth === 1) {
                    // Skip space after comma at depth 1
                    continue;
                } else {
                    result += char;
                }
            }

            normalized = result;
        }

        return normalized;
    }

    /**
     * Extract the content between angle brackets, handling nested generics
     */
    private extractGenericContent(type: string): string | null {
        // First normalize the type to handle spaces
        type = this.normalizeGenericSpaces(type);

        const startIndex = type.indexOf('<');
        if (startIndex === -1) return null;

        let balance = 1; // Start with 1 open bracket
        let endIndex = -1;

        for (let i = startIndex + 1; i < type.length; i++) {
            if (type[i] === '<') {
                balance++;
            } else if (type[i] === '>') {
                balance--;
                if (balance === 0) {
                    endIndex = i;
                    break;
                }
            }
        }

        if (endIndex === -1) return null;

        return type.substring(startIndex + 1, endIndex);
    }

    /**
     * Find the comma separator in a generic type, ignoring commas within nested generics
     */
    private findGenericSeparator(content: string): number {
        // First normalize the content to handle spaces
        content = content.trim();

        let balance = 0;

        for (let i = 0; i < content.length; i++) {
            if (content[i] === '<') {
                balance++;
            } else if (content[i] === '>') {
                balance--;
            } else if (content[i] === ',' && balance === 0) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Helper method to extract a type from a string, handling complex nested types
     * @param line The line containing the type
     * @param startPos The position to start extraction (after the name/annotation)
     * @returns The extracted type string or null if no valid type found
     */
    private extractTypeFromLine(line: string, startPos: number): string | null {
        // Skip the start position to get to the type
        const remainingLine = line.substring(startPos);

        // Extract the type
        let typeStr = '';
        let typeComplete = false;
        let bracketDepth = 0;
        let parenDepth = 0;

        for (let j = 0; j < remainingLine.length; j++) {
            const char = remainingLine[j];

            // Track bracket and parenthesis depth
            if (char === '<') bracketDepth++;
            else if (char === '>') bracketDepth--;
            else if (char === '(') parenDepth++;
            else if (char === ')') parenDepth--;

            // If we're at depth 0 and hit a whitespace, we've reached the end of the type
            if (bracketDepth === 0 && parenDepth === 0 && /\s/.test(char) && typeStr.length > 0) {
                typeComplete = true;
                break;
            }

            if (!typeComplete) {
                typeStr += char;
            }
        }

        // Trim the type string to remove any trailing whitespace
        typeStr = typeStr.trim();

        return typeStr || null;
    }

    private extractProperties(fileLines: string[], fileIndex: number) {
        // First pass to get all properties
        for (const entity of this.entities) {
            // now we know where the entity starts
            // we parse the whole file until we find the next entity
            // and we do this for each entity

            for (let i = entity.lineStart + 1; i < fileLines.length; i++) {
                const line = fileLines[i];

                // Stop if we hit another entity definition (but allow function declarations for class methods)
                if (
                    line.startsWith('---@class') ||
                    line.startsWith('---@enum') ||
                    line.startsWith('---@alias')
                ) {
                    entity.lineEnd = i - 1;
                    break;
                }

                // Check if line is a property annotation
                if (line.startsWith('---@field')) {
                    // First, extract the property name
                    const nameMatch = line.match(/^---@field\s+([A-Za-z0-9_]+)\s+/);

                    if (nameMatch && nameMatch[1]) {
                        const name = nameMatch[1];

                        // Extract the type using the shared helper
                        const typeName = this.extractTypeFromLine(line, nameMatch[0].length);

                        if (typeName) {
                            // Create the property
                            const property = this.createProperty(name, typeName, entity.id, null, fileIndex, i);
                            entity.properties.push(property);
                            this.properties.push(property);
                        }
                    }
                }
            }
        }
    }

    /**
     * Parse parameter annotation and add to current params
     */
    private parseParamAnnotation(
        line: string,
        currentParams: Parameter[],
        fileIndex: number,
        lineNumber: number
    ): void {
        // First, extract the parameter name
        const nameMatch = line.match(/^---@param\s+([A-Za-z0-9_]+)\s+/);
        if (!nameMatch || !nameMatch[1]) return;

        const paramName = nameMatch[1];

        // Extract the type using the shared helper
        const paramTypeStr = this.extractTypeFromLine(line, nameMatch[0].length);

        if (!paramTypeStr) return;

        // Create type info for the parameter
        const param = this.createTypeInfo(
            -1,
            paramTypeStr,
            0, // Will be set later when function is created
            fileIndex,
            lineNumber,
            paramName
        );

        currentParams.push(param);

        // We'll track references later when the function is fully created and we have proper IDs
    }

    /**
     * Extract return type from a return annotation line
     */
    private parseReturnAnnotation(line: string, fileIndex: number, lineNumber: number): string | null {
        // Match the return annotation prefix
        const returnNameMatch = line.match(/^---@return\s+/);
        if (!returnNameMatch) return null;

        // Extract the type using the shared helper
        return this.extractTypeFromLine(line, returnNameMatch[0].length);
    }

    /**
     * Process a function definition line and associated annotations
     */
    private processFunction(
        functionName: string,
        methodName: string | null,
        paramsString: string,
        currentParams: Parameter[],
        currentReturnType: string | null,
        fileIndex: number,
        lineNumber: number
    ): Entity | Method | null {
        // For class methods

        // Create return type info
        const returnInfo = this.createReturnTypeInfo(currentReturnType || 'void', fileIndex, lineNumber);

        if (methodName) {
            // Look up the class entity
            const classEntity = this.classes.get(functionName);

            if (!classEntity) {
                console.warn(`Warning: function found for unknown class: ${functionName}:${methodName}`);
                return null;
            }

            returnInfo.id = this.numFunctionReturns;
            this.numFunctionReturns++;

            // Create the function
            const func: Method = {
                id: this.functions.length,
                parent: classEntity.id,
                name: methodName,
                return: returnInfo,
                params: currentParams,
                file: fileIndex,
                lineNumber
            };

            // Set parent for params
            for (const param of currentParams) {
                param.id = this.numFunctionParams;
                this.numFunctionParams++;
                param.parent = func.id;
                this.trackTypeWithSubtypesReferences(param, param.id, 'param');
            }

            // Track references from return type to other entities
            this.trackTypeWithSubtypesReferences(returnInfo, func.id, 'func');
            // Add function to class
            classEntity.methods.push(func);
            this.functions.push(func);

            return func;
        }

        returnInfo.id = this.numGlobalFunctionReturns;
        this.numGlobalFunctionReturns++;

        // Create a global function entity
        const globalFunction = this.createEntity(functionName, 'GlobalFunction', fileIndex, lineNumber);
        globalFunction.params = currentParams;
        globalFunction.return = returnInfo;

        for (const param of currentParams) {
            param.parent = globalFunction.id;
            this.trackTypeWithSubtypesReferences(param, param.id, 'param');
        }

        // Set parent references
        returnInfo.parent = globalFunction.id;

        // Track references from return type to global function
        this.trackTypeWithSubtypesReferences(returnInfo, globalFunction.id, 'gfunc');

        for (const param of currentParams) {
            param.id = this.numGlobalFunctionParams;
            this.numGlobalFunctionParams++;
            param.parent = globalFunction.id;
            // Track references from parameter to other entities
            this.trackTypeWithSubtypesReferences(param, param.id, 'param');
        }

        // Store the global function
        this.globalFunctions.set(functionName, globalFunction);
        this.entities.push(globalFunction);

        return globalFunction;
    }

    private extractClassMethods(fileLines: string[], fileIndex: number) {
        this.extractFunctions(fileLines, fileIndex, true);
    }

    private extractGlobalFunctions(fileLines: string[], fileIndex: number) {
        this.extractFunctions(fileLines, fileIndex, false);
    }

    /**
     * Shared method to extract functions (both class methods and global functions)
     */
    private extractFunctions(fileLines: string[], fileIndex: number, isClassMethod: boolean) {
        // State tracking
        let currentParams: Parameter[] = [];
        let currentReturnType: string | null = null;
        let currentFunctionDescription: string = '';
        let isCollectingFunction = false;

        for (let i = 0; i < fileLines.length; i++) {
            const line = fileLines[i].trim();

            // Define regex pattern based on whether we're looking for class methods or global functions
            const functionPattern = isClassMethod
                ? /^function\s+([A-Za-z0-9_]+):([A-Za-z0-9_]+)\(([^)]*)\)\s*(?:end)?/
                : /^function\s+([A-Za-z0-9_]+)\(([^)]*)\)\s*(?:end)?$/;

            // Check for the function definition
            const functionMatch = line.match(functionPattern);

            if (functionMatch) {
                if (isClassMethod) {
                    // Class method: className:methodName(params)
                    const className = functionMatch[1];
                    const methodName = functionMatch[2];
                    const paramsString = functionMatch[3];

                    this.processFunction(
                        className,
                        methodName,
                        paramsString,
                        currentParams,
                        currentReturnType,
                        fileIndex,
                        i
                    );
                } else {
                    // Global function: functionName(params)
                    const functionName = functionMatch[1];
                    const paramsString = functionMatch[2];

                    this.processFunction(
                        functionName,
                        null,
                        paramsString,
                        currentParams,
                        currentReturnType,
                        fileIndex,
                        i
                    );
                }

                // Reset state for next function
                currentParams = [];
                currentReturnType = null;
                currentFunctionDescription = '';
                isCollectingFunction = false;
            } else if (line.startsWith('---@param')) {
                // Parse param annotation
                this.parseParamAnnotation(line, currentParams, fileIndex, i);
                isCollectingFunction = true;
            } else if (line.startsWith('---@return')) {
                // Parse return annotation with the shared helper
                currentReturnType = this.parseReturnAnnotation(line, fileIndex, i);
                if (currentReturnType) {
                    isCollectingFunction = true;
                }
            } else if (line.startsWith('---') && !line.startsWith('---@')) {
                // Collect function description lines
                if (isCollectingFunction || currentFunctionDescription.length === 0) {
                    currentFunctionDescription += line.replace(/^---/, '').trim() + '\n';
                }
            } else if (line.trim() !== '' && !line.startsWith('function') && isCollectingFunction) {
                // Non-function line after collecting function info - reset state
                currentParams = [];
                currentReturnType = null;
                currentFunctionDescription = '';
                isCollectingFunction = false;
            }
        }
    }

    /**
     * Create function parameters from parameter string or annotations
     */
    private createFunctionParams(
        paramsString: string,
        annotatedParams: Parameter[],
        fileIndex: number,
        lineNumber: number
    ): Parameter[] {
        const functionParams: Parameter[] = [];

        // Use annotated params if available
        if (annotatedParams.length > 0) {
            functionParams.push(...annotatedParams);
        } else {
            // Otherwise create basic params from the function signature
            const params = paramsString ? paramsString.split(',').map((p) => p.trim()) : [];

            for (let j = 0; j < params.length; j++) {
                const paramName = params[j];
                functionParams.push({
                    id: this.numFunctionParams,
                    parent: 0, // Will be set later
                    name: paramName,
                    type: 'any', // Default to any if not annotated
                    isArray: false,
                    isMap: false,
                    isSet: false,
                    isOptional: false,
                    isUnion: false,
                    isFunctionType: false,
                    functionSignature: null,
                    subTypes: null,
                    value: null,
                    file: fileIndex,
                    lineNumber
                });
                this.numFunctionParams++;
            }
        }

        return functionParams;
    }

    /**
     * Create return type info for a function
     */
    private createReturnTypeInfo(returnType: string, fileIndex: number, lineNumber: number): TypeInfo {
        return this.createTypeInfo(
            -1,
            returnType,
            0, // Will be set later when function is created
            fileIndex,
            lineNumber,
            'return'
        );
    }

    /**
     * Add a reference to an entity
     */
    private addReference(
        entityId: number,
        referenceId: number,
        referenceType: 'prop' | 'param' | 'func' | 'gfunc'
    ): void {
        const entity = this.entities.find((e) => e.id === entityId);
        if (!entity) return;

        // Check if reference already exists
        const existingRef = entity.references.find((ref) => ref.id === referenceId && ref.type === referenceType);
        if (!existingRef) {
            entity.references.push({ id: referenceId, type: referenceType });
            entity.refNumber++;
        }
    }

    /**
     * Track references for a type (used in properties, params, returns)
     */
    private trackTypeReferences(
        typeValue: string | number,
        referenceId: number,
        referenceType: 'prop' | 'param' | 'func' | 'gfunc'
    ): void {
        // Only process entity references (numeric types)
        if (typeof typeValue === 'number') {
            this.addReference(typeValue, referenceId, referenceType);
        }
    }

    /**
     * Track references for a type with subtypes
     */
    private trackTypeWithSubtypesReferences(
        typeInfo: TypeInfo,
        referenceId: number,
        referenceType: 'prop' | 'param' | 'func' | 'gfunc'
    ): void {
        // Track the main type reference
        this.trackTypeReferences(typeInfo.type, referenceId, referenceType);

        // Track subtype references
        if (typeInfo.subTypes) {
            for (const subType of typeInfo.subTypes) {
                this.trackTypeReferences(subType, referenceId, referenceType);
            }
        }
    }

    /**
     * Update the end line for class entities based on their methods
     */
    private updateClassEntityEndLines() {
        // Process each class
        for (const entity of this.entities) {
            if (entity.type === 'Class' && entity.methods.length > 0) {
                // Find the last method for this class
                const methods = entity.methods.sort((a, b) => a.lineNumber - b.lineNumber);
                const lastMethod = methods[methods.length - 1];
                
                // Set the entity end line to be after the last method
                entity.lineEnd = Math.max(entity.lineEnd, lastMethod.lineNumber + 1);
            }
        }
    }
}
