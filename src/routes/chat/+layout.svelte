<script lang="ts">
  import "../../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { page } from "$app/stores";
  import { handleLogout } from "$lib/auth/logout";
  import { browser } from '$app/environment';
  import { fly, fade } from 'svelte/transition';

  // Svelte 5: children passed via $props()
  const { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{ -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    html, body { overscroll-behavior: none; }
  </style>
</svelte:head>

<div data-theme="chat" class="min-h-svh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
  <!-- Chat-specific header with minimal navigation -->
  <header class="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
      <!-- Brand -->
      <a href="/" class="flex items-center gap-2 font-semibold">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="w-5 h-5 object-contain" />
        </div>
        <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AuthenBot</span>
      </a>

      <!-- Navigation -->
      <nav class="flex items-center gap-2 md:gap-4">
        {#if $page.data.user || $page.data.viewer}
          <a href={($page.data.user?.role || $page.data.viewer?.role) === 'admin' ? '/dashboard' : '/user'} class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Dashboard</a>
          <a href="/documents" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Documents</a>
          <a href="/settings" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Settings</a>
          <button 
            onclick={handleLogout}
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
          >
            Logout
          </button>
        {:else}
          <a href="/login" class="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">Login</a>
          <a href="/login?signup=1" class="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200">Register</a>
        {/if}
      </nav>
    </div>
  </header>

  <!-- Main content - full screen for chat -->
  <main class="w-full h-[calc(100vh-4rem)]">
    {@render children?.()}
  </main>
</div>

<style>
  /* Ensure full height for chat interface */
  main {
    height: calc(100vh - 4rem); /* Subtract header height */
    overflow: hidden;
  }
</style>
