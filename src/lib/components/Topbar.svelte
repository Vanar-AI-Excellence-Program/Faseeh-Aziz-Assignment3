<script lang="ts">
  import { page } from '$app/stores';
  import { fly, scale } from 'svelte/transition';

  const { pageTitle, onMenuToggle } = $props<{
    pageTitle: string;
    onMenuToggle: () => void;
  }>();

  let searchQuery = $state('');
  let showUserMenu = $state(false);
  let showNotifications = $state(false);

  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
  }

  function toggleNotifications() {
    showNotifications = !showNotifications;
  }

  function closeDropdowns() {
    showUserMenu = false;
    showNotifications = false;
  }

  // Close dropdowns when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu') && !target.closest('.notifications-menu')) {
      closeDropdowns();
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
  <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
    <!-- Left section -->
    <div class="flex items-center gap-4">
      <!-- Mobile menu button -->
      <button
        onclick={onMenuToggle}
        class="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800"
        aria-label="Toggle mobile menu"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Page title -->
      <div class="hidden sm:block">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
      </div>
    </div>

    <!-- Center section - Search -->
    <div class="flex-1 max-w-lg mx-4 hidden md:block">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search..."
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
        />
      </div>
    </div>

    <!-- Right section -->
    <div class="flex items-center gap-3">
      <!-- Notifications -->
      <div class="relative">
        <button
          onclick={toggleNotifications}
          class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800 relative"
          aria-label="Notifications"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z M15 7h5l-5 5V7z M9 7h5l-5 5V7z M3 7h5l-5 5V7z" />
          </svg>
          <!-- Notification badge -->
          <span class="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
        </button>

        <!-- Notifications dropdown -->
        {#if showNotifications}
          <div 
            class="notifications-menu absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50"
            transition:fly={{ y: -10, duration: 200 }}
          >
            <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <!-- Sample notifications -->
              <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900 dark:text-white">New user registered</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">john.doe@example.com just joined the platform</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">2 minutes ago</p>
                  </div>
                </div>
              </div>
              
              <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900 dark:text-white">System update completed</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">All services are running smoothly</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
              <a href="/notifications" class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                View all notifications
              </a>
            </div>
          </div>
        {/if}
      </div>

      <!-- User menu -->
      <div class="relative">
        <button
          onclick={toggleUserMenu}
          class="flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800"
          aria-label="User menu"
        >
          <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <span class="text-sm font-semibold text-white">
              {($page.data.user?.name || $page.data.viewer?.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <span class="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">
            {($page.data.user?.name || $page.data.viewer?.name) || 'User'}
          </span>
          <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- User dropdown -->
        {#if showUserMenu}
          <div 
            class="user-menu absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50"
            transition:fly={{ y: -10, duration: 200 }}
          >
            <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {($page.data.user?.name || $page.data.viewer?.name) || 'User'}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {($page.data.user?.email || $page.data.viewer?.email) || 'user@example.com'}
              </p>
            </div>
            
            <div class="py-1">
              <a href="/user" class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your Profile
              </a>
              
              <a href="/settings" class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Settings
              </a>
            </div>
            
            <div class="border-t border-gray-200 dark:border-slate-700 py-1">
              <a href="/logout" class="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </a>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>
