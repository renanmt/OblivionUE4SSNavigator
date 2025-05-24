import {
    type Entity,
    type Property,
    type Method,
    type Parameter,
    type TypeInfo,
    EntityType,
    EntityReferenceType,
    type Class,
    type Enum,
    type Alias,
    type GlobalFunction,
    type EnumValue,
    type TypeMin,
    type EntityReference
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
    'table',
    'function',
    'fun',
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
    classMap: Map<number, Class>;
    enumMap: Map<number, Enum>;
    aliasMap: Map<number, Alias>;
    globalFunctionMap: Map<number, GlobalFunction>;
    propertyMap: Map<number, Property>;
    methodMap: Map<number, Method>;
    parameterMap: Map<number, Parameter>;
    unknownMap: Map<number, Entity>;
    entityMap: Map<number, Entity>;
    entities: Entity[];
    classes: Class[];
    enums: Enum[];
    aliases: Alias[];
    globalFunctions: GlobalFunction[];
    properties: Property[];
    methods: Method[];
    unknowns: Entity[];
    fileContents: string[][];
}

export class TypeExtractor {
    private entities: Entity[] = [];
    private entityMap: Map<string, Entity> = new Map();
    private classes: Map<string, Class> = new Map();
    private properties: Property[] = [];
    private methods: Method[] = [];
    private parameters: Parameter[] = [];
    private enums: Map<string, Enum> = new Map();
    private aliases: Map<string, Alias> = new Map();
    private globalFunctions: Map<string, GlobalFunction> = new Map();

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
        const methods = [...classes.flatMap((c) => (c as Class).methods)];

        const classMap = new Map<number, Class>(classes.map((c) => [c.id, c]));
        const enumMap = new Map<number, Enum>(enums.map((e) => [e.id, e]));
        const aliasMap = new Map<number, Alias>(aliases.map((a) => [a.id, a]));
        const globalFunctionMap = new Map<number, GlobalFunction>(globalFunctions.map((g) => [g.id, g]));
        const propertyMap = new Map<number, Property>(properties.map((p) => [p.id, p]));
        const methodMap = new Map<number, Method>(methods.map((m) => [m.id, m]));
        const parameterMap = new Map<number, Parameter>(methods.flatMap((m) => m.params).map((p) => [p.id, p]));

        const unknowns: Entity[] = [];

        for (const e of this.entities) {
            if (e.type === EntityType.Unknown) {
                unknowns.push(e);
            }
        }

        const unknownMap = new Map<number, Entity>(unknowns.map((u) => [u.id, u]));

        const entityMap = new Map<number, Entity>();

        for (const entity of [...classes, ...enums, ...aliases, ...globalFunctions]) {
            entityMap.set(entity.id, entity);
        }

        const typeDatabase: TypeDatabase = {
            classMap,
            enumMap,
            aliasMap,
            globalFunctionMap,
            propertyMap,
            methodMap,
            parameterMap,
            unknownMap,
            entityMap,
            entities: this.entities,
            classes,
            enums,
            aliases,
            globalFunctions,
            properties,
            methods,
            unknowns,
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
                totalMethods += (entity as Class).methods.length;
            }
        }
        console.log(`Class Methods: ${totalMethods}`);
    }

    // Patterns for each type of entity
    // Class: ---@class <Class Name> or ---@class <Class Name> : <Parent Class Name>
    // Enum: ---@enum <Enum Name>
    // EnumValue: <Enum Name> = <Value>
    // Alias: ---@alias <Alias Name>
    // AliasValue: ---| `<Alias Value>`
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
        AliasValue: /---\|\s*`([^`]+)`/,
        GlobalFunction: /function\s+([^:\s]+)\s*\(.*\)\s*end/,
        Property: /---@field\s+(\w+)\s+(\w+)/,
        Method: /function\s+(\w+)\s*:\s*(\w+)\s*\(.*\)\s*end/,
        Param: /---@param\s+(\w+)\s+(.+)/,
        ParamFun: /(?<=:\s)([^:,()]+(?:<[^<>]+>)?(?:\[\])?|\w+)(?=[,)\n:])/g,
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

        // First get or create the parent entity as Unknown type if it doesn't exist
        const parentEntity = parentClassName
            ? this.getOrCreateEntity(EntityType.Unknown, null, parentClassName, lineNumber, fileIndex, undefined)
            : null;

        // Create the class entity
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

                const value: EnumValue = {
                    name: valueName,
                    value: valueValue
                };

                enumEntity.values.push(value);

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

        const aliasValues: string[] = [];

        // Handle different alias formats:
        // 1. Simple: ---@alias int8 integer
        if (aliasType) aliasValues.push(aliasType);

        let lastLine = lineNumber + 1;

        // 2. Complex with options: ---@alias PropertyTypes (followed by ---| entries)
        for (let j = lineNumber + 1; j < fileLines.length; j++) {
            const line = fileLines[j];

            const aliasValueMatch = line.match(this.patterns.AliasValue);

            if (aliasValueMatch) {
                aliasValues.push(aliasValueMatch[1]);

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

        aliasEntity.values = aliasValues;
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

        const { params, returnObj } = this.parseParamsAndReturn(
            globalFunctionEntity.id,
            { id: globalFunctionEntity.id, type: EntityReferenceType.gfunc },
            fileLines,
            lineNumber,
            fileIndex
        );

        globalFunctionEntity.params = params;
        globalFunctionEntity.return = returnObj;

        return lineNumber + 1;
    }

    private typeSetMap: Map<EntityType, Map<string, Entity>> = new Map<EntityType, Map<string, Entity>>([
        [EntityType.Class, this.classes as Map<string, Entity>],
        [EntityType.Enum, this.enums as Map<string, Entity>],
        [EntityType.Alias, this.aliases as Map<string, Entity>],
        [EntityType.GlobalFunction, this.globalFunctions as Map<string, Entity>]
    ]);

    private getEntityKey(name: string, type: EntityType): string {
        return `${type}:${name}`;
    }

    private getOrCreateEntity: {
        (
            type: EntityType.Unknown,
            parent: Entity | null,
            name: string,
            line: number,
            fileIndex: number,
            refBy?: EntityReference
        ): Entity;
        (
            type: EntityType.Class,
            parent: Entity | null,
            name: string,
            line: number,
            fileIndex: number,
            refBy?: EntityReference
        ): Class;
        (
            type: EntityType.Enum,
            parent: Entity | null,
            name: string,
            line: number,
            fileIndex: number,
            refBy?: EntityReference
        ): Enum;
        (
            type: EntityType.Alias,
            parent: Entity | null,
            name: string,
            line: number,
            fileIndex: number,
            refBy?: EntityReference
        ): Alias;
        (
            type: EntityType.GlobalFunction,
            parent: Entity | null,
            name: string,
            line: number,
            fileIndex: number,
            refBy?: EntityReference
        ): GlobalFunction;
    } = (
        type: EntityType,
        parent: Entity | null,
        name: string,
        line: number,
        fileIndex: number,
        refBy?: EntityReference
    ): any => {
        let entity: Entity | undefined;
        let entityKey: string;

        if (type === EntityType.Unknown) {
            for (const t of [
                EntityType.Unknown,
                EntityType.Class,
                EntityType.Enum,
                EntityType.Alias,
                EntityType.GlobalFunction
            ]) {
                entityKey = this.getEntityKey(name, t);
                entity = this.entityMap.get(entityKey);

                if (entity) return entity;
            }

            entity = this.createDefaultEntity(EntityType.Unknown, name, line, fileIndex, refBy);

            return entity;
        }

        entityKey = this.getEntityKey(name, type);
        entity = this.entityMap.get(entityKey);

        if (entity) return entity;

        entityKey = this.getEntityKey(name, EntityType.Unknown);
        entity = this.entityMap.get(entityKey);

        let found = true;

        // if we didn't find as unknown type, we create a default entity
        if (!entity) {
            entity = this.createDefaultEntity(EntityType.Unknown, name, line, fileIndex, refBy);
            found = false;
        }

        // force update the entity with correct values (for unknown type)
        entity.type = type;
        entity.file = fileIndex;
        entity.lineStart = line;
        entity.lineEnd = line;

        // set all the values for the entity
        switch (type) {
            case EntityType.Class:
                (entity as Class).hasParent = !!parent;
                (entity as Class).parent = parent?.id ?? null;
                (entity as Class).childs = (entity as Class).childs ?? [];
                (entity as Class).properties = (entity as Class).properties ?? [];
                (entity as Class).methods = (entity as Class).methods ?? [];
                break;
            case EntityType.Enum:
                (entity as Enum).values = (entity as Enum).values ?? [];
                break;
            case EntityType.Alias:
                (entity as Alias).values = (entity as Alias).values ?? [];
                break;
            case EntityType.GlobalFunction:
                (entity as GlobalFunction).return = (entity as GlobalFunction).return ?? null;
                (entity as GlobalFunction).params = (entity as GlobalFunction).params ?? [];
                (entity as GlobalFunction).signature = (entity as GlobalFunction).signature ?? null;
                break;
        }

        // add the reference to the entity
        if (refBy) entity.references.push(refBy);

        // add the entity to the parent class if it's a class
        if (parent) {
            if (!parent.childs) parent.childs = [];
            if (!parent.childs.includes(entity.id)) parent.childs.push(entity.id);
        }

        this.typeSetMap.get(type)?.set(name, entity);

        if (!found) {
            this.entityMap.set(entityKey, entity);
        }

        return entity;
    };

    private createDefaultEntity(
        type: EntityType,
        name: string,
        line: number,
        fileIndex: number,
        refBy?: EntityReference
    ): Entity {
        const entityKey = this.getEntityKey(name, type);

        const entity: Entity = {
            id: this.entities.length + 1,
            name,
            type,
            references: refBy ? [refBy] : [],
            file: fileIndex,
            lineStart: line,
            lineEnd: line
        };

        this.entities.push(entity);
        this.entityMap.set(entityKey, entity);

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
    private parseType(refBy: EntityReference, type: string, line: number, fileIndex: number) {
        let tokens: Set<string> = new Set();
        if (type.includes('fun')) {
            const funMatch = type.match(this.patterns.ParamFun);
            for (const match of funMatch ?? []) {
                const t = this.tokenizeType(match);
                tokens = tokens.union(t);
            }
        } else tokens = this.tokenizeType(type);

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

        const { params, returnObj } = this.parseParamsAndReturn(
            method.id,
            {
                id: entityId,
                type: EntityReferenceType.method
            },
            fileLines,
            lineNumber,
            fileIndex
        );

        method.params = params;
        method.return = returnObj;

        return method;
    }

    private parseParamsAndReturn(
        entityId: number,
        refBy: EntityReference,
        fileLines: string[],
        lineNumber: number,
        fileIndex: number
    ) {
        const params: Parameter[] = [];
        let returnObj: TypeMin | undefined;

        for (let i = lineNumber - 1; i > 0; i--) {
            const line = fileLines[i];

            const paramMatch = line.match(this.patterns.Param);
            const returnMatch = line.match(this.patterns.Return);

            if (!paramMatch && !returnMatch) {
                break;
            }

            if (returnMatch) {
                const returnType = returnMatch[1];

                const typeRefs = this.parseType(refBy, returnType, i, fileIndex);

                returnObj = {
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
                    parent: entityId,
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

        if (!returnObj) {
            returnObj = {
                type: 'void',
                typeRefs: null
            };
        }

        return {
            params,
            returnObj
        };
    }
}
