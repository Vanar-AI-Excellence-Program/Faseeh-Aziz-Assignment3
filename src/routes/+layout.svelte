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
  <style>
    :root{ -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    html, body { overscroll-behavior: none; }
  </style>
</svelte:head>

<div data-theme={theme} class={$page.url.pathname === '/' ? 'min-h-svh bg-\[#E9F1FA\] text-gray-900 overflow-x-hidden' : 'min-h-svh bg-gradient-to-b from-indigo-50 to-white text-gray-900 overflow-x-hidden'}>
  {#if $page.url.pathname !== "/"}
    <!-- Header (hidden on home) -->
    <header class="sticky top-0 z-40 bg-\[#E9F1FA\]">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <!-- Brand -->
        <a href="/" class="flex items-center gap-2 font-semibold">
          <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="h-5 w-5 object-contain" />
          <span class="text-\[#00ABE4\]">AuthenBot</span>
        </a>

        <!-- Nav -->
        <nav class="flex items-center gap-2 md:gap-4">
          {#if $page.data.viewer}
            <a 
              href="/post-auth" 
              class="btn btn-primary rounded-full px-3 py-1.5 text-sm"
            >
              Dashboard
            </a>
            <a href="/chat" class="nav-link">Chat</a>
            <a href="/settings" class="nav-link">Settings</a>
            <button 
              onclick={handleLogout}
              class="btn-outline rounded-full px-3 py-1.5 text-sm cursor-pointer"
            >
              Logout
            </button>
          {:else}
            <a href="/login" class="inline-flex items-center justify-center rounded-full px-5 py-1.5 text-sm font-semibold text-\[#00ABE4\] bg-white ring-2 ring-\[#00ABE4\] shadow-sm hover:bg-white/95 hover:shadow-md transition relative z-30">Login</a>
            <a href="/login?signup=1" class="inline-flex items-center justify-center rounded-full px-5 py-1.5 text-sm font-semibold text-\[#00ABE4\] bg-white ring-2 ring-\[#00ABE4\] shadow-sm hover:bg-white/95 hover:shadow-md transition relative z-30">Register</a>
          {/if}
        </nav>
      </div>
    </header>
  {/if}

  <!-- Main content -->
  <main class={
    $page.url.pathname === '/' 
      ? 'w-full px-0 py-0' 
      : ($page.url.pathname.startsWith('/login')
          ? 'w-full px-0 py-2'
          : 'mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:px-8')
  }>
    {@render children?.()}
  </main>

  
</div>
