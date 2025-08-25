<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';

	import { goto } from '$app/navigation';

	export let data: { error?: { type: string; message: string; provider: string | null } };

	let rightActive = false;
	
	// Password visibility states
	let showLoginPassword = false;
	let showSignupPassword = false;
	

	// Client-side navigation functions
	function navigateToHome() {
		goto('/');
	}

	// Check URL parameters to determine which panel to show
	$: if (browser) {
		if ($page.url.searchParams.get('signup') === '1') {
			rightActive = true;
		} else {
			rightActive = false;
		}
	}
	
	// Keep the correct panel open based on which action failed
	$: if ($page?.form?.action === 'register' && $page?.form?.error) {
		rightActive = true;
	}
	$: if ($page?.form?.error && $page?.form?.action === 'signin') {
		rightActive = false;
	}
	
	// Functions to handle panel switching
	function showLogin() {
		rightActive = false;
		// Update URL to remove signup parameter
		window.history.replaceState({}, '', '/login');
	}
	
	function showSignup() {
		rightActive = true;
		// Update URL to add signup parameter
		window.history.replaceState({}, '', '/login?signup=1');
	}
	
	// Handle browser back/forward buttons and page refresh
	$: if (browser) {
		// Set initial state based on current URL
		if (window.location.search.includes('signup=1')) {
			rightActive = true;
		} else {
			rightActive = false;
		}
		
		// Listen for popstate events (back/forward buttons)
		window.addEventListener('popstate', () => {
			if (window.location.search.includes('signup=1')) {
				rightActive = true;
			} else {
				rightActive = false;
			}
		});
		
		// Debug: Log URL parameters and data
		console.log('Login page loaded with URL params:', window.location.search);
		console.log('Error param:', $page.url.searchParams.get('error'));
		console.log('Message param:', $page.url.searchParams.get('message'));
		console.log('Data error:', data.error);
	}
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<!-- Header: logo/name left, login right -->
<div class="fixed top-0 left-0 right-0 bg-[#E9F1FA] border-b border-[#00ABE4]/10 z-50" style="width: 100vw;">
  <div class="w-full flex items-center justify-center px-4 md:px-6 py-4 relative z-20">
    <div class="w-full max-w-7xl flex items-center justify-between gap-4">
      <button 
        on:click={navigateToHome}
        class="flex items-center gap-3 shrink-0 group" 
        aria-label="AuthenBot Home"
      >
        <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="h-8 w-8 object-contain transition-transform group-hover:scale-105" />
        <span class="text-lg font-bold text-[#00ABE4] transition-colors group-hover:text-[#0095c7]">AuthenBot</span>
      </button>
      <button 
        on:click={() => rightActive = false}
        class="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-[#00ABE4] bg-white ring-2 ring-[#00ABE4] shadow-sm hover:bg-white/95 hover:shadow-md hover:ring-[#0095c7] focus:outline-none focus:ring-4 focus:ring-[#00ABE4]/20 transition-all duration-200 shrink-0"
        aria-label="Sign in to AuthenBot"
      >
        Login
      </button>
    </div>
  </div>
</div>

<section class="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center px-4 pt-20" style="background:linear-gradient(135deg,#E9F1FA 0%, #FFFFFF 70%);">
  <!-- Animated background elements -->
  <div class="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden">
    <!-- Floating particles -->
    <div class="absolute top-20 left-10 w-4 h-4 bg-[#00ABE4] rounded-full animate-bounce opacity-60" style="animation-delay: 0s; animation-duration: 2s;"></div>
    <div class="absolute top-40 right-20 w-3 h-3 bg-[#00ABE4] rounded-full animate-bounce opacity-50" style="animation-delay: 1s; animation-duration: 2.5s;"></div>
    <div class="absolute bottom-40 left-20 w-5 h-5 bg-[#00ABE4] rounded-full animate-bounce opacity-40" style="animation-delay: 0.5s; animation-duration: 1.8s;"></div>
    <div class="absolute bottom-20 right-10 w-2 h-2 bg-[#00ABE4] rounded-full animate-bounce opacity-70" style="animation-delay: 2s; animation-duration: 2.2s;"></div>
    
    <!-- Geometric shapes -->
    <div class="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-[#00ABE4] rotate-45 animate-pulse opacity-30"></div>
    <div class="absolute bottom-1/3 right-1/4 w-6 h-6 bg-[#00ABE4] rounded-full animate-ping opacity-20"></div>
    <div class="absolute top-1/3 right-1/3 w-4 h-4 border border-[#00ABE4] rotate-12 animate-pulse opacity-40"></div>
    
    <!-- Wave lines -->
    <div class="absolute top-1/2 left-0 w-32 h-0.5 bg-gradient-to-r from-transparent via-[#00ABE4] to-transparent animate-pulse opacity-30"></div>
    <div class="absolute bottom-1/3 right-0 w-24 h-0.5 bg-gradient-to-l from-transparent via-[#00ABE4] to-transparent animate-pulse opacity-40" style="animation-delay: 1s;"></div>
    
         <!-- Glowing orbs -->
     <div class="absolute top-1/4 right-1/4 w-12 h-12 bg-[#00ABE4] rounded-full blur-sm animate-glow opacity-10"></div>
     <div class="absolute bottom-1/4 left-1/3 w-16 h-16 bg-[#00ABE4] rounded-full blur-md animate-glow opacity-8" style="animation-delay: 1.5s;"></div>
    
    <!-- Data flow circles -->
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#00ABE4] rounded-full animate-spin opacity-5" style="animation-duration: 20s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#00ABE4] rounded-full animate-spin opacity-8" style="animation-duration: 15s; animation-direction: reverse;"></div>
    
    <!-- Connection dots -->
    <div class="absolute top-1/3 left-1/2 w-2 h-2 bg-[#00ABE4] rounded-full animate-ping opacity-60"></div>
    <div class="absolute bottom-1/3 right-1/2 w-2 h-2 bg-[#00ABE4] rounded-full animate-ping opacity-60" style="animation-delay: 0.5s;"></div>
    
    <!-- Floating elements -->
    <div class="absolute top-1/4 right-1/4 w-6 h-6 bg-[#00ABE4] rounded-full animate-float opacity-30"></div>
    <div class="absolute bottom-1/4 left-1/4 w-4 h-4 bg-[#00ABE4] rounded-full animate-float opacity-40" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/4 w-3 h-3 bg-[#00ABE4] rounded-full animate-float opacity-50" style="animation-delay: 2s;"></div>
    
    <!-- Glow effects -->
    <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#00ABE4] rounded-full blur-3xl opacity-5 animate-pulse"></div>
    <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-[#00ABE4] rounded-full blur-3xl opacity-5 animate-pulse" style="animation-delay: 1s;"></div>
  </div>
	<div id="container" class="auth-container animate-float" class:right-panel-active={rightActive}>
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
						<div class="password-input-container">
							<input 
								class="auth-input" 
								type={showSignupPassword ? "text" : "password"} 
								name="password" 
								placeholder="Password" 
								required 
							/>
							<button 
								type="button" 
								class="password-toggle-btn cursor-pointer" 
								on:click={() => showSignupPassword = !showSignupPassword}
								aria-label={showSignupPassword ? "Hide password" : "Show password"}
							>
								{#if showSignupPassword}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
										<line x1="1" y1="1" x2="23" y2="23"/>
									</svg>
								{:else}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
										<circle cx="12" cy="12" r="3"/>
									</svg>
								{/if}
							</button>
						</div>
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
					<div class="mb-3 rounded-lg {($page.form.message || '').includes('disabled') ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'} border px-3 py-2 text-sm">
						<div class="flex items-center gap-2">
							{#if ($page.form.message || '').includes('disabled')}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/>
									<line x1="15" y1="9" x2="9" y2="15"/>
									<line x1="9" y1="9" x2="15" y2="15"/>
								</svg>
							{/if}
							{$page.form.message}
						</div>
						{#if ($page.form.message || '').includes('disabled')}
							<div class="mt-2 text-xs opacity-75">
								If you believe this is an error, please contact support or try using a different account.
							</div>
						{/if}
					</div>
				{/if}
				
				<!-- OAuth Error Messages -->
				{#if $page.url.searchParams.get('error') === 'disabled'}
					<div class="mb-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 text-sm">
						<div class="flex items-center gap-2">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"/>
								<line x1="15" y1="9" x2="9" y2="15"/>
								<line x1="9" y1="9" x2="15" y2="15"/>
							</svg>
							{$page.url.searchParams.get('message') || 'Account is disabled. Please contact an administrator.'}
						</div>
						<div class="mt-2 text-xs opacity-75">
							If you believe this is an error, please contact support or try using a different account.
						</div>
					</div>
				{/if}
				
				<!-- Server-side error messages (including disabled user errors) -->
				{#if data.error?.type === 'auth_error'}
					<div class="mb-3 rounded-lg {data.error.message.includes('disabled') ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'} border px-3 py-2 text-sm">
						<div class="flex items-center gap-2">
							{#if data.error.message.includes('disabled')}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/>
									<line x1="15" y1="9" x2="9" y2="15"/>
									<line x1="9" y1="9" x2="15" y2="15"/>
								</svg>
							{/if}
							{data.error.message}
						</div>
						{#if data.error.message.includes('disabled')}
							<div class="mt-2 text-xs opacity-75">
								If you believe this is an error, please contact support or try using a different account.
							</div>
						{/if}
					</div>
				{/if}
				
				<!-- Debug: Show data for troubleshooting -->
				{#if data.error}
					<div class="mb-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 text-xs">
						Debug: data.error.type={data.error.type}, data.error.message={data.error.message}
					</div>
				{/if}
				
				<form method="POST" action="?/signin" class="w-full contents" use:enhance>
					<div class="w-full flex flex-col items-center">
						<input type="hidden" name="provider" value="credentials" />
						<input type="hidden" name="redirectTo" value="/dashboard" />
						<input class="auth-input" id="loginEmail" type="email" name="email" placeholder="Email" required />
						<div class="password-input-container">
							<input 
								class="auth-input" 
								id="loginPassword"
								type={showLoginPassword ? "text" : "password"} 
								name="password" 
								placeholder="Password" 
								required 
							/>
							<button 
								type="button" 
								class="password-toggle-btn cursor-pointer" 
								on:click={() => showLoginPassword = !showLoginPassword}
								aria-label={showLoginPassword ? "Hide password" : "Show password"}
							>
								{#if showLoginPassword}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
										<line x1="1" y1="1" x2="23" y2="23"/>
									</svg>
								{:else}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
										<circle cx="12" cy="12" r="3"/>
									</svg>
								{/if}
							</button>
						</div>
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
					<button class="ghost" type="button" on:click={showLogin}>Sign In</button>
				</div>
				<div class="overlay-panel overlay-right">
					<h1>Hello, Friend!</h1>
					<p>Enter your personal details and start journey with us</p>
					<button class="ghost" type="button" on:click={showSignup}>Sign Up</button>
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
.auth-form a{margin:8px 0 16px;color:#555}

/* Password input container and toggle button */
.password-input-container {
	position: relative;
	width: 320px;
	max-width: 100%;
}

.password-input-container .auth-input {
	width: 100%;
	padding-right: 50px;
}

.password-toggle-btn {
	position: absolute;
	right: 15px;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	color: #666;
	cursor: pointer;
	padding: 5px;
	border-radius: 4px;
	transition: color 0.2s ease, background-color 0.2s ease;
}

.password-toggle-btn:hover {
	color: #00ABE4;
	background-color: rgba(0, 171, 228, 0.1);
}

.password-toggle-btn:focus {
	outline: 2px solid #00ABE4;
	outline-offset: 2px;
}
/* Right gradient panel typography */
.overlay-panel h1{font-weight:800;font-size:44px;line-height:1.1;margin:0 0 14px;color:#fff}
.overlay-panel p{color:#fff;opacity:.95;max-width:420px;margin:0 0 24px;line-height:1.6}

/* Custom animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

/* Enhanced auth container */
.auth-container {
  animation: float 4s ease-in-out infinite;
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22), 0 0 20px rgba(0, 171, 228, 0.1);
  transition: all 0.3s ease;
}

.auth-container:hover {
  box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 15px 15px rgba(0,0,0,0.25), 0 0 30px rgba(0, 171, 228, 0.2);
  transform: translateY(-2px);
}

/* Enhanced buttons */
.auth-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 171, 228, 0.3);
}

.auth-btn:active {
  transform: translateY(0);
}

/* Enhanced social buttons */
.social {
  transition: all 0.3s ease;
}

.social:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

/* Enhanced ghost buttons */
.ghost {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.ghost:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255,255,255,0.2);
}

.ghost:active {
  transform: translateY(0);
}

@media (max-width: 768px){.auth-container{width:100%;height:100svh;min-height:0;border-radius:0}.overlay-left,.overlay-right{display:none}.sign-in-container{width:100%}.sign-up-container{width:100%}.auth-form{padding:0 24px}.auth-form h1{font-size:34px}}
</style>