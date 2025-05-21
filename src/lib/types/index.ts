export interface Entity {
    id: number;
    name: string;
    type: 'Class' | 'Enum' | 'Alias' | 'GlobalFunction' | 'Unknown';
    hasParent: boolean;
    parent: number | null;
    refNumber: number;
    references: Array<{ id: number; type: 'prop' | 'param' | 'func' | 'gfunc' }>;
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
export interface TypeInfo {
    id: number;
    parent: number;
    name: string;
    type: string | number;
    subTypes: (string | number)[] | null;
    value: string | null;
    isArray: boolean;
    isMap: boolean;
    isSet: boolean;
    isOptional: boolean;
    isUnion: boolean;
    isFunctionType: boolean;
    functionSignature: string | null;
    file: number;
    lineNumber: number;
}

export interface Property extends TypeInfo {}

export interface Parameter extends TypeInfo {}

export interface Method {
    id: number;
    parent: number;
    name: string;
    return: TypeInfo; 
    params: Parameter[];
    file: number;
    lineNumber: number;
}
