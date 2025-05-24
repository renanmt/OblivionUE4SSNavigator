<script lang="ts">
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import EntityView from '$lib/components/EntityView.svelte';
  import { onMount } from 'svelte';
  
  let entityId = $page.params.id;
  
  // Update entityId when page params change
  $: {
    entityId = $page.params.id;
  }
  
  // Force component update after a navigation
  afterNavigate(() => {
    entityId = $page.params.id;
  });
</script>

<svelte:head>
  <title>Entity Details - Oblivion UE4SS Navigator</title>
</svelte:head>

<div class="mb-8">
  <div class="flex items-center mb-6">
    <a href="/browse" class="link flex items-center mr-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Browse
    </a>
  </div>
  
  <EntityView entityId={entityId} />
</div> 