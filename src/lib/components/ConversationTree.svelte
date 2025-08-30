<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import MessageNode from './MessageNode.svelte';
  
  export let messages: any[] = [];
  export let activeBranchId: string | null = null;
  export let onBranchSelect: (branchId: string) => void;
  export let onMessageEdit: (messageId: string, content: string) => void;
  export let onRegenerate: (messageId: string) => void;
  
  const dispatch = createEventDispatcher();
  
  // Build tree structure from flat messages
  $: conversationTree = buildConversationTree(messages);
  
  function buildConversationTree(messages: any[]) {
    const messageMap = new Map();
    const rootMessages: any[] = [];
    
    // Check if messages have parentId support
    const hasParentId = messages.length > 0 && 'parentId' in messages[0];
    
    if (!hasParentId) {
      // Fallback: treat all messages as root messages (linear conversation)
      messages.forEach(msg => {
        messageMap.set(msg.id, {
          ...msg,
          children: [],
          branches: [],
          isBranchPoint: false,
          parentId: null // Ensure parentId exists
        });
        rootMessages.push(msg);
      });
      
      return {
        rootMessages: rootMessages.map(msg => messageMap.get(msg.id)),
        branchingPoints: [],
        messageMap: Object.fromEntries(messageMap),
        totalBranches: 0
      };
    }
    
    // First pass: create message map and identify root messages
    messages.forEach(msg => {
      messageMap.set(msg.id, {
        ...msg,
        children: [],
        branches: [],
        isBranchPoint: false
      });
      
      if (!msg.parentId) {
        rootMessages.push(msg);
      }
    });
    
    // Second pass: build parent-child relationships
    messages.forEach(msg => {
      if (msg.parentId) {
        const parent = messageMap.get(msg.parentId);
        if (parent) {
          parent.children.push(msg);
          
          // Check if this creates a branch (multiple children from same parent)
          if (parent.children.length > 1) {
            parent.isBranchPoint = true;
            parent.branches = parent.children;
            parent.branchCount = parent.children.length;
          }
        }
      }
    });
    
    // Third pass: identify branching points and calculate branch counts
    const branchingPoints = new Set();
    messages.forEach(msg => {
      if (msg.parentId) {
        const parent = messageMap.get(msg.parentId);
        if (parent && parent.children.length > 1) {
          branchingPoints.add(msg.parentId);
        }
      }
    });
    
    return {
      rootMessages: rootMessages.map(msg => messageMap.get(msg.id)),
      branchingPoints: Array.from(branchingPoints),
      messageMap: Object.fromEntries(messageMap),
      totalBranches: Array.from(branchingPoints).length
    };
  }
  
  function getMessagePath(messageId: string): string[] {
    const path: string[] = [];
    let currentId = messageId;
    
    while (currentId) {
      const msg = conversationTree.messageMap[currentId];
      if (msg) {
        path.unshift(currentId);
        currentId = msg.parentId;
      } else {
        break;
      }
    }
    
    return path;
  }
  
  function isActiveBranch(messageId: string): boolean {
    if (!activeBranchId) return true;
    const path = getMessagePath(messageId);
    return path.includes(activeBranchId);
  }
  
  function getBranchIndicator(message: any): string {
    if (!message.isBranchPoint) return '';
    const branchCount = message.children.length;
    if (branchCount === 1) return '';
    return `🌿 ${branchCount} branches`;
  }
  
  function handleBranchSelect(messageId: string) {
    if (onBranchSelect) {
      onBranchSelect(messageId);
    }
  }
  
  function handleMessageEdit(messageId: string, content: string) {
    if (onMessageEdit) {
      onMessageEdit(messageId, content);
    }
  }
  
  function handleRegenerate(messageId: string) {
    if (onRegenerate) {
      onRegenerate(messageId);
    }
  }
</script>

<div class="conversation-tree">
  {#each conversationTree.rootMessages as rootMessage (rootMessage.id)}
    <div class="message-node root-message" in:fly={{ y: 20, duration: 300 }}>
      <MessageNode 
        message={rootMessage} 
        depth={0} 
        isActive={isActiveBranch(rootMessage.id)}
        onBranchSelect={handleBranchSelect}
        onMessageEdit={handleMessageEdit}
        onRegenerate={handleRegenerate} 
      />
    </div>
  {/each}
</div>

<style>
  .conversation-tree {
    padding: 1rem;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 0.75rem;
    min-height: 200px;
  }
  
  .message-node {
    margin-bottom: 1rem;
  }
  
  .root-message {
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;
  }
</style>
