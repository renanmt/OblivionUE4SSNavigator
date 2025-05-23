import {
    type Entity,
    type Property,
    type Method,
    type Parameter,
    type TypeInfo,
    EntityType,
    EntityReferenceType
} from '$lib/types';

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
    private entityMap: Map<string, Entity> = new Map();
    private classes: Map<string, Entity> = new Map();
    private properties: Property[] = [];
    private methods: Method[] = [];
    private parameters: Parameter[] = [];
    private enums: Map<string, Entity> = new Map();
    private aliases: Map<string, Entity> = new Map();
    private globalFunctions: Map<string, Entity> = new Map();

    private numGlobalFunctionParams: number = 0;
    private numGlobalFunctionReturns: number = 0;
    private numFunctionParams: number = 0;
    private numFunctionReturns: number = 0;

    /**
     * Build the type database from the loaded files
     */
    public build(files: string[]): TypeDatabase {
        console.log('Starting type extraction...');

        const fileLines = files.map((file) => file.split('\n'));

        for (let i = 0; i < files.length; i++) {
            this.parseFiles(fileLines[i], i);
        }

        // // Update line end for class entities
        // this.updateClassEntityEndLines();

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
            .sort((a, b) => {
                if (!a.name.localeCompare) {
                    console.log(a);
                }
                return a.name.localeCompare(b.name);
            });

        const propertyNameId = properties
            .map((p) => ({ id: p.id, name: p.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const methodNameId = methods
            .map((m) => ({ id: m.id, name: m.name.toLowerCase() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const parammeterNameId = this.methods
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

    // Patterns for each type of entity
    // Class: ---@class <Class Name> or ---@class <Class Name> : <Parent Class Name>
    // Enum: ---@enum <Enum Name>
    // EnumValue: <Enum Name> = <Value>
    // Alias: ---@alias <Alias Name>
    // GlobalFunction: function <Function Name>(<Params,...>) end
    // Property: ---@field <Property Name> <Type>
    // Method: function <Class Name>:<Method Name>(<Params,...>) end
    // Param: ---@param <Param Name> <Type>
    // Return: ---@return <Type>
    private patterns = {
        Class: /---@class\s+(\w+)(?:\s*:\s*(\w+))?/,
        Enum: /---@enum\s+(\w+)/,
        EnumValue: /\s*(\w+)\s*=\s*(\w+)/,
        Alias: /---@alias\s+(\w+)(?:\s*(\w+))?/,
        GlobalFunction: /function\s+([^:\s]+)\s*\(.*\)\s*end/,
        Property: /---@field\s+(\w+)\s+(\w+)/,
        Method: /function\s+(\w+)\s*:\s*(\w+)\s*\(.*\)\s*end/,
        Param: /---@param\s+(\w+)\s+(\w+)/,
        Return: /---@return\s+(\w+)/
    };

    private enumNames: Map<string, number> = new Map();

    private typeParseMap: Map<
        string,
        (match: RegExpMatchArray, fileLines: string[], lineNumber: number, fileIndex: number) => number
    > = new Map([
        ['Class', this.parseClass],
        ['Enum', this.parseEnum],
        ['Alias', this.parseAlias],
        ['GlobalFunction', this.parseGlobalFunction]
    ]);

    private parseFiles(fileLines: string[], fileIndex: number) {
        console.log(`🗄️ Parsing file ${fileIndex} with ${fileLines.length} lines.`);
        const patterns = Object.entries(this.patterns);

        for (let i = 0; i < fileLines.length; i++) {
            let skipTo = 0;
            const line = fileLines[i];

            for (const [type, pattern] of patterns) {
                const match = line.match(pattern);
                let found = false;

                if (match) {
                    const parseFunction = this.typeParseMap.get(type);

                    if (parseFunction) {
                        skipTo = parseFunction.bind(this)(match, fileLines, i, fileIndex);
                        found = true;
                    }
                }

                if (found) break;
            }

            if (skipTo > i) {
                i = skipTo;
            }
        }
    }

    private parseClass(match: RegExpMatchArray, fileLines: string[], lineNumber: number, fileIndex: number) {
        const className = match[1];
        const parentClassName = match.length > 2 ? match[2] : null;

        const parentEntity = parentClassName
            ? this.getOrCreateEntity(EntityType.Unknown, null, parentClassName, lineNumber, fileIndex)
            : null;

        const entity = this.getOrCreateEntity(EntityType.Class, parentEntity, className, lineNumber, fileIndex);

        let lastLine = lineNumber + 2;

        // Parse properties
        for (let j = lineNumber + 1; j < fileLines.length; j++) {
            const line = fileLines[j];

            const propertyMatch = line.match(this.patterns.Property);

            if (propertyMatch) {
                const propertyName = propertyMatch[1];
                const propertyType = propertyMatch[2];

                const refId = this.properties.length + 1;
                const refBy = { id: entity.id, type: EntityReferenceType.prop };

                const typeRefs = this.parseType(refBy, propertyType, j, fileIndex);

                const property: Property = {
                    id: refId,
                    parent: entity.id,
                    name: propertyName,
                    type: propertyType,
                    typeRefs,
                    value: null,
                    file: fileIndex,
                    lineNumber: j
                };

                entity.properties.push(property);
                this.properties.push(property);

                continue;
            }

            const methodMatch = line.match(this.patterns.Method);

            if (methodMatch) {
                const methodName = methodMatch[2];

                const method = this.parseMethod(entity.id, methodName, fileLines, j, fileIndex);

                entity.methods.push(method);
                this.methods.push(method);

                continue;
            }

            const done =
                this.patterns.Class.test(line) ||
                this.patterns.Enum.test(line) ||
                this.patterns.Alias.test(line) ||
                this.patterns.GlobalFunction.test(line);

            if (done) {
                lastLine = j - 1;
                break;
            }
        }

        entity.lineEnd = lastLine;

        return lastLine;
    }

    private parseEnum(match: RegExpMatchArray, fileLines: string[], lineNumber: number, fileIndex: number) {
        const enumName = match[1];

        const enumEntity = this.getOrCreateEntity(EntityType.Enum, null, enumName, lineNumber, fileIndex);

        let lastLine = lineNumber + 1;

        for (let j = lineNumber + 2; j < fileLines.length; j++) {
            const line = fileLines[j];

            const valueMatch = line.match(this.patterns.EnumValue);

            if (valueMatch) {
                const valueName = valueMatch[1];
                const valueValue = valueMatch[2];

                const value: Property = {
                    id: this.properties.length + 1,
                    parent: enumEntity.id,
                    name: valueName,
                    value: valueValue,
                    type: 'integer',
                    typeRefs: null,
                    file: fileIndex,
                    lineNumber: j
                };

                enumEntity.properties.push(value);
                this.properties.push(value);

                continue;
            }

            // check for } closing the enum
            const done = /}/.test(line);

            if (done) {
                lastLine = j + 1;
                break;
            }
        }

        enumEntity.lineEnd = lastLine;

        return lastLine;
    }

    private parseAlias(match: RegExpMatchArray, fileLines: string[], lineNumber: number, fileIndex: number) {
        const aliasName = match[1];
        const aliasType = match[2]?.trim();

        const aliasEntity = this.getOrCreateEntity(EntityType.Alias, null, aliasName, lineNumber, fileIndex);

        const properties: Property[] = [];

        // Handle different alias formats:
        // 1. Simple: ---@alias int8 integer
        // 2. Complex with options: ---@alias PropertyTypes (followed by ---| entries)
        if (aliasType) {
            const property: Property = {
                id: this.properties.length + 1,
                parent: aliasEntity.id,
                name: 'aliases',
                type: 'string',
                value: aliasType,
                typeRefs: null,
                file: fileIndex,
                lineNumber: lineNumber
            };

            properties.push(property);
            this.properties.push(property);
        }

        let lastLine = lineNumber + 1;

        for (let j = lineNumber + 1; j < fileLines.length; j++) {
            const line = fileLines[j];

            const done =
                this.patterns.Class.test(line) ||
                this.patterns.Enum.test(line) ||
                this.patterns.Alias.test(line) ||
                this.patterns.GlobalFunction.test(line);

            if (done) {
                lastLine = j - 1;
                break;
            }
        }

        aliasEntity.properties = properties;
        aliasEntity.lineEnd = lastLine;

        return lastLine;
    }

    private parseGlobalFunction(match: RegExpMatchArray, fileLines: string[], lineNumber: number, fileIndex: number) {
        const globalFunctionName = match[1];
        const globalFunctionEntity = this.getOrCreateEntity(
            EntityType.GlobalFunction,
            null,
            globalFunctionName,
            lineNumber,
            fileIndex
        );

        return lineNumber + 1;
    }

    private typeSetMap: Map<EntityType, Map<string, Entity>> = new Map([
        [EntityType.Class, this.classes],
        [EntityType.Enum, this.enums],
        [EntityType.Alias, this.aliases],
        [EntityType.GlobalFunction, this.globalFunctions]
    ]);

    private getOrCreateEntity(
        type: EntityType,
        parent: Entity | null,
        name: string,
        line: number,
        fileIndex: number,
        refBy?: { id: number; type: EntityReferenceType }
    ) {
        let entity = this.entityMap.get(name);

        if (!entity) {
            entity = {
                id: this.entities.length + 1,
                name,
                type: type,
                hasParent: !!parent,
                parent: parent?.id ?? null,
                refNumber: 0,
                references: [],
                childs: [],
                file: fileIndex,
                properties: [],
                methods: [],
                params: [],
                lineStart: line,
                lineEnd: line
            };

            this.entityMap.set(name, entity);
            this.entities.push(entity);
        }

        if (entity.type === EntityType.Unknown) {
            entity.parent = parent?.id ?? null;
            entity.hasParent = !!parent;
            entity.type = type;
            entity.file = fileIndex;
            entity.lineStart = line;
            entity.lineEnd = line;
        }

        if (refBy) entity.references.push(refBy);
        if (parent) parent.childs.push(entity.id);

        this.typeSetMap.get(type)?.set(name, entity);

        return entity;
    }

    // Type: Types required to be extracted cause nesting can happen.
    // Examples:
    // * TArray<T>
    // * TMap<TKey, TValue>
    // * TSet<T>
    // * <T>[]
    // * TArray<TArray<T>>
    // * TMap<TMap<TKey, TValue>, TKey>
    // * TSet<TSet<T>>
    // * <T>[][]
    // * TArray<TArray<TArray<T>>>
    // * TMap<TMap<TMap<TKey, TValue>, TKey>, TKey>
    // * TSet<TSet<TSet<T>>>
    // * T, T, T
    // * fun(self: UObject, ...)
    private parseType(refBy: { id: number; type: EntityReferenceType }, type: string, line: number, fileIndex: number) {
        const tokens = this.tokenizeType(type);
        const typeRefs: Record<string, number> = {};
        let foundEntity = false;

        for (const token of tokens) {
            if (primitiveTypes.has(token)) {
                continue;
            }

            const entity = this.getOrCreateEntity(EntityType.Unknown, null, token, line, fileIndex, refBy);

            if (entity) {
                foundEntity = true;
                typeRefs[token] = entity.id;
                entity.references.push(refBy);
            }
        }

        if (!foundEntity) return null;

        return typeRefs;
    }

    private tokenizeType(type: string): Set<string> {
        const tokens: string[] = [];
        let i = 0;

        while (i < type.length) {
            const char = type[i];

            // Skip whitespace
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // Handle multi-character operators
            if (i < type.length - 2 && type.substr(i, 3) === '...') {
                tokens.push('...');
                i += 3;
                continue;
            }

            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(char)) {
                let identifier = '';
                while (i < type.length && /[a-zA-Z0-9_]/.test(type[i])) {
                    identifier += type[i];
                    i++;
                }
                tokens.push(identifier);
                continue;
            }

            // Handle numbers
            if (/[0-9]/.test(char)) {
                let number = '';
                while (i < type.length && /[0-9]/.test(type[i])) {
                    number += type[i];
                    i++;
                }
                tokens.push(number);
                continue;
            }

            // Handle unknown characters by skipping them
            i++;
        }

        return new Set(tokens);
    }

    private parseMethod(entityId: number, name: string, fileLines: string[], lineNumber: number, fileIndex: number) {
        const method: Method = {
            id: this.methods.length + 1,
            parent: entityId,
            name,
            return: null!,
            params: [],
            file: fileIndex,
            lineNumber: lineNumber
        };

        const params: Parameter[] = [];

        for (let i = lineNumber - 1; i > 0; i--) {
            const line = fileLines[i];

            const paramMatch = line.match(this.patterns.Param);
            const returnMatch = line.match(this.patterns.Return);

            if (!paramMatch && !returnMatch) {
                break;
            }

            if (returnMatch) {
                const returnType = returnMatch[1];

                const refBy = { id: entityId, type: EntityReferenceType.method };

                const typeRefs = this.parseType(refBy, returnType, i, fileIndex);

                method.return = {
                    type: returnType,
                    typeRefs
                };

                continue;
            }

            if (paramMatch) {
                const paramName = paramMatch[1];
                const paramType = paramMatch[2];

                const refBy = { id: entityId, type: EntityReferenceType.method };

                const typeRefs = this.parseType(refBy, paramType, i, fileIndex);

                const param: Parameter = {
                    id: this.parameters.length + 1,
                    parent: method.id,
                    name: paramName,
                    type: paramType,
                    typeRefs,
                    value: null,
                    file: fileIndex,
                    lineNumber: i
                };

                this.parameters.push(param);
                params.push(param);

                continue;
            }
        }

        method.params = params;
        if (!method.return) {
            method.return = {
                type: 'void',
                typeRefs: null
            };
        }

        return method;
    }
}
