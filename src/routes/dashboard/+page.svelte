<script lang="ts">
  import StatCard from '$lib/components/StatCard.svelte';
  import ActionCard from '$lib/components/ActionCard.svelte';
  import ChartCard from '$lib/components/ChartCard.svelte';
  import { fly, scale } from 'svelte/transition';
  
  const { data } = $props<{ 
    user: { 
      id?: string; 
      name?: string | null; 
      email?: string | null; 
      role?: string | null 
    },
    stats: {
      totalUsers: number;
      verifiedUsers: number;
      unverifiedUsers: number;
      adminUsers: number;
      regularUsers: number;
    }
  }>();

  // Mock data for charts (in a real app, this would come from your backend)
  const userGrowthData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 180 },
    { month: 'Mar', users: 220 },
    { month: 'Apr', users: 280 },
    { month: 'May', users: 320 },
    { month: 'Jun', users: 380 }
  ];

  const systemHealthData = [
    { service: 'Authentication', status: 'operational', uptime: 99.9 },
    { service: 'AI Chat', status: 'operational', uptime: 99.8 },
    { service: 'Database', status: 'operational', uptime: 99.95 },
    { service: 'Email Service', status: 'operational', uptime: 99.7 }
  ];
</script>

<!-- Dashboard Header -->
<div class="mb-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Welcome back, {data.user.name || 'Admin'} 👋</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Email: {data.user.email} • Role: {data.user.role}
      </p>
    </div>
    <div class="flex items-center gap-4">
      <!-- Quick actions -->
      <a href="/admin" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        Admin Dashboard
      </a>
      <a href="/chat" class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        AI Chat
      </a>
    </div>
  </div>
</div>

<!-- Premium Welcome Section -->
<div class="mb-12" in:fly={{ y: -20, duration: 600, delay: 100 }}>
  <div class="max-w-4xl mx-auto text-center">
    <div class="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full border border-blue-200/50 dark:border-blue-700/50 mb-6">
      <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Live Dashboard</span>
    </div>
    
    <h2 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-4">
      Here's what's happening today
    </h2>
    
    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
      Monitor key metrics, manage users, and keep your system running smoothly.
    </p>
  </div>
</div>

<!-- Premium Stats Grid -->
<div class="mb-16">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    <div 
      class="group relative"
      in:fly={{ y: 20, duration: 600, delay: 200 }}
    >
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div class="flex items-center justify-between mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 1 4-4h4 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span class="text-sm font-semibold">+12%</span>
          </div>
        </div>
        
        <div class="mb-2">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">
            {data.stats.totalUsers.toLocaleString()}
          </div>
          <div class="text-gray-600 dark:text-gray-400 font-medium">
            Total Users
          </div>
        </div>
        
        <div class="text-sm text-gray-500 dark:text-gray-500">
          Across all platforms
        </div>
      </div>
    </div>

    <div 
      class="group relative"
      in:fly={{ y: 20, duration: 600, delay: 300 }}
    >
      <div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div class="flex items-center justify-between mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span class="text-sm font-semibold">+8%</span>
          </div>
        </div>
        
        <div class="mb-2">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">
            {data.stats.verifiedUsers.toLocaleString()}
          </div>
          <div class="text-gray-600 dark:text-gray-400 font-medium">
            Verified Users
          </div>
        </div>
        
        <div class="text-sm text-gray-500 dark:text-gray-500">
          Email confirmed
        </div>
      </div>
    </div>

    <div 
      class="group relative"
      in:fly={{ y: 20, duration: 600, delay: 400 }}
    >
      <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div class="flex items-center justify-between mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span class="text-sm font-semibold">+2</span>
          </div>
        </div>
        
        <div class="mb-2">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">
            {data.stats.adminUsers}
          </div>
          <div class="text-gray-600 dark:text-gray-400 font-medium">
            Admin Users
          </div>
        </div>
        
        <div class="text-sm text-gray-500 dark:text-gray-500">
          Full access
        </div>
      </div>
    </div>

    <div 
      class="group relative"
      in:fly={{ y: 20, duration: 600, delay: 500 }}
    >
      <div class="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div class="flex items-center justify-between mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="flex items-center gap-1 text-red-600 dark:text-red-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <span class="text-sm font-semibold">-5%</span>
          </div>
        </div>
        
        <div class="mb-2">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">
            {data.stats.unverifiedUsers}
          </div>
          <div class="text-gray-600 dark:text-gray-400 font-medium">
            Pending Users
          </div>
        </div>
        
        <div class="text-sm text-gray-500 dark:text-gray-500">
          Awaiting verification
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Premium Quick Actions -->
<div class="mb-16" in:fly={{ y: 20, duration: 600, delay: 600 }}>
  <div class="text-center mb-10">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      Quick Actions
    </h2>
    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
      Access the most important features and manage your platform efficiently
    </p>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <div class="group">
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
            User Management
          </h3>
          
          <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Browse and manage user accounts with advanced filtering and role management capabilities
          </p>
          
          <a 
            href="/admin/users"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 group-hover:scale-105"
          >
            Manage Users
            <svg class="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div class="group">
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
            AI Chat Interface
          </h3>
          
          <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Access the intelligent AI-powered chat application for user support and interactions
          </p>
          
          <a 
            href="/chat"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 group-hover:scale-105"
          >
            Open Chat
            <svg class="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div class="group">
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative">
          <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
            System Settings
          </h3>
          
          <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Manage your profile, system preferences, and account configuration
          </p>
          
          <a 
            href="/settings"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 group-hover:scale-105"
          >
            Configure
            <svg class="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Premium Platform Overview -->
<div class="mb-16" in:fly={{ y: 20, duration: 600, delay: 800 }}>
  <div class="text-center mb-10">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      Platform Overview
    </h2>
    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
      Key metrics and insights about your authentication platform
    </p>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- User Growth Chart -->
    <div class="group">
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">User Growth</h3>
              <p class="text-gray-600 dark:text-gray-400">Monthly progression</p>
            </div>
          </div>
          
          <div class="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50">
            <div class="text-center">
              <div class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                +{userGrowthData[userGrowthData.length - 1].users - userGrowthData[0].users}
              </div>
              <div class="text-lg text-gray-600 dark:text-gray-400 mb-2">
                New users this year
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-500">
                Chart visualization coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="group">
      <div class="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">System Health</h3>
              <p class="text-gray-600 dark:text-gray-400">Service status</p>
            </div>
          </div>
          
          <div class="space-y-4">
            {#each systemHealthData as service}
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-200/50 dark:border-slate-600/50 hover:bg-gray-100 dark:hover:bg-slate-600/50 transition-colors duration-300">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {service.service}
                  </span>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-gray-900 dark:text-white">
                    {service.uptime}%
                  </div>
                  <div class="text-sm text-green-600 dark:text-green-400 capitalize font-medium">
                    {service.status}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Premium AI Chat Shortcut -->
<div class="mb-16" in:fly={{ y: 20, duration: 600, delay: 1000 }}>
  <div class="relative bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-3xl border border-purple-200/50 dark:border-purple-700/50 p-10 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
    <div class="relative">
      <div class="flex items-center justify-between">
        <div class="flex-1 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full border border-purple-200 dark:border-purple-700/50 mb-4">
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-purple-700 dark:text-purple-300">AI Assistant</span>
          </div>
          
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            AI Chat Assistant
          </h3>
          
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Your AI assistant is ready to help with user support, system questions, and platform insights. Get instant answers and intelligent recommendations.
          </p>
          
          <a 
            href="/chat"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 group-hover:scale-105"
          >
            Open Chat
            <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        
        <div class="hidden lg:block">
          <div class="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Premium Recent Activity -->
<div in:fly={{ y: 20, duration: 600, delay: 1200 }}>
  <div class="text-center mb-10">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      Recent Activity
    </h2>
    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
      Latest updates and activities on your platform
    </p>
  </div>
  
  <div class="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden shadow-xl">
    <div class="px-8 py-6 border-b border-gray-200/50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-700/50">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">Activity Feed</h3>
      <p class="text-gray-600 dark:text-gray-400 text-sm">Real-time platform updates</p>
    </div>
    
    <div class="divide-y divide-gray-200/50 dark:divide-slate-700/50">
      <div class="px-8 py-6 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors duration-300 group">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-base text-gray-900 dark:text-white font-medium">
              New user <span class="font-semibold text-blue-600 dark:text-blue-400">john.doe@example.com</span> registered
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">2 minutes ago</p>
          </div>
          <div class="text-right">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div class="px-8 py-6 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors duration-300 group">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-base text-gray-900 dark:text-white font-medium">
              System maintenance completed successfully
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">1 hour ago</p>
          </div>
          <div class="text-right">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div class="px-8 py-6 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors duration-300 group">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-base text-gray-900 dark:text-white font-medium">
              AI Chat model updated to latest version
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">3 hours ago</p>
          </div>
          <div class="text-right">
            <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>