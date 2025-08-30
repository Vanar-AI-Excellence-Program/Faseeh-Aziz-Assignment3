<script lang="ts">
  import { fly } from 'svelte/transition';

  const { 
    title, 
    value, 
    icon, 
    iconBgColor = 'bg-indigo-500', 
    iconColor = 'text-white', 
    trend, 
    delay = 0 
  } = $props<{
    title: string;
    value: string | number;
    icon: string;
    iconBgColor?: 'bg-indigo-500' | 'bg-blue-500' | 'bg-green-500' | 'bg-emerald-500' | 'bg-purple-500' | 'bg-pink-500' | 'bg-yellow-500' | 'bg-orange-500' | 'bg-red-500' | 'bg-slate-500';
    iconColor?: 'text-white' | 'text-indigo-500' | 'text-blue-500' | 'text-green-500' | 'text-emerald-500' | 'text-purple-500' | 'text-pink-500' | 'text-yellow-500' | 'text-orange-500' | 'text-red-500' | 'text-slate-500';
    trend?: {
      value: number;
      isPositive: boolean;
      label: string;
    };
    delay?: number;
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

  const iconTextColors = {
    'text-indigo-500': 'text-indigo-500',
    'text-blue-500': 'text-blue-500',
    'text-green-500': 'text-green-500',
    'text-emerald-500': 'text-emerald-500',
    'text-purple-500': 'text-purple-500',
    'text-pink-500': 'text-pink-500',
    'text-yellow-500': 'text-yellow-500',
    'text-orange-500': 'text-orange-500',
    'text-red-500': 'text-red-500',
    'text-slate-500': 'text-slate-500'
  } as const;
</script>

<div 
  class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
  in:fly={{ y: 20, duration: 400, delay }}
>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p class="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      
      {#if trend}
        <div class="flex items-center gap-2 mt-2">
          <span class="inline-flex items-center gap-1 text-sm {trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {#if trend.isPositive}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              {:else}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              {/if}
            </svg>
            {trend.value}%
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">{trend.label}</span>
        </div>
      {/if}
    </div>
    
    <div class="flex-shrink-0">
      <div class="w-12 h-12 {iconColors[iconBgColor as keyof typeof iconColors] || 'bg-indigo-500'} rounded-xl flex items-center justify-center shadow-lg">
        <svg class="w-6 h-6 {iconTextColors[iconColor as keyof typeof iconTextColors] || 'text-white'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
        </svg>
      </div>
    </div>
  </div>
</div>
