<script>
  import Button from "$lib/components/Button.svelte";

  let email = "";
  const submit = (event) => {
    event.preventDefault();
    // Keep it simple: navigate to register (email can be filled again there)
    window.location.href = "/register";
  };
  </script>

<section class="relative">
  <div class="grid w-full items-center gap-0 md:grid-cols-2">
    <!-- Illustration (left) -->
    <div class="order-2 md:order-1 relative h-72 sm:h-80 md:h-[420px] lg:h-[520px] xl:h-[600px] rounded-2xl overflow-hidden shadow-lg">
      <img
        src="/images/authenticatio_illustration.jpg"
        alt="Authentication illustration"
        class="absolute inset-0 size-full object-cover"
      />
    </div>

    <!-- Copy + CTA (right) -->
    <div class="order-1 space-y-6 px-6 py-12 md:order-2 md:px-12 lg:px-20">
      <h1 class="text-pretty text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
        Where Work Happens
      </h1>
      <p class="max-w-prose text-lg leading-7 text-gray-600">
        Kick off projects, collaborate with your team, and ship faster. Email + password auth with
        database sessions, powered by Drizzle ORM.
      </p>

      <form class="flex w-full max-w-md items-center gap-3" on:submit={submit}>
        <input
          class="flex-1 rounded-xl border border-gray-300/80 bg-white/90 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
          type="email"
          placeholder="Email address"
          bind:value={email}
          required
        />
        <Button variant="primary" href="/register">Get Started</Button>
      </form>

      <p class="text-sm text-gray-600">
        Already have an account?
        <a class="underline decoration-indigo-400 underline-offset-4 hover:decoration-2" href="/login">Sign in</a>.
      </p>
    </div>
  </div>
</section>
