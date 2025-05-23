export enum EntityType {
    Class = 'Class',
    Enum = 'Enum',
    Alias = 'Alias',
    GlobalFunction = 'GlobalFunction',
    Unknown = 'Unknown'
}

export enum EntityReferenceType {
    prop = 'prop',
    param = 'param',
    method = 'method',
    gfunc = 'gfunc'
}

export interface Entity {
    id: number;
    name: string;
    type: EntityType;
    hasParent: boolean;
    parent: number | null;
    refNumber: number;
    references: Array<{ id: number; type: EntityReferenceType }>;
    childs: number[];
    aliasFor?: string | number; // Stores what this alias represents

    properties: Property[];
    methods: Method[];
    return?: TypeInfo; // For global function entities
    params?: Parameter[]; // For global function entities

    file: number;
    lineStart: number;
    lineEnd: number;
}

// Common interface for type information
export interface TypeMin {
    type: string;
    typeRefs: Record<string, number> | null;
}

export interface TypeInfo extends TypeMin {
    id: number;
    parent: number;
    name: string;
    value: string | null;
    file: number;
    lineNumber: number;
}

export interface Property extends TypeInfo {}

export interface Parameter extends TypeInfo {}

export interface Method {
    id: number;
    parent: number;
    name: string;
    return: TypeMin;
    params: Parameter[];
    file: number;
    lineNumber: number;
}
