<script>
  import { onMount } from 'svelte';
  export let url;
  onMount(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const dest = params.get('dest') || '/user';
      window.location.href = dest;
    }, 1500);
    return () => clearTimeout(timer);
  });
</script>

<section class="mx-auto flex max-w-5xl justify-center px-4 py-16 md:px-6 lg:px-8 lg:py-20">
  <div class="w-full max-w-md text-center">
    <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Verification Successful</h1>
    <p class="mt-2 text-gray-600">Redirecting you to your dashboard…</p>
  </div>
</section>


