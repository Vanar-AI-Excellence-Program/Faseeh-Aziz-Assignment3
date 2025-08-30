<script lang="ts">
  export let type = 'text';
  export let placeholder = '';
  export let value = '';
  export let name = '';
  export let required = false;
  export let disabled = false;
  export let className = '';
  export let label = '';
  export let error = '';
</script>

<div class="w-full {className}">
  {#if label}
    <label for={name} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
  {/if}
  
  <input
    {type}
    {placeholder}
    {value}
    {name}
    {required}
    {disabled}
    id={name}
    class="
      w-full px-4 py-3 rounded-xl border transition-all duration-200
      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
      border-gray-300 dark:border-gray-600
      focus:border-blue-500 dark:focus:border-blue-400
      focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
      placeholder-gray-500 dark:placeholder-gray-400
      disabled:opacity-50 disabled:cursor-not-allowed
      hover:border-gray-400 dark:hover:border-gray-500
    "
    on:input={(e) => value = e.target.value}
  />
  
  {#if error}
    <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}
</div>
