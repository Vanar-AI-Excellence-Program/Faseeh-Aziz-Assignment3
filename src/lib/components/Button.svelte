<script lang="ts">
  export let href: string | undefined;
  export let variant: 'primary' | 'outline' | 'soft' = 'primary';

  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition';
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    outline: 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
  } as const;
  const classes = `${base} ${styles[variant]}`;
</script>

{#if href}
  <a class={classes} href={href}><slot /></a>
{:else}
  <button class={classes} type="button"><slot /></button>
{/if}


