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

<svelte:head>
  <title>Verify Email - User Portal</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
  <div class="w-full max-w-md">
    <!-- Main Card -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verify your email
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          A verification code has been sent to <span class="font-medium text-gray-900 dark:text-white">{data.email}</span>
        </p>
      </div>

      <!-- Alerts -->
      {#if data.sent === 0}
        <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              We couldn't send the email right now, but you can still enter the code if you received it, or press "Resend code".
            </p>
          </div>
        </div>
      {/if}

      {#if $page.form?.error}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-red-800 dark:text-red-200">
              {$page.form.message}
            </p>
          </div>
        </div>
      {/if}

      <!-- Verification Form -->
      <form method="POST" action="?/verify" class="space-y-6" use:enhance>
        <div>
          <input type="hidden" name="email" value={data.email} />
          <label for="code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Code
          </label>
          <input 
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
            id="code" 
            type="text" 
            name="code" 
            bind:value={code} 
            placeholder="Enter 6-digit code" 
            required 
            minlength="6" 
            maxlength="6" 
            disabled={isExpired} 
            bind:this={codeInput} 
          />
        </div>

        <button 
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200" 
          type="submit" 
          disabled={isExpired}
        >
          Verify Email
        </button>
      </form>

      <!-- Timer -->
      {#if data.expiresAt}
        <div class="mt-6 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Code expires in {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      {/if}

      <!-- Resend Form -->
      <form method="POST" action="?/resend" class="mt-6 text-center" on:submit|preventDefault={async (e) => {
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
        <button 
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200" 
          type="submit" 
          disabled={!isExpired}
        >
          Resend Code
        </button>
      </form>

      <!-- Back Link -->
      <div class="mt-8 text-center">
        <a 
          href="/login" 
          class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors duration-200"
        >
          ← Back to Sign In
        </a>
      </div>
    </div>

    <!-- Info Card -->
    <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
      <div class="text-center">
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Email Verification
        </h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          Enter the 6-digit verification code sent to your email address to complete the verification process and access your account.
        </p>
      </div>
    </div>
  </div>
</div>


