<script lang="ts">
  import ChatPopup from '$lib/components/ChatPopup.svelte';
</script>

<!-- existing dashboard content remains below -->

<ChatPopup title="Admin Assistant" placeholder="Ask about admin features..." />
<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  
  export let data: {
    user: { name?: string | null; email?: string | null; role?: string | null };
    users: { id: string; email: string | null; role: string; disabled: boolean }[];
    stats: { total: number; admins: number; disabled: number };
  };

  let selectedUser: { id: string; email: string | null; role: string; disabled: boolean } | null = null;
  let showRoleModal = false;
  let showStatusModal = false;
  let newRole = 'user';
  let action = 'disable';

  function openRoleModal(user: typeof data.users[0]) {
    selectedUser = user;
    newRole = user.role;
    showRoleModal = true;
  }

  function openStatusModal(user: typeof data.users[0]) {
    selectedUser = user;
    action = user.disabled ? 'enable' : 'disable';
    showStatusModal = true;
  }

  function closeModals() {
    showRoleModal = false;
    showStatusModal = false;
    selectedUser = null;
  }

  // Auto-refresh after form submission
  $: if ($page.form?.success) {
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
</script>

<div class="mx-auto max-w-5xl space-y-6">
  <div class="card">
    <h1 class="mb-2 text-2xl font-semibold">Admin dashboard</h1>
    <p class="text-sm text-gray-600">Users: {data.stats.total} • Admins: {data.stats.admins} • Disabled: {data.stats.disabled}</p>
  </div>

  <div class="card">
    <h2 class="mb-3 text-lg font-semibold">Registered users</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="text-gray-600">
          <tr>
            <th class="py-2">Email</th>
            <th class="py-2">Role</th>
            <th class="py-2">Status</th>
            <th class="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.users as u}
            <tr class="border-t">
              <td class="py-2">{u.email}</td>
              <td class="py-2">
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
                  {u.role}
                </span>
              </td>
              <td class="py-2">
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {u.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                  {u.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
              <td class="py-2">
                <div class="flex gap-2">
                  <button 
                    on:click={() => openRoleModal(u)}
                    class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={u.id === data.user.id}
                  >
                    Change Role
                  </button>
                  <button 
                    on:click={() => openStatusModal(u)}
                    class="text-xs {u.disabled ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 rounded hover:opacity-80 disabled:opacity-50"
                    disabled={u.id === data.user.id}
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Role Change Modal -->
  {#if showRoleModal && selectedUser}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Change User Role</h3>
        <p class="text-sm text-gray-600 mb-4">Change role for user: <strong>{selectedUser.email}</strong></p>
        
        <form method="POST" action="?/changeRole" use:enhance>
          <input type="hidden" name="userId" value={selectedUser.id} />
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">New Role</label>
            <select name="role" bind:value={newRole} class="w-full border rounded px-3 py-2">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div class="flex gap-3 justify-end">
            <button type="button" on:click={closeModals} class="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Status Toggle Modal -->
  {#if showStatusModal && selectedUser}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Toggle User Status</h3>
        <p class="text-sm text-gray-600 mb-4">
          {action === 'disable' ? 'Disable' : 'Enable'} user: <strong>{selectedUser.email}</strong>
        </p>
        
        <form method="POST" action="?/toggleUserStatus" use:enhance>
          <input type="hidden" name="userId" value={selectedUser.id} />
          <input type="hidden" name="action" value={action} />
          
          <div class="mb-4">
            <p class="text-sm text-gray-600">
              {action === 'disable' 
                ? 'This user will not be able to log in until re-enabled.' 
                : 'This user will be able to log in again.'}
            </p>
          </div>
          
          <div class="flex gap-3 justify-end">
            <button type="button" on:click={closeModals} class="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 {action === 'disable' ? 'bg-red-500' : 'bg-green-500'} text-white rounded hover:opacity-80"
            >
              {action === 'disable' ? 'Disable User' : 'Enable User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Success Message -->
  {#if $page.form?.success}
    <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
      {$page.form.message}
    </div>
  {/if}

  <!-- Error Message -->
  {#if $page.form?.error}
    <div class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
      {$page.form.error}
    </div>
  {/if}
</div>