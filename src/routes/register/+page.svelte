<div class="mx-auto mt-16 max-w-sm card">
  <h1 class="mb-1 text-2xl font-semibold">Create your account</h1>
  <p class="mb-6 text-sm text-gray-600">Start by entering your email and a strong password.</p>
  <form method="POST" class="space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-medium">Email</label>
      <input class="input" type="email" name="email" placeholder="you@example.com" required />
    </div>
    <div class="space-y-2">
      <label class="text-sm font-medium">Password</label>
      <input class="input" type="password" name="password" placeholder="At least 8 characters" required />
    </div>
    <button class="btn-primary w-full">Sign up</button>
    <p class="text-center text-sm text-gray-600">Already have an account? <a class="underline" href="/login">Log in</a></p>
  </form>
</div>