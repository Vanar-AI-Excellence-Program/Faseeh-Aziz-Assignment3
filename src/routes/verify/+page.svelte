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
  <div class="auth-container">
    <div class="form-container sign-in-container">
      <div class="auth-form">
        <h1>Verify your email</h1>
        <p class="mt-2 text-center text-gray-600">A verification code has been sent to {data.email}.</p>
        
        {#if data.sent === 0}
          <div class="mt-3 rounded bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
            We couldn't send the email right now, but you can still enter the code if you received it, or press "Resend code".
          </div>
        {/if}

        {#if $page.form?.error}
          <div class="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {$page.form.message}
          </div>
        {/if}

        <form method="POST" action="?/verify" class="w-full contents" use:enhance>
          <div class="w-full flex flex-col items-center">
            <input type="hidden" name="email" value={data.email} />
            <input 
              class="auth-input" 
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
            <button class="auth-btn" type="submit" disabled={isExpired}>Verify Email</button>
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
          <button class="ghost" type="submit" disabled={!isExpired}>Resend Code</button>
        </form>

        <div class="mt-4">
          <a href="/login" class="auth-form a">Back to Sign In</a>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div class="overlay-container">
      <div class="overlay">
        <div class="overlay-panel overlay-left">
          <h1>Welcome Back!</h1>
          <p>Please verify your email address to continue with your account</p>
          <button class="ghost" type="button" on:click={() => window.history.back()}>Go Back</button>
        </div>
        <div class="overlay-panel overlay-right">
          <h1>Email Verification</h1>
          <p>Enter the 6-digit verification code sent to your email address to complete the verification process</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
/* Scoped auth styles (inspired by template) */
:global(html,body){height:100%;overflow:hidden}
:global(body){font-family:'Montserrat',sans-serif;margin:0}
.auth-container{background:#fff;border-radius:12px;box-shadow:0 14px 28px rgba(0,0,0,0.25),0 10px 10px rgba(0,0,0,0.22);position:relative;overflow:hidden;width:950px;max-width:100%;min-height:520px;height:clamp(520px,78svh,680px)}
.form-container{position:absolute;top:0;height:100%;transition:all .6s ease-in-out}
.sign-in-container{left:0;width:50%;z-index:2}
.overlay-container{position:absolute;top:0;left:50%;width:50%;height:100%;overflow:hidden;transition:transform .6s ease-in-out;z-index:100}
.overlay{background:linear-gradient(to right,#00ABE4,#34c5f1);background-repeat:no-repeat;background-size:cover;background-position:0 0;color:#fff;position:relative;left:-100%;height:100%;width:200%;transform:translateX(0);transition:transform .6s ease-in-out}
.overlay-panel{position:absolute;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:0 40px;text-align:center;top:0;height:100%;width:50%;transform:translateX(0);transition:transform .6s ease-in-out}
.overlay-left{transform:translateX(-20%)}
.overlay-right{right:0}
.auth-form{background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:0 56px;height:100%;text-align:center}
.auth-input{background:#eee;border:none;padding:12px 15px;margin:10px 0;width:320px;max-width:100%}
.auth-btn{border-radius:20px;border:1px solid #00ABE4;background:#00ABE4;color:#fff;font-size:13px;font-weight:700;padding:12px 45px;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
.auth-btn:disabled{opacity:0.6;cursor:not-allowed}
.ghost{background:transparent;border:2px solid #00ABE4;color:#00ABE4;border-radius:9999px;padding:12px 28px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:background .2s ease, transform .1s ease}
.ghost:hover{background:#00ABE4;color:#fff}
.ghost:active{transform:translateY(1px)}
.ghost:disabled{opacity:0.6;cursor:not-allowed}
.auth-form h1{font-weight:800;font-size:42px;line-height:1.1;margin-bottom:8px}
.auth-form p{color:#666;margin-bottom:16px;max-width:300px}
.auth-form a{color:#00ABE4;text-decoration:none;margin-top:16px}
.auth-form a:hover{text-decoration:underline}
/* Right gradient panel typography */
.overlay-panel h1{font-weight:800;font-size:44px;line-height:1.1;margin:0 0 14px;color:#fff}
.overlay-panel p{color:#fff;opacity:.95;max-width:420px;margin:0 0 24px;line-height:1.6}
@media (max-width: 768px){.auth-container{width:100%;height:100svh;min-height:0;border-radius:0}.overlay-left,.overlay-right{display:none}.sign-in-container{width:100%}.auth-form{padding:0 24px}.auth-form h1{font-size:34px}}
</style>


