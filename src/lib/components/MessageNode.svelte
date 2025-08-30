<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  
  export let message: any;
  export let depth: number = 0;
  export let isActive: boolean = true;
  export let onBranchSelect: (branchId: string) => void;
  export let onMessageEdit: (messageId: string, content: string) => void;
  export let onRegenerate: (messageId: string) => void;
  
  let isEditing = false;
  let editContent = '';
  let showChildren = true;
  
  $: editContent = message.content;
  
  function toggleChildren() {
    showChildren = !showChildren;
  }
  
  function startEdit() {
    isEditing = true;
  }
  
  function cancelEdit() {
    isEditing = false;
    editContent = message.content;
  }
  
  function saveEdit() {
    if (editContent.trim() && editContent !== message.content) {
      onMessageEdit(message.id, editContent);
    }
    isEditing = false;
  }
  
  function handleRegenerate() {
    onRegenerate(message.id);
  }
  
  function handleBranchSelect() {
    onBranchSelect(message.id);
  }
  
  const maxDepth = 5; // Prevent infinite recursion
</script>

<div class="message-node {depth > maxDepth ? 'max-depth' : ''}" 
     class:active={isActive}
     class:branch-point={message.isBranchPoint}
     style="--depth: {depth};">
  
  <!-- Message Content -->
  <div class="message-content" in:fly={{ y: 10, duration: 200 }}>
    <div class="message-header">
      <div class="message-role">
        {#if message.role === 'user'}
          <span class="role-badge user">👤 User</span>
        {:else if message.role === 'assistant'}
          <span class="role-badge assistant">🤖 AI</span>
        {:else}
          <span class="role-badge system">⚙️ System</span>
        {/if}
      </div>
      
      <div class="message-actions">
        {#if message.role === 'user'}
          <button class="action-btn edit-btn" on:click={startEdit} title="Edit message">
            ✏️
          </button>
        {:else if message.role === 'assistant'}
          <button class="action-btn regenerate-btn" on:click={handleRegenerate} title="Regenerate response">
            🔄
          </button>
        {/if}
        
        {#if message.isBranchPoint}
          <button class="action-btn branch-btn" on:click={handleBranchSelect} title="Switch to this branch">
            🌿
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Message Text -->
    {#if isEditing}
      <div class="edit-form" in:scale={{ duration: 200 }}>
        <textarea
          bind:value={editContent}
          class="edit-textarea"
          rows="3"
          placeholder="Edit your message..."
        ></textarea>
        <div class="edit-actions">
          <button class="btn btn-primary" on:click={saveEdit}>Save</button>
          <button class="btn btn-secondary" on:click={cancelEdit}>Cancel</button>
        </div>
      </div>
    {:else}
      <div class="message-text">
        {message.content}
      </div>
    {/if}
    
    <!-- Branch Indicator -->
    {#if message.isBranchPoint}
      <div class="branch-indicator" in:fade={{ duration: 300 }}>
        <span class="branch-count">🌿 {message.children.length} branches available</span>
        <button class="toggle-btn" on:click={toggleChildren}>
          {showChildren ? '▼' : '▶'}
        </button>
      </div>
    {/if}
    
    <!-- Timestamp -->
    <div class="message-timestamp">
      {new Date(message.createdAt).toLocaleTimeString()}
    </div>
  </div>
  
  <!-- Children Messages -->
  {#if showChildren && message.children && message.children.length > 0}
    <div class="children-container" in:fade={{ duration: 300 }}>
      {#each message.children as childMessage (childMessage.id)}
        <div class="child-message" style="--depth: {depth + 1};">
          <svelte:self 
            message={childMessage}
            depth={depth + 1}
            isActive={isActive}
            onBranchSelect={onBranchSelect}
            onMessageEdit={onMessageEdit}
            onRegenerate={onRegenerate}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .message-node {
    margin-left: calc(var(--depth) * 1.5rem);
    margin-bottom: 1rem;
    position: relative;
  }
  
  .message-content {
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
    transition: all 0.3s ease;
  }
  
  .message-node.active .message-content {
    border-color: #3b82f6;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  }
  
  .message-node.branch-point .message-content {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .role-badge.user {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .role-badge.assistant {
    background: #dcfce7;
    color: #166534;
  }
  
  .role-badge.system {
    background: #f3e8ff;
    color: #7c3aed;
  }
  
  .message-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    background: none;
    border: none;
    padding: 0.25rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }
  
  .action-btn:hover {
    background: #f1f5f9;
    transform: scale(1.1);
  }
  
  .edit-btn:hover {
    color: #3b82f6;
  }
  
  .regenerate-btn:hover {
    color: #10b981;
  }
  
  .branch-btn:hover {
    color: #f59e0b;
  }
  
  .message-text {
    line-height: 1.6;
    color: #1f2937;
    margin-bottom: 0.75rem;
  }
  
  .branch-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin: 0.75rem 0;
  }
  
  .branch-count {
    font-size: 0.875rem;
    font-weight: 600;
    color: #92400e;
  }
  
  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #92400e;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
  }
  
  .toggle-btn:hover {
    background: #fbbf24;
    color: white;
  }
  
  .message-timestamp {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: right;
    margin-top: 0.5rem;
  }
  
  .children-container {
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 2px dashed #d1d5db;
  }
  
  .child-message {
    position: relative;
  }
  
  .child-message::before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 1rem;
    width: 0.5rem;
    height: 2px;
    background: #d1d5db;
  }
  
  .edit-form {
    margin: 0.75rem 0;
  }
  
  .edit-textarea {
    width: 100%;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-family: inherit;
    font-size: inherit;
    resize: vertical;
    min-height: 80px;
  }
  
  .edit-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover {
    background: #2563eb;
  }
  
  .btn-secondary {
    background: #6b7280;
    color: white;
  }
  
  .btn-secondary:hover {
    background: #4b5563;
  }
  
  .max-depth {
    opacity: 0.6;
  }
  
  .max-depth .message-content {
    background: #f9fafb;
  }
</style>
