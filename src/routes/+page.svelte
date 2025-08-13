<section class="grid gap-10 md:grid-cols-2 md:items-center">
  <div class="space-y-6">
    <h1 class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
      Secure Authentication Starter
    </h1>
    <p class="text-lg text-gray-700">
      A production-ready SvelteKit auth template using database sessions, Drizzle ORM, and TailwindCSS.
    </p>
    <div class="flex flex-wrap gap-3">
      <a href="/register" class="btn-primary">Get Started</a>
      <a href="/login" class="btn-outline">Sign in</a>
      <a href="/dashboard" class="btn-outline">Dashboard</a>
    </div>
    <ul class="mt-6 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
      <li class="card">• Email/password with bcrypt</li>
      <li class="card">• Database sessions (no JWT)</li>
      <li class="card">• Drizzle ORM + PostgreSQL</li>
      <li class="card">• TailwindCSS v4 UI</li>
    </ul>
  </div>
  <div class="card">
    <h2 class="mb-4 text-lg font-semibold">Quick Links</h2>
    <ol class="space-y-2 text-sm">
      <li><a class="underline" href="/auth/session">View session JSON</a></li>
      <li><a class="underline" href="/login">Sign in</a></li>
      <li><a class="underline" href="/register">Create account</a></li>
      <li><a class="underline" href="/dashboard">Go to dashboard</a></li>
    </ol>
  </div>
</section>
