<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  export let fallback: string = '/';
  
  let isAdmin = false;
  let loading = true;
  
  onMount(async () => {
    // Check if user is admin by looking at the page data
    if ($page.data?.user?.role === 'admin') {
      isAdmin = true;
    }
    loading = false;
  });
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <div class="text-gray-600">Loading...</div>
  </div>
{:else if isAdmin}
  <slot />
{:else}
  <div class="flex items-center justify-center p-8">
    <div class="text-center">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
      <p class="text-gray-600 mb-4">You don't have permission to access this page.</p>
      <a href={fallback} class="text-blue-500 hover:text-blue-700 underline">
        Go back
      </a>
    </div>
  </div>
{/if}
