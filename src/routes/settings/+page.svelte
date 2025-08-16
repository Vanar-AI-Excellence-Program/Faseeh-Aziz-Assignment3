<script lang="ts">
  import { page } from '$app/stores';
  import AdminGuard from '$lib/components/AdminGuard.svelte';
  import { handleLogout } from '$lib/auth/logout';
  
  export let data: {
    user: { name?: string | null; email?: string | null; role?: string | null };
  };
</script>

<AdminGuard>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="card">
      <h1 class="mb-2 text-2xl font-semibold">Admin Settings</h1>
      <p class="text-sm text-gray-600">Manage system settings and user permissions</p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- User Management -->
      <div class="card">
        <h2 class="mb-3 text-lg font-semibold">User Management</h2>
        <p class="text-sm text-gray-600 mb-4">Manage user roles and account status</p>
        <a href="/dashboard" class="btn btn-primary">
          Go to User Dashboard
        </a>
      </div>

      <!-- System Information -->
      <div class="card">
        <h2 class="mb-3 text-lg font-semibold">System Information</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Current User:</span>
            <span class="font-medium">{data.user.email}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Role:</span>
            <span class="font-medium">{data.user.role}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Name:</span>
            <span class="font-medium">{data.user.name || 'Not set'}</span>
          </div>
        </div>
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

      <!-- Security -->
      <div class="card">
        <h2 class="mb-3 text-lg font-semibold">Security</h2>
        <p class="text-sm text-gray-600 mb-4">Admin account security settings</p>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Account Status:</span>
            <span class="text-green-600 font-medium">Active</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Last Login:</span>
            <span class="font-medium">Recent</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Notes -->
    <div class="card">
      <h2 class="mb-3 text-lg font-semibold">Admin Notes</h2>
      <div class="prose prose-sm max-w-none">
        <ul class="list-disc list-inside space-y-1 text-gray-600">
          <li>Use the dashboard to manage user roles and account status</li>
          <li>Users with 'admin' role can access this page and the dashboard</li>
          <li>Disabled users cannot log in until re-enabled</li>
          <li>Admins cannot modify their own account status or demote themselves</li>
          <li>All changes are logged and can be reviewed in the database</li>
        </ul>
      </div>
    </div>
  </div>
</AdminGuard>


