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
  <div class="auth-container">
    <div class="form-container sign-in-container">
      <div class="auth-form">
        <h1>Reset Password</h1>
        <p class="mt-2 text-center text-gray-600">Reset your password in three quick steps.</p>

        {#if message}
          <div class="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{message}</div>
        {/if}

        {#if step === 'request'}
          <form method="POST" action="?/request" class="w-full contents">
            <div class="w-full flex flex-col items-center">
              <input class="auth-input" id="email" type="email" name="email" placeholder="Enter your email" required />
              <button class="auth-btn" type="submit">Send Reset Link</button>
            </div>
          </form>
          <div class="mt-4">
            <a href="/login" class="auth-form a">Back to Sign In</a>
          </div>
        {:else if step === 'verify'}
          <form method="POST" action="?/verify" class="w-full contents">
            <div class="w-full flex flex-col items-center">
              <input type="hidden" name="email" value={email} />
              <input 
                class="auth-input tracking-widest" 
                id="code" 
                type="tel" 
                name="code" 
                placeholder="Enter 6-digit code" 
                inputmode="numeric" 
                autocomplete="one-time-code" 
                maxlength="6" 
                required 
              />
              <button class="auth-btn" type="submit">Verify Code</button>
            </div>
          </form>
        {:else if step === 'reset'}
          <form method="POST" action="?/reset" class="w-full contents">
            <div class="w-full flex flex-col items-center">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="code" value={code} />
              <input 
                class="auth-input" 
                id="password" 
                type="password" 
                name="password" 
                placeholder="New password (min 8 characters)" 
                bind:value={newPassword} 
                required 
              />
              <input 
                class="auth-input" 
                id="confirm" 
                type="password" 
                name="confirm" 
                placeholder="Confirm new password" 
                bind:value={confirmPassword} 
                required 
              />
              {#if passwordsMismatch}
                <p class="text-sm text-red-600">Passwords do not match</p>
              {/if}
              <button class="auth-btn" type="submit" disabled={passwordsMismatch}>Reset Password</button>
            </div>
          </form>
        {/if}
      </div>
    </div>

    <!-- Overlay -->
    <div class="overlay-container">
      <div class="overlay">
        <div class="overlay-panel overlay-left">
          <h1>Forgot Password?</h1>
          <p>Don't worry! It happens to the best of us. Enter your email and we'll send you a reset link.</p>
          <button class="ghost" type="button" on:click={() => window.history.back()}>Go Back</button>
        </div>
        <div class="overlay-panel overlay-right">
          <h1>Password Reset</h1>
          <p>Follow the simple steps to reset your password and regain access to your account</p>
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
.ghost{background:transparent;border:2px solid #fff;color:#fff;border-radius:9999px;padding:12px 28px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:background .2s ease, transform .1s ease}
.ghost:hover{background:rgba(255,255,255,0.15)}
.ghost:active{transform:translateY(1px)}
.auth-form h1{font-weight:800;font-size:42px;line-height:1.1;margin-bottom:8px}
.auth-form p{color:#666;margin-bottom:16px;max-width:300px}
.auth-form a{color:#00ABE4;text-decoration:none;margin-top:16px}
.auth-form a:hover{text-decoration:underline}
/* Right gradient panel typography */
.overlay-panel h1{font-weight:800;font-size:44px;line-height:1.1;margin:0 0 14px;color:#fff}
.overlay-panel p{color:#fff;opacity:.95;max-width:420px;margin:0 0 24px;line-height:1.6}
@media (max-width: 768px){.auth-container{width:100%;height:100svh;min-height:0;border-radius:0}.overlay-left,.overlay-right{display:none}.sign-in-container{width:100%}.auth-form{padding:0 24px}.auth-form h1{font-size:34px}}
</style>


