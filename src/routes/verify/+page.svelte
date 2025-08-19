<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  
  type PageData = { email: string; expiresAt: string | null; sent?: number };
  export let data: PageData;
  let code: string = "";
  let codeInput: HTMLInputElement | null = null;
  let timeRemaining: number = 0;
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let isExpired: boolean = false;

  function formatTime(ms: number) {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function startTimer(expiresAt: string | null) {
    if (!expiresAt) {
      isExpired = true;
      timeRemaining = 0;
      return;
    }
    if (intervalId) clearInterval(intervalId);
    const update = () => {
      timeRemaining = new Date(expiresAt).getTime() - Date.now();
      isExpired = timeRemaining <= 0;
      if (isExpired && intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };
    update();
    intervalId = setInterval(update, 1000);
  }

  onMount(() => {
    startTimer(data.expiresAt);
    return () => intervalId && clearInterval(intervalId);
  });

  function restartTimer(newExpiresAt: string) {
    data.expiresAt = newExpiresAt;
    isExpired = false;
    timeRemaining = 0;
    startTimer(newExpiresAt);
  }
</script>

<section class="mx-auto flex max-w-5xl justify-center px-4 py-16 md:px-6 lg:px-8 lg:py-20">
  <div class="w-full max-w-md">
    <h1 class="text-center text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Verify your email</h1>
    <p class="mt-2 text-center text-gray-600">A verification code has been sent to {data.email}.</p>
    {#if data.sent === 0}
      <div class="mt-3 rounded bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
        We couldn't send the email right now, but you can still enter the code if you received it, or press "Resend code".
      </div>
    {/if}

    <div class="card mt-6 p-6">
      <h2 class="mb-2 text-xl font-semibold">Enter verification code</h2>
      {#if $page.form?.error}
        <div class="mb-3 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{$page.form.message}</div>
      {/if}
      <form method="POST" action="?/verify" class="space-y-4">
        <input type="hidden" name="email" value={data.email} />
        <div class="space-y-2">
          <label class="text-sm font-medium" for="code">6-digit code</label>
          <input id="code" class="input" type="text" name="code" bind:value={code} placeholder="123456" required minlength="6" maxlength="6" disabled={isExpired} bind:this={codeInput} />
        </div>
        <div class="flex justify-center">
          <button class="btn btn-primary rounded-full px-4 py-2 text-sm" disabled={isExpired}>Verify</button>
        </div>
      </form>
      <div class="mt-4 text-center text-sm text-gray-600">
        {#if data.expiresAt}
          <p>Code expires in {formatTime(timeRemaining)}</p>
        {/if}
      </div>
      <form method="POST" action="?/resend" class="mt-4 text-center" on:submit|preventDefault={async (e) => {
        const form = e.currentTarget as HTMLFormElement;
        // Optimistically restart timer and enable input immediately
        const optimisticExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        restartTimer(optimisticExpiresAt);
        code = '';
        codeInput?.focus();

        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'accept': 'application/json' } });
        if (res.ok) {
          const payload = await res.json();
          const expiresAt = payload?.expiresAt ?? payload?.data?.expiresAt;
          if (expiresAt) {
            restartTimer(expiresAt);
          }
        }
      }}>
        <input type="hidden" name="email" value={data.email} />
        <button class="btn btn-soft hover:underline rounded-full px-4 py-2 text-sm" disabled={!isExpired}>Resend code</button>
      </form>
    </div>
  </div>
  
</section>


