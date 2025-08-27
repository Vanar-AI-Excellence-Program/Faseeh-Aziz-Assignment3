<script lang="ts">
  import { page } from '$app/stores';
  import { fly } from 'svelte/transition';
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';

  const { pageTitle, children } = $props<{
    pageTitle: string;
    children: any;
  }>();

  let sidebarOpen = $state(false);

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  // Close sidebar on mobile when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.mobile-menu-button')) {
      sidebarOpen = false;
    }
  }

  // Close sidebar on route change
  $effect(() => {
    if ($page.url.pathname && sidebarOpen) {
      sidebarOpen = false;
    }
  });
</script>

<svelte:window onclick={handleClickOutside} />

<div class="min-h-screen bg-gray-50 dark:bg-slate-900">
  <!-- Sidebar -->
  <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
  
  <!-- Main content -->
  <div class="lg:pl-64">
    <!-- Topbar -->
    <Topbar pageTitle={pageTitle} onMenuToggle={toggleSidebar} />
    
    <!-- Page content -->
    <main class="p-6">
      <div transition:fly={{ y: 20, duration: 300 }}>
        {@render children?.()}
      </div>
    </main>
  </div>
</div>
