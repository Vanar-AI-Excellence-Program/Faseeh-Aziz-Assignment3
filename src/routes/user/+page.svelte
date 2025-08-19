<script lang="ts">
  import { browser } from '$app/environment';
  
  export let data: { 
    user: { 
      id?: string; 
      name?: string | null; 
      email?: string | null; 
      role?: string | null 
    } 
  };
  
  let isClient = false;
  
  if (browser) {
    isClient = true;
  }
</script>

{#if isClient && data?.user}
  <div class="user-content">
    <div class="welcome-section">
      <h1 class="welcome-title">Hello {data.user.name || 'User'}</h1>
      <p class="welcome-subtitle">Welcome back.</p>
    </div>
    
    <div class="content-cards">
      <div class="content-card">
        <!-- Empty card for future content -->
      </div>
      
      <div class="content-card">
        <a href="/settings" class="settings-link">Go to settings</a>
      </div>
    </div>
  </div>
{:else}
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
{/if}

<style>
  .user-content {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .welcome-section {
    text-align: center;
    margin-bottom: 3rem;
  }

  .welcome-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .welcome-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
  }

  .content-cards {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .content-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .settings-link {
    color: #00ABE4;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.125rem;
    transition: color 0.2s ease;
  }

  .settings-link:hover {
    color: #0095c7;
  }

  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #6b7280;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #00ABE4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .user-content {
      padding: 1rem;
    }
    
    .welcome-title {
      font-size: 2rem;
    }
  }
</style>

