<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  
  export let message: string = '';
  export let type: 'success' | 'error' | 'info' = 'info';
  export let duration: number = 3000;
  export let show: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let timeoutId: number | null = null;
  
  $: if (show && message) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      show = false;
      dispatch('close');
    }, duration);
  }
  
  onMount(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });
  
  function closeToast() {
    show = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    dispatch('close');
  }
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };
  
  const colors = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    info: 'bg-blue-500 dark:bg-blue-600'
  };
</script>

{#if show}
  <div 
    class="fixed top-4 right-4 z-50 max-w-sm"
    transition:fly={{ y: -50, duration: 300 }}
  >
    <div class="flex items-center gap-3 p-4 rounded-lg shadow-lg text-white {colors[type]}">
      <span class="text-lg">{icons[type]}</span>
      <p class="flex-1 text-sm font-medium">{message}</p>
      <button
        on:click={closeToast}
        class="text-white/80 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  </div>
{/if}
