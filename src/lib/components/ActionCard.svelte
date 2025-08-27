<script lang="ts">
  import { fly } from 'svelte/transition';

  const { 
    title, 
    description, 
    href, 
    icon, 
    iconBgColor = 'bg-indigo-500', 
    delay = 0, 
    ctaText = 'Get Started' 
  } = $props<{
    title: string;
    description: string;
    href: string;
    icon: string;
    iconBgColor?: 'bg-indigo-500' | 'bg-blue-500' | 'bg-green-500' | 'bg-emerald-500' | 'bg-purple-500' | 'bg-pink-500' | 'bg-yellow-500' | 'bg-orange-500' | 'bg-red-500' | 'bg-slate-500';
    delay?: number;
    ctaText?: string;
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

<a 
  href={href}
  class="group block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-indigo-200 dark:hover:border-indigo-700"
  in:fly={{ y: 20, duration: 400, delay }}
>
  <div class="text-center">
    <!-- Icon -->
    <div class="w-16 h-16 {iconColors[iconBgColor as keyof typeof iconColors] || 'bg-indigo-500'} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
      </svg>
    </div>
    
    <!-- Content -->
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
      {title}
    </h3>
    
    <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
      {description}
    </p>
    
    <!-- CTA -->
    <div class="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-200">
      {ctaText}
      <svg class="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
</a>
