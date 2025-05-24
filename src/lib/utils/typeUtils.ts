import type { TypeMin } from '$lib/types';

export function getTypeString(type: TypeMin): string {
    if (!type) return 'unknown';
    
    let typeStr = type.type;
    
    // If there are type references, append them in angle brackets
    if (type.typeRefs) {
        const refTypes = Object.values(type.typeRefs).join(', ');
        typeStr += `<${refTypes}>`;
    }
    
    return typeStr;
} 