<script lang="ts">
  import { page } from '$app/stores';
  import { handleLogout } from '$lib/auth/logout';
  import DarkModeToggle from './DarkModeToggle.svelte';
  import { fly, fade } from 'svelte/transition';

  const { isOpen = false, onToggle } = $props<{
    isOpen?: boolean;
    onToggle: () => void;
  }>();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
    },
    {
      name: 'AI Chat',
      href: '/chat',
      icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
    },
    {
      name: 'Profile',
      href: '/user',
      icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    }
  ];

  const currentPath = $derived($page.url.pathname);
</script>

<!-- Mobile backdrop -->
{#if isOpen}
  <div 
    class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden" 
    onclick={onToggle}
    onkeydown={(e) => e.key === 'Enter' && onToggle()}
    role="button"
    tabindex="0"
    aria-label="Close sidebar"
    transition:fade={{ duration: 200 }}
  ></div>
{/if}

<!-- Sidebar -->
<aside 
  class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 {isOpen ? 'translate-x-0' : '-translate-x-full'}"
  transition:fly={{ x: -300, duration: 300 }}
>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <div class="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-slate-700">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span class="text-xl font-bold text-gray-900 dark:text-white">Admin</span>
      </div>
      
      <!-- Mobile close button -->
      <button 
        onclick={onToggle}
        class="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800"
        aria-label="Close sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- User Profile -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
          <span class="text-sm font-semibold text-white">
            {($page.data.user?.name || $page.data.viewer?.name || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {($page.data.user?.name || $page.data.viewer?.name) || 'User'}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {($page.data.user?.role || $page.data.viewer?.role) || 'user'}
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2">
      {#each navigation as item}
        <a
          href={item.href}
          class="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 {currentPath === item.href 
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800'}"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          {item.name}
        </a>
      {/each}
    </nav>

    <!-- Footer -->
    <div class="border-t border-gray-200 dark:border-slate-700 p-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-gray-500 dark:text-gray-400">Theme</span>
        <DarkModeToggle />
      </div>
      
      <button
        onclick={handleLogout}
        class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign out
      </button>
    </div>
  </div>
</aside>
