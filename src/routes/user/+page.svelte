<script lang="ts">
  import { browser } from '$app/environment';
  
  export let data: { 
    user: { 
      id?: string; 
      name?: string | null; 
      email?: string | null; 
      role?: string | null;
      emailVerified?: Date | null;
    };
    stats?: {
      totalChats: number;
      totalMessages: number;
    };
    recentChats?: Array<{
      id: string;
      title: string;
      updatedAt: Date;
    }>;
  };
  
  let isClient = false;
  
  if (browser) {
    isClient = true;
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getInitials(name: string | null, email: string | null) {
    if (name) {
      return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  }
</script>

{#if isClient && data?.user}
  <div class="dashboard-container">
    <!-- Header Section -->
    <div class="header-section">
      <div class="user-profile">
        <div class="avatar">
          {getInitials(data.user.name, data.user.email)}
        </div>
        <div class="user-info">
          <h1 class="welcome-title">Welcome back, {data.user.name || 'User'}!</h1>
          <p class="user-email">{data.user.email}</p>
          <div class="verification-status">
            {#if data.user.emailVerified}
              <span class="status-badge verified">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Email Verified
              </span>
            {:else}
              <span class="status-badge unverified">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Email Not Verified
              </span>
            {/if}
          </div>
        </div>
      </div>
        </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon chat-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{data.stats?.totalChats || 0}</h3>
          <p class="stat-label">Total Chats</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon message-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{data.stats?.totalMessages || 0}</h3>
          <p class="stat-label">Total Messages</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon ai-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-number">AI</h3>
          <p class="stat-label">Powered Chat</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2 class="section-title">Quick Actions</h2>
      <div class="action-buttons">
        <a href="/chat" class="action-btn primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Start New Chat
        </a>
        <a href="/settings" class="action-btn secondary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </a>
      </div>
    </div>

    <!-- Recent Activity -->
    {#if data.recentChats && data.recentChats.length > 0}
      <div class="recent-activity">
        <h2 class="section-title">Recent Chats</h2>
        <div class="chat-list">
          {#each data.recentChats as chat}
            <a href="/chat?id={chat.id}" class="chat-item">
              <div class="chat-info">
                <h3 class="chat-title">{chat.title}</h3>
                <p class="chat-date">Last updated: {formatDate(chat.updatedAt)}</p>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          {/each}
        </div>
        <div class="view-all">
          <a href="/chat" class="view-all-link">View All Chats →</a>
        </div>
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon">
          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 class="empty-title">No chats yet</h3>
        <p class="empty-description">Start your first conversation with AI to see your chat history here.</p>
        <a href="/chat" class="empty-action">Start Your First Chat</a>
      </div>
    {/if}
  </div>
  {:else}
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
{/if}

<style>
  .dashboard-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(135deg, #E9F1FA 0%, #F8FBFF 70%);
    min-height: 100vh;
  }

  /* Header Section */
  .header-section {
    background: linear-gradient(135deg, #00ABE4 0%, #34c5f1 100%);
    border-radius: 20px;
    padding: 2.5rem;
    margin-bottom: 2rem;
    color: white;
    box-shadow: 0 10px 30px rgba(0, 171, 228, 0.3);
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .avatar {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    border: 3px solid rgba(255, 255, 255, 0.3);
  }

  .user-info h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .user-email {
    font-size: 1.125rem;
    margin: 0 0 1rem 0;
    opacity: 0.9;
  }

  .verification-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-badge.verified {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .status-badge.unverified {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
  }

  /* Statistics Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(135deg, #00ABE4, #34c5f1);
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-icon.chat-icon {
    background: linear-gradient(135deg, #00ABE4, #1d4ed8);
  }

  .stat-icon.message-icon {
    background: linear-gradient(135deg, #34c5f1, #00ABE4);
  }

  .stat-icon.ai-icon {
    background: linear-gradient(135deg, #00ABE4, #34c5f1);
  }

  .stat-content h3 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 0.25rem 0;
    color: #1f2937;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    font-weight: 500;
  }

  /* Quick Actions */
  .quick-actions {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
  }

  .quick-actions::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(135deg, #00ABE4, #34c5f1);
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #00ABE4, #1d4ed8);
    color: white;
  }

  .action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 171, 228, 0.4);
  }

  .action-btn.secondary {
    background: white;
    color: #00ABE4;
    border-color: #00ABE4;
  }

  .action-btn.secondary:hover {
    background: #00ABE4;
    color: white;
    transform: translateY(-2px);
  }

  /* Recent Activity */
  .recent-activity {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
  }

  .recent-activity::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(135deg, #00ABE4, #34c5f1);
  }

  .chat-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .chat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .chat-item:hover {
    background: #f8fafc;
    border-color: #00ABE4;
    transform: translateX(4px);
  }

  .chat-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .chat-date {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .view-all {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .view-all-link {
    color: #00ABE4;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
  }

  .view-all-link:hover {
    color: #1d4ed8;
  }

  /* Empty State */
  .empty-state {
    background: white;
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
  }

  .empty-state::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(135deg, #00ABE4, #34c5f1);
  }

  .empty-icon {
    color: #9ca3af;
    margin-bottom: 1.5rem;
  }

  .empty-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .empty-description {
    color: #6b7280;
    margin: 0 0 2rem 0;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, #00ABE4, #1d4ed8);
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .empty-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 171, 228, 0.4);
  }

  /* Loading Spinner */
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

  /* Responsive Design */
  @media (max-width: 768px) {
    .dashboard-container {
      padding: 1rem;
    }
    
    .header-section {
      padding: 1.5rem;
    }
    
    .user-profile {
      flex-direction: column;
      text-align: center;
    }
    
    .avatar {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }
    
    .user-info h1 {
      font-size: 2rem;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .action-buttons {
      flex-direction: column;
    }
    
    .action-btn {
      justify-content: center;
    }
  }
</style>

