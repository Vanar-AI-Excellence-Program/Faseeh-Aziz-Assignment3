<script lang="ts">
  export let data: { name: string };
  import ChatPopup from '$lib/components/ChatPopup.svelte';
</script>

<div class="mx-auto max-w-3xl">
  <div class="card">
    <h1 class="text-2xl font-semibold">Hello {data.name}</h1>
    <p class="mt-2 text-gray-600">Welcome back.</p>
  </div>
  <div class="card mt-4">
    <a class="nav-link" href="/settings">Go to settings</a>
  </div>
</div>

<ChatPopup title="Assistant" placeholder="Ask about your account..." />

