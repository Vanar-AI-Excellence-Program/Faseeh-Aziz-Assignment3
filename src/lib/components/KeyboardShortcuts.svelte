<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  
  export let show: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  function closeModal() {
    dispatch('close');
  }
  
  const shortcuts = [
    { key: 'Ctrl/Cmd + Enter', description: 'Send message' },
    { key: 'Ctrl/Cmd + N', description: 'New chat' },
    { key: 'Ctrl/Cmd + K', description: 'Focus search' },
    { key: 'Ctrl/Cmd + ?', description: 'Show keyboard shortcuts' },
    { key: 'Escape', description: 'Cancel editing' },
    { key: '← →', description: 'Navigate branches' }
  ];
</script>

{#if show}
  <div 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
    on:click={closeModal}
  >
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
      transition:fly={{ y: -20, duration: 200 }}
      on:click|stopPropagation
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            on:click={closeModal}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div class="space-y-3">
          {#each shortcuts as shortcut}
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </span>
              <kbd class="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border">
                {shortcut.key}
              </kbd>
            </div>
          {/each}
        </div>
        
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
            Tip: Hover over messages to see action buttons
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
