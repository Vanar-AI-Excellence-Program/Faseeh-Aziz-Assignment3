<script lang="ts">
  import { enhance } from '$app/forms';
  
  export let data: { 
    user: { 
      id?: string; 
      name?: string | null; 
      email?: string | null; 
      role?: string | null 
    } 
  };
  
  export let form: any;
  
  let isSubmitting = false;
  let showPasswordFields = false;
  let showCurrentPassword = false;
  let showNewPassword = false;
  let showConfirmPassword = false;
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let passwordSuccess = false;
  
  function togglePasswordFields() {
    showPasswordFields = !showPasswordFields;
    if (!showPasswordFields) {
      // Clear password fields when hiding
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      passwordSuccess = false;
    }
  }

  function clearPasswordFields() {
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;
    passwordSuccess = false;
  }
</script>

<div class="settings-content">
  <div class="content-wrapper">
    <h1 class="content-title">Your personal profile info</h1>
    
    {#if form?.error}
      <div class="error-message">
        {form.error}
      </div>
    {/if}
    
    {#if form?.success}
      <div class="success-message">
        {form.message || 'Profile updated successfully!'}
      </div>
    {/if}

    {#if passwordSuccess}
      <div class="success-message">
        Password updated successfully!
      </div>
    {/if}
    
    <form method="POST" action="?/updateProfile" use:enhance={() => {
      isSubmitting = true;
      console.log('Form submission started');
      return async ({ result }) => {
        isSubmitting = false;
        console.log('Form result:', result);
        if (result.type === 'success') {
          form = result;
          // Check if password was updated
          if (result.data?.passwordUpdated) {
            console.log('Password updated, clearing fields');
            passwordSuccess = true;
            clearPasswordFields();
            showPasswordFields = false;
            // Clear the success message after 3 seconds
            setTimeout(() => {
              passwordSuccess = false;
            }, 3000);
          }
        }
      };
    }}>
      <!-- Section 1: PROFILE -->
      <div class="section">
        <div class="section-header">
          <div class="section-number">1</div>
          <h2>PROFILE</h2>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={data.user.name || ''} 
              class="form-input" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={data.user.email || ''} 
              class="form-input" 
              disabled
            />
            <small class="email-note">Email cannot be changed</small>
          </div>
          
          <div class="form-group">
            <label for="role">Account Role</label>
            <input 
              type="text" 
              id="role" 
              value={data.user.role || 'User'} 
              class="form-input" 
              disabled
            />
          </div>
          
          <div class="form-group">
            <label for="userId">User ID</label>
            <input 
              type="text" 
              id="userId" 
              value={data.user.id || ''} 
              class="form-input" 
              disabled
            />
          </div>
        </div>
      </div>
      
      <!-- Section 2: PASSWORD -->
      <div class="section">
        <div class="section-header">
          <div class="section-number">2</div>
          <h2>PASSWORD</h2>
        </div>
        
        <div class="password-toggle">
          <button 
            type="button" 
            on:click={togglePasswordFields}
            class="toggle-btn"
          >
            {showPasswordFields ? 'Cancel password change' : 'Change password'}
          </button>
        </div>

        {#if showPasswordFields}
          <div class="form-grid">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <div class="password-input-wrapper">
                <input 
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword" 
                  bind:value={currentPassword}
                  placeholder="Enter your current password"
                  class="form-input password-input" 
                />
                <button 
                  type="button" 
                  class="password-toggle-btn"
                  on:click={() => showCurrentPassword = !showCurrentPassword}
                >
                  {#if showCurrentPassword}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  {/if}
                </button>
              </div>
              <small class="password-hint">Required only if you have a password set</small>
            </div>
            
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <div class="password-input-wrapper">
                <input 
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword" 
                  bind:value={newPassword}
                  placeholder="Enter new password"
                  class="form-input password-input" 
                  required
                />
                <button 
                  type="button" 
                  class="password-toggle-btn"
                  on:click={() => showNewPassword = !showNewPassword}
                >
                  {#if showNewPassword}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <div class="password-input-wrapper">
                <input 
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword" 
                  bind:value={confirmPassword}
                  placeholder="Confirm new password"
                  class="form-input password-input" 
                  required
                />
                <button 
                  type="button" 
                  class="password-toggle-btn"
                  on:click={() => showConfirmPassword = !showConfirmPassword}
                >
                  {#if showConfirmPassword}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <small class="password-hint">Password must be at least 8 characters long</small>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Action Button -->
      <div class="action-area">
        <button type="submit" disabled={isSubmitting} class="save-btn">
          {isSubmitting ? 'Saving...' : 'Correct. Save info'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .settings-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .content-wrapper {
    max-width: 800px;
    width: 100%;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 3rem;
  }

  .content-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .section {
    margin-bottom: 2.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .section-number {
    width: 32px;
    height: 32px;
    background: #00ABE4;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: #00ABE4;
    box-shadow: 0 0 0 3px rgba(0, 171, 228, 0.1);
  }

  .form-input:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .email-note {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .password-toggle {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .toggle-btn {
    background: #00ABE4;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: #0095c7;
    transform: translateY(-1px);
  }

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input {
    padding-right: 3rem;
    width: 100%;
  }

  .password-toggle-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.2s ease;
  }

  .password-toggle-btn:hover {
    color: #374151;
    background: rgba(0, 0, 0, 0.05);
  }

  .password-hint {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
    grid-column: 1 / -1;
    text-align: center;
  }

  .action-area {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }

  .save-btn {
    background: #00ABE4;
    color: white;
    border: none;
    padding: 0.875rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn:hover:not(:disabled) {
    background: #0095c7;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 171, 228, 0.3);
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .success-message {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .content-wrapper {
      padding: 2rem;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .content-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }
  }
</style>


