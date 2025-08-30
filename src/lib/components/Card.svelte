<script lang="ts">
  export let className = '';
  export let glassmorphism = true;
  export let padding = 'p-6';
  export let hover = true;
</script>

<div 
  class="
    {glassmorphism 
      ? 'bg-white/30 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-xl' 
      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg'
    }
    rounded-2xl {padding} transition-all duration-300
    {hover ? 'hover:shadow-2xl hover:-translate-y-1' : ''}
    {className}
  "
>
  <slot />
</div>
