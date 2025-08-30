<script lang="ts">
  const { children, showLeftPanel = true } = $props<{ 
    children: any; 
    showLeftPanel?: boolean; 
  }>();
</script>

<!-- Professional Header -->
<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3 group" aria-label="AuthenBot Home">
        <div class="w-9 h-9 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
          <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="w-5 h-5 object-contain" />
        </div>
        <span class="text-xl font-semibold text-slate-900 dark:text-white">
          AuthenBot
        </span>
      </a>

      <!-- CTA Button -->
      <a 
        href="/login"
        class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200"
        aria-label="Sign in to AuthenBot"
      >
        Sign In
      </a>
    </div>
  </div>
</header>

<!-- Main Auth Section -->
<section class="min-h-screen flex items-center justify-center px-4 pt-20 pb-8">
  <!-- Background -->
  <div class="absolute inset-0 -z-10">
    <div class="absolute inset-0 bg-slate-50 dark:bg-slate-900"></div>
    <!-- Subtle pattern overlay -->
    <div class="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style="background-image: radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0); background-size: 24px 24px;"></div>
  </div>
  
  <div class="w-full max-w-6xl mx-auto">
    <div class="grid lg:grid-cols-2 gap-0 lg:gap-16 items-center">
      
      <!-- Left Panel: Brand & Tagline (Desktop Only) -->
      {#if showLeftPanel}
        <div class="hidden lg:block text-center lg:text-left">
          <div class="max-w-md mx-auto lg:mx-0">
            <!-- Logo -->
            <div class="w-20 h-20 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto lg:mx-0 mb-8">
              <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="w-12 h-12 object-contain" />
            </div>
            
            <!-- Tagline -->
            <h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Secure authentication for modern teams
            </h1>
            
            <p class="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Join thousands of teams using AuthenBot for enterprise-grade authentication, 
              user management, and security compliance.
            </p>
            
            <!-- Social proof -->
            <div class="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
              <p class="text-sm text-slate-500 dark:text-slate-500 mb-3">Trusted by teams at</p>
              <div class="flex items-center justify-center lg:justify-start gap-6 opacity-60">
                <div class="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div class="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div class="w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Right Panel: Auth Forms -->
      <div class="w-full max-w-md mx-auto {showLeftPanel ? '' : 'lg:col-span-2 lg:max-w-lg'}">
        <!-- Mobile Logo (Mobile/Tablet Only) -->
        <div class="lg:hidden text-center mb-8">
          <div class="w-16 h-16 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="w-10 h-10 object-contain" />
          </div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">AuthenBot</h2>
        </div>

        <!-- Form Container -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8">
          {@render children?.()}
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* Smooth transitions */
  * {
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>
