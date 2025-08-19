<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { page } from "$app/stores";
  import { handleLogout } from "$lib/auth/logout";

  // Svelte 5: children passed via $props()
  const { children } = $props();

  // Global theme for this layout (you can change to "dashboard" on child layouts)
  const theme = "marketing";
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div data-theme={theme} class="min-h-dvh bg-gradient-to-b from-indigo-50 to-white text-gray-900">
  {#if $page.url.pathname !== "/"}
    <!-- Minimal header with Back to Home -->
    <header class="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <div class="flex items-center gap-2">
          <img src={favicon} alt="App" class="size-5" />
          <span class="sr-only">App</span>
        </div>
        <a href="/" class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm cursor-pointer"
           style="background:#00ABE4;">
          Back to Home
        </a>
      </div>
    </header>
  {/if}

  <!-- Main content -->
  <main class={$page.url.pathname === '/' ? 'w-full px-0 py-0' : 'mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:px-8'}>
    {@render children?.()}
  </main>

  
</div>
