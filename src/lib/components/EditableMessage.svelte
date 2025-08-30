<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: Date;
    isEdited?: boolean;
    parentId?: string | null;
  };
  export let isEditing = false;
  export let onBranchCreate: (originalId: string, newContent: string) => Promise<void> = async () => {};

  const dispatch = createEventDispatcher<{
    edit: { messageId: string; content: string };
    save: { messageId: string; content: string };
    cancel: { messageId: string };
    branch: { originalId: string; newContent: string };
  }>();

  let editContent = message.content;
  let isSaving = false;

  function handleEdit() {
    editContent = message.content;
    dispatch('edit', { messageId: message.id, content: message.content });
  }

  async function handleSave() {
    if (editContent.trim() === message.content) {
      // No changes, just exit edit mode
      dispatch('cancel', { messageId: message.id });
      return;
    }

    isSaving = true;
    try {
      if (onBranchCreate) {
        // Use the new branching system
        await onBranchCreate(message.id, editContent.trim());
      } else {
        // Fallback to old system
        dispatch('save', { messageId: message.id, content: editContent.trim() });
      }
    } catch (error) {
      console.error('Error saving message:', error);
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    editContent = message.content;
    dispatch('cancel', { messageId: message.id });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  }
</script>

<div class="message-container">
  {#if isEditing}
    <!-- Edit Mode -->
    <div class="edit-mode">
      <div class="edit-header">
        <span class="edit-label">
          {onBranchCreate ? 'Creating new branch' : 'Editing message'}
        </span>
        <div class="edit-actions">
          <button 
            class="cancel-btn"
            on:click={handleCancel}
            disabled={isSaving}
            type="button"
          >
            <!-- X icon -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancel
          </button>
          <button 
            class="save-btn"
            on:click={handleSave}
            disabled={isSaving || !editContent.trim()}
            type="button"
          >
            <!-- Check icon -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            {isSaving ? 'Saving...' : (onBranchCreate ? 'Create Branch' : 'Save')}
          </button>
        </div>
      </div>
      
      <textarea
        bind:value={editContent}
        placeholder="Edit your message..."
        on:keydown={handleKeydown}
        class="edit-textarea"
        rows="3"
        disabled={isSaving}
      ></textarea>
      
      <div class="edit-hint">
        {onBranchCreate 
          ? 'Press Ctrl+Enter to create branch, Esc to cancel'
          : 'Press Ctrl+Enter to save, Esc to cancel'
        }
      </div>
    </div>
  {:else}
    <!-- Display Mode -->
    <div class="message-content">
      <div class="message-text">
        {message.content}
      </div>
      
      {#if message.role === 'user'}
        <div class="message-actions">
          <button
            class="edit-btn"
            on:click={handleEdit}
            title={onBranchCreate ? 'Create new branch' : 'Edit message'}
            type="button"
          >
            <!-- Pencil icon -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .message-container {
    width: 100%;
  }

  .edit-mode {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    background: #ffffff;
  }

  .edit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .edit-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .edit-actions {
    display: flex;
    gap: 8px;
  }

  .edit-textarea {
    width: 100%;
    resize: vertical;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 0.875rem;
    line-height: 1.5;
    background: #ffffff;
    color: #111827;
    margin-bottom: 8px;
    font-family: inherit;
  }

  .edit-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .edit-textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .edit-hint {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: center;
  }

  .message-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .message-text {
    flex: 1;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .message-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    margin-left: 8px;
  }

  .message-content:hover .message-actions {
    opacity: 1;
  }

  .edit-btn {
    padding: 6px;
    min-width: auto;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .cancel-btn {
    padding: 6px 12px;
    border-radius: 6px;
    background: #ef4444;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: background-color 0.2s ease;
  }

  .cancel-btn:hover:not(:disabled) {
    background: #dc2626;
  }

  .cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .save-btn {
    padding: 6px 12px;
    border-radius: 6px;
    background: #3b82f6;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: background-color 0.2s ease;
  }

  .save-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Dark mode support */
  :global(.dark) .edit-mode {
    border-color: #374151;
    background: #1f2937;
  }

  :global(.dark) .edit-label {
    color: #9ca3af;
  }

  :global(.dark) .edit-textarea {
    border-color: #4b5563;
    background: #374151;
    color: #f9fafb;
  }

  :global(.dark) .edit-hint {
    color: #9ca3af;
  }
</style>
