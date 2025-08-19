<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  
  export let data: {
    users: Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      disabled: boolean;
      emailVerified: boolean;
    }>;
  };

  let searchTerm = '';
  let selectedRole = 'all';
  let showDisabled = 'all';
  let sortBy = 'name';
  let sortOrder = 'asc';
  let message = '';
  let messageType = 'success';
  let showConfirmDialog = false;
  let confirmAction = '';
  let confirmUserId = '';
  let confirmUserEmail = '';

  // Filter and sort users
  $: filteredUsers = data.users
    .filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesStatus = showDisabled === 'all' || 
                           (showDisabled === 'enabled' && !user.disabled) ||
                           (showDisabled === 'disabled' && user.disabled);
      
      return matchesSearch && matchesRole && matchesStatus;
    })
         .sort((a, b) => {
       let aValue: any = a[sortBy];
       let bValue: any = b[sortBy];
       
       if (sortOrder === 'asc') {
         return aValue > bValue ? 1 : -1;
       } else {
         return aValue < bValue ? 1 : -1;
       }
     });



  function getRoleBadgeColor(role: string) {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }

  function getStatusBadgeColor(disabled: boolean, emailVerified: boolean) {
    if (disabled) return 'bg-red-100 text-red-800';
    if (!emailVerified) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  function getStatusText(disabled: boolean, emailVerified: boolean) {
    if (disabled) return 'Disabled';
    if (!emailVerified) return 'Unverified';
    return 'Active';
  }

  // Handle form messages
  $: if ($page.form?.action === 'changeRole' && $page.form?.success) {
    message = $page.form.message || 'User role updated successfully';
    messageType = 'success';
    setTimeout(() => message = '', 3000);
  }
  
  $: if ($page.form?.action === 'toggleUserStatus' && $page.form?.success) {
    message = $page.form.message || 'User status updated successfully';
    messageType = 'success';
    setTimeout(() => message = '', 3000);
  }
  
  $: if ($page.form?.error) {
    message = $page.form.message || 'An error occurred';
    messageType = 'error';
    setTimeout(() => message = '', 5000);
  }

  function showConfirm(action: string, userId: string, userEmail: string) {
    confirmAction = action;
    confirmUserId = userId;
    confirmUserEmail = userEmail;
    showConfirmDialog = true;
  }

  function hideConfirm() {
    showConfirmDialog = false;
    confirmAction = '';
    confirmUserId = '';
    confirmUserEmail = '';
  }
</script>

<svelte:head>
  <title>User Management - Admin Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <a href="/dashboard" class="text-blue-600 hover:text-blue-800 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
            <p class="text-gray-600 mt-2">Manage all users, roles, and account status</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
          <div class="text-sm text-gray-500">Total Users</div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if message}
      <div class="mb-6 p-4 rounded-md {messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}">
        <div class="flex">
          <div class="flex-shrink-0">
            {#if messageType === 'success'}
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            {:else}
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            {/if}
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{message}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Filters and Search -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
          <input
            id="search"
            type="text"
            bind:value={searchTerm}
            placeholder="Search by name or email..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Role Filter -->
        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            id="role"
            bind:value={selectedRole}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            id="status"
            bind:value={showDisabled}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="enabled">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>

        <!-- Sort -->
        <div>
          <label for="sort" class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                     <select
             id="sort"
             bind:value={sortBy}
             class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           >
             <option value="name">Name</option>
             <option value="email">Email</option>
             <option value="role">Role</option>
           </select>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
                             <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Status
               </th>
               <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Actions
               </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredUsers as user (user.id)}
              <tr class="hover:bg-gray-50">
                <!-- User Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-sm font-medium text-blue-600">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {user.name || 'No Name'}
                      </div>
                      <div class="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>

                <!-- Role -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleBadgeColor(user.role)}">
                    {user.role}
                  </span>
                </td>

                                 <!-- Status -->
                 <td class="px-6 py-4 whitespace-nowrap">
                   <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeColor(user.disabled, user.emailVerified)}">
                     {getStatusText(user.disabled, user.emailVerified)}
                   </span>
                 </td>

                 <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <!-- Change Role -->
                    <form method="POST" action="?/changeRole" use:enhance class="inline">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        class="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors hover:border-blue-400"
                        onchange={(e) => e.target.form?.submit()}
                      >
                        <option value="user" selected={user.role === 'user'}>User</option>
                        <option value="admin" selected={user.role === 'admin'}>Admin</option>
                      </select>
                    </form>

                    <!-- Toggle Status -->
                    <button
                      type="button"
                      onclick={() => showConfirm(user.disabled ? 'enable' : 'disable', user.id, user.email)}
                      class="text-xs px-3 py-1 rounded-md transition-colors {user.disabled 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'}"
                    >
                      {user.disabled ? 'Enable' : 'Disable'}
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      {#if filteredUsers.length === 0}
        <div class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p class="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Confirmation Dialog -->
  {#if showConfirmDialog}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full {confirmAction === 'disable' ? 'bg-red-100' : 'bg-green-100'}">
            {#if confirmAction === 'disable'}
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            {:else}
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {/if}
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-4">
            Confirm {confirmAction === 'disable' ? 'Disable' : 'Enable'} User
          </h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to {confirmAction} the user account for <strong>{confirmUserEmail}</strong>?
            </p>
            {#if confirmAction === 'disable'}
              <p class="text-sm text-red-500 mt-2">
                This user will not be able to log in until re-enabled.
              </p>
            {/if}
          </div>
          <div class="items-center px-4 py-3">
            <div class="flex justify-center space-x-3">
              <button
                onclick={hideConfirm}
                class="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <form method="POST" action="?/toggleUserStatus" use:enhance class="inline">
                <input type="hidden" name="userId" value={confirmUserId} />
                <button
                  type="submit"
                  class="px-4 py-2 {confirmAction === 'disable' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 {confirmAction === 'disable' ? 'focus:ring-red-500' : 'focus:ring-green-500'}"
                >
                  {confirmAction === 'disable' ? 'Disable' : 'Enable'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
