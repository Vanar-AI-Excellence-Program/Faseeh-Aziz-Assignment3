<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { page } from "$app/stores";
  import { handleLogout } from "$lib/auth/logout";
  import { browser } from '$app/environment';
  import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
  import { fly, fade } from 'svelte/transition';

  // Svelte 5: children passed via $props()
  const { children } = $props();

  // Global theme for this layout (you can change to "dashboard" on child layouts)
  const theme = "marketing";

  // Loading state to prevent old UI flash
  let isLoading = false;
  let sidebarOpen = false;
  
  // Set loading to true briefly when navigating to prevent old UI flash
  $effect(() => {
    if (browser) {
      isLoading = true;
      // Use requestAnimationFrame to ensure the loading state is shown
      requestAnimationFrame(() => {
        setTimeout(() => {
          isLoading = false;
        }, 50);
      });
    }
  });

  // Listen for page navigation to show loading state
  $effect(() => {
    if (browser && $page.url.pathname) {
      isLoading = true;
      requestAnimationFrame(() => {
        setTimeout(() => {
          isLoading = false;
        }, 50);
      });
    }
  });

  // Check if current page is a post-login page
  const isPostLoginPage = $derived(browser && ['/dashboard', '/user', '/chat', '/settings', '/admin/users'].includes($page.url.pathname));

  // Role-based redirect logic (fallback for edge cases)
  $effect(() => {
    if (browser && isPostLoginPage) {
      const userData = $page.data.user || $page.data.viewer;
      if (userData) {
        const userRole = userData.role;
        const currentPath = $page.url.pathname;
        
        // Only handle edge cases where server-side redirect might have failed
        // Regular users should not be on dashboard (server handles this)
        if (userRole === 'user' && currentPath === '/dashboard') {
          window.location.href = '/user';
        }
      }
    }
  });

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{ -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    html, body { overscroll-behavior: none; }
  </style>
</svelte:head>

<div data-theme={theme} class="no-flash {isLoading ? '' : 'loaded'} {$page.url.pathname === '/' ? 'min-h-svh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white overflow-x-hidden' : 'min-h-svh bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white overflow-x-hidden'}">
  {#if isLoading}
    <div class="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  {/if}
  
  {#if $page.url.pathname !== "/" && !isPostLoginPage}
    <!-- Header (hidden on home and post-login pages) -->
    <header class="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <!-- Brand -->
        <a href="/" class="flex items-center gap-2 font-semibold">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="w-5 h-5 object-contain" />
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AuthenBot</span>
        </a>

        <!-- Nav -->
        <nav class="flex items-center gap-2 md:gap-4">
          <DarkModeToggle />
          {#if $page.data.viewer}
            <a 
              href="/post-auth" 
              class="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Dashboard
            </a>
            <a href="/chat" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Chat</a>
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
  {/if}

  <!-- Main content -->
  <main class={$page.url.pathname === '/' ? 'w-full px-0 py-0' : (isPostLoginPage ? 'w-full px-0 py-0' : 'mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:px-8')}>
    {#if isPostLoginPage && ($page.data.user || $page.data.viewer)}
      <!-- Post-login layout with modern sidebar -->
      <div class="post-login-container">
        <div class="post-login-card">
          <!-- Mobile sidebar toggle -->
          <button
            onclick={toggleSidebar}
            class="mobile-menu-button lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Modern Left Sidebar -->
          <div class="sidebar {sidebarOpen ? 'sidebar-open' : ''}" transition:fly={{ x: -300, duration: 300 }}>
            <div class="sidebar-header">
              <div class="profile-section">
                <div class="profile-avatar">
                  <div class="avatar-ring">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 1 4-4h4"/>
                      <circle cx="12" cy="7" r="4"/>
                      <path d="M12 12a4 4 0 0 0-4 4v1"/>
                    </svg>
                  </div>
                </div>
                <div class="profile-info">
                  <h3 class="welcome-text">Welcome back!</h3>
                  <p class="user-name">{$page.data.user?.name || $page.data.viewer?.name || 'User'}</p>
                </div>
              </div>
            </div>
            
            <nav class="sidebar-nav">
              <div class="nav-section">
                <h4 class="nav-section-title">Main</h4>
                <a href={($page.data.user?.role || $page.data.viewer?.role) === 'admin' ? '/dashboard' : '/user'} class="nav-item" class:active={$page.url.pathname === '/dashboard' || $page.url.pathname === '/user'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  <span>Dashboard</span>
                </a>
                
                <a href="/chat" class="nav-item" class:active={$page.url.pathname === '/chat'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>AI Chat</span>
                </a>
              </div>

              {#if ($page.data.user?.role || $page.data.viewer?.role) === 'admin'}
                <div class="nav-section">
                  <h4 class="nav-section-title">Administration</h4>
                  <a href="/admin" class="nav-item" class:active={$page.url.pathname === '/admin'}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    <span>Dashboard</span>
                  </a>
                  <a href="/admin/users" class="nav-item" class:active={$page.url.pathname === '/admin/users'}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Manage Users</span>
                  </a>
                </div>
              {/if}

              <div class="nav-section">
                <h4 class="nav-section-title">Account</h4>
                <a href="/settings" class="nav-item" class:active={$page.url.pathname === '/settings'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span>Profile</span>
                </a>
                
                <button onclick={handleLogout} class="nav-item logout">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            </nav>
          </div>

          <!-- Right Content Area -->
          <div class="content">
            <!-- Header with search and profile -->
            <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <div class="flex h-16 items-center justify-between px-6">
                <!-- Left section -->
                <div class="flex items-center gap-4">
                  <!-- Page title -->
                  <div>
                    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                      {#if $page.url.pathname === '/dashboard'}Dashboard
                      {:else if $page.url.pathname === '/admin'}Admin Dashboard
                      {:else if $page.url.pathname === '/admin/users'}User Management
                      {:else if $page.url.pathname === '/chat'}AI Chat
                      {:else if $page.url.pathname === '/settings'}Settings
                      {:else if $page.url.pathname === '/user'}Profile
                      {:else}Dashboard{/if}
                    </h1>
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
                      placeholder="Search..."
                      class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    />
                  </div>
                </div>

                <!-- Right section -->
                <div class="flex items-center gap-3">
                  <!-- Notifications -->
                  <div class="relative">
                    <button
                      class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800 relative"
                      aria-label="Notifications"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z M15 7h5l-5 5V7z M9 7h5l-5 5V7z M3 7h5l-5 5V7z" />
                      </svg>
                      <!-- Notification badge -->
                      <span class="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                    </button>
                  </div>

                  <!-- User menu -->
                  <div class="relative">
                    <button
                      class="flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800"
                      aria-label="User menu"
                    >
                      <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
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
                  </div>
                </div>
              </div>
            </header>

            <!-- Main content -->
            <div class="p-6" transition:fade={{ duration: 200 }}>
              {@render children?.()}
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Regular content for non-post-login pages -->
      <div transition:fade={{ duration: 200 }}>
        {@render children?.()}
      </div>
    {/if}
  </main>
</div>

<style>
  /* Post-login layout styles */
  .post-login-container {
    min-height: 100vh;
    height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: stretch;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .dark .post-login-container {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }

  .post-login-card {
    background: white;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    width: 100%;
    max-width: none;
    height: 100vh;
    display: flex;
    margin: 0;
  }

  .dark .post-login-card {
    background: #0f172a;
  }

  /* Modern Left Sidebar */
  .sidebar {
    background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
    width: 280px;
    padding: 0;
    color: white;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    z-index: 40;
    position: relative;
    overflow: hidden;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  }

  .sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
    pointer-events: none;
  }

  .sidebar-header {
    padding: 2rem 1.5rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
  }

  .profile-section {
    text-align: center;
  }

  .profile-avatar {
    margin-bottom: 1rem;
  }

  .avatar-ring {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
    border: 3px solid rgba(255, 255, 255, 0.2);
  }

  .profile-info {
    color: white;
  }

  .welcome-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 0.25rem 0;
  }

  .user-name {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: white;
  }

  .sidebar-nav {
    flex: 1;
    padding: 1.5rem 1rem;
    position: relative;
    z-index: 1;
  }

  .nav-section {
    margin-bottom: 2rem;
  }

  .nav-section-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 0.75rem 0;
    padding-left: 0.75rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    position: relative;
    overflow: hidden;
  }

  .nav-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .nav-item:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }

  .nav-item:hover::before {
    opacity: 1;
  }

  .nav-item.active {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    transform: translateX(4px);
  }

  .nav-item.active::before {
    opacity: 0;
  }

  .nav-item.logout {
    margin-top: auto;
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    font-weight: 600;
    position: relative;
  }

  .nav-item.logout:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fecaca;
    transform: translateX(4px);
  }

  .nav-item.logout::before {
    background: rgba(239, 68, 68, 0.1);
  }

  /* Right Content */
  .content {
    flex: 1;
    padding: 0;
    background: white;
    overflow-y: auto;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .dark .content {
    background: #0f172a;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      z-index: 50;
    }
    
    .sidebar.sidebar-open {
      transform: translateX(0);
    }
    
    .post-login-card {
      flex-direction: column;
    }

    .content {
      margin-left: 0;
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 260px;
    }
    
    .sidebar-header {
      padding: 1.5rem 1rem 1rem;
    }
    
    .avatar-ring {
      width: 56px;
      height: 56px;
    }
    
    .user-name {
      font-size: 1rem;
    }

    .content {
      padding: 0;
    }
  }

  /* Enhanced sidebar styling */
  .sidebar {
    background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
    width: 280px;
    padding: 0;
    color: white;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    z-index: 40;
    position: relative;
    overflow: hidden;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  }

  .sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
    pointer-events: none;
  }

  /* Content area improvements */
  .content header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  }

  .dark .content header {
    background: rgba(15, 23, 42, 0.95);
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  }

  /* Smooth transitions */
  .sidebar,
  .content {
    transition: all 0.3s ease;
  }

  /* Mobile menu button improvements */
  .mobile-menu-button {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 60;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border: none;
    border-radius: 12px;
    padding: 0.75rem;
    color: white;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;
  }

  .mobile-menu-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
  }
</style>
