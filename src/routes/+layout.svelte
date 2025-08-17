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
    <!-- Header (hidden on home) -->
    <header class="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <!-- Brand -->
        <a href="/" class="flex items-center gap-2 font-semibold">
          <img src={favicon} alt="App" class="size-5" />
          <span class="text-indigo-700">Auth App</span>
        </a>

        <!-- Nav -->
        <nav class="flex items-center gap-2 md:gap-4">
          {#if $page.data.viewer}
            {#if ($page.data.viewer as any)?.role === 'admin'}
              <a href="/dashboard" class="nav-link">Dashboard</a>
            {/if}
            <a href="/settings" class="nav-link">Settings</a>
            <button 
              onclick={handleLogout}
              class="btn-outline rounded-full px-3 py-1.5 text-sm cursor-pointer"
            >
              Logout
            </button>
          {:else}
            <a href="/login" class="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer">Login</a>
            <a href="/register" class="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer">Register</a>
          {/if}
        </nav>
      </div>
    </header>
  {/if}

  <!-- Main content -->
  <main class={$page.url.pathname === '/' ? 'w-full px-0 py-0' : 'mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:px-8'}>
    {@render children?.()}
  </main>

  
</div>
