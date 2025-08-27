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
				Create your account
			</h1>
			<p class="text-slate-600 dark:text-slate-400">
				Get started with AuthenBot today
			</p>
		</div>
		
		<!-- Social Login Buttons -->
		<div class="space-y-3 mb-6">
			<SocialLoginButton provider="google" action="signin" callbackUrl="http://localhost:5173/post-auth" />
			<SocialLoginButton provider="github" action="signin" callbackUrl="http://localhost:5173/post-auth" />
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

		<!-- Error Message -->
		{#if $page.form?.action === 'register' && $page.form?.error}
			<div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm">
				{$page.form.message}
			</div>
		{/if}

		<!-- Success Message -->
		{#if $page.form?.action === 'register' && !$page.form?.error && $page.form?.success}
			<div class="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm">
				{$page.form.message}
			</div>
		{/if}

		<!-- Sign Up Form -->
		<form method="POST" action="?/register" class="space-y-4" use:enhance>
			<FormField
				id="signup-name"
				label="Full Name"
				type="text"
				name="name"
				placeholder="Enter your full name"
				required={true}
			/>
			
			<FormField
				id="signup-email"
				label="Email Address"
				type="email"
				name="email"
				placeholder="Enter your email"
				required={true}
			/>
			
			<FormField
				id="signup-password"
				label="Password"
				type={showPassword ? "text" : "password"}
				name="password"
				placeholder="Create a password"
				required={true}
				showPasswordToggle={true}
				showPassword={showPassword}
				onPasswordToggle={() => showPassword = !showPassword}
			/>
			
			<button 
				class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md" 
				type="submit"
			>
				Create Account
			</button>
		</form>
		
		<!-- Sign In Link -->
		<div class="mt-6 text-center">
			<p class="text-slate-600 dark:text-slate-400">
				Already have an account? 
				<a 
					href="/login"
					class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
				>
					Sign in
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
