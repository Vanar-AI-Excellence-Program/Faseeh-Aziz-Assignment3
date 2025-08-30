<script lang="ts">
  import StatCard from '$lib/components/StatCard.svelte';
  import ActionCard from '$lib/components/ActionCard.svelte';
  import ChartCard from '$lib/components/ChartCard.svelte';
  
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

<svelte:head>
  <title>Dashboard - User Portal</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        🏠 User Dashboard
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Welcome back, {data.user.name || 'User'}! Here's your personalized overview
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Email: {data.user.email} • Role: {data.user.role}
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.totalUsers.toLocaleString()}</p>
          </div>
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 1 4-4h4 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Verified Users</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.verifiedUsers.toLocaleString()}</p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
            <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Users</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.adminUsers}</p>
          </div>
          <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <svg class="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Users</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.unverifiedUsers}</p>
          </div>
          <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h2>
        <p class="text-gray-600 dark:text-gray-300">Access the most important features</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            User Management
          </h3>
          
          <p class="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            Browse and manage user accounts with advanced filtering
          </p>
          
          <a 
            href="/admin/users"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Manage Users
            <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            AI Chat Interface
          </h3>
          
          <p class="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            Access the intelligent AI-powered chat application
          </p>
          
          <a 
            href="/chat"
            class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Open Chat
            <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
          <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            System Settings
          </h3>
          
          <p class="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            Manage your profile and system preferences
          </p>
          
          <a 
            href="/settings"
            class="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Configure
            <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Platform Overview -->
    <div class="mb-8">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Platform Overview</h2>
        <p class="text-gray-600 dark:text-gray-300">Key metrics and insights about your platform</p>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- User Growth Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">User Growth</h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm">Monthly progression</p>
            </div>
          </div>
          
          <div class="h-32 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                +{userGrowthData[userGrowthData.length - 1].users - userGrowthData[0].users}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-300">
                New users this year
              </div>
            </div>
          </div>
        </div>

        <!-- System Health -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm">Service status</p>
            </div>
          </div>
          
          <div class="space-y-3">
            {#each systemHealthData as service}
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {service.service}
                  </span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold text-gray-900 dark:text-white">
                    {service.uptime}%
                  </div>
                  <div class="text-xs text-green-600 dark:text-green-400 capitalize">
                    {service.status}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- AI Chat Shortcut -->
    <div class="mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span class="text-sm font-medium text-purple-600 dark:text-purple-400">AI Assistant</span>
            </div>
            
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI Chat Assistant
            </h3>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Your AI assistant is ready to help with user support, system questions, and platform insights.
            </p>
            
            <a 
              href="/chat"
              class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Open Chat
              <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          <div class="hidden lg:block">
            <div class="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
              <svg class="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div>
      <div class="text-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Recent Activity</h2>
        <p class="text-gray-600 dark:text-gray-300">Latest updates and activities on your platform</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Activity Feed</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">Real-time platform updates</p>
        </div>
        
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-900 dark:text-white font-medium">
                  New user <span class="font-semibold text-blue-600 dark:text-blue-400">john.doe@example.com</span> registered
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
              </div>
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          
          <div class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-900 dark:text-white font-medium">
                  System maintenance completed successfully
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
              </div>
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
          
          <div class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-900 dark:text-white font-medium">
                  AI Chat model updated to latest version
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">3 hours ago</p>
              </div>
              <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>