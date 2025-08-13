<script lang="ts">
  export let data: { me: { id: string; email: string | null; name: string | null } };
</script>

<div class="mx-auto max-w-md">
  <h1 class="mb-2 text-2xl font-semibold">Settings</h1>
  <p class="mb-6 text-sm text-gray-600">Manage your profile and password.</p>

  <div class="card p-6">
    <form method="POST" action="?/update" class="space-y-6">
      <div class="grid gap-3 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-medium">First name</label>
          <input class="input" type="text" name="firstName" value={data.me.firstName ?? ''} placeholder="John" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Last name</label>
          <input class="input" type="text" name="lastName" value={data.me.lastName ?? ''} placeholder="Doe" />
        </div>
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium">Username</label>
        <input class="input" type="text" name="name" value={data.me.name ?? ''} placeholder="username" />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium">Email</label>
        <input class="input" type="email" value={data.me.email ?? ''} disabled />
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <div class="space-y-2">
          <label class="text-sm font-medium">Current password</label>
          <input class="input" type="password" name="current" placeholder="••••••••" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">New password</label>
          <input class="input" type="password" name="next" placeholder="At least 8 characters" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Confirm new password</label>
          <input class="input" type="password" name="confirm" placeholder="Re-enter new password" />
        </div>
      </div>

      <div class="flex justify-center">
        <button class="btn btn-primary rounded-full px-4 py-2 text-sm">Save changes</button>
      </div>
    </form>
  </div>
</div>


