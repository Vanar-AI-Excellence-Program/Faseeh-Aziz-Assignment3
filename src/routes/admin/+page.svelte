<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  export let data: {
    user: { id: string; name?: string | null; email?: string | null; role?: string | null };
    stats: {
      users: number;
      documents: number;
      chunks: number;
      embeddings: number;
      chats: number;
      messages: number;
    };
    recentUsers: Array<{
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string | null;
      createdAt: Date;
    }>;
    recentDocuments: Array<{
      id: number;
      name: string;
      uploadedBy: string;
      createdAt: Date;
      metadata: any;
    }>;
    recentChats: Array<{
      id: string;
      title: string;
      createdAt: Date;
      userId: string;
    }>;
  };

  let activeTab = 'overview';
  let searchQuery = '';

  onMount(() => {
    if (!data.user?.id || data.user.role !== 'admin') {
      goto('/dashboard');
    }
  });

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<svelte:head>
  <title>Admin Dashboard - RAG System</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        🛡️ Admin Dashboard
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Manage users, monitor documents, and oversee system performance
      </p>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex justify-center mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
        <button
          class="px-6 py-2 rounded-lg transition-all duration-200 {activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}"
          on:click={() => activeTab = 'overview'}
        >
          📊 Overview
        </button>
        <button
          class="px-6 py-2 rounded-lg transition-all duration-200 {activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}"
          on:click={() => activeTab = 'users'}
        >
          👥 Users
        </button>
        <button
          class="px-6 py-2 rounded-lg transition-all duration-200 {activeTab === 'documents' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}"
          on:click={() => activeTab = 'documents'}
        >
          📄 Documents
        </button>
        <button
          class="px-6 py-2 rounded-lg transition-all duration-200 {activeTab === 'chats' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}"
          on:click={() => activeTab = 'chats'}
        >
          💬 Chats
        </button>
      </div>
    </div>

    <!-- Overview Tab -->
    {#if activeTab === 'overview'}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- Stats Cards -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.users}</p>
            </div>
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.documents}</p>
            </div>
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Chunks</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.chunks}</p>
            </div>
            <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <svg class="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Embeddings</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.embeddings}</p>
            </div>
            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Chats</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.chats}</p>
            </div>
            <div class="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full">
              <svg class="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Messages</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.messages}</p>
            </div>
            <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Users Tab -->
    {#if activeTab === 'users'}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h2>
          <div class="relative">
            <input
              type="text"
              placeholder="Search users..."
              bind:value={searchQuery}
              class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Name</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Email</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Joined</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each data.recentUsers.filter(u => 
                !searchQuery || 
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
              ) as user}
                <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="py-3 px-4 text-gray-900 dark:text-white">{user.name || 'N/A'}</td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-1 text-xs rounded-full {user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}">
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300">{formatDate(user.createdAt)}</td>
                  <td class="py-3 px-4">
                    <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Documents Tab -->
    {#if activeTab === 'documents'}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Document Overview</h2>
          <div class="relative">
            <input
              type="text"
              placeholder="Search documents..."
              bind:value={searchQuery}
              class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Name</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Uploaded By</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Size</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Chunks</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {#each data.recentDocuments.filter(doc => 
                !searchQuery || 
                doc.name.toLowerCase().includes(searchQuery.toLowerCase())
              ) as doc}
                <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="py-3 px-4 text-gray-900 dark:text-white font-medium">{doc.name}</td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300">{doc.uploadedBy}</td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {doc.metadata?.originalSize ? formatFileSize(doc.metadata.originalSize) : 'N/A'}
                  </td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {doc.metadata?.chunkCount || 'N/A'}
                  </td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300">{formatDate(doc.createdAt)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Chats Tab -->
    {#if activeTab === 'chats'}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Chat History</h2>
          <div class="relative">
            <input
              type="text"
              placeholder="Search chats..."
              bind:value={searchQuery}
              class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Title</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User ID</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each data.recentChats.filter(chat => 
                !searchQuery || 
                chat.title.toLowerCase().includes(searchQuery.toLowerCase())
              ) as chat}
                <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="py-3 px-4 text-gray-900 dark:text-white font-medium">{chat.title}</td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300 font-mono text-sm">{chat.userId}</td>
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300">{formatDate(chat.createdAt)}</td>
                  <td class="py-3 px-4">
                    <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                      View
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
