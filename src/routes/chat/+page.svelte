<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';

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

  let replyToMessageId: string | null = null;
  let renamingChatId: string | null = null;
  let renameInput = '';
  let fileInput: HTMLInputElement;
  let uploadedFile: File | null = null;
  $: replyToMessage = activeChat?.messages.find((m) => m.id === replyToMessageId) || null;

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
    text = text.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700 bg-blue-50 p-4 rounded-lg">$1</blockquote>');
    
    // Horizontal rules (---, ***, ___)
    text = text.replace(/^[\s]*[-*_]{3,}[\s]*$/gim, '<hr class="my-4 border-blue-500 opacity-70">');
    
    // Tables (basic support)
    text = text.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => `<td class="border border-gray-300 px-3 py-2">${cell.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    });
    text = text.replace(/(<tr>.*<\/tr>)/s, '<table class="border-collapse border border-gray-300 my-4 w-full">$1</table>');
    
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

  onMount(() => {
    // Convert DB data to local format
    if (data.chats && data.chats.length > 0) {
      chats = data.chats.map((chat: any) => ({
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
      
      // Set the first chat as active
      activeChat = chats[0];
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
      // Load messages for the selected chat only if they haven't been loaded yet
      if (!chat.messages || chat.messages.length === 0) {
        try {
          const response = await fetch(`/api/chat/message?chatId=${chat.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.messages) {
              chat.messages = data.messages.map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.createdAt),
                parentId: msg.parentId
              }));
            } else {
              chat.messages = [];
            }
          } else {
            console.error('Failed to load messages for chat:', chat.id);
            chat.messages = [];
          }
        } catch (error) {
          console.error('Error loading messages:', error);
          chat.messages = [];
        }
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
          return chain.map(({ role, content }) => ({ role, content, chatId: activeChat.id }));
        } else {
          // Normal linear conversation - send all messages plus the new user message
          const allMessages = [...activeChat.messages, userMsg];
          console.log('Normal conversation - all messages:', allMessages.map(m => ({ role: m.role, content: m.content.substring(0, 50) })));
          return allMessages.map(({ role, content }) => ({ role, content, chatId: activeChat.id }));
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
         body: JSON.stringify({ messages: validBranchMessages }),
         headers: { 'content-type': 'application/json' }
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

      // Save messages to DB
      try {
        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: userMsg.id,
            chatId: activeChat.id,
            parentId: parentId, // Use the computed parentId
            role: userMsg.role,
            content: userMsg.content
          })
        });
        
        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: assistantId,
            chatId: activeChat.id,
            parentId: userMsg.id,
            role: 'assistant',
            content: assistantText
          })
        });
      } catch (e) {
        console.error('Failed to save messages:', e);
      }

      
    } catch (e: any) {
      error = e?.message ?? 'Unknown error';
    } finally {
      loading = false;
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 10);
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
</script>

<div class="flex bg-white h-full">

  <!-- Chat Sidebar -->
  <div class="w-80 bg-gray-50 border-r border-gray-200 flex flex-col min-h-0">
    <div class="p-4 border-b border-gray-200">
      <div class="flex gap-2">
        <button
          onclick={createNewChat}
          class="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          New Chat
        </button>
        <button
          onclick={refreshChats}
          class="bg-gray-500 text-white rounded-lg px-3 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-600 transition-colors"
          title="Refresh chats"
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
          class={`p-3 rounded-lg mb-2 cursor-pointer group relative w-full ${
            activeChat?.id === chat.id ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
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
              class="text-sm font-medium w-full bg-white border border-blue-300 rounded px-2 py-1"
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
          <div class="text-xs text-gray-500 mt-1">{chat.createdAt.toLocaleDateString()}</div>
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onclick={(e) => { e.stopPropagation(); startRename(chat); }}
              class="text-gray-500 hover:text-gray-700 text-xs cursor-pointer p-1 hover:bg-gray-200 rounded"
              aria-label="Rename chat"
            >
              ✎
            </button>
            <button
              onclick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
              class="text-red-500 hover:text-red-700 text-xs cursor-pointer p-1 hover:bg-gray-200 rounded"
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
     <header class="border-b border-gray-200 p-4 flex items-center justify-between">
       <div class="flex items-center gap-3">
         <h1 class="text-lg font-semibold text-gray-900">
           {activeChat?.title || 'AI Assistant'}
         </h1>
       </div>
       <div class="text-sm text-gray-500">
         Hello, {data.user.name || 'User'}
       </div>
     </header>

    <!-- Messages -->
    <div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
      {#key activeChat?.id}
        {#if !activeChat || activeChat.messages.length === 0}
          <div class="text-center text-gray-500 mt-20">
            <div class="text-4xl mb-4">💬</div>
            <h2 class="text-xl font-semibold mb-2">Start a conversation</h2>
            <p>Ask me anything about your app, or any general question!</p>
          </div>
        {:else}
          {#each activeChat.messages as message, i (`${activeChat.id}-${message.id}`)}
            <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div class="max-w-3xl">
                <div class="flex items-start gap-2">
                  <button
                    class="mt-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
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
                  <div class={`rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-50 text-gray-900 border border-gray-200'
                  }`}>
                    {#if isForkedMessage(activeChat, i, message)}
                      <div class="mb-2 text-xs text-gray-500 italic">
                        Forked from: {getParentPreview(message) || 'previous message'}
                      </div>
                    {/if}
                    {#if message.role === 'assistant'}
                      <div class="prose prose-sm max-w-none" use:setHtml={{ html: renderMarkdownLite(message.content) }}></div>
                    {:else}
                      <div class="prose prose-sm max-w-none" use:setHtml={{ html: renderMarkdownLite(message.content) }}></div>
                    {/if}
                  </div>
                </div>
                <div class={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          {/each}
        {/if}
      {/key}
      
      {#if loading}
        <div class="flex justify-start">
          <div class="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    {#if error}
      <div class="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm">
        {error}
      </div>
    {/if}

    <!-- Input Area -->
    <div class="border-t border-gray-200 p-4">
      {#if replyToMessage}
        <div class="mb-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 flex items-start justify-between gap-3">
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
          <button class="text-indigo-700 hover:text-indigo-900 cursor-pointer" aria-label="Cancel reply" title="Cancel reply" onclick={() => (replyToMessageId = null)}>
            ✕
          </button>
        </div>
      {/if}
      

      <div class="flex items-end gap-3">
        <div class="flex-1">
          <textarea
            class="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
             class="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
             aria-label="Send message"
           >
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
             </svg>
           </button>
         </div>
      </div>
      
      <div class="mt-2 text-xs text-gray-500 text-center">
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

  .prose {
    color: rgb(17 24 39);
  }

  .prose p {
    margin-bottom: 0.5rem;
  }

  .prose p:last-child {
    margin-bottom: 0;
  }

  .prose code {
    background-color: rgb(31 41 55);
    color: rgb(229 231 235);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    border: 1px solid rgb(75 85 99);
  }

  .prose pre {
    background-color: rgb(17 24 39);
    color: rgb(229 231 235);
    padding: 0.75rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    border: 1px solid rgb(75 85 99);
    margin: 0;
  }

  .prose pre code {
    background-color: transparent;
    padding: 0;
    color: rgb(229 231 235);
    border: none;
  }

  .prose strong {
    font-weight: 600;
  }

  .prose em {
    font-style: italic;
  }

  .prose del {
    text-decoration: line-through;
  }

  .prose h1, .prose h2, .prose h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    line-height: 1.25;
  }

  .prose h1 {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .prose h2 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .prose h3 {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .prose ul, .prose ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .prose li {
    margin: 0.25rem 0;
  }

  .prose blockquote {
    border-left: 4px solid rgb(59 130 246);
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: rgb(55 65 81);
    background-color: rgb(239 246 255);
    padding: 1rem;
    border-radius: 0.5rem;
  }

  .prose hr {
    border: none;
    border-top: 2px solid rgb(59 130 246);
    margin: 1.5rem 0;
    opacity: 0.7;
  }

  .prose table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    background-color: rgb(249 250 251);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .prose th, .prose td {
    border: 1px solid rgb(209 213 219);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  .prose th {
    background-color: rgb(243 244 246);
    font-weight: 600;
    color: rgb(17 24 39);
  }

  .prose td {
    background-color: rgb(255 255 255);
    color: rgb(17 24 39);
  }

  .prose a {
    color: #2563eb;
    text-decoration: underline;
  }

  .prose a:hover {
    color: #1d4ed8;
  }

  /* Force all code blocks to have dark backgrounds - using direct selectors */
  .prose pre,
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

  .prose pre code,
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

  /* Target any div that contains code blocks */
  .prose div:has(> pre),
  .prose div:has(> code) {
    background-color: rgb(17 24 39) !important;
    color: rgb(229 231 235) !important;
  }

  /* Additional direct targeting for code blocks */
  .prose .bg-gray-900,
  .prose .bg-gray-800,
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
  .bg-indigo-600 {
    color: white !important;
  }

  .bg-indigo-600 * {
    color: white !important;
  }
</style>
