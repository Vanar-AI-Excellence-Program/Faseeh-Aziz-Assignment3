<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import SocialLoginButton from '$lib/components/SocialLoginButton.svelte';
	import FormField from '$lib/components/FormField.svelte';
	import { fly } from 'svelte/transition';

	const { data } = $props<{ 
		data: { error?: { type: string; message: string; provider: string | null } } 
	}>();

	let showPassword = $state(false);
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<AuthLayout>
	<div in:fly={{ y: 20, duration: 300 }}>
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
				Welcome back
			</h1>
			<p class="text-slate-600 dark:text-slate-400">
				Sign in to your AuthenBot account
			</p>
		</div>
		
		<!-- Social Login Buttons -->
		<div class="space-y-3 mb-6">
			<SocialLoginButton provider="google" action="signin" callbackUrl="/post-auth" />
			<SocialLoginButton provider="github" action="signin" callbackUrl="/post-auth" />
		</div>
		
		<!-- Divider -->
		<div class="relative mb-6">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-slate-300 dark:border-slate-600"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">or continue with email</span>
			</div>
		</div>

		<!-- Error Messages -->
		{#if $page.form?.action === 'signin' && $page.form?.error}
			<div class="mb-4 p-3 rounded-lg {($page.form.message || '').includes('disabled') ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30 text-orange-700 dark:text-orange-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400'} border text-sm">
				<div class="flex items-center gap-2">
					{#if ($page.form.message || '').includes('disabled')}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			<div class="mb-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 text-orange-700 dark:text-orange-400 text-sm">
				<div class="flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
		
		<!-- Server-side error messages -->
		{#if data.error?.type === 'auth_error'}
			<div class="mb-4 p-3 rounded-lg {data.error.message.includes('disabled') ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30 text-orange-700 dark:text-orange-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400'} border text-sm">
				<div class="flex items-center gap-2">
					{#if data.error.message.includes('disabled')}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
		

		
		<!-- Sign In Form -->
		<form method="POST" action="?/signin" class="space-y-4" use:enhance>
			<FormField
				id="login-email"
				label="Email Address"
				type="email"
				name="email"
				placeholder="Enter your email"
				required={true}
			/>
			
			<FormField
				id="login-password"
				label="Password"
				type={showPassword ? "text" : "password"}
				name="password"
				placeholder="Enter your password"
				required={true}
				showPasswordToggle={true}
				showPassword={showPassword}
				onPasswordToggle={() => showPassword = !showPassword}
			/>
			
			<div class="flex items-center justify-between">
				<a href="/forgot-password" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">
					Forgot your password?
				</a>
			</div>
			
			<button 
				class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md" 
				type="submit"
			>
				Sign In
			</button>
		</form>
		
		<!-- Sign Up Link -->
		<div class="mt-6 text-center">
			<p class="text-slate-600 dark:text-slate-400">
				Don't have an account? 
				<a 
					href="/signup"
					class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
				>
					Sign up
				</a>
			</p>
		</div>
	</div>
</AuthLayout>

<style>
  /* Global styles */
  :global(html, body) {
    height: 100%;
    font-family: 'Inter', sans-serif;
  }
  
  :global(body) {
    margin: 0;
  }
</style>