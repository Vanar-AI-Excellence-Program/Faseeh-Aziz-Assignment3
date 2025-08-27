<script lang="ts">
  export let className = '';
  export let lines = 1;
  export let height = 'h-4';
  export let width = 'w-full';
</script>

<div class="space-y-3 {className}">
  {#each Array(lines) as _, i}
    <div class="
      {height} {width} bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse
      {i === lines - 1 ? 'w-3/4' : ''}
    "></div>
  {/each}
</div>
