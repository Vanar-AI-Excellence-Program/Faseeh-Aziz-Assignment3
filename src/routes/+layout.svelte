<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-indigo-50 to-white text-gray-900">
  <header class="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
    <div class="container flex items-center justify-between py-3">
      <a href="/" class="flex items-center gap-2 font-semibold">
        <img src={favicon} alt="" class="size-5" />
        <span class="text-indigo-700">Auth App</span>
      </a>
      <nav class="flex items-center gap-4">
        <a class="nav-link" href="/">Home</a>
        <a class="nav-link" href="/login">Login</a>
        <a class="nav-link" href="/register">Register</a>
        <a class="nav-link" href="/dashboard">Dashboard</a>
      </nav>
    </div>
  </header>

  <main class="container py-10">
    {@render children?.()}
  </main>

  <footer class="border-t bg-white/70 py-6 text-center text-sm text-gray-500">
    <div class="container">Built with SvelteKit, TailwindCSS, Auth.js, Drizzle</div>
  </footer>
</div>
