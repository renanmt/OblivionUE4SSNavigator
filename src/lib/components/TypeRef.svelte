<script lang="ts">
    import type { TypeInfo, TypeMin } from '$lib/types';

    export let typeInfo: TypeMin;

    const linkTag: string = '<a href="/entity/{id}" class="link">{name}</a>';

    let type = typeInfo.type;

    for (const refName of Object.keys(typeInfo.typeRefs || {})) {
        const link = linkTag.replace('{id}', typeInfo.typeRefs![refName].toString()).replace('{name}', refName);
        type = type.replaceAll(refName, link);
    }
</script>

{@html type}
