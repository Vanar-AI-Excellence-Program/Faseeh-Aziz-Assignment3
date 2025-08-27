# Branch Navigation System Implementation

This document describes the complete branch navigation system implemented in the chat application, allowing users to navigate between different conversation branches.

## Overview

The branch navigation system enables users to:
- Edit messages and create new conversation branches
- Navigate between different branches using arrow buttons
- View branch counters showing current position
- Maintain context and history for each branch

## Key Components

### 1. UI Navigation Buttons

Navigation buttons appear on messages that have branches or are being edited:

```svelte
<!-- Branch navigation - show on messages that have branches or are being edited -->
{#if messageHasBranches(message.id)}
  <div class="flex items-center space-x-1 text-slate-500 text-sm">
    <button 
      class="branch-nav-button"
      on:click={async () => await navigateToPreviousBranch(message.id)}
      disabled={editingMessageId === message.id ? true : getCurrentBranchIndexForMessage(message.id) === 0}
      title="Previous branch"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>
    <span class="branch-counter">
      {editingMessageId === message.id ? 'Creating...' : `${getCurrentBranchIndexForMessage(message.id) + 1}/${getTotalBranchesForMessage(message.id)}`}
    </span>
    <button 
      class="branch-nav-button"
      on:click={async () => await navigateToNextBranch(message.id)}
      disabled={editingMessageId === message.id ? true : getCurrentBranchIndexForMessage(message.id) === getTotalBranchesForMessage(message.id) - 1}
      title="Next branch"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
    </button>
  </div>
{/if}
```

### 2. State Management

The system uses several state variables to track navigation:

```typescript
// Branch state variables
let currentBranchId = 'main';
let availableBranches: Array<{id: string, name: string, messageCount: number, parentBranchId?: string}> = [];
let currentBranchIndex = 0;
let messagesWithBranches: Map<string, number> = new Map(); // Track messageId -> branchCount
let branchData: Map<string, ChatMessage[]> = new Map(); // Store messages for each branch
let messageBranchIndices: Map<string, number> = new Map(); // Track current branch index for each message
let editingMessageId: string | null = null;
let editingText = '';
```

### 3. Navigation Functions

#### Previous Branch Navigation
```typescript
async function navigateToPreviousBranch(messageId: string) {
  // Don't navigate if currently editing
  if (editingMessageId) return;
  
  const messageBranches = getBranchesForMessage(messageId);
  const currentIndex = getCurrentBranchIndexForMessage(messageId);
  const totalBranches = getTotalBranchesForMessage(messageId);
  
  if (currentIndex > 0 && messageBranches.length > 0) {
    const newIndex = currentIndex - 1;
    messageBranchIndices.set(messageId, newIndex);
    
    const targetBranchId = messageBranches[newIndex]?.id;
    if (targetBranchId) {
      await loadBranchMessagesFromDatabase(targetBranchId);
      currentBranchId = targetBranchId;
      currentBranchIndex = newIndex;
    }
  }
}
```

#### Next Branch Navigation
```typescript
async function navigateToNextBranch(messageId: string) {
  // Don't navigate if currently editing
  if (editingMessageId) return;
  
  const messageBranches = getBranchesForMessage(messageId);
  const currentIndex = getCurrentBranchIndexForMessage(messageId);
  const totalBranches = getTotalBranchesForMessage(messageId);
  
  if (currentIndex < totalBranches - 1 && messageBranches.length > 0) {
    const newIndex = currentIndex + 1;
    messageBranchIndices.set(messageId, newIndex);
    
    const targetBranchId = messageBranches[newIndex]?.id;
    if (targetBranchId) {
      await loadBranchMessagesFromDatabase(targetBranchId);
      currentBranchId = targetBranchId;
      currentBranchIndex = newIndex;
    }
  }
}
```

### 4. Helper Functions

#### Check if Message Has Branches
```typescript
function messageHasBranches(messageId: string): boolean {
  const hasBranches = messagesWithBranches.has(messageId);
  const shouldShowNavigation = hasBranches || editingMessageId === messageId;
  return shouldShowNavigation;
}
```

#### Get Current Branch Index
```typescript
function getCurrentBranchIndexForMessage(messageId: string): number {
  return messageBranchIndices.get(messageId) || 0;
}
```

#### Get Total Branches
```typescript
function getTotalBranchesForMessage(messageId: string): number {
  const branchCount = messagesWithBranches.get(messageId) || 0;
  return branchCount + 1; // +1 for the original branch
}
```

### 5. Backend APIs

#### Branch Messages API
**Endpoint:** `GET /api/chat/branches/messages`
**Parameters:** `branchId`, `conversationId`
**Response:** Array of messages for the specified branch

#### Branches API
**Endpoint:** `GET /api/chat/branches`
**Parameters:** `conversationId`, `messageId` (optional)
**Response:** Available branches and message branch counts

### 6. CSS Styling

The navigation buttons use custom CSS for consistent styling:

```css
.branch-nav-button {
  background-color: rgba(255, 255, 255, 0.6);
  color: #64748b;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  min-height: 1.5rem;
  user-select: none;
  border: 1px solid rgba(226, 232, 240, 0.4);
}

.branch-nav-button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.9);
  color: #475569;
  border-color: rgba(203, 213, 225, 0.8);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.branch-nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.branch-counter {
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 2rem;
  text-align: center;
}
```

## Usage Flow

1. **User sees navigation buttons** on messages that have branches
2. **Click previous/next arrow** to navigate between branches
3. **System checks current branch index** and validates navigation
4. **Load fresh messages** from database for target branch
5. **Update UI state** with new messages and branch information
6. **Update navigation counter** to reflect current position
7. **Disable buttons** when at first/last branch

## Visual Feedback

- **Branch Counter**: Shows "1/3", "2/3", etc.
- **Disabled States**: Buttons grayed out when at limits
- **Loading States**: Visual feedback during branch loading
- **Hover Effects**: Buttons highlight on hover
- **Edit Mode**: Shows "Creating..." during branch creation

## Database Schema

The system uses the following database tables:

- `chat_messages`: Stores messages with branch information
- `chat_branches`: Manages branch metadata
- `message_branches`: Tracks branch counts per message

## Error Handling

- Navigation is disabled during message editing
- Proper error handling for failed API calls
- Graceful fallbacks for missing branch data
- Console logging for debugging

This implementation provides a seamless way for users to explore different conversation paths while maintaining the context and history of each branch.
