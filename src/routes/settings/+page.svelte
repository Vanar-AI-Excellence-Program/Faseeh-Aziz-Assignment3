<script lang="ts">
  import { page } from '$app/stores';
  import { handleLogout } from '$lib/auth/logout';
  import { enhance } from '$app/forms';
  
  export let data: {
    user: { id?: string; name?: string | null; email?: string | null; role?: string | null };
  };

  export let form: { error?: string; success?: boolean; message?: string } | null = null;

  let showPasswordFields = false;
  let name = data.user.name || '';
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let isSubmitting = false;

  function togglePasswordFields() {
    showPasswordFields = !showPasswordFields;
    if (!showPasswordFields) {
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    }
  }
</script>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="card">
    <h1 class="mb-2 text-2xl font-semibold">Settings</h1>
    <p class="text-sm text-gray-600">Manage your profile and account settings</p>
  </div>

  <!-- Profile Update Form -->
  <div class="card">
    <h2 class="mb-4 text-xl font-semibold">Profile Information</h2>
    
    {#if form?.error}
      <div class="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
        <div class="text-sm text-red-700">{form.error}</div>
      </div>
    {/if}

    {#if form?.success}
      <div class="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
        <div class="text-sm text-green-700">{form.message || 'Profile updated successfully!'}</div>
      </div>
    {/if}

    <form method="POST" action="?/updateProfile" use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        await update();
        isSubmitting = false;
      };
    }}>
      <div class="space-y-4">
        <!-- Current User Info -->
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={data.user.email || ''} 
              disabled 
              class="input bg-gray-50 text-gray-500" 
            />
            <p class="text-xs text-gray-500">Email cannot be changed</p>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Role</label>
            <input 
              type="text" 
              value={data.user.role || 'user'} 
              disabled 
              class="input bg-gray-50 text-gray-500 capitalize" 
            />
          </div>
        </div>

        <!-- Editable Name -->
        <div class="space-y-2">
          <label for="name" class="text-sm font-medium text-gray-700">Full Name</label>
          <input 
            id="name"
            type="text" 
            name="name" 
            bind:value={name}
            placeholder="Enter your full name"
            required
            class="input" 
          />
        </div>

        <!-- Password Update Section -->
        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Password</h3>
            <button 
              type="button" 
              on:click={togglePasswordFields}
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              {showPasswordFields ? 'Cancel password change' : 'Change password'}
            </button>
          </div>

          {#if showPasswordFields}
            <div class="space-y-4">
              <div class="space-y-2">
                <label for="currentPassword" class="text-sm font-medium text-gray-700">Current Password</label>
                <input 
                  id="currentPassword"
                  type="password" 
                  name="currentPassword" 
                  bind:value={currentPassword}
                  placeholder="Enter your current password"
                  class="input" 
                />
                <p class="text-xs text-gray-500">Required only if you have a password set</p>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <label for="newPassword" class="text-sm font-medium text-gray-700">New Password</label>
                  <input 
                    id="newPassword"
                    type="password" 
                    name="newPassword" 
                    bind:value={newPassword}
                    placeholder="Enter new password"
                    class="input" 
                  />
                </div>
                <div class="space-y-2">
                  <label for="confirmPassword" class="text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    name="confirmPassword" 
                    bind:value={confirmPassword}
                    placeholder="Confirm new password"
                    class="input" 
                  />
                </div>
              </div>
              <p class="text-xs text-gray-500">Password must be at least 8 characters long</p>
            </div>
          {/if}
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            class="btn btn-primary"
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </div>
    </form>
    </div>

  {#if data.user.role === 'admin'}
    <!-- Admin-specific sections -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- User Management -->
      <div class="card">
        <h2 class="mb-3 text-lg font-semibold">User Management</h2>
        <p class="text-sm text-gray-600 mb-4">Manage user roles and account status</p>
        <a href="/dashboard" class="btn btn-primary">
          Go to User Dashboard
        </a>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h2 class="mb-3 text-lg font-semibold">Quick Actions</h2>
        <div class="space-y-2">
          <a href="/dashboard" class="block text-blue-600 hover:text-blue-800 text-sm">
            → View all users
          </a>
          <a href="/user" class="block text-blue-600 hover:text-blue-800 text-sm">
            → User profile
          </a>
          <button 
            on:click={handleLogout}
            class="block text-red-600 hover:text-red-800 text-sm text-left w-full"
          >
            → Sign out
          </button>
        </div>
      </div>
    </div>

    <!-- Admin Notes -->
    <div class="card">
      <h2 class="mb-3 text-lg font-semibold">Admin Notes</h2>
      <div class="prose prose-sm max-w-none">
        <ul class="list-disc list-inside space-y-1 text-gray-600">
          <li>Use the dashboard to manage user roles and account status</li>
          <li>Both users and admins can access this settings page</li>
          <li>Disabled users cannot log in until re-enabled</li>
          <li>Admins cannot modify their own account status or demote themselves</li>
          <li>All changes are logged and can be reviewed in the database</li>
        </ul>
      </div>
    </div>
  {/if}
  </div>


