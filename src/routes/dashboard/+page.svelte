<script lang="ts">
  export let data: { user: { name?: string | null; email?: string | null } };
</script>

<div class="mx-auto max-w-3xl space-y-6">
  <div class="card">
    <h1 class="mb-2 text-2xl font-semibold">Dashboard</h1>
    <p class="text-gray-600">Signed in as {data.user.email}</p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="card">
      <h2 class="mb-2 font-semibold">Quick actions</h2>
      <form method="POST" action="/auth/signout?callbackUrl=/login" class="mt-2">
        <button class="btn-primary">Sign out</button>
      </form>
    </div>

    <div class="card">
      <h2 class="mb-2 font-semibold">Next steps</h2>
      <ul class="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>Update your profile</li>
        <li>Try protected routes</li>
        <li>Explore session JSON at <a class="underline" href="/auth/session">/auth/session</a></li>
      </ul>
    </div>
  </div>
</div>