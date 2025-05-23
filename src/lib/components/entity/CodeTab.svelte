<script lang="ts">
    import type { Entity } from '$lib/services/dataLoader';
    import FilterInput from '../common/FilterInput.svelte';
    import hljs from 'highlight.js/lib/core';
    import lua from 'highlight.js/lib/languages/lua';
    import 'highlight.js/styles/atom-one-dark.css';
    import { onMount } from 'svelte';

    export let entity: Entity;
    export let entityCode: string = '';
    let codeFilter = '';
    let highlightedCode: string = '';

    // Apply code filter and syntax highlighting
    $: {
        if (codeFilter) {
            const filteredLines = entityCode
                .split('\n')
                .filter((line) => line.toLowerCase().includes(codeFilter.toLowerCase()));
            const filteredText = filteredLines.join('\n');
            highlightedCode = highlightLuaCode(filteredText);
        } else {
            highlightedCode = highlightLuaCode(entityCode);
        }
    }

    // Function to highlight Lua code using highlight.js
    function highlightLuaCode(code: string): string {
        if (!code) return '';
        try {
            return hljs.highlight(code, { language: 'lua' }).value;
        } catch (e) {
            console.error('Error highlighting code:', e);
            return code;
        }
    }

    function clearCodeFilter() {
        codeFilter = '';
    }

    onMount(() => {
        // Register Lua language
        hljs.registerLanguage('lua', lua);
    });
</script>

<h2 class="mb-4 text-xl font-semibold text-gray-100">Code</h2>

<FilterInput value={codeFilter} placeholder="Filter code..." onClear={clearCodeFilter} />

<div class="overflow-x-auto rounded border border-[#15192b] bg-[#080a11] p-4 text-gray-200">
    {#if entity?.file !== undefined}
        <div class="mb-2 text-sm text-gray-400">
            Source File: {entity.file}, Lines: {entity.lineStart}-{entity.lineEnd}
        </div>
    {/if}
    <pre class="whitespace-pre-wrap"><code class="hljs language-lua">{@html highlightedCode}</code></pre>
</div>
