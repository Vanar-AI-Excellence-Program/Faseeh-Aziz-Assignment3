<script lang="ts">
  import { page } from '$app/stores';
  const token = $page.data.token as string;
  const email = $page.data.email as string;
  $: error = $page.form?.message;
  let newPassword = '';
  let confirmPassword = '';
  $: passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
</script>

<section class="mx-auto flex max-w-5xl justify-center px-4 py-16 md:px-6 lg:px-8 lg:py-20">
  <div class="w-full max-w-md">
    <h1 class="text-center text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Set a new password</h1>
    <p class="mt-2 text-center text-gray-600">Enter and confirm your new password.</p>

    <div class="card mt-6 p-6">
      {#if error}
        <div class="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      {/if}
      <form method="POST" class="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <div class="space-y-2">
          <label class="text-sm font-medium" for="password">New password</label>
          <input class="input" id="password" type="password" name="password" placeholder="At least 8 characters" bind:value={newPassword} required />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium" for="confirm">Confirm password</label>
          <input class="input" id="confirm" type="password" name="confirm" placeholder="Re-enter password" bind:value={confirmPassword} required />
          {#if passwordsMismatch}
            <p class="text-sm text-red-600">Passwords do not match</p>
          {/if}
        </div>
        <div class="flex justify-center">
          <button class="btn btn-primary rounded-full px-4 py-2 text-sm" disabled={passwordsMismatch}>Reset password</button>
        </div>
      </form>
    </div>
  </div>
  </section>


