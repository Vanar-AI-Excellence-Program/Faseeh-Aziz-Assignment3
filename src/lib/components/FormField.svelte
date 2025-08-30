<script lang="ts">
  const { 
    id, 
    label, 
    type = 'text', 
    name, 
    placeholder, 
    required = false, 
    error = null,
    showPasswordToggle = false,
    showPassword = false,
    onPasswordToggle = () => {}
  } = $props<{
    id: string;
    label: string;
    type?: string;
    name: string;
    placeholder: string;
    required?: boolean;
    error?: string | null;
    showPasswordToggle?: boolean;
    showPassword?: boolean;
    onPasswordToggle?: () => void;
  }>();
</script>

<div>
  <label for={id} class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
    {label}
    {#if required}
      <span class="text-red-500 ml-1">*</span>
    {/if}
  </label>
  
  <div class="relative">
    <input 
      {id}
      class="w-full px-3 py-2.5 {showPasswordToggle ? 'pr-10' : ''} border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 {error ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-slate-600'}" 
      {type}
      {name}
      {placeholder}
      {required}
    />
    
    {#if showPasswordToggle}
      <button 
        type="button" 
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" 
        onclick={onPasswordToggle}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {#if showPassword}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        {/if}
      </button>
    {/if}
  </div>
  
  {#if error}
    <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}
</div>
