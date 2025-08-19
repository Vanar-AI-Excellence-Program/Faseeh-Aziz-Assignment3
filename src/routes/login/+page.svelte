<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	export let data: { error?: { type: string; message: string; provider: string | null } };

	let rightActive = false;
	// Keep the correct panel open based on which action failed
	$: if ($page?.form?.action === 'register' && $page?.form?.error) {
		rightActive = true;
	}
	$: if ($page?.form?.action === 'signin' && $page?.form?.error) {
		rightActive = false;
	}
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<section class="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center px-4" style="background:linear-gradient(135deg,#E9F1FA 0%, #FFFFFF 70%);">
	<div id="container" class="auth-container" class:right-panel-active={rightActive}>
		<!-- Sign Up (prompt) -->
		<div class="form-container sign-up-container">
			<div class="auth-form">
				<h1>Create Account</h1>
				<div class="social-container">
					<form method="POST" action="/auth/signin/google?callbackUrl=/post-auth" class="contents">
						<button type="submit" class="social" aria-label="Continue with Google">
							<!-- Google logo (mono) -->
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.35 11.1h-9.18v2.98h5.39c-.23 1.48-1.62 4.34-5.39 4.34-3.25 0-5.9-2.68-5.9-5.98s2.65-5.98 5.9-5.98c1.85 0 3.1.78 3.81 1.45l2.59-2.5C17.94 3.6 16.02 2.7 14 2.7 8.9 2.7 4.75 6.84 4.75 12.02S8.9 21.35 14 21.35c7.01 0 8.65-6.14 7.35-10.25Z"/></svg>
						</button>
					</form>
					<form method="POST" action="/auth/signin/github?callbackUrl=/post-auth" class="contents">
						<button type="submit" class="social" aria-label="Continue with GitHub">
							<!-- GitHub logo -->
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.56 1.07 1.56 1.07.9 1.57 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05.8-.23 1.65-.35 2.5-.35.85 0 1.7.12 2.5.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.49C19.13 20.6 22 16.78 22 12.26 22 6.58 17.52 2 12 2Z"/></svg>
						</button>
					</form>
				</div>
				<span>or use your email for registration</span>
				{#if $page.form?.action === 'register' && $page.form?.error}
					<div class="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{$page.form.message}</div>
				{/if}
				<form method="POST" action="?/register" class="w-full contents">
					<div class="w-full flex flex-col items-center">
						<input class="auth-input" type="text" name="name" placeholder="Name" />
						<input class="auth-input" type="email" name="email" placeholder="Email" required />
						<input class="auth-input" type="password" name="password" placeholder="Password" required />
						<button class="auth-btn" type="submit">Sign Up</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Sign In -->
		<div class="form-container sign-in-container">
			<div class="auth-form">
				<h1>Sign in</h1>
				<div class="social-container">
					<form method="POST" action="/auth/signin/google?callbackUrl=/post-auth" class="contents">
						<button type="submit" class="social" aria-label="Continue with Google">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.35 11.1h-9.18v2.98h5.39c-.23 1.48-1.62 4.34-5.39 4.34-3.25 0-5.9-2.68-5.9-5.98s2.65-5.98 5.9-5.98c1.85 0 3.1.78 3.81 1.45l2.59-2.5C17.94 3.6 16.02 2.7 14 2.7 8.9 2.7 4.75 6.84 4.75 12.02S8.9 21.35 14 21.35c7.01 0 8.65-6.14 7.35-10.25Z"/></svg>
						</button>
					</form>
					<form method="POST" action="/auth/signin/github?callbackUrl=/post-auth" class="contents">
						<button type="submit" class="social" aria-label="Continue with GitHub">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.56 1.07 1.56 1.07.9 1.57 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05.8-.23 1.65-.35 2.5-.35.85 0 1.7.12 2.5.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.49C19.13 20.6 22 16.78 22 12.26 22 6.58 17.52 2 12 2Z"/></svg>
						</button>
					</form>
				</div>
				{#if $page.form?.action === 'signin' && $page.form?.error}
					<div class="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{$page.form.message}</div>
				{/if}
				{#if data.error?.type === 'auth_error'}
					<div class="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{data.error.message}</div>
				{/if}
				<form method="POST" action="?/signin" class="w-full contents" use:enhance>
					<div class="w-full flex flex-col items-center">
						<input type="hidden" name="provider" value="credentials" />
						<input type="hidden" name="redirectTo" value="/dashboard" />
						<input class="auth-input" id="loginEmail" type="email" name="email" placeholder="Email" required />
						<input class="auth-input" id="loginPassword" type="password" name="password" placeholder="Password" required />
						<a href="/forgot-password">Forgot your password?</a>
						<button class="auth-btn" type="submit">Sign In</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Overlay -->
		<div class="overlay-container">
			<div class="overlay">
				<div class="overlay-panel overlay-left">
					<h1>Welcome Back!</h1>
					<p>To keep connected with us please login with your personal info</p>
					<button class="ghost" type="button" on:click={() => (rightActive = false)}>Sign In</button>
				</div>
				<div class="overlay-panel overlay-right">
					<h1>Hello, Friend!</h1>
					<p>Enter your personal details and start journey with us</p>
					<button class="ghost" type="button" on:click={() => (rightActive = true)}>Sign Up</button>
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
.sign-up-container{left:0;width:50%;opacity:0;z-index:1}
.auth-container.right-panel-active .sign-in-container{transform:translateX(100%)}
.auth-container.right-panel-active .sign-up-container{transform:translateX(100%);opacity:1;z-index:5;animation:show .6s}
.overlay-container{position:absolute;top:0;left:50%;width:50%;height:100%;overflow:hidden;transition:transform .6s ease-in-out;z-index:100}
.auth-container.right-panel-active .overlay-container{transform:translateX(-100%)}
.overlay{background:linear-gradient(to right,#00ABE4,#34c5f1);background-repeat:no-repeat;background-size:cover;background-position:0 0;color:#fff;position:relative;left:-100%;height:100%;width:200%;transform:translateX(0);transition:transform .6s ease-in-out}
.auth-container.right-panel-active .overlay{transform:translateX(50%)}
.overlay-panel{position:absolute;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:0 40px;text-align:center;top:0;height:100%;width:50%;transform:translateX(0);transition:transform .6s ease-in-out}
.overlay-left{transform:translateX(-20%)}
.auth-container.right-panel-active .overlay-left{transform:translateX(0)}
.overlay-right{right:0}
.auth-container.right-panel-active .overlay-right{transform:translateX(20%)}
.auth-form{background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:0 56px;height:100%;text-align:center}
.auth-input{background:#eee;border:none;padding:12px 15px;margin:10px 0;width:320px;max-width:100%}
.auth-btn{border-radius:20px;border:1px solid #00ABE4;background:#00ABE4;color:#fff;font-size:13px;font-weight:700;padding:12px 45px;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
.ghost{background:transparent;border:2px solid #fff;color:#fff;border-radius:9999px;padding:12px 28px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:background .2s ease, transform .1s ease}
.ghost:hover{background:rgba(255,255,255,0.15)}
.ghost:active{transform:translateY(1px)}
.social-container{margin:18px 0 10px}
.social{border:1px solid #DDD;border-radius:50%;display:inline-flex;justify-content:center;align-items:center;margin:0 8px;height:44px;width:44px;cursor:pointer;background:#fff;color:#444}
.auth-form h1{font-weight:800;font-size:42px;line-height:1.1;margin-bottom:8px}
label{font-weight:600}
.auth-form a{margin:8px 0 16px;color:#555}
/* Right gradient panel typography */
.overlay-panel h1{font-weight:800;font-size:44px;line-height:1.1;margin:0 0 14px;color:#fff}
.overlay-panel p{color:#fff;opacity:.95;max-width:420px;margin:0 0 24px;line-height:1.6}
@media (max-width: 768px){.auth-container{width:100%;height:100svh;min-height:0;border-radius:0}.overlay-left,.overlay-right{display:none}.sign-in-container{width:100%}.sign-up-container{width:100%}.auth-form{padding:0 24px}.auth-form h1{font-size:34px}}
</style>