<script lang="ts">
  export let data: {
    user: { name?: string | null; email?: string | null; role?: string | null };
    users: { id: string; email: string | null; role: string; disabled: boolean }[];
    stats: { total: number; admins: number; disabled: number };
  };
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
          </tr>
        </thead>
        <tbody>
          {#each data.users as u}
            <tr class="border-t">
              <td class="py-2">{u.email}</td>
              <td class="py-2">{u.role}</td>
              <td class="py-2">{u.disabled ? 'Disabled' : 'Active'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <h2 class="mb-2 text-lg font-semibold">Administrative controls</h2>
    <p class="text-sm text-gray-600">Promote/demote and disable/enable users in Drizzle Studio for now. If you want, I can add in-app controls here next.</p>
  </div>
</div>