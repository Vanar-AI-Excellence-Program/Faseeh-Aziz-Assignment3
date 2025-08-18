<script lang="ts">
  import { page } from '$app/stores';
  export let data: { error?: { type: string; message: string; provider: string | null } };
  let formMessage: string | undefined;
  $: formMessage = (/** @type {any} */ ($page))?.form?.message as string | undefined;
</script>

<section class="mx-auto flex max-w-5xl justify-center px-4 py-16 md:px-6 lg:px-8 lg:py-20">
  <div class="w-full max-w-md">
    <h1 class="text-center text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Welcome back</h1>
    <p class="mt-2 text-center text-gray-600">Sign in to continue to your dashboard.</p>

    <!-- Auth Error Message -->
    {#if data.error?.type === 'auth_error'}
      <div class="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Sign In Error</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{data.error.message}</p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Credentials Error Message from server form -->
    {#if formMessage}
      <div class="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
        <div class="text-sm text-red-700">{formMessage}</div>
      </div>
    {/if}

    <div class="card mt-6 p-6">
      <h2 class="mb-2 text-xl font-semibold">Sign in</h2>
      <p class="mb-6 text-sm text-gray-600">Use your email and password.</p>
      <form method="POST" class="space-y-4">
        <input type="hidden" name="provider" value="credentials" />
        <input type="hidden" name="redirectTo" value="/dashboard" />
        <div class="space-y-2">
          <label class="text-sm font-medium" for="loginEmail">Email</label>
          <input class="input" id="loginEmail" type="email" name="email" placeholder="you@example.com" required />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium" for="loginPassword">Password</label>
          <input class="input" id="loginPassword" type="password" name="password" placeholder="••••••••" required />
          <div class="mt-2 text-right text-sm">
            <button type="button" class="underline text-gray-600 hover:text-gray-900" on:click={() => (location.href = '/forgot-password')}>
              Reset password
            </button>
          </div>
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
          <button class="btn-outline rounded-xl px-4 py-2 text-sm w-full">
            Continue with Google
          </button>
        </form>
        <form method="POST" action="/auth/signin/github?callbackUrl=/post-auth" class="contents">
          <button class="btn-outline rounded-xl px-4 py-2 text-sm w-full">
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  </div>
</section>