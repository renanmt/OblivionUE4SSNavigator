<script lang="ts">
    export let value: string;
    export let placeholder: string;
    export let onClear: () => void;
</script>

<div class="relative mb-4">
    <input
        type="text"
        {placeholder}
        class="w-full rounded border border-[#15192b] bg-[#15192b] p-2 pr-10 text-gray-100 placeholder-gray-500 focus:border-[#3a4577] focus:outline-none"
        bind:value
    />
    {#if value}
        <button
            class="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
            on:click={onClear}
        >
            ×
        </button>
    {/if}
</div> 