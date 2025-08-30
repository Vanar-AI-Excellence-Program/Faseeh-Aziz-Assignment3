<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let isDark = $state(false);
  let mounted = $state(false);
  
  onMount(() => {
    if (browser) {
      // Check localStorage for saved preference
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        isDark = saved === 'true';
      } else {
        // Check system preference
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      applyTheme();
      mounted = true;
    }
  });
  
  function toggleDarkMode() {
    isDark = !isDark;
    if (browser) {
      localStorage.setItem('darkMode', isDark.toString());
      applyTheme();
    }
  }
  
  function applyTheme() {
    if (browser) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
  
  // Listen for system theme changes
  $effect(() => {
    if (browser && mounted) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (localStorage.getItem('darkMode') === null) {
          isDark = e.matches;
          applyTheme();
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  });
</script>

<button
  onclick={toggleDarkMode}
  class="
    p-2 rounded-xl transition-all duration-200
    bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
    text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
    border border-gray-200 dark:border-gray-600
    hover:shadow-md active:scale-95
  "
  aria-label="Toggle dark mode"
  title="Toggle dark mode"
>
  {#if isDark}
    <!-- Sun icon for dark mode -->
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  {:else}
    <!-- Moon icon for light mode -->
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  {/if}
</button>
