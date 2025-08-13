<div class="mx-auto mt-16 max-w-sm card">
  <h1 class="mb-1 text-2xl font-semibold">Log in</h1>
  <p class="mb-6 text-sm text-gray-600">Welcome back. Enter your credentials to access your account.</p>
  <form method="POST" class="space-y-4">
    <input type="hidden" name="provider" value="credentials" />
    <input type="hidden" name="redirectTo" value="/dashboard" />
    <div class="space-y-2">
      <label class="text-sm font-medium">Email</label>
      <input class="input" type="email" name="email" placeholder="you@example.com" required />
    </div>
    <div class="space-y-2">
      <label class="text-sm font-medium">Password</label>
      <input class="input" type="password" name="password" placeholder="••••••••" required />
    </div>
    <button class="btn-primary w-full">Sign in</button>
    <p class="text-center text-sm text-gray-600">No account? <a class="underline" href="/register">Create one</a></p>
  </form>
</div>