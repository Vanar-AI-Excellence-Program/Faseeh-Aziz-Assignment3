<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { page } from "$app/stores";
  import { handleLogout } from "$lib/auth/logout";
  import { browser } from '$app/environment';

  // Svelte 5: children passed via $props()
  const { children } = $props();

  // Global theme for this layout (you can change to "dashboard" on child layouts)
  const theme = "marketing";

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
  {#if $page.url.pathname !== "/" && !isPostLoginPage}
    <!-- Header (hidden on home and post-login pages) -->
    <header class="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
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
  <main class={$page.url.pathname === '/' ? 'w-full px-0 py-0' : (isPostLoginPage ? 'w-full px-0 py-0' : 'mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:px-8')}>
    {#if isPostLoginPage && ($page.data.user || $page.data.viewer)}
      <!-- Post-login layout with sidebar -->
      <div class="post-login-container">
        <div class="post-login-card">
          <!-- Left Blue Sidebar -->
          <div class="sidebar">
            <div class="sidebar-header">
              <div class="profile-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 1 4-4h4"/>
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M12 12a4 4 0 0 0-4 4v1"/>
                </svg>
              </div>
              <h2 class="welcome-text">Welcome, {$page.data.user?.name || $page.data.viewer?.name || 'User'}</h2>
            </div>
            
            <nav class="sidebar-nav">
              <a href={($page.data.user?.role || $page.data.viewer?.role) === 'admin' ? '/dashboard' : '/user'} class="nav-item" class:active={$page.url.pathname === '/dashboard' || $page.url.pathname === '/user'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                Dashboard
              </a>
              {#if ($page.data.user?.role || $page.data.viewer?.role) === 'admin'}
                <a href="/admin/users" class="nav-item" class:active={$page.url.pathname === '/admin/users'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Manage Users
                </a>
              {/if}
              <a href="/chat" class="nav-item" class:active={$page.url.pathname === '/chat'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Chat
              </a>
              <a href="/settings" class="nav-item" class:active={$page.url.pathname === '/settings'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                Profile
              </a>
              <button onclick={handleLogout} class="nav-item logout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log Out
              </button>
            </nav>
          </div>

          <!-- Right Content Area -->
          <div class="content">
            {@render children?.()}
          </div>
        </div>
      </div>
    {:else}
      <!-- Regular content for non-post-login pages -->
      {@render children?.()}
    {/if}
  </main>
</div>

<style>
  /* Post-login layout styles */
  .post-login-container {
    min-height: 100vh;
    height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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

  /* Left Sidebar */
  .sidebar {
    background: linear-gradient(135deg, #00ABE4 0%, #34c5f1 100%);
    width: 300px;
    padding: 2rem;
    color: white;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
  }

  .sidebar-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .profile-icon {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
  }

  .welcome-text {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    color: white;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 1rem;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .nav-item.active {
    background: rgba(255, 255, 255, 0.2);
    font-weight: 600;
  }

  .nav-item.logout {
    margin-top: auto;
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
    border: 2px solid #ff6b6b;
    font-weight: 600;
    position: relative;
  }

  .nav-item.logout:hover {
    background: rgba(255, 107, 107, 0.2);
    border-color: #ff5252;
    color: #ff5252;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
  }

  /* Right Content */
  .content {
    flex: 1;
    padding: 0;
    background: white;
    overflow-y: auto;
    height: 100vh;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .post-login-card {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      padding: 1.5rem;
      height: auto;
    }
    
    .sidebar-nav {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .nav-item.logout {
      margin-top: 0;
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      padding: 1rem;
    }
  }
</style>
