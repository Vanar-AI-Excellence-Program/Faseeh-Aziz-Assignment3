<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let data: { 
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
  };
  
  let isClient = false;
  
  onMount(() => {
    isClient = true;
  });
</script>

{#if isClient}
  <div class="dashboard-content">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Admin Dashboard</h1>
      <p class="dashboard-subtitle">Welcome back, {data.user.name || 'Admin'}!</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{data.stats.totalUsers}</h3>
          <p class="stat-label">Total Users</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon verified-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{data.stats.verifiedUsers}</h3>
          <p class="stat-label">Verified Users</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon unverified-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{data.stats.unverifiedUsers}</h3>
          <p class="stat-label">Unverified Users</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon admin-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{data.stats.adminUsers}</h3>
          <p class="stat-label">Admin Users</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon regular-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{data.stats.regularUsers}</h3>
          <p class="stat-label">Regular Users</p>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2 class="section-title">Quick Actions</h2>
      <div class="actions-grid">
        <a href="/user" class="action-card">
          <div class="action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <h3>View All Users</h3>
          <p>Browse and manage user accounts</p>
        </a>

        <a href="/chat" class="action-card">
          <div class="action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>Open Chat</h3>
          <p>Access the chat application</p>
        </a>

        <a href="/settings" class="action-card">
          <div class="action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <h3>Settings</h3>
          <p>Manage your profile and preferences</p>
        </a>
      </div>
    </div>
  </div>
{/if}

<style>
  .dashboard-content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .dashboard-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .dashboard-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .users-icon { background: linear-gradient(135deg, #00ABE4 0%, #34c5f1 100%); }
  .verified-icon { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
  .unverified-icon { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
  .admin-icon { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); }
  .regular-icon { background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); }

  .stat-content h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .stat-content p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
  }

  .quick-actions {
    margin-top: 2rem;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .action-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    text-align: center;
  }

  .action-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }

  .action-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #00ABE4 0%, #34c5f1 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
  }

  .action-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .action-card p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .dashboard-content {
      padding: 1rem;
    }
    
    .dashboard-title {
      font-size: 2rem;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .actions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>