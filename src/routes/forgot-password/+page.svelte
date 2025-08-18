<script lang="ts">
  import { page } from '$app/stores';
  $: step = ($page.form as any)?.step ?? 'request';
  $: email = ($page.form as any)?.email ?? '';
  $: code = ($page.form as any)?.code ?? '';
  $: message = ($page.form as any)?.message ?? null;

  let newPassword = '';
  let confirmPassword = '';
  $: passwordsMismatch = step === 'reset' && confirmPassword.length > 0 && newPassword !== confirmPassword;
</script>

<section class="mx-auto flex max-w-5xl justify-center px-4 py-16 md:px-6 lg:px-8 lg:py-20">
  <div class="w-full max-w-md">
    <h1 class="text-center text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Forgot password</h1>
    <p class="mt-2 text-center text-gray-600">Reset your password in three quick steps.</p>

    <div class="card mt-6 p-6">
      {#if message}
        <div class="rounded-md bg-red-50 p-4 text-sm text-red-700">{message}</div>
      {/if}

      {#if step === 'request'}
        <form method="POST" action="?/request" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="email">Email</label>
            <input class="input" id="email" type="email" name="email" placeholder="you@example.com" required />
          </div>
          <div class="flex justify-center">
            <button class="btn btn-primary rounded-full px-4 py-2 text-sm">Send reset link</button>
          </div>
          <p class="text-center text-sm text-gray-600">Remembered it? <a class="underline" href="/login">Back to sign in</a></p>
        </form>
      {:else if step === 'verify'}
        <form method="POST" action="?/verify" class="space-y-4">
          <input type="hidden" name="email" value={email} />
          <div class="space-y-2">
            <label class="text-sm font-medium" for="code">Enter the 6-digit code we emailed you</label>
            <input class="input tracking-widest" id="code" type="tel" name="code" placeholder="123456" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required />
          </div>
          <div class="flex justify-center">
            <button class="btn btn-primary rounded-full px-4 py-2 text-sm">Verify code</button>
          </div>
        </form>
      {:else if step === 'reset'}
        <form method="POST" action="?/reset" class="space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="code" value={code} />
          <div class="space-y-2">
            <label class="text-sm font-medium" for="password">New password</label>
            <input class="input" id="password" type="password" name="password" placeholder="At least 8 characters" bind:value={newPassword} required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium" for="confirm">Confirm new password</label>
            <input class="input" id="confirm" type="password" name="confirm" placeholder="Re-enter password" bind:value={confirmPassword} required />
            {#if passwordsMismatch}
              <p class="text-sm text-red-600">Passwords do not match</p>
            {/if}
          </div>
          <div class="flex justify-center">
            <button class="btn btn-primary rounded-full px-4 py-2 text-sm" disabled={passwordsMismatch}>Reset password</button>
          </div>
        </form>
      {/if}
    </div>
  </div>
  </section>


