<script lang="ts">
  import { fly } from 'svelte/transition';

  const { 
    title, 
    icon, 
    iconBgColor = 'bg-indigo-500', 
    delay = 0,
    children
  } = $props<{
    title: string;
    icon: string;
    iconBgColor?: 'bg-indigo-500' | 'bg-blue-500' | 'bg-green-500' | 'bg-emerald-500' | 'bg-purple-500' | 'bg-pink-500' | 'bg-yellow-500' | 'bg-orange-500' | 'bg-red-500' | 'bg-slate-500';
    delay?: number;
    children?: any;
  }>();

  const iconColors = {
    'bg-indigo-500': 'bg-indigo-500',
    'bg-blue-500': 'bg-blue-500',
    'bg-green-500': 'bg-green-500',
    'bg-emerald-500': 'bg-emerald-500',
    'bg-purple-500': 'bg-purple-500',
    'bg-pink-500': 'bg-pink-500',
    'bg-yellow-500': 'bg-yellow-500',
    'bg-orange-500': 'bg-orange-500',
    'bg-red-500': 'bg-red-500',
    'bg-slate-500': 'bg-slate-500'
  } as const;
</script>

<div 
  class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300"
  in:fly={{ y: 20, duration: 400, delay }}
>
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <div class="w-10 h-10 {iconColors[iconBgColor as keyof typeof iconColors] || 'bg-indigo-500'} rounded-xl flex items-center justify-center">
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
  </div>

  <!-- Content -->
  <div class="space-y-4">
    {@render children?.()}
  </div>
</div>
