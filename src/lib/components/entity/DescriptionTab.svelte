<script lang="ts">
    import type { Entity } from '$lib/types';
    import { onMount, onDestroy, afterUpdate } from 'svelte';
    import { fetchEntityDescription, editDescription, type Description } from '$lib/services/descriptionService';
    import { authStore } from '$lib/services/authStore';
    import { browser } from '$app/environment';

    export let entity: Entity;

    let description: Description | null = null;
    let isLoading = true;
    let error: string | null = null;
    let isEditing = false;
    let isSaving = false;
    let editor: any = null;
    let viewer: any = null;
    let editorContainer: HTMLDivElement;
    let viewerContainer: HTMLDivElement;
    let Editor: any;
    let isEditorLoaded = false;

    // Load editor dynamically only in browser
    async function loadEditor() {
        if (browser && !isEditorLoaded) {
            try {
                const module = await import('@toast-ui/editor');
                Editor = module.default;
                await import('@toast-ui/editor/dist/toastui-editor.css');
                await import('@toast-ui/editor/dist/theme/toastui-editor-dark.css');
                isEditorLoaded = true;
                // Initialize viewer after editor is loaded if we have a description
                if (description && !isEditing) {
                    initViewer();
                }
            } catch (err) {
                console.error('Error loading editor:', err);
                error = err instanceof Error ? err.message : 'Failed to load editor';
            }
        }
    }

    function initViewer() {
        if (!isEditorLoaded || !Editor || !viewerContainer || !description) {
            return;
        }

        try {
            if (viewer) {
                viewer.destroy();
            }
            viewer = Editor.factory({
                el: viewerContainer,
                viewer: true,
                theme: 'dark',
                initialValue: description.description || ''
            });
        } catch (err) {
            console.error('Error initializing viewer:', err);
            error = err instanceof Error ? err.message : 'Failed to initialize viewer';
        }
    }

    onMount(loadEditor);

    // Re-initialize viewer when component updates and we have a description
    afterUpdate(() => {
        if (!isEditing && description && isEditorLoaded) {
            initViewer();
        }
    });

    async function loadDescription() {
        isLoading = true;
        error = null;

        try {
            description = await fetchEntityDescription(entity.id);
            // Initialize viewer after description is loaded if editor is ready
            if (!isEditing && isEditorLoaded) {
                initViewer();
            }
        } catch (err) {
            console.error('Error loading description:', err);
            error = err instanceof Error ? err.message : 'Failed to load description';
        } finally {
            isLoading = false;
        }
    }

    async function handleEdit() {
        if (!$authStore.isAuthenticated || !$authStore.user) {
            error = 'You must be logged in to edit descriptions';
            return;
        }

        isEditing = true;

        // Cleanup viewer before initializing editor
        if (viewer) {
            viewer.destroy();
            viewer = null;
        }

        // Initialize editor after the container is mounted
        setTimeout(async () => {
            if (editorContainer && Editor) {
                try {
                    editor = new Editor({
                        el: editorContainer,
                        height: '400px',
                        initialValue: description?.description || '',
                        previewStyle: 'vertical',
                        theme: 'dark',
                        toolbarItems: [
                            ['heading', 'bold', 'italic', 'strike'],
                            ['hr', 'quote'],
                            ['ul', 'ol', 'task', 'indent', 'outdent'],
                            ['table', 'link'],
                            ['code', 'codeblock'],
                            ['scrollSync']
                        ]
                    });
                } catch (err) {
                    console.error('Error initializing editor:', err);
                    error = err instanceof Error ? err.message : 'Failed to initialize editor';
                    isEditing = false;
                }
            }
        }, 0);
    }

    async function handleSave() {
        if (!editor) return;

        const content = editor.getMarkdown().trim();
        if (!content) {
            error = 'Description cannot be empty';
            return;
        }

        // Check if content has actually changed
        if (content === description?.description?.trim()) {
            isEditing = false;
            if (editor) {
                editor.destroy();
                editor = null;
            }
            initViewer();
            return;
        }

        if (!$authStore.user?.global_name) {
            error = 'User data is not available';
            return;
        }

        isSaving = true;
        error = null;

        try {
            description = await editDescription(entity.id, content, $authStore.user.global_name);
            isEditing = false;
            if (editor) {
                editor.destroy();
                editor = null;
            }
            initViewer();
        } catch (err) {
            console.error('Error saving description:', err);
            error = err instanceof Error ? err.message : 'Failed to save description';
        } finally {
            isSaving = false;
        }
    }

    function handleCancel() {
        isEditing = false;
        error = null;
        if (editor) {
            editor.destroy();
            editor = null;
        }
        // Reinitialize viewer after canceling
        initViewer();
    }

    onDestroy(() => {
        if (editor) {
            editor.destroy();
            editor = null;
        }
        if (viewer) {
            viewer.destroy();
            viewer = null;
        }
    });

    $: if (entity?.id) {
        loadDescription();
    }
</script>

<div class="prose prose-invert max-w-none">
    {#if isLoading}
        <div class="flex items-center space-x-2 text-gray-400">
            <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
            <span>Loading description...</span>
        </div>
    {:else if error}
        <p class="text-red-400">{error}</p>
    {:else if isEditing}
        <div class="space-y-4">
            <div bind:this={editorContainer} class="min-h-[400px] overflow-hidden rounded bg-[#1a1f35]"></div>
            <div class="flex space-x-2">
                <button
                    class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    on:click={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                    class="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                    on:click={handleCancel}
                    disabled={isSaving}
                >
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <div class="space-y-4">
            {#if description}
                <div bind:this={viewerContainer} class="min-h-[200px] overflow-hidden rounded"></div>
                <div class="mt-6 text-sm text-gray-500">
                    <p>Last edited by: {description.lastEditedBy}</p>
                    <p>Last updated: {new Date(description.createdAt).toLocaleString()}</p>
                    {#if description.contributors?.length}
                        <p>Contributors: {description.contributors.join(', ')}</p>
                    {/if}
                </div>
            {:else}
                <p class="text-gray-400">&lt;&lt; No description for this entity has been found &gt;&gt;</p>
            {/if}
            <button class="action-button" on:click={handleEdit}>
                {description ? 'Edit' : 'Add Description'}
            </button>
        </div>
    {/if}
</div>
