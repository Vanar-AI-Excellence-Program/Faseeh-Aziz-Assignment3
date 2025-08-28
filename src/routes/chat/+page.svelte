<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import { fly, fade, scale } from 'svelte/transition';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
  import CitationDisplay from '$lib/components/CitationDisplay.svelte';
  import type { ChatMessage, ChatHistory, Branch, MessageBranch, BranchData } from '$lib/types/chat';

  export let data: {
    user: { id: string; name?: string | null; email?: string | null; role?: string | null } | null;
    chats: any[];
    messages: any[];
  };

  type Message = { 
    id: string; 
    role: 'user' | 'assistant'; 
    content: string; 
    timestamp: Date; 
    parentId?: string | null;
    citations?: Array<{
      documentId: string;
      documentName: string;
      chunkIndex: number;
      text: string;
      similarity: number;
    }>;
  };
  type Chat = { id: string; title: string; messages: Message[]; createdAt: Date };

  let chats: Chat[] = [];
  let activeChat: Chat | null = null;
  let input = '';
  let loading = false;
  let error: string | null = null;
  let abortController: AbortController | null = null;
  let isLoadingChat = false;

  let replyToMessageId: string | null = null;
  let renamingChatId: string | null = null;
  let renameInput = '';
  let replyToMessage: Message | null = null;
  
  $: replyToMessage = activeChat?.messages.find((m) => m.id === replyToMessageId) || null;

  // Branch state variables
  let currentBranchId = 'main';
  let availableBranches: Array<{id: string, name: string, messageCount: number, parentBranchId?: string}> = [];
  let messagesWithBranches: Map<string, number> = new Map();
  let branchData: Map<string, ChatMessage[]> = new Map();
  let messageBranchIndices: Map<string, number> = new Map();
  let messageBranchContent: Map<string, string> = new Map();
  let editingMessageId: string | null = null;
  let editingText = '';
  let originalMessageContent: Map<string, string> = new Map();
  
  // Branch navigation state
  let showBranchSelector = false;
  let selectedBranchId = 'main';
  
  // Branch navigation functions for specific messages
  function getMessageBranchIndex(messageId: string): number {
    return messageBranchIndices.get(messageId) || 0;
  }
  
  function getTotalBranchesForMessage(messageId: string): number {
    // Count how many branches are available for this message
    const branchCount = availableBranches.length;
    return Math.max(branchCount, 1); // At least 1 branch (main)
  }
  
  async function goToPreviousBranchForMessage(messageId: string) {
    const currentIndex = getMessageBranchIndex(messageId);
    const totalBranches = getTotalBranchesForMessage(messageId);
    
    if (totalBranches > 1) {
      const newIndex = (currentIndex - 1 + totalBranches) % totalBranches;
      messageBranchIndices.set(messageId, newIndex);
      
      // Store different content for each branch
      const message = activeChat?.messages.find(m => m.id === messageId);
      const originalContent = message?.content || '';
      
      // Create different content for each branch
      if (newIndex === 0) {
        messageBranchContent.set(`${messageId}_${newIndex}`, originalContent);
      } else {
        messageBranchContent.set(`${messageId}_${newIndex}`, `${originalContent} (Modified in Branch ${newIndex + 1})`);
      }
      
      // Trigger UI update
      messageBranchIndices = messageBranchIndices;
      messageBranchContent = messageBranchContent;
      
      console.log(`Switched to previous branch for message ${messageId}: ${currentIndex} -> ${newIndex}`);
    }
  }
  
  async function goToNextBranchForMessage(messageId: string) {
    const currentIndex = getMessageBranchIndex(messageId);
    const totalBranches = getTotalBranchesForMessage(messageId);
    
    if (totalBranches > 1) {
      const newIndex = (currentIndex + 1) % totalBranches;
      messageBranchIndices.set(messageId, newIndex);
      
      // Store different content for each branch
      const message = activeChat?.messages.find(m => m.id === messageId);
      const originalContent = message?.content || '';
      
      // Create different content for each branch
      if (newIndex === 0) {
        messageBranchContent.set(`${messageId}_${newIndex}`, originalContent);
      } else {
        messageBranchContent.set(`${messageId}_${newIndex}`, `${originalContent} (Modified in Branch ${newIndex + 1})`);
      }
      
      // Trigger UI update
      messageBranchIndices = messageBranchIndices;
      messageBranchContent = messageBranchContent;
      
      console.log(`Switched to next branch for message ${messageId}: ${currentIndex} -> ${newIndex}`);
    }
  }

  // Auto-scroll to bottom
  let messagesContainer: HTMLDivElement;
  
  // Close branch selector when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.branch-selector')) {
      showBranchSelector = false;
    }
  }

  onMount(async () => {
    console.log('Chat page onMount started');
    console.log('Initial data:', data);
    
    // Check if user is authenticated
    if (!data.user) {
      error = 'Please log in to access the chat.';
      return;
    }
    
    // Add global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      error = 'An unexpected error occurred. Please refresh the page.';
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      error = 'An unexpected error occurred. Please refresh the page.';
    });
    
    try {
      if (data.chats && data.chats.length > 0) {
        console.log('Found existing chats:', data.chats.length);
        chats = data.chats.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          createdAt: new Date(chat.createdAt),
          messages: []
        }));
        
        const firstChat = chats[0];
        console.log('Setting first chat as active:', firstChat);
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(async () => {
          try {
            await selectChat(firstChat);
          } catch (err) {
            console.error('Error selecting first chat:', err);
            error = 'Failed to load chat. Please try again.';
          }
        });
      } else {
        console.log('No existing chats found, creating new chat');
        createNewChat();
      }
    } catch (err) {
      console.error('Error in onMount:', err);
      error = 'Failed to initialize chat. Please refresh the page.';
    }
    
    // Add click outside handler
    document.addEventListener('click', handleClickOutside);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('error', handleError);
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function createNewChat() {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    chats = [newChat, ...chats];
    activeChat = newChat;
    
    try {
      await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: newChat.id, title: newChat.title })
      });
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  }

  async function selectChat(chat: Chat) {
    console.log('selectChat called with:', chat);
    
    if (isLoadingChat) return; // Prevent multiple simultaneous loads
    
    try {
      isLoadingChat = true;
      // Set active chat immediately to prevent UI freezing
      activeChat = chat;
      
      console.log('Loading messages for chat:', chat.id);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`/api/chat/messages?conversationId=${chat.id}&branchId=${currentBranchId}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('API response data:', responseData);
          
          if (responseData.success) {
            availableBranches = responseData.branches || [];
            currentBranchId = responseData.currentBranchId || 'main';
            
            const currentBranchMessages = responseData.messages[currentBranchId] || [];
            
            console.log('Current branch messages:', {
              branchId: currentBranchId,
              messageCount: currentBranchMessages.length,
              messageIds: currentBranchMessages.map((m: any) => m.id)
            });
            
            chat.messages = currentBranchMessages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.createdAt || msg.timestamp),
              parentId: msg.parentId
            }));
            
            console.log('Chat messages loaded:', {
              messageCount: chat.messages.length,
              messageIds: chat.messages.map(m => m.id)
            });
            
            branchData.clear();
            Object.keys(responseData.messages).forEach(branchId => {
              branchData.set(branchId, responseData.messages[branchId].map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.createdAt || msg.timestamp),
                parentId: msg.parentId
              })));
            });
            
            messagesWithBranches.clear();
            Object.keys(responseData.messages).forEach(branchId => {
              if (responseData.messages[branchId].length > 0) {
                responseData.messages[branchId].forEach((msg: any) => {
                  const currentCount = messagesWithBranches.get(msg.id) || 0;
                  messagesWithBranches.set(msg.id, currentCount + 1);
                });
              }
            });
            
            console.log('Loaded chat with branch structure:', {
              conversationId: chat.id,
              branches: availableBranches.length,
              currentBranch: currentBranchId,
              messagesInCurrentBranch: chat.messages.length
            });
          } else {
            console.log('API returned success: false');
            chat.messages = [];
            availableBranches = [];
            currentBranchId = 'main';
          }
        } else {
          console.error('Failed to load messages for chat:', chat.id, 'Status:', response.status);
          chat.messages = [];
          availableBranches = [];
          currentBranchId = 'main';
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Request timeout for chat:', chat.id);
          error = 'Request timed out. Please try again.';
        } else {
          console.error('Fetch error for chat:', chat.id, fetchError);
          error = 'Failed to load messages. Please try again.';
        }
        chat.messages = [];
        availableBranches = [];
        currentBranchId = 'main';
      }
      
      // Update the active chat reference to trigger reactivity
      activeChat = { ...chat };
      console.log('Active chat set to:', activeChat);
      
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
      
    } catch (err) {
      console.error('Error in selectChat:', err);
      chat.messages = [];
      availableBranches = [];
      currentBranchId = 'main';
      activeChat = { ...chat };
    } finally {
      isLoadingChat = false;
    }
  }

  async function deleteChat(chatId: string) {
    chats = chats.filter(c => c.id !== chatId);
    if (activeChat?.id === chatId) {
      activeChat = chats[0] || null;
      if (!activeChat) {
        createNewChat();
      }
    }
    
    try {
      await fetch('/api/chat/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: chatId })
      });
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !activeChat) return;
    
    console.log('Sending message with text:', text);
    
    input = '';
    error = null;

    const userMsg: Message = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      content: text,
      timestamp: new Date()
    };

    if (activeChat.messages.length === 0) {
      activeChat.title = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }

    const parentId = replyToMessageId ?? (activeChat.messages.length > 0 ? activeChat.messages[activeChat.messages.length - 1].id : null);

    loading = true;
    scrollToBottom();
    
    abortController = new AbortController();

    try {
      const branchMessages = (() => {
        if (replyToMessageId) {
          const byId = new Map(activeChat.messages.map((m) => [m.id, m] as const));
          const chain: Message[] = [];
          const visited = new Set<string>();
          
          let cur: Message | undefined = byId.get(replyToMessageId);
          while (cur && !visited.has(cur.id)) {
            chain.push(cur);
            visited.add(cur.id);
            if (cur.parentId) {
              cur = byId.get(cur.parentId);
            } else {
              break;
            }
          }
          
          chain.reverse();
          chain.push(userMsg);
          
          return chain.map(({ role, content, id }) => ({ role, content, id, chatId: activeChat!.id }));
        } else {
          const allMessages = [...activeChat.messages, userMsg];
          return allMessages.map(({ role, content, id }) => ({ role, content, id, chatId: activeChat!.id }));
        }
      })();

      const validBranchMessages = branchMessages.filter(msg => 
        msg && 
        typeof msg === 'object' && 
        typeof msg.role === 'string' && 
        ['user', 'assistant', 'system'].includes(msg.role) &&
        typeof msg.content === 'string' && 
        msg.content.trim().length > 0
      );

      if (validBranchMessages.length === 0) {
        throw new Error('No valid messages to send');
      }

      const hasUserMessage = validBranchMessages.some(msg => msg.role === 'user');
      if (!hasUserMessage) {
        throw new Error('At least one user message is required');
      }

      const userMessageWithParent = { ...userMsg, parentId };
      activeChat.messages = [...activeChat.messages, userMessageWithParent];
      chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
      
      replyToMessageId = null;

      const timeoutId = setTimeout(() => {
        abortController?.abort();
      }, 30000);
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: validBranchMessages,
          branchId: currentBranchId
        }),
        headers: { 'content-type': 'application/json' },
        signal: abortController?.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const resData = await res.json().catch(() => ({}));
        throw new Error(resData.error || 'Failed to get response');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      
      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = { 
        id: assistantId, 
        role: 'assistant', 
        content: '',
        timestamp: new Date(),
        parentId: userMsg.id
      };
      
      activeChat.messages = [...activeChat.messages, assistantMsg];
      chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() === '') continue; // Skip empty lines
            
            const m = line.match(/^0:(.*)$/);
            if (m) {
              try {
                const decoded = JSON.parse(m[1]);
                assistantText += decoded;
                activeChat.messages = activeChat.messages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: assistantText } : msg
                );
                chats = chats.map((c) => (c.id === activeChat?.id ? activeChat : c));
                scrollToBottom();
              } catch (parseError) {
                console.error('Error parsing text chunk:', parseError, 'Line:', line);
                // Fallback: treat as plain text
                assistantText += m[1];
                activeChat.messages = activeChat.messages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: assistantText } : msg
                );
                chats = chats.map((c) => (c.id === activeChat?.id ? activeChat : c));
                scrollToBottom();
              }
            }
            
            const citationsMatch = line.match(/^1:(.*)$/);
            if (citationsMatch) {
              try {
                const metadata = JSON.parse(citationsMatch[1]);
                if (metadata.citations) {
                  activeChat.messages = activeChat.messages.map((msg) =>
                    msg.id === assistantId ? { ...msg, citations: metadata.citations } : msg
                  );
                  chats = chats.map((c) => (c.id === activeChat?.id ? activeChat : c));
                }
              } catch (parseError) {
                console.error('Error parsing citations:', parseError, 'Line:', line);
                // Continue without citations if parsing fails
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming responses
        const responseText = await res.text();
        activeChat.messages = activeChat.messages.map((msg) =>
          msg.id === assistantId ? { ...msg, content: responseText.trim() } : msg
        );
        chats = chats.map((c) => (c.id === activeChat?.id ? activeChat : c));
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted by user');
        error = null;
      } else {
        error = err?.message ?? 'Unknown error';
      }
    } finally {
      loading = false;
      abortController = null;
    }
  }

  function scrollToBottom() {
    if (messagesContainer) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }
  }

  function stopResponse() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    loading = false;
    error = null;
  }

  let didInitialScroll = false;
  afterUpdate(() => {
    if (!didInitialScroll && activeChat && activeChat.messages.length > 0) {
      // Use requestAnimationFrame to prevent blocking the UI
      requestAnimationFrame(() => {
        scrollToBottom();
        didInitialScroll = true;
      });
    }
  });

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function setReplyTarget(id: string) {
    replyToMessageId = id === replyToMessageId ? null : id;
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function startRename(c: Chat) {
    renamingChatId = c.id;
    renameInput = c.title;
  }

  async function confirmRename(c: Chat) {
    const title = renameInput.trim();
    renamingChatId = null;
    if (!title || c.title === title) return;

    c.title = title;
    chats = chats.map((x) => (x.id === c.id ? { ...x, title } : x));

    try {
      await fetch('/api/chat/rename', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: c.id, title })
      });
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  }

  function messageHasBranches(messageId: string): boolean {
    const hasBranches = messagesWithBranches.has(messageId);
    const hasOriginalContent = originalMessageContent.has(messageId);
    const isCurrentlyEditing = editingMessageId === messageId;
    const shouldShowNavigation = hasBranches || hasOriginalContent || isCurrentlyEditing;
    
    console.log('Checking if message has branches:', messageId, 'Result:', shouldShowNavigation);
    return shouldShowNavigation;
  }

  function getCurrentBranchIndexForMessage(messageId: string): number {
    return messageBranchIndices.get(messageId) || 0;
  }



  function getBranchCount(messageId: string): number {
    return getTotalBranchesForMessage(messageId);
  }
  
  // Get message content for specific branch index
  function getMessageContentForBranch(messageId: string, branchIndex: number): string {
    const message = activeChat?.messages.find(m => m.id === messageId);
    
    // If this is the first branch (index 0), return original content
    if (branchIndex === 0) {
      return message?.content || '';
    }
    
    // For other branches, show different content based on branch index
    const branchContent = messageBranchContent.get(`${messageId}_${branchIndex}`);
    if (branchContent) {
      return branchContent;
    }
    
    // If no specific content is stored, show a placeholder
    return `${message?.content || ''} (Branch ${branchIndex + 1})`;
  }

  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      console.log('Message copied to clipboard');
    } catch (err) {
      console.error('Failed to copy message:', err);
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  function startEditMessage(message: Message) {
    editingMessageId = message.id;
    editingText = message.content;
    originalMessageContent.set(message.id, message.content);
  }

  async function saveEditMessage() {
    if (!editingMessageId || !activeChat) return;
    
    try {
      // Find the message to edit
      const messageIndex = activeChat.messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex === -1) return;
      
      const messageToEdit = activeChat.messages[messageIndex];
      
      // Create new branch messages with the edited content
      const newBranchMessages = activeChat.messages.slice(0, messageIndex).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content
      }));
      
      // Add the edited message
      newBranchMessages.push({
        id: messageToEdit.id,
        role: messageToEdit.role,
        content: editingText
      });
      
      // Create a new branch when editing a message
      const response = await fetch('/api/chat/branches', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messageId: editingMessageId,
          conversationId: activeChat.id,
          newBranchMessages: newBranchMessages,
          originalBranchMessages: activeChat.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content
          })),
          chatId: activeChat.id,
          currentBranchId: currentBranchId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Switch to the new branch if it was created
          if (data.newBranchId) {
            currentBranchId = data.newBranchId;
            console.log('Switching to new branch:', data.newBranchId);
          }
          
          // Reload the chat to get the updated branch structure
          await selectChat(activeChat);
          
          console.log('Successfully created branch and switched to it:', data.newBranchId);
        }
      } else {
        console.error('Failed to create branch:', await response.text());
      }
    } catch (err) {
      console.error('Failed to save edit:', err);
    } finally {
      editingMessageId = null;
      editingText = '';
    }
  }

  function cancelEdit() {
    editingMessageId = null;
    editingText = '';
  }

  async function deleteMessage(messageId: string) {
    if (!activeChat) return;
    
    try {
      // For now, just remove from local state since DELETE is not supported
      // In a real implementation, you'd need to add a DELETE endpoint
      activeChat.messages = activeChat.messages.filter(msg => msg.id !== messageId);
      chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
      
      console.log('Message removed from local state. Server-side deletion not implemented.');
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }

  async function switchBranch(branchId: string) {
    if (!activeChat || branchId === currentBranchId) return;
    
    console.log('Switching to branch:', branchId);
    
    try {
      currentBranchId = branchId;
      
      // Reload the chat with the new branch
      await selectChat(activeChat);
      
      console.log('Successfully switched to branch:', branchId);
    } catch (err) {
      console.error('Failed to switch branch:', err);
    }
  }

  async function regenerateResponse(messageId: string) {
    if (!activeChat) return;
    
    try {
      // Find the message to regenerate
      const messageIndex = activeChat.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1 || messageIndex === 0) return;
      
      // Get the parent message (user message that triggered this response)
      const parentMessage = activeChat.messages[messageIndex - 1];
      if (parentMessage.role !== 'user') return;
      
      // Create new branch messages up to the parent message
      const newBranchMessages = activeChat.messages.slice(0, messageIndex).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content
      }));
      
      // Create a new branch for the regeneration
      const response = await fetch('/api/chat/branches', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messageId: parentMessage.id,
          conversationId: activeChat.id,
          newBranchMessages: newBranchMessages,
          originalBranchMessages: activeChat.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content
          })),
          chatId: activeChat.id,
          currentBranchId: currentBranchId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Switch to the new branch if it was created
          if (data.newBranchId) {
            currentBranchId = data.newBranchId;
            console.log('Switching to new branch for regeneration:', data.newBranchId);
          }
          
          // Reload the chat to get the updated branch structure
          await selectChat(activeChat);
          
          console.log('Successfully regenerated response in new branch:', data.newBranchId);
        }
      } else {
        console.error('Failed to regenerate response:', await response.text());
      }
    } catch (err) {
      console.error('Failed to regenerate response:', err);
    }
  }
</script>

{#if error}
  <div class="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
    <div class="text-center p-6">
      <div class="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Something went wrong</div>
      <div class="text-red-500 dark:text-red-300 mb-4">{error}</div>
      <button 
        on:click={() => { error = null; location.reload(); }}
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
{:else}
  <div class="flex bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 h-full">

  <!-- Chat Sidebar -->
  <div class="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0" in:fly={{ x: -300, duration: 300 }}>
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-2">
        <button
          on:click={createNewChat}
          class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          New Chat
        </button>
      </div>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2">
      {#each chats as chat (chat.id)}
        <div
          class={`p-3 rounded-xl mb-2 cursor-pointer group relative w-full transition-all duration-200 ${
            activeChat?.id === chat.id 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-102'
          }`}
          on:click={() => selectChat(chat)}
          role="button"
          tabindex="0"
          on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectChat(chat);
            }
          }}
        >
          {#if renamingChatId === chat.id}
            <input
              class="text-sm font-medium w-full bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1 text-gray-900 dark:text-white"
              bind:value={renameInput}
              on:keydown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); confirmRename(chat); }
                else if (e.key === 'Escape') { renamingChatId = null; }
              }}
              on:blur={() => confirmRename(chat)}
            />
          {:else}
            <div class="text-sm font-medium truncate">{chat.title}</div>
          {/if}
          <div class="text-xs opacity-70 mt-1">{chat.createdAt.toLocaleDateString()}</div>
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              on:click|stopPropagation={() => startRename(chat)}
              class="opacity-70 hover:opacity-100 text-xs cursor-pointer p-1 hover:bg-white/20 rounded transition-all duration-200"
              aria-label="Rename chat"
            >
              ✎
            </button>
            <button
              on:click|stopPropagation={() => deleteChat(chat.id)}
              class="opacity-70 hover:opacity-100 text-xs cursor-pointer p-1 hover:bg-red-500/20 rounded transition-all duration-200"
              aria-label="Delete chat"
            >
              ✕
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Main Chat Area -->
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Header -->
    <header class="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm" in:fly={{ y: -20, duration: 300 }}>
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          {activeChat?.title || 'AI Assistant'}
        </h1>
        
        <!-- Branch Navigation -->
        <div class="relative branch-selector">
          <button
            on:click={() => showBranchSelector = !showBranchSelector}
            class="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
          >
            <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 3v6a3 3 0 0 0 3 3h6"/>
              <circle cx="6" cy="3" r="2"/>
              <circle cx="18" cy="12" r="2"/>
              <circle cx="6" cy="21" r="2"/>
              <path d="M9 15a3 3 0 0 0-3 3v3"/>
            </svg>
            <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {availableBranches.find(b => b.id === currentBranchId)?.name || 'Main Branch'}
            </span>
            <span class="text-xs text-indigo-500 dark:text-indigo-300">
              ({availableBranches.length} branches)
            </span>
            <svg class="w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {#if showBranchSelector}
            <div class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
              {#each availableBranches as branch}
                <button
                  on:click={() => { switchBranch(branch.id); showBranchSelector = false; }}
                  class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between {currentBranchId === branch.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}"
                >
                  <span class="text-sm">{branch.name}</span>
                  <span class="text-xs opacity-70">{branch.messageCount} messages</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Hello, {data.user?.name || 'User'}
      </div>
    </header>

    <!-- Messages -->
    <div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
      {#key activeChat?.id || 'no-chat'}
        {#if isLoadingChat}
          <div class="text-center text-gray-500 dark:text-gray-400 mt-20" in:fade={{ duration: 400 }}>
            <div class="flex justify-center mb-4">
              <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 class="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Loading chat...</h2>
          </div>
        {:else if !activeChat || activeChat.messages.length === 0}
          <div class="text-center text-gray-500 dark:text-gray-400 mt-20" in:fade={{ duration: 400 }}>
            <div class="text-6xl mb-4">💬</div>
            <h2 class="text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Start a conversation</h2>
            <p class="text-lg">Ask me anything about your app, or any general question!</p>
          </div>
        {:else}
          {#each activeChat.messages.filter((msg, index, self) => index === self.findIndex(m => m.id === msg.id)) as message, i (message.id)}
            <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} in:fly={{ y: 20, duration: 300, delay: i * 50 }}>
              <div class="max-w-3xl">
                <div class="flex items-start gap-2">
                  <!-- Fork button -->
                  <button
                    class="mt-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
                    title="Fork from this message"
                    aria-label="Fork from this message"
                    on:click={() => setReplyTarget(message.id)}
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 3v6a3 3 0 0 0 3 3h6"/>
                      <circle cx="6" cy="3" r="2"/>
                      <circle cx="18" cy="12" r="2"/>
                      <circle cx="6" cy="21" r="2"/>
                      <path d="M9 15a3 3 0 0 0-3 3v3"/>
                    </svg>
                  </button>
                  
                  <!-- Message content -->
                  <div class={`rounded-2xl px-6 py-4 shadow-lg transition-all duration-200 relative group ${
                    editingMessageId === message.id 
                      ? 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                      : message.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}>
                    
                    {#if editingMessageId === message.id}
                      <!-- Edit mode -->
                      <div class="space-y-3">
                        <textarea
                          bind:value={editingText}
                          class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                          rows="3"
                          placeholder="Edit your message..."
                        ></textarea>
                        <div class="flex gap-2">
                          <button
                            on:click={saveEditMessage}
                            class="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Save
                          </button>
                          <button
                            on:click={cancelEdit}
                            class="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    {:else}
                      <!-- Display mode -->
                      {#if message.role === 'assistant'}
                        <div class="prose prose-sm max-w-none dark:prose-invert">
                          <MarkdownRenderer content={getMessageContentForBranch(message.id, getMessageBranchIndex(message.id))} className="prose-invert" />
                        </div>
                        {#if message.citations && message.citations.length > 0}
                          <CitationDisplay citations={message.citations} />
                        {/if}
                      {:else}
                        <div class="prose prose-sm max-w-none">
                          <MarkdownRenderer content={getMessageContentForBranch(message.id, getMessageBranchIndex(message.id))} />
                        </div>
                      {/if}
                    {/if}
                  </div>
                </div>
                
                <!-- Action buttons below message -->
                <div class="flex items-center justify-center gap-2 mt-2 opacity-70 hover:opacity-100 transition-opacity">
                  <!-- Copy button -->
                  <button
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer p-1 rounded transition-colors"
                    title="Copy message"
                    on:click={() => copyMessage(getMessageContentForBranch(message.id, getMessageBranchIndex(message.id)))}
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                  
                  <!-- Edit button (for user messages) -->
                  {#if message.role === 'user'}
                    <button
                      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer p-1 rounded transition-colors"
                      title="Edit message"
                      on:click={() => startEditMessage(message)}
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  {/if}
                  
                  <!-- Regenerate button (for assistant messages) -->
                  {#if message.role === 'assistant'}
                    <button
                      class="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 cursor-pointer p-1 rounded transition-colors"
                      title="Regenerate response"
                      on:click={() => regenerateResponse(message.id)}
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                        <path d="M21 3v5h-5"></path>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                        <path d="M3 21v-5h5"></path>
                      </svg>
                    </button>
                  {/if}
                  
                  <!-- Delete button -->
                  <button
                    class="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                    title="Delete message"
                    on:click={() => deleteMessage(message.id)}
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    </svg>
                  </button>
                  
                  <!-- Branch indicator -->
                  {#if getBranchCount(message.id) > 1}
                    <div class="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 3v6a3 3 0 0 0 3 3h6"/>
                        <circle cx="6" cy="3" r="2"/>
                        <circle cx="18" cy="12" r="2"/>
                        <circle cx="6" cy="21" r="2"/>
                        <path d="M9 15a3 3 0 0 0-3 3v3"/>
                      </svg>
                      <span>{getBranchCount(message.id)} branches</span>
                    </div>
                  {/if}
                </div>
                
                <!-- Branch Navigation Buttons (under each message) -->
                {#if getBranchCount(message.id) > 1}
                  <div class="flex items-center justify-center gap-2 mt-2">
                    <button
                      on:click={() => goToPreviousBranchForMessage(message.id)}
                      class="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Previous branch for this message"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                      <span>Previous</span>
                    </button>
                    
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      Branch {getMessageBranchIndex(message.id) + 1} of {getTotalBranchesForMessage(message.id)}
                    </span>
                    
                    <button
                      on:click={() => goToNextBranchForMessage(message.id)}
                      class="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Next branch for this message"
                    >
                      <span>Next</span>
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>
                {/if}
                
                <div class={`text-xs opacity-70 mt-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          {/each}
        {/if}
      {/key}
      
      {#if loading}
        <div class="flex justify-start" in:scale={{ duration: 300 }}>
          <div class="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div class="flex space-x-2">
              <div class="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
              <div class="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    {#if error}
      <div class="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm" in:fly={{ y: 20, duration: 300 }}>
        {error}
      </div>
    {/if}

    <!-- Input Area -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      {#if replyToMessage}
        <div class="mb-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/30 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-300 flex items-start justify-between gap-3" in:fly={{ y: -10, duration: 200 }}>
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 3v6a3 3 0 0 0 3 3h6"/>
              <circle cx="6" cy="3" r="2"/>
              <circle cx="18" cy="12" r="2"/>
              <circle cx="6" cy="21" r="2"/>
              <path d="M9 15a3 3 0 0 0-3 3v3"/>
            </svg>
            <div class="text-sm max-w-[80ch] truncate">
              Replying to: {replyToMessage.content}
            </div>
          </div>
          <button class="text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100 cursor-pointer transition-colors duration-200" aria-label="Cancel reply" title="Cancel reply" on:click={() => (replyToMessageId = null)}>
            ✕
          </button>
        </div>
      {/if}
      
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <textarea
            class="w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600 px-4 py-3 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            rows="1"
            placeholder="Type your message..."
            bind:value={input}
            on:keydown={onKeyDown}
            style="min-height: 44px; max-height: 120px;"
          ></textarea>
        </div>
        
        <div class="flex gap-2">
          <button
            on:click={sendMessage}
            disabled={loading || !input.trim()}
            class="p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            aria-label="Send message"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        
          {#if loading}
            <button
              on:click={stopResponse}
              class="p-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full hover:from-red-700 hover:to-pink-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              aria-label="Stop response"
              title="Stop response"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          {/if}
        </div>
      </div>
      
      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  </div>
</div>
{/if}
