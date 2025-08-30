<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let messages: any[] = [];
  export let selectedBranchId: string | null = null;
  export let onBranchSelect: (branchId: string) => void;
  
  const dispatch = createEventDispatcher();
  
  // Build tree structure from messages
  $: treeData = buildTreeData(messages);
  
  function buildTreeData(messages: any[]) {
    if (!messages || messages.length === 0) return [];
    
    const messageMap = new Map();
    const rootMessages: any[] = [];
    
    // First pass: create message map
    messages.forEach(msg => {
      messageMap.set(msg.id, {
        ...msg,
        children: [],
        siblings: [],
        isBranchPoint: false
      });
      
      if (!msg.parentId) {
        rootMessages.push(msg);
      }
    });
    
    // Second pass: build relationships
    messages.forEach(msg => {
      if (msg.parentId) {
        const parent = messageMap.get(msg.parentId);
        if (parent) {
          parent.children.push(msg);
          
          // Check for siblings
          const siblings = messages.filter(m => 
            m.parentId === msg.parentId && m.id !== msg.id
          );
          if (siblings.length > 0) {
            parent.isBranchPoint = true;
            parent.siblings = siblings;
          }
        }
      }
    });
    
    return rootMessages.map(msg => messageMap.get(msg.id));
  }
  
  function getMessageDepth(messageId: string): number {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.parentId) return 0;
    return 1 + getMessageDepth(message.parentId);
  }
  
  function isSelectedBranch(messageId: string): boolean {
    return selectedBranchId === messageId;
  }
  
  function handleBranchClick(messageId: string) {
    onBranchSelect(messageId);
  }
</script>

<div class="branch-tree bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Conversation Tree</h3>
  
  {#if treeData.length === 0}
    <div class="text-center text-gray-500 dark:text-gray-400 py-4">
      <div class="text-2xl mb-2">🌳</div>
      <p class="text-sm">No conversation tree available</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each treeData as rootMessage}
        <div class="tree-node">
          {#each rootMessage.children as child, depth}
            <div class="flex items-center gap-2 py-1" style="padding-left: {depth * 20}px;">
              <!-- Branch line -->
              {#if depth > 0}
                <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
              {/if}
              
              <!-- Message node -->
              <button
                on:click={() => handleBranchClick(child.id)}
                class="flex-1 text-left p-2 rounded-lg transition-colors {isSelectedBranch(child.id) 
                  ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {child.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <span class="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {child.content.length > 30 ? child.content.substring(0, 30) + '...' : child.content}
                  </span>
                  {#if child.siblings && child.siblings.length > 0}
                    <span class="text-xs text-blue-500 dark:text-blue-400" title="Has branches">
                      🌿
                    </span>
                  {/if}
                </div>
              </button>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .branch-tree {
    font-family: 'Inter', sans-serif;
  }
  
  .tree-node {
    position: relative;
  }
  
  .tree-node::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(to bottom, transparent, #d1d5db, transparent);
  }
</style>
