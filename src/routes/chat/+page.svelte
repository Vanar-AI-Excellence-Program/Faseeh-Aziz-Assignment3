<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import { fly, fade, scale } from 'svelte/transition';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
  import type { ChatMessage, ChatHistory, Branch, MessageBranch, BranchData } from '$lib/types/chat';

  export let data: {
    user: { id: string; name?: string | null; email?: string | null; role?: string | null };
    chats: any[];
    messages: any[];
  };

  type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; parentId?: string | null };
  type Chat = { id: string; title: string; messages: Message[]; createdAt: Date };

  let chats: Chat[] = [];
  let activeChat: Chat | null = null;
  let input = '';
  let loading = false;
  let error: string | null = null;
  let abortController: AbortController | null = null;

  let replyToMessageId: string | null = null;
  let renamingChatId: string | null = null;
  let renameInput = '';
  let fileInput: HTMLInputElement;
  let uploadedFile: File | null = null;
  $: replyToMessage = activeChat?.messages.find((m) => m.id === replyToMessageId) || null;

  // Branch state variables
  let currentBranchId = 'main';
  let availableBranches: Array<{id: string, name: string, messageCount: number, parentBranchId?: string}> = [];
  let currentBranchIndex = 0;
  let messagesWithBranches: Map<string, number> = new Map(); // Track messageId -> branchCount
  let branchData: Map<string, ChatMessage[]> = new Map(); // Store messages for each branch
  let messageBranchIndices: Map<string, number> = new Map(); // Track current branch index for each message
  let editingMessageId: string | null = null;
  let editingText = '';
  let originalMessageContent: Map<string, string> = new Map(); // Store original content for edited messages

  // Utility function to reconstruct conversation tree from flat message array
  function reconstructMessageTree(messages: any[]): any[] {
    if (!messages || messages.length === 0) {
      return [];
    }
    
    // Remove duplicate messages by ID to prevent key conflicts
    const uniqueMessages = messages.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    );
    
    console.log('Reconstructing message tree:', {
      originalCount: messages.length,
      uniqueCount: uniqueMessages.length,
      duplicateCount: messages.length - uniqueMessages.length
    });
    
    const messageMap = new Map();
    const rootMessages: any[] = [];
    
    // First pass: create a map of all messages
    uniqueMessages.forEach((msg: any) => {
      messageMap.set(msg.id, {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt || msg.timestamp),
        parentId: msg.parentId,
        children: []
      });
    });
    
    // Second pass: build the tree structure
    uniqueMessages.forEach((msg: any) => {
      const messageNode = messageMap.get(msg.id);
      if (msg.parentId && messageMap.has(msg.parentId)) {
        // This message has a parent, add it as a child
        const parentNode = messageMap.get(msg.parentId);
        parentNode.children.push(messageNode);
      } else {
        // This is a root message (no parent or parent not found)
        rootMessages.push(messageNode);
      }
    });
    
    // Flatten the tree into a linear array for display (UI expects flat array)
    const flattenTree = (nodes: any[], result: any[] = []): any[] => {
      for (const node of nodes) {
        result.push({
          id: node.id,
          role: node.role,
          content: node.content,
          timestamp: node.timestamp,
          parentId: node.parentId
        });
        if (node.children && node.children.length > 0) {
          flattenTree(node.children, result);
        }
      }
      return result;
    };
    
    const flattenedResult = flattenTree(rootMessages);
    
    // Final check to ensure no duplicate IDs in the result
    const finalResult = flattenedResult.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    );
    
    if (finalResult.length !== flattenedResult.length) {
      console.warn('Duplicate IDs found in flattened result, removing duplicates');
    }
    
    return finalResult;
  }

  // Function to restore branch navigation state after reload
  function restoreBranchNavigationState() {
    if (!activeChat) return;
    
    // Check if any messages have been edited and restore their navigation state
    activeChat.messages.forEach(message => {
      if (originalMessageContent.has(message.id)) {
        // This message has been edited, ensure it shows navigation controls
        messagesWithBranches.set(message.id, 2); // Original + Edited
        messageBranchIndices.set(message.id, 1); // Start on edited version
      }
    });
  }

  // Minimal action to inject trusted HTML (generated locally)
  export function setHtml(node: HTMLElement, params: { html: string }) {
    const set = (html: string) => {
      node.innerHTML = html;
    };
    set(params?.html || '');
    return {
      update(next: { html: string }) {
        set(next?.html || '');
      }
    };
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderMarkdownLite(src: string): string {
    let text = src || '';
    
    // Headers (# ## ###)
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
    
    // Code fences ```lang\ncode\n``` with syntax highlighting
    text = text.replace(/```([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      const cls = lang ? ` class="language-${lang}"` : '';
      const langLabel = lang ? `<div class="text-xs text-gray-300 mb-2 font-mono bg-gray-700 px-2 py-1 rounded">${lang}</div>` : '';
      return `<div class="bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto border border-gray-600 shadow-lg" style="background-color: rgb(17 24 39) !important; color: rgb(229 231 235) !important;"><pre class="bg-gray-900 text-gray-100" style="background-color: rgb(17 24 39) !important; color: rgb(229 231 235) !important;"><code${cls}>${langLabel}${escapeHtml(code.trim())}</code></pre></div>`;
    });
    
    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, (_m, code) => `<code class="bg-gray-800 text-gray-100 px-2 py-1 rounded text-sm font-mono border border-gray-600" style="background-color: rgb(31 41 55) !important; color: rgb(229 231 235) !important;">${escapeHtml(code)}</code>`);
    
    // Bold **text** and __text__
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>');
    
    // Italic *text* and _text_
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    text = text.replace(/_(.*?)_/g, '<em class="italic">$1</em>');
    
    // Strikethrough ~~text~~
    text = text.replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>');
    
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Unordered lists (- * +)
    text = text.replace(/^[\s]*[-*+][\s]+(.*)/gim, '<li class="ml-4">$1</li>');
    text = text.replace(/(<li.*<\/li>)/s, '<ul class="list-disc ml-6 my-2">$1</ul>');
    
    // Ordered lists (1. 2. 3.)
    text = text.replace(/^[\s]*\d+\.[\s]+(.*)/gim, '<li class="ml-4">$1</li>');
    text = text.replace(/(<li.*<\/li>)/s, '<ol class="list-decimal ml-6 my-2">$1</ol>');
    
    // Blockquotes (> text)
    text = text.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">$1</blockquote>');
    
    // Horizontal rules (---, ***, ___)
    text = text.replace(/^[\s]*[-*_]{3,}[\s]*$/gim, '<hr class="my-4 border-blue-500 opacity-70">');
    
    // Tables (basic support)
    text = text.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => `<td class="border border-gray-300 dark:border-gray-600 px-3 py-2">${cell.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    });
    text = text.replace(/(<tr>.*<\/tr>)/s, '<table class="border-collapse border border-gray-300 dark:border-gray-600 my-4 w-full">$1</table>');
    
    // Simple paragraphs/line breaks
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
      line = line.trim();
      // Skip lines that are already HTML tags
      if (line.startsWith('<') && line.endsWith('>')) {
        return line;
      }
      // Skip empty lines
      if (!line) {
        return '<br>';
      }
      // Skip list items, headers, blockquotes, etc. that are already processed
      if (line.startsWith('<li>') || line.startsWith('<h') || line.startsWith('<blockquote>') || 
          line.startsWith('<hr>') || line.startsWith('<table>') || line.startsWith('<div>')) {
        return line;
      }
      // Regular paragraph
      return `<p class="mb-2">${line}</p>`;
    });
    
    return processedLines.join('');
  }

  // Auto-scroll to bottom
  let messagesContainer: HTMLDivElement;

  onMount(async () => {
    // Convert DB data to local format
    if (data.chats && data.chats.length > 0) {
      chats = data.chats.map((chat: any) => ({
        id: chat.id,
        title: chat.title,
        createdAt: new Date(chat.createdAt),
        messages: [] // Initialize with empty messages, will be loaded with branch structure
      }));
      
      // Set the first chat as active and load with proper branch structure
      const firstChat = chats[0];
      await selectChat(firstChat);
    } else {
      createNewChat();
    }
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
    
    // Save to DB
    try {
      await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: newChat.id, title: newChat.title })
      });
      
      // Refresh chats to get the updated data from the server
      await refreshChats();
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  }

  async function selectChat(chat: Chat) {
    activeChat = null;
    // force DOM reset before setting the new chat to ensure formatting action runs
    setTimeout(async () => {
      // Load messages for the selected chat with proper branch structure
      try {
        const response = await fetch(`/api/chat/messages?conversationId=${chat.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Initialize branch data
            availableBranches = data.branches || [];
            currentBranchId = data.currentBranchId || 'main';
            
            // Get messages for the current branch
            const currentBranchMessages = data.messages[currentBranchId] || [];
            
            console.log('Current branch messages before reconstruction:', {
              branchId: currentBranchId,
              messageCount: currentBranchMessages.length,
              messageIds: currentBranchMessages.map(m => m.id)
            });
            
            // Convert to the format expected by the frontend using tree reconstruction
            chat.messages = reconstructMessageTree(currentBranchMessages);
            
            console.log('Chat messages after reconstruction:', {
              messageCount: chat.messages.length,
              messageIds: chat.messages.map(m => m.id)
            });
            
            // Store all branch messages for navigation
            branchData.clear();
            Object.keys(data.messages).forEach(branchId => {
              branchData.set(branchId, data.messages[branchId].map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.createdAt || msg.timestamp),
                parentId: msg.parentId
              })));
            });
            
            // Update message branch counts
            messagesWithBranches.clear();
            Object.keys(data.messages).forEach(branchId => {
              if (data.messages[branchId].length > 0) {
                // Count how many branches each message appears in
                data.messages[branchId].forEach((msg: any) => {
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
            chat.messages = [];
            availableBranches = [];
            currentBranchId = 'main';
          }
        } else {
          console.error('Failed to load messages for chat:', chat.id);
          chat.messages = [];
          availableBranches = [];
          currentBranchId = 'main';
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        chat.messages = [];
        availableBranches = [];
        currentBranchId = 'main';
      }
      
      activeChat = chat;
      
      // ensure we scroll to bottom of the newly selected chat
      scrollToBottom();
    }, 0);
  }

  async function deleteChat(chatId: string) {
    chats = chats.filter(c => c.id !== chatId);
    if (activeChat?.id === chatId) {
      activeChat = chats[0] || null;
      if (!activeChat) {
        createNewChat();
      }
    }
    
    // Delete from DB
    try {
      await fetch('/api/chat/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: chatId })
      });
      
      // Refresh chats to get the updated data from the server
      await refreshChats();
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  }

  async function refreshChats() {
    try {
      const response = await fetch('/chat');
      if (response.ok) {
        const html = await response.text();
        // Parse the HTML to extract the data
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const scriptTag = doc.querySelector('script[data-sveltekit-hydrate]');
        if (scriptTag) {
          const dataMatch = scriptTag.textContent?.match(/window\.__sveltekit_1\s*=\s*({.*?});/s);
          if (dataMatch) {
            try {
              const newData = JSON.parse(dataMatch[1]);
              if (newData.chats) {
                chats = newData.chats.map((chat: any) => ({
                  id: chat.id,
                  title: chat.title,
                  createdAt: new Date(chat.createdAt),
                  messages: chat.messages ? chat.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.createdAt),
                    parentId: msg.parentId
                  })) : []
                }));
                
                // Update active chat if it still exists
                if (activeChat) {
                  const updatedActiveChat = chats.find(c => c.id === activeChat.id);
                  if (updatedActiveChat) {
                    activeChat = updatedActiveChat;
                  } else if (chats.length > 0) {
                    activeChat = chats[0];
                  }
                }
              }
            } catch (e) {
              console.error('Failed to parse chat data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing chats:', error);
    }
  }

  function getParentMessageContent(msg: Message): string | null {
    if (!msg.parentId || !activeChat) return null;
    const parent = activeChat.messages.find((m) => m.id === msg.parentId);
    return parent ? parent.content : null;
  }

  function getParentPreview(msg: Message, maxLen = 160): string | null {
    const c = getParentMessageContent(msg);
    if (!c) return null;
    // Strip markdown formatting for cleaner previews
    const cleanText = c
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/__(.*?)__/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/_(.*?)_/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/^[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\d+\.\s+/gm, '') // Remove ordered list markers
      .replace(/^>\s+/gm, '') // Remove blockquote markers
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return cleanText.length > maxLen ? cleanText.slice(0, maxLen) + '…' : cleanText;
  }

  function isForkedMessage(chat: Chat | null, index: number, msg: Message): boolean {
    if (!chat || !msg.parentId) return false;
    const prev = chat.messages[index - 1];
    return !prev || msg.parentId !== prev.id;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !activeChat) return;
    
    console.log('Sending message with text:', text);
    console.log('Active chat messages count:', activeChat.messages.length);
    
    input = '';
    error = null;

    const userMsg: Message = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      content: text,
      timestamp: new Date()
    };

    console.log('Created userMsg:', userMsg);

    // Update chat title if it's the first message
    if (activeChat.messages.length === 0) {
      activeChat.title = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }

    // compute parent for tree fork
    const parentId = replyToMessageId ?? (activeChat.messages.length > 0 ? activeChat.messages[activeChat.messages.length - 1].id : null);

    loading = true;
    scrollToBottom();
    
    // Create new AbortController for this request
    abortController = new AbortController();

    try {
      // Build branch context for forked messages
      const branchMessages = (() => {
        if (replyToMessageId) {
          // If we're replying to a specific message, build context from that message
          const byId = new Map(activeChat.messages.map((m) => [m.id, m] as const));
          const chain: Message[] = [];
          const visited = new Set<string>();
          
          // Start from the message we're replying to
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
          
          // Reverse to get chronological order and add the new user message
          chain.reverse();
          chain.push(userMsg);
          
          console.log('Fork context:', { replyToMessageId, chain: chain.map(m => ({ role: m.role, content: m.content.substring(0, 50) })) });
          return chain.map(({ role, content, id }) => ({ role, content, id, chatId: activeChat.id }));
        } else {
          // Normal linear conversation - send all messages plus the new user message
          const allMessages = [...activeChat.messages, userMsg];
          // Log only essential info to avoid data overwriting issues
          console.log('Normal conversation - message count:', allMessages.length, 'roles:', allMessages.map(m => m.role));
          return allMessages.map(({ role, content, id }) => ({ role, content, id, chatId: activeChat.id }));
        }
      })();

      console.log('Branch messages before validation:', branchMessages);

      // Validate messages before sending
      const validBranchMessages = branchMessages.filter(msg => 
        msg && 
        typeof msg === 'object' && 
        typeof msg.role === 'string' && 
        ['user', 'assistant', 'system'].includes(msg.role) &&
        typeof msg.content === 'string' && 
        msg.content.trim().length > 0
      );

      console.log('Valid branch messages after filtering:', validBranchMessages);

      if (validBranchMessages.length === 0) {
        console.error('No valid messages to send. Branch messages:', branchMessages);
        throw new Error('No valid messages to send');
      }

      // Ensure at least one user message exists
      const hasUserMessage = validBranchMessages.some(msg => msg.role === 'user');
      if (!hasUserMessage) {
        console.error('No user message found in valid messages:', validBranchMessages);
        throw new Error('At least one user message is required');
      }

      console.log('Sending messages:', validBranchMessages.length, 'valid messages');

      // Add the user message to the chat now that we have the context
      const userMessageWithParent = { ...userMsg, parentId };
      activeChat.messages = [...activeChat.messages, userMessageWithParent];
      chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
      
      // Clear reply banner after adding message
      replyToMessageId = null;

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: validBranchMessages,
          branchId: currentBranchId // Pass the current branch ID
        }),
        headers: { 'content-type': 'application/json' },
        signal: abortController.signal
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get response');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      
      // Add placeholder message for streaming
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
              } catch (_) {
                // ignore malformed lines
              }
            }
          }
        }
      }

      // Messages are now saved by the main chat API to the correct branch
      // No need for additional save-message calls
      
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Request was aborted by user
        console.log('Request was aborted by user');
        error = null;
      } else {
        error = e?.message ?? 'Unknown error';
      }
    } finally {
      loading = false;
      abortController = null;
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 10);
  }

  function stopResponse() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    loading = false;
    error = null;
  }

  // After initial mount or refresh, jump to bottom if there are messages
  let didInitialScroll = false;
  afterUpdate(() => {
    if (!didInitialScroll && activeChat && activeChat.messages.length > 0) {
      scrollToBottom();
      didInitialScroll = true;
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
      
      // Refresh chats to get the updated data from the server
      await refreshChats();
    } catch (e) {
      console.error('Failed to rename chat:', e);
    }
  }

  // Branch management functions
  function editUserMessage(content: string, messageId: string) {
    editingMessageId = messageId;
    editingText = content;
    // Store the original content for later restoration
    originalMessageContent.set(messageId, content);
  }

  async function saveEdit(messageId: string) {
    if (!activeChat || !editingText.trim()) return;

    try {
      console.log('Saving edit for message:', messageId, 'with content:', editingText);
      
      // Find the index of the message being edited
      const editIndex = activeChat.messages.findIndex(msg => msg.id === messageId);
      if (editIndex === -1) return;

      // Store the original content and AI response
      const originalMessage = activeChat.messages[editIndex];
      const originalAIResponse = activeChat.messages[editIndex + 1]; // AI response comes after user message
      
      // Store original content and AI response for navigation
      originalMessageContent.set(messageId, originalMessage.content);
      if (originalAIResponse && originalAIResponse.role === 'assistant') {
        originalMessageContent.set(messageId + '_ai_response', originalAIResponse.content);
      }
      
      // Create the new branch with edited message
      const newBranchMessages = [
        ...activeChat.messages.slice(0, editIndex), // Messages before the edit
        { ...originalMessage, content: editingText.trim() } // Edited message
      ];

      // Original branch keeps everything as is (including AI response)
      const originalBranchMessages = activeChat.messages;

      // Create new branch with edited message and get AI response
      const response = await fetch('/api/chat/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId: activeChat.id,
          newBranchMessages,
          originalBranchMessages,
          chatId: activeChat.id,
          currentBranchId: currentBranchId
        })
      });

      console.log('Branch creation response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Branch creation error:', errorData);
        throw new Error('Failed to create branch');
      }

      const result = await response.json();
      console.log('Branch creation result:', result);
      
      // Update the current message content to show the edited version
      if (editIndex !== -1) {
        activeChat.messages[editIndex] = { ...originalMessage, content: editingText.trim() };
        
        // Remove the original AI response since we'll get a new one from the API
        if (originalAIResponse && originalAIResponse.role === 'assistant') {
          activeChat.messages.splice(editIndex + 1, 1);
        }
        
        // Add the new AI response from the branch creation API
        if (result.aiResponse) {
          const assistantId = crypto.randomUUID();
          const assistantMsg: Message = { 
            id: assistantId, 
            role: 'assistant', 
            content: result.aiResponse,
            timestamp: new Date(),
            parentId: messageId
          };
          activeChat.messages = [...activeChat.messages, assistantMsg];
          
          // Store the edited AI response for navigation
          originalMessageContent.set(messageId + '_edited_ai_response', result.aiResponse);
        }
        
        chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
        
        // Store the edited content for later restoration
        originalMessageContent.set(messageId + '_edited', editingText.trim());
      }
      
      // Update branch data for the edited message to include both original and edited versions
      await refreshBranchDataForMessage(messageId);
      
      // Ensure the message is marked as having branches for navigation
      messagesWithBranches.set(messageId, 2); // Original + Edited
      messageBranchIndices.set(messageId, 1); // Start on edited version (index 1)
      
      // Clear editing state
      editingMessageId = null;
      editingText = '';
      
    } catch (err) {
      console.error('Failed to save edit:', err);
      error = 'Failed to create branch';
    }
  }

  function cancelEdit() {
    editingMessageId = null;
    editingText = '';
  }

  async function navigateToPreviousBranch(messageId: string) {
    
    const messageBranches = getBranchesForMessage(messageId);
    const currentIndex = getCurrentBranchIndexForMessage(messageId);
    const totalBranches = getTotalBranchesForMessage(messageId);
    
    console.log('Navigating to previous branch for message:', messageId, 'Current index:', currentIndex, 'Total branches:', totalBranches);
    
    if (messageBranches.length > 0 && totalBranches > 0) {
      // Implement circular navigation: wrap around to last branch when at first
      const newIndex = (currentIndex - 1 + totalBranches) % totalBranches;
      messageBranchIndices.set(messageId, newIndex);
      
      // Find the branch to switch to from message-specific branches
      const targetBranch = messageBranches[newIndex];
      if (targetBranch) {
        console.log('Switching to branch:', targetBranch.id, 'at index:', newIndex);
        
        // Handle virtual branches (Original vs Edited)
        if (targetBranch.id.startsWith('original_') || targetBranch.id.startsWith('edited_')) {
          // For virtual branches, we need to restore the original content or show edited content
          const editIndex = activeChat.messages.findIndex(msg => msg.id === messageId);
          if (editIndex !== -1) {
            if (targetBranch.id.startsWith('original_')) {
              // Restore original content
              await loadOriginalMessageContent(messageId);
            } else if (targetBranch.id.startsWith('edited_')) {
              // Show edited content - restore the edited version
              const editedContent = originalMessageContent.get(messageId + '_edited');
              if (editedContent) {
                activeChat.messages[editIndex] = { 
                  ...activeChat.messages[editIndex], 
                  content: editedContent 
                };
                
                // Check if there's an edited AI response stored
                const editedAIResponse = originalMessageContent.get(messageId + '_edited_ai_response');
                if (editedAIResponse) {
                  // Check if there's already an AI response after this message
                  const nextMessage = activeChat.messages[editIndex + 1];
                  if (nextMessage && nextMessage.role === 'assistant') {
                    // Replace existing AI response with edited version
                    activeChat.messages[editIndex + 1] = {
                      ...nextMessage,
                      content: editedAIResponse
                    };
                  } else {
                    // Add edited AI response
                    const aiResponseMessage = {
                      id: crypto.randomUUID(),
                      role: 'assistant' as const,
                      content: editedAIResponse,
                      timestamp: new Date(),
                      parentId: messageId
                    };
                    activeChat.messages.splice(editIndex + 1, 0, aiResponseMessage);
                  }
                }
                
                chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
                console.log('Restored edited content and AI response for message:', messageId);
              }
            }
          }
        } else {
          // Load fresh messages from database for this branch
          await loadBranchMessagesFromDatabase(targetBranch.id);
        }
        
        currentBranchId = targetBranch.id;
        currentBranchIndex = newIndex;
      }
    }
  }

  async function navigateToNextBranch(messageId: string) {
    
    const messageBranches = getBranchesForMessage(messageId);
    const currentIndex = getCurrentBranchIndexForMessage(messageId);
    const totalBranches = getTotalBranchesForMessage(messageId);
    
    console.log('Navigating to next branch for message:', messageId, 'Current index:', currentIndex, 'Total branches:', totalBranches);
    
    if (messageBranches.length > 0 && totalBranches > 0) {
      // Implement circular navigation: wrap around to first branch when at last
      const newIndex = (currentIndex + 1) % totalBranches;
      messageBranchIndices.set(messageId, newIndex);
      
      // Find the branch to switch to from message-specific branches
      const targetBranch = messageBranches[newIndex];
      if (targetBranch) {
        console.log('Switching to branch:', targetBranch.id, 'at index:', newIndex);
        
        // Handle virtual branches (Original vs Edited)
        if (targetBranch.id.startsWith('original_') || targetBranch.id.startsWith('edited_')) {
          // For virtual branches, we need to restore the original content or show edited content
          const editIndex = activeChat.messages.findIndex(msg => msg.id === messageId);
          if (editIndex !== -1) {
            if (targetBranch.id.startsWith('original_')) {
              // Restore original content
              await loadOriginalMessageContent(messageId);
            } else if (targetBranch.id.startsWith('edited_')) {
              // Show edited content (should already be current)
              // No action needed as we're already showing edited content
            }
          }
        } else {
          // Load fresh messages from database for this branch
          await loadBranchMessagesFromDatabase(targetBranch.id);
        }
        
        currentBranchId = targetBranch.id;
        currentBranchIndex = newIndex;
      }
    }
  }

  async function loadBranchMessagesFromDatabase(branchId: string) {
    try {
      console.log('Loading fresh messages for branch:', branchId);
      
      // Get all messages for this conversation with branch structure
      const response = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(activeChat.id)}&branchId=${encodeURIComponent(branchId)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Get messages for the specific branch
          const branchMessages = data.messages[branchId] || [];
          
                      // Build the conversation tree using utility function
            const formattedMessages = reconstructMessageTree(branchMessages);
          
          console.log('Loaded', formattedMessages.length, 'messages for branch:', branchId);
          
          // Update the active chat messages
          activeChat.messages = formattedMessages;
          chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
          
          // Update the branch data cache
          branchData.set(branchId, formattedMessages);
          
          // Update available branches
          availableBranches = data.branches || [];
          
          return formattedMessages;
        } else {
          console.error('Failed to load branch messages:', data.error);
        }
      } else {
        console.error('Failed to load branch messages:', response.status);
      }
    } catch (error) {
      console.error('Error loading branch messages from database:', error);
    }
    
    return [];
  }

  async function loadOriginalMessageContent(messageId: string) {
    try {
      console.log('Loading original content for message:', messageId);
      
      // Get the original content from our cache
      const originalContent = originalMessageContent.get(messageId);
      if (originalContent) {
        // Find the message and restore its original content
        const messageIndex = activeChat.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          // Restore original message content
          activeChat.messages[messageIndex] = { 
            ...activeChat.messages[messageIndex], 
            content: originalContent 
          };
          
          // Check if there's an original AI response stored
          const originalAIResponse = originalMessageContent.get(messageId + '_ai_response');
          if (originalAIResponse) {
            // Find the AI response that follows this message
            let aiResponseIndex = messageIndex + 1;
            while (aiResponseIndex < activeChat.messages.length && activeChat.messages[aiResponseIndex].role !== 'assistant') {
              aiResponseIndex++;
            }
            
            if (aiResponseIndex < activeChat.messages.length && activeChat.messages[aiResponseIndex].role === 'assistant') {
              // Update existing AI response
              activeChat.messages[aiResponseIndex] = {
                ...activeChat.messages[aiResponseIndex],
                content: originalAIResponse
              };
            } else {
              // Add original AI response if none exists
              const aiResponseMessage = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: originalAIResponse,
                timestamp: new Date(),
                parentId: messageId
              };
              activeChat.messages.splice(messageIndex + 1, 0, aiResponseMessage);
            }
          }
          
          chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
          console.log('Restored original content and AI response for message:', messageId);
        }
      } else {
        console.log('No original content found for message:', messageId);
      }
    } catch (error) {
      console.error('Error loading original message content:', error);
    }
  }

  async function refreshBranchDataForMessage(messageId: string) {
    if (!activeChat) return;

    try {
      const response = await fetch(`/api/chat/messages?conversationId=${activeChat.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update branch data
          availableBranches = data.branches || [];
          
          // Store all branch messages with proper tree structure
          branchData.clear();
          Object.keys(data.messages).forEach(branchId => {
            const branchMessages = data.messages[branchId];
            console.log('Processing branch messages for branchId:', branchId, 'count:', branchMessages.length);
            const flattenedBranchMessages = reconstructMessageTree(branchMessages);
            branchData.set(branchId, flattenedBranchMessages);
          });
          
          // Update message branch counts
          messagesWithBranches.clear();
          Object.keys(data.messages).forEach(branchId => {
            if (data.messages[branchId].length > 0) {
              // Count how many branches each message appears in
              data.messages[branchId].forEach((msg: any) => {
                const currentCount = messagesWithBranches.get(msg.id) || 0;
                messagesWithBranches.set(msg.id, currentCount + 1);
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to refresh branch data:', error);
    }
  }

  function messageHasBranches(messageId: string): boolean {
    const hasBranches = messagesWithBranches.has(messageId);
    const hasOriginalContent = originalMessageContent.has(messageId);
    const isCurrentlyEditing = editingMessageId === messageId;
    const shouldShowNavigation = hasBranches || hasOriginalContent || isCurrentlyEditing;
    
    console.log('Checking if message has branches:', messageId, 'Result:', shouldShowNavigation);
    console.log('Has branches from DB:', hasBranches);
    console.log('Has original content:', hasOriginalContent);
    console.log('Is currently editing:', isCurrentlyEditing);
    return shouldShowNavigation;
  }

  function getCurrentBranchIndexForMessage(messageId: string): number {
    return messageBranchIndices.get(messageId) || 0;
  }

  function getTotalBranchesForMessage(messageId: string): number {
    // Check if we have original content stored (indicating this message has been edited)
    const hasOriginalContent = originalMessageContent.has(messageId);
    if (hasOriginalContent) {
      return 2; // Original + Edited
    }
    
    // Fallback to database branch count
    const branchCount = messagesWithBranches.get(messageId) || 0;
    return branchCount + 1; // +1 for the original branch
  }

  function getBranchesForMessage(messageId: string): Array<{ id: string; name: string; messageCount: number; parentBranchId?: string }> {
    // Only get branches that were actually created for this specific message
    const branchCount = messagesWithBranches.get(messageId) || 0;
    
    console.log('getBranchesForMessage called for:', messageId, 'branchCount:', branchCount);
    console.log('Available branches:', availableBranches.map(b => ({ id: b.id, name: b.name })));
    console.log('Branch data keys:', Array.from(branchData.keys()));
    
    if (branchCount === 0) {
      // No branches created for this message
      console.log('No branches found for message:', messageId);
      return [];
    }
    
    // Get branches that were specifically created for this message
    const messageBranches = availableBranches.filter(branch => {
      const branchMessages = branchData.get(branch.id);
      if (branchMessages) {
        // Check if this branch contains the specific message
        const hasMessage = branchMessages.some(msg => msg.id === messageId);
        
        console.log('Checking branch:', branch.id, branch.name, 'hasMessage:', hasMessage);
        
        // For the first branch (Original), always include it if it has the message
        if ((branch.name || '') === 'Original' && hasMessage) {
          console.log('Including Original branch:', branch.id);
          return true;
        }
        
        // For other branches, only include if they were created for this message
        const wasCreatedForThisMessage = branchMessages.some(msg => 
          msg.parentId === messageId
        );
        
        console.log('Branch', branch.id, 'wasCreatedForThisMessage:', wasCreatedForThisMessage);
        
        if (hasMessage && wasCreatedForThisMessage) {
          console.log('Including branch:', branch.id);
          return true;
        }
      }
      return false;
    });
    
    // Remove duplicate "Original" branches
    const uniqueBranches = messageBranches.filter((branch, index, self) => {
      if ((branch.name || '') === 'Original') {
        return index === self.findIndex(b => (b.name || '') === 'Original');
      }
      return true;
    });
    
    // Sort branches to ensure consistent order: Original first, then Branch 1, Branch 2, etc.
    uniqueBranches.sort((a, b) => {
      // Handle cases where name might be undefined
      const aName = a.name || '';
      const bName = b.name || '';
      
      if (aName === 'Original') return -1;
      if (bName === 'Original') return 1;
      
      // Extract branch numbers for sorting
      const aNum = parseInt(aName.replace('Branch ', ''));
      const bNum = parseInt(bName.replace('Branch ', ''));
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      return aName.localeCompare(bName);
    });
    
    // If we have branches but they're not in the database yet (just created), create virtual branches
    if (uniqueBranches.length === 0 && branchCount > 0) {
      const virtualBranches = [];
      
      // Add Original branch
      virtualBranches.push({
        id: 'original_' + messageId,
        name: 'Original',
        messageCount: activeChat?.messages.length || 0,
        parentBranchId: 'main'
      });
      
      // Add Edited branch
      virtualBranches.push({
        id: 'edited_' + messageId,
        name: 'Branch 1',
        messageCount: activeChat?.messages.length || 0,
        parentBranchId: 'main'
      });
      
      console.log('Created virtual branches for message', messageId, ':', virtualBranches);
      return virtualBranches;
    }
    
    // Fallback: if no branches found but we know there should be branches, 
    // include all branches that contain this message
    if (uniqueBranches.length === 0 && branchCount > 0) {
      console.log('Fallback: including all branches that contain message:', messageId);
      const fallbackBranches = availableBranches.filter(branch => {
        const branchMessages = branchData.get(branch.id);
        return branchMessages && branchMessages.some(msg => msg.id === messageId);
      });
      
      if (fallbackBranches.length > 0) {
        console.log('Found fallback branches:', fallbackBranches.map(b => ({ id: b.id, name: b.name })));
        return fallbackBranches;
      }
    }
    
    console.log('Branches for message', messageId, ':', uniqueBranches.map(b => ({ id: b.id, name: b.name })));
    return uniqueBranches;
  }

  // Load branch data on chat selection
  async function loadBranchData() {
    if (!activeChat) return;
    
    try {
      console.log('Loading branch data for chat:', activeChat.id);
      const response = await fetch(`/api/chat/messages?conversationId=${activeChat.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Branch data response:', data);
        
        if (data.success) {
          availableBranches = data.branches || [];
          console.log('Available branches:', availableBranches);
          
          // Store all branch messages with proper tree structure
          branchData.clear();
          Object.keys(data.messages).forEach(branchId => {
            const branchMessages = data.messages[branchId];
            console.log('Processing branch messages for branchId:', branchId, 'count:', branchMessages.length);
            const flattenedBranchMessages = reconstructMessageTree(branchMessages);
            branchData.set(branchId, flattenedBranchMessages);
          });
          
          // Update message branch counts
          messagesWithBranches.clear();
          Object.keys(data.messages).forEach(branchId => {
            if (data.messages[branchId].length > 0) {
              // Count how many branches each message appears in
              data.messages[branchId].forEach((msg: any) => {
                const currentCount = messagesWithBranches.get(msg.id) || 0;
                messagesWithBranches.set(msg.id, currentCount + 1);
              });
            }
          });
          
          console.log('Messages with branches:', messagesWithBranches);
        } else {
          console.error('Branch data load failed:', data.error);
        }
      } else {
        console.error('Failed to load branch data, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load branch data:', error);
    }
  }

  // Generate AI response for edited message
  async function generateAIResponseForEditedMessage(editedContent: string, messageId: string) {
    if (!activeChat) return;

    try {
      console.log('Generating AI response for edited message:', messageId);
      
      // Get the context up to the edited message
      const editIndex = activeChat.messages.findIndex(msg => msg.id === messageId);
      if (editIndex === -1) return;

      // Get messages up to and including the edited message
      const contextMessages = activeChat.messages.slice(0, editIndex + 1);
      
      // Create the edited message for the API
      const editedMessage = {
        ...contextMessages[editIndex],
        content: editedContent
      };
      
      // Replace the original message with the edited one
      const messagesForAI = [
        ...contextMessages.slice(0, editIndex),
        editedMessage
      ];

      console.log('Sending edited message to AI:', messagesForAI);

      // Send to AI API
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: messagesForAI.map(msg => ({ 
            role: msg.role, 
            content: msg.content, 
            chatId: activeChat.id 
          }))
        }),
        headers: { 'content-type': 'application/json' }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get AI response');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      
      // Add placeholder message for streaming
      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = { 
        id: assistantId, 
        role: 'assistant', 
        content: '',
        timestamp: new Date(),
        parentId: messageId
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
              } catch (_) {
                // ignore malformed lines
              }
            }
          }
        }
      }

      // AI response is now saved by the branch creation API
      // No need for additional save-message call
      
      // Store the edited AI response for navigation
      if (assistantText.trim()) {
        originalMessageContent.set(messageId + '_edited_ai_response', assistantText);
      }

      console.log('AI response generated and saved to branch');
      
    } catch (error) {
      console.error('Failed to generate AI response for edited message:', error);
      error = 'Failed to generate AI response';
    }
  }

  // Copy message to clipboard
  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
      console.log('Message copied to clipboard');
    } catch (err) {
      console.error('Failed to copy message:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }


</script>

<div class="flex bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 h-full">

  <!-- Chat Sidebar -->
  <div class="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0" in:fly={{ x: -300, duration: 300 }}>
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-2">
        <button
          onclick={createNewChat}
          class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          New Chat
        </button>
        <button
          onclick={refreshChats}
          class="bg-gray-500 text-white rounded-xl px-3 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          title="Refresh chats"
          aria-label="Refresh chats"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
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
          onclick={() => selectChat(chat)}
          role="button"
          tabindex="0"
          onkeydown={(e) => {
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
              onkeydown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); confirmRename(chat); }
                else if (e.key === 'Escape') { renamingChatId = null; }
              }}
              onblur={() => confirmRename(chat)}
            />
          {:else}
            <div class="text-sm font-medium truncate">{chat.title}</div>
          {/if}
          <div class="text-xs opacity-70 mt-1">{chat.createdAt.toLocaleDateString()}</div>
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onclick={(e) => { e.stopPropagation(); startRename(chat); }}
              class="opacity-70 hover:opacity-100 text-xs cursor-pointer p-1 hover:bg-white/20 rounded transition-all duration-200"
              aria-label="Rename chat"
            >
              ✎
            </button>
            <button
              onclick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
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
        {#if currentBranchId !== 'main'}
          <div class="flex items-center gap-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 3v6a3 3 0 0 0 3 3h6"/>
              <circle cx="6" cy="3" r="2"/>
              <circle cx="18" cy="12" r="2"/>
              <circle cx="6" cy="21" r="2"/>
              <path d="M9 15a3 3 0 0 0-3 3v3"/>
            </svg>
            <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Branch: {availableBranches.find(b => b.id === currentBranchId)?.name || currentBranchId}
            </span>
          </div>
        {/if}
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Hello, {data.user.name || 'User'}
      </div>
    </header>

    <!-- Messages -->
    <div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
      {#key activeChat?.id}
        {#if !activeChat || activeChat.messages.length === 0}
          <div class="text-center text-gray-500 dark:text-gray-400 mt-20" in:fade={{ duration: 400 }}>
            <div class="text-6xl mb-4">💬</div>
            <h2 class="text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Start a conversation</h2>
            <p class="text-lg">Ask me anything about your app, or any general question!</p>
          </div>
        {:else}
          {#each activeChat.messages.filter((msg, index, self) => index === self.findIndex(m => m.id === msg.id)) as message, i (`${activeChat.id}-${message.id}`)}
            <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} in:fly={{ y: 20, duration: 300, delay: i * 50 }}>
              <div class="max-w-3xl">
                <div class="flex items-start gap-2">
                  <!-- Fork button -->
                  <button
                    class="mt-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
                    title="Fork from this message"
                    aria-label="Fork from this message"
                    onclick={() => setReplyTarget(message.id)}
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
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}>
                    
                    {#if isForkedMessage(activeChat, i, message)}
                      <div class="mb-3 text-xs opacity-70 italic border-l-2 border-current pl-3">
                        Forked from: {getParentPreview(message) || 'previous message'}
                      </div>
                    {/if}
                    
                    {#if editingMessageId === message.id}
                      <!-- Edit mode -->
                      <div class="space-y-3">
                        <textarea
                          class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                          rows="3"
                          bind:value={editingText}
                          placeholder="Edit your message..."
                        ></textarea>
                        <div class="flex gap-2">
                          <button
                            class="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            onclick={() => saveEdit(message.id)}
                          >
                            Save
                          </button>
                          <button
                            class="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            onclick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    {:else}
                      <!-- Normal message display -->
                      {#if message.role === 'assistant'}
                        <div class="prose prose-sm max-w-none dark:prose-invert" use:setHtml={{ html: renderMarkdownLite(message.content) }}></div>
                      {:else}
                        <div class="prose prose-sm max-w-none" use:setHtml={{ html: renderMarkdownLite(message.content) }}></div>
                      {/if}
                    {/if}
                  </div>
                </div>
                
                <!-- ChatGPT-style action buttons below message -->
                {#if message.role === 'user'}
                  <div class="flex items-center justify-center gap-2 mt-2">
                    <!-- Copy button -->
                    <button
                      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer p-1 rounded transition-colors"
                      title="Copy message"
                      onclick={() => copyMessage(message.content)}
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                    
                    <!-- Branch navigation and edit button -->
                    <div class="flex justify-end items-center space-x-2">
                      <!-- Branch navigation - show on messages that have branches or are being edited -->
                      {#if messageHasBranches(message.id)}
                        <div class="flex items-center space-x-1 text-slate-500 text-sm">
                          <button 
                            class="branch-nav-button"
                            onclick={async () => await navigateToPreviousBranch(message.id)}
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
                            onclick={async () => await navigateToNextBranch(message.id)}
                            title="Next branch"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </button>
                        </div>
                      {/if}
                      
                      <!-- Edit button -->
                      <button 
                        class="user-edit-button-outside"
                        onclick={() => editUserMessage(message.content, message.id)}
                        title="Edit message"
                      >
                        <svg class="edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                    </div>
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
              Replying to: <span use:setHtml={{ html: renderMarkdownLite(replyToMessage.content) }}></span>
            </div>
          </div>
          <button class="text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100 cursor-pointer transition-colors duration-200" aria-label="Cancel reply" title="Cancel reply" onclick={() => (replyToMessageId = null)}>
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
            onkeydown={onKeyDown}
            style="min-height: 44px; max-height: 120px;"
          ></textarea>
        </div>
        
        <div class="flex gap-2">
          <button
            onclick={sendMessage}
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
              onclick={stopResponse}
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

<style>
  /* Chat-specific styles using basic CSS properties */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    outline: none;
    cursor: pointer;
  }

  .btn:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .btn-primary {
    background-color: rgb(79 70 229);
    color: white;
    height: 2.5rem;
    padding: 0.5rem 1rem;
  }

  .btn-primary:hover {
    background-color: rgb(67 56 202);
  }

  /* Basic prose styling for markdown elements */
  .prose {
    color: rgb(17 24 39);
  }

  .prose.dark {
    color: rgb(229 231 235);
  }

  /* Force all code blocks to have dark backgrounds - using direct selectors */
  .prose div[class*="bg-gray-900"],
  .prose div[class*="bg-gray-800"] {
    background-color: rgb(17 24 39) !important;
    color: rgb(229 231 235) !important;
    border: 1px solid rgb(75 85 99) !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    padding: 1rem !important;
    border-radius: 0.5rem !important;
    margin: 1rem 0 !important;
  }

  .prose div[class*="bg-gray-900"] code,
  .prose div[class*="bg-gray-800"] code {
    background-color: transparent !important;
    color: rgb(229 231 235) !important;
    border: none !important;
    padding: 0 !important;
  }

  /* Force all inline code to have dark backgrounds */
  .prose code {
    background-color: rgb(31 41 55) !important;
    color: rgb(229 231 235) !important;
    border: 1px solid rgb(75 85 99) !important;
  }

  /* Additional direct targeting for code blocks */
  .prose [class*="language-"] {
    background-color: rgb(17 24 39) !important;
    color: rgb(229 231 235) !important;
  }

  /* Ensure any element with code-related classes has dark background */
  .prose [class*="bg-gray-900"],
  .prose [class*="bg-gray-800"] {
    background-color: rgb(17 24 39) !important;
    color: rgb(229 231 235) !important;
  }

  /* Force user message text to be white */
  .bg-blue-600 {
    color: white !important;
  }

  .bg-blue-600 * {
    color: white !important;
  }

  /* Dark mode prose adjustments */
  .dark .prose {
    color: rgb(229 231 235);
  }

  .dark .prose code {
    background-color: rgb(31 41 55) !important;
    color: rgb(229 231 235) !important;
    border: 1px solid rgb(75 85 99) !important;
  }

  .dark .prose pre {
    background-color: rgb(17 24 39) !important;
    color: rgb(229 231 235) !important;
    border: 1px solid rgb(75 85 99) !important;
  }

  /* Branch navigation styles */
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

  .branch-nav-button:hover {
    background-color: rgba(255, 255, 255, 0.9);
    color: #475569;
    border-color: rgba(203, 213, 225, 0.8);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .branch-counter {
    font-size: 0.75rem;
    font-weight: 500;
    min-width: 2rem;
    text-align: center;
  }

  .user-edit-button-outside {
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

  .user-edit-button-outside:hover {
    background-color: rgba(255, 255, 255, 0.9);
    color: #475569;
    border-color: rgba(203, 213, 225, 0.8);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .edit-icon {
    width: 1rem;
    height: 1rem;
  }
</style>
