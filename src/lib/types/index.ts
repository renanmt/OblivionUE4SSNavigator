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

export interface EntityReference {
    id: number;
    type: EntityReferenceType;
}

export interface Entity {
    id: number;
    name: string;
    type: EntityType;
    references: EntityReference[];
    childs?: number[];
    
    file: number;
    lineStart: number;
    lineEnd: number;
}

export interface Class extends Entity {
    parent: number | null;
    hasParent: boolean;
    properties: Property[];
    methods: Method[];
}

export interface EnumValue {
    name: string;
    value: string;
}

export interface Enum extends Entity {
    values: EnumValue[];
}

export interface Alias extends Entity {
    values: string[];
}

export interface GlobalFunction extends Entity {
    return: TypeMin;
    params: Parameter[];
    signature: string;
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
