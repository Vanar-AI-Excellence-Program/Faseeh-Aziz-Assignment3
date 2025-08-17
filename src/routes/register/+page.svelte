<script lang="ts">
  import { page } from '$app/stores';
</script>

<section class="mx-auto flex max-w-5xl justify-center px-4 py-16 md:px-6 lg:px-8 lg:py-20">
  <div class="w-full max-w-md">
    <h1 class="text-center text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Create your account</h1>
    <p class="mt-2 text-center text-gray-600">Start by entering your email and a strong password.</p>

    <div class="card mt-6 p-6">
      <h2 class="mb-2 text-xl font-semibold">Sign up</h2>
      <p class="mb-6 text-sm text-gray-600">It only takes a minute.</p>
      <form method="POST" class="space-y-4">
        <div class="grid gap-3 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium" id="firstNameLabel" for="firstName">First name</label>
            <input class="input" id="firstName" aria-labelledby="firstNameLabel" type="text" name="firstName" placeholder="John" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium" id="lastNameLabel" for="lastName">Last name</label>
            <input class="input" id="lastName" aria-labelledby="lastNameLabel" type="text" name="lastName" placeholder="Doe" />
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium" id="emailLabel" for="email">Email</label>
          <input class="input" id="email" aria-labelledby="emailLabel" type="email" name="email" placeholder="you@example.com" required />
          {#if $page.form?.message === 'Email already in use.'}
            <p class="text-sm text-red-600">email already in use !</p>
          {/if}
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium" id="passwordLabel" for="password">Password</label>
          <input class="input" id="password" aria-labelledby="passwordLabel" type="password" name="password" placeholder="At least 8 characters" required />
        </div>
        <div class="flex justify-center">
          <button class="btn btn-primary rounded-full px-4 py-2 text-sm">Create account</button>
        </div>
        <p class="text-center text-sm text-gray-600">Already have an account? <a class="underline" href="/login">Log in</a></p>
      </form>
    </div>
  </div>
</section>