<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import Card from '$lib/components/Card.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { fly, fade } from 'svelte/transition';
  
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
  let showToast = false;
  let showConfirmDialog = false;
  let confirmAction = '';
  let confirmUserId = '';
  let confirmUserEmail = '';
  
  // Create a local copy of users data for immediate updates
  let localUsers = [...data.users];
  
  // Sync local users with server data when it changes
  $: if (data.users) {
    localUsers = [...data.users];
  }

  // Watch for message changes to show/hide toast
  $: if (message !== '') {
    showToast = true;
  }

  // Filter and sort users
  $: filteredUsers = localUsers
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
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  }

  function getStatusBadgeColor(disabled: boolean, emailVerified: boolean) {
    if (disabled) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (!emailVerified) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }

  function getStatusText(disabled: boolean, emailVerified: boolean) {
    if (disabled) return 'Disabled';
    if (!emailVerified) return 'Unverified';
    return 'Active';
  }

  // Handle form messages and update local state
  $: if ($page.form?.action === 'changeRole' && $page.form?.success) {
    message = $page.form.message || 'User role updated successfully';
    messageType = 'success';
    setTimeout(() => {
      message = '';
      showToast = false;
    }, 3000);
    
    // Update local user data immediately to prevent UI flash
    const formData = new FormData($page.form?.data);
    const userId = formData.get('userId');
    const newRole = formData.get('role');
    
    if (userId && newRole) {
      const userIndex = localUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        localUsers[userIndex] = { ...localUsers[userIndex], role: newRole as string };
        localUsers = [...localUsers];
      }
    }
  }

  $: if ($page.form?.action === 'toggleUserStatus' && $page.form?.success) {
    message = $page.form.message || 'User status updated successfully';
    messageType = 'success';
    setTimeout(() => {
      message = '';
      showToast = false;
    }, 3000);
    
    // Update local user data immediately
    const formData = new FormData($page.form?.data);
    const userId = formData.get('userId');
    const newStatus = formData.get('disabled');
    
    if (userId && newStatus !== null) {
      const userIndex = localUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        localUsers[userIndex] = { ...localUsers[userIndex], disabled: newStatus === 'true' };
        localUsers = [...localUsers];
      }
    }
  }

  function confirmAction(action: string, userId: string, userEmail: string) {
    confirmAction = action;
    confirmUserId = userId;
    confirmUserEmail = userEmail;
    showConfirmDialog = true;
  }

  function closeConfirmDialog() {
    showConfirmDialog = false;
    confirmAction = '';
    confirmUserId = '';
    confirmUserEmail = '';
  }

  // Function to update local user status immediately
  function updateLocalUserStatus(userId: string, newStatus?: boolean) {
    console.log('[frontend] updateLocalUserStatus called for userId:', userId, 'newStatus:', newStatus);
    const userIndex = localUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      if (newStatus !== undefined) {
        // Use the exact status from the server response
        localUsers[userIndex].disabled = newStatus;
        console.log('[frontend] Updated local user disabled status to:', newStatus);
      } else {
        // Fallback: toggle the current status
        localUsers[userIndex].disabled = !localUsers[userIndex].disabled;
        console.log('[frontend] Fallback: toggled local user disabled status to:', localUsers[userIndex].disabled);
      }
      // Trigger reactivity by reassigning the array
      localUsers = [...localUsers];
    }
  }

  // Function to refresh the page data (keeping for backup)
  function refreshPageData() {
    console.log('[frontend] refreshPageData called');
    // Simple approach: reload the page after a short delay
    setTimeout(() => {
      console.log('[frontend] Reloading page to reflect changes');
      window.location.reload();
    }, 500); // Reduced delay for better UX
  }
</script>

<!-- Page Header -->
<div class="mb-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Manage user accounts, roles, and permissions</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="text-right">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{filteredUsers.length}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
      </div>
    </div>
  </div>
</div>

<!-- Filters and Search -->
<div class="mb-8">
  <Card>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Search -->
      <div class="lg:col-span-2">
        <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Users</label>
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="Search by name or email..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        />
      </div>

      <!-- Role Filter -->
      <div>
        <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
        <select
          id="role"
          bind:value={selectedRole}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      <!-- Status Filter -->
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
        <select
          id="status"
          bind:value={showDisabled}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        >
          <option value="all">All Status</option>
          <option value="enabled">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <!-- Sort -->
      <div>
        <label for="sort" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
        <select
          id="sort"
          bind:value={sortBy}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        >
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="role">Role</option>
        </select>
      </div>
    </div>

    <!-- Sort Order Toggle -->
    <div class="mt-4 flex items-center gap-2">
      <button
        onclick={() => sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'}
        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        {#if sortOrder === 'asc'}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          Ascending
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          Descending
        {/if}
      </button>
    </div>
  </Card>
</div>

<!-- Users Table -->
<div in:fly={{ y: 20, duration: 400, delay: 200 }}>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead class="bg-gray-50 dark:bg-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          {#each filteredUsers as user (user.id)}
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-150">
              <!-- User Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name || 'No Name'}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
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
                      class="text-xs px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors hover:border-indigo-400 cursor-pointer"
                      onchange={(e) => {
                        const form = e.target.form;
                        if (form) {
                          // Update local state immediately for instant UI feedback
                          const userId = form.querySelector('input[name="userId"]')?.value;
                          const newRole = (e.target as HTMLSelectElement).value;
                          if (userId && newRole) {
                            const userIndex = localUsers.findIndex(u => u.id === userId);
                            if (userIndex !== -1) {
                              localUsers[userIndex].role = newRole;
                              localUsers = [...localUsers];
                            }
                          }
                          // Submit the form
                          form.submit();
                        }
                      }}
                    >
                      <option value="user" selected={user.role === 'user'}>User</option>
                      <option value="admin" selected={user.role === 'admin'}>Admin</option>
                    </select>
                  </form>

                  <!-- Toggle Status -->
                  <button
                    type="button"
                    onclick={() => {
                      // Don't update local state yet - wait for confirmation
                      // Just show the confirmation dialog with the action that would be performed
                      const action = user.disabled ? 'enable' : 'disable';
                      confirmAction(action, user.id, user.email);
                    }}
                    class="text-xs px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer {user.disabled 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'}"
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
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
        <p class="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
      </div>
    {/if}
  </div>
</div>

<!-- Confirmation Dialog -->
{#if showConfirmDialog}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" transition:fade={{ duration: 200 }}>
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" transition:fly={{ y: -20, duration: 200 }}>
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full {confirmAction === 'disable' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}">
          {#if confirmAction === 'disable'}
            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          {:else}
            <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">
          Confirm {confirmAction === 'disable' ? 'Disable' : 'Enable'} User
        </h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to {confirmAction} the user account for <strong class="text-gray-900 dark:text-white">{confirmUserEmail}</strong>?
          </p>
          {#if confirmAction === 'disable'}
            <p class="text-sm text-red-500 dark:text-red-400 mt-2">
              This user will not be able to log in until re-enabled.
            </p>
          {/if}
        </div>
        <div class="items-center px-4 py-3">
          <div class="flex justify-center space-x-3">
            <button
              onclick={closeConfirmDialog}
              class="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg shadow-sm hover:bg-gray-400 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer transition-colors duration-200"
            >
              Cancel
            </button>
            <form method="POST" action="?/toggleUserStatus" use:enhance={() => {
              console.log('[frontend] Form submission started for toggleUserStatus');
              // Store the user ID before hiding the dialog
              const userIdToUpdate = confirmUserId;
              return async ({ result }) => {
                console.log('[frontend] Form submission result:', result);
                // Hide the confirmation dialog after form submission
                closeConfirmDialog();
                
                // If there's an error, show it
                if (result.type === 'failure') {
                  console.error('Form submission failed:', result);
                } else if (result.type === 'success') {
                  // Update local state immediately to reflect changes without page reload
                  console.log('[frontend] Updating local state after success');
                  console.log('[frontend] Full result object:', result);
                  console.log('[frontend] Result data:', result.data);
                  console.log('[frontend] Result data type:', typeof result.data);
                  
                  // Try different ways to access the data
                  let newStatus = result.data?.data?.disabled; // Access nested data structure
                  console.log('[frontend] Direct access to nested data:', result.data?.data);
                  
                  if (newStatus === undefined && result.data) {
                    // Try to parse if it's a string
                    try {
                      const parsedData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                      newStatus = parsedData.data?.disabled; // Access nested data in parsed result
                      console.log('[frontend] Parsed data:', parsedData);
                    } catch (e) {
                      console.log('[frontend] Failed to parse data:', e);
                    }
                  }
                  
                  console.log('[frontend] Final new status:', newStatus);
                  if (newStatus !== undefined) {
                    // Use the stored user ID instead of confirmUserId
                    updateLocalUserStatus(userIdToUpdate, newStatus);
                  } else {
                    // Fallback: toggle the current status
                    console.log('[frontend] Using fallback toggle');
                    updateLocalUserStatus(userIdToUpdate);
                  }
                }
              };
            }} class="inline">
              <input type="hidden" name="userId" value={confirmUserId} />
              <button
                type="submit"
                class="px-4 py-2 {confirmAction === 'disable' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white text-base font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 {confirmAction === 'disable' ? 'focus:ring-red-500' : 'focus:ring-green-500'} cursor-pointer transition-colors duration-200"
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

<!-- Toast Notifications -->
<Toast 
  bind:show={showToast} 
  type={messageType} 
  message={message} 
  on:close={() => {
    message = '';
    showToast = false;
  }} 
/>

<script>
  // Add the missing function
  function updateLocalUserStatus(userId: string, newStatus?: boolean) {
    const userIndex = localUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      if (newStatus !== undefined) {
        localUsers[userIndex] = { ...localUsers[userIndex], disabled: newStatus };
      } else {
        // Toggle current status
        localUsers[userIndex] = { ...localUsers[userIndex], disabled: !localUsers[userIndex].disabled };
      }
      localUsers = [...localUsers];
    }
  }
</script>
