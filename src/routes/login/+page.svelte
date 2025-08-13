<section class="mx-auto flex max-w-5xl justify-center px-4 py-16 md:px-6 lg:px-8 lg:py-20">
  <div class="w-full max-w-md">
    <h1 class="text-center text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Welcome back</h1>
    <p class="mt-2 text-center text-gray-600">Sign in to continue to your dashboard.</p>

    <div class="card mt-6 p-6">
      <h2 class="mb-2 text-xl font-semibold">Sign in</h2>
      <p class="mb-6 text-sm text-gray-600">Use your email and password.</p>
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
        <div class="flex justify-center">
          <button class="btn btn-primary rounded-full px-4 py-2 text-sm">Sign in</button>
        </div>
        <p class="text-center text-sm text-gray-600">No account? <a class="underline" href="/register">Create one</a></p>
      </form>

      <div class="my-4 flex items-center gap-3 text-xs text-gray-500">
        <div class="h-px flex-1 bg-gray-200"></div>
        <span>or</span>
        <div class="h-px flex-1 bg-gray-200"></div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <form method="POST" action="/auth/signin/google?callbackUrl=/post-auth" class="contents">
          <button class="btn-outline rounded-xl px-4 py-2 text-sm w-full">Continue with Google</button>
        </form>
        <form method="POST" action="/auth/signin/github?callbackUrl=/post-auth" class="contents">
          <button class="btn-outline rounded-xl px-4 py-2 text-sm w-full">Continue with GitHub</button>
        </form>
      </div>
    </div>
  </div>
</section>