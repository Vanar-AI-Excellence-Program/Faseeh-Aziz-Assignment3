<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let data: {
    user: { id: string; name?: string | null; email?: string | null; role?: string | null };
  };

  type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date };
  type Chat = { id: string; title: string; messages: Message[]; createdAt: Date };

  let chats: Chat[] = [];
  let activeChat: Chat | null = null;
  let input = '';
  let loading = false;
  let error: string | null = null;
  let fileInput: HTMLInputElement;
  let uploadedFile: File | null = null;
  let sidebarOpen = true;

  // Auto-scroll to bottom
  let messagesContainer: HTMLDivElement;

  onMount(() => {
    loadChatsFromStorage();
    if (chats.length === 0) {
      createNewChat();
    } else {
      activeChat = chats[0];
    }
  });

  function loadChatsFromStorage() {
    if (!browser) return;
    try {
      const stored = localStorage.getItem(`chats_${data.user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        chats = parsed.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
    } catch (e) {
      console.error('Failed to load chats:', e);
    }
  }

  function saveChatsToStorage() {
    if (!browser) return;
    try {
      localStorage.setItem(`chats_${data.user.id}`, JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chats:', e);
    }
  }

  function createNewChat() {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    chats = [newChat, ...chats];
    activeChat = newChat;
    saveChatsToStorage();
  }

  function selectChat(chat: Chat) {
    activeChat = chat;
  }

  function deleteChat(chatId: string) {
    chats = chats.filter(c => c.id !== chatId);
    if (activeChat?.id === chatId) {
      activeChat = chats[0] || null;
      if (!activeChat) {
        createNewChat();
      }
    }
    saveChatsToStorage();
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      uploadedFile = file;
    }
  }

  function removeFile() {
    uploadedFile = null;
    if (fileInput) fileInput.value = '';
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !activeChat) return;
    
    input = '';
    error = null;

    const userMsg: Message = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      content: text,
      timestamp: new Date()
    };

    // Update chat title if it's the first message
    if (activeChat.messages.length === 0) {
      activeChat.title = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }

    activeChat.messages = [...activeChat.messages, userMsg];
    chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
    saveChatsToStorage();

    loading = true;
    scrollToBottom();

    try {
      const formData = new FormData();
      formData.append('messages', JSON.stringify(activeChat.messages.map(({ role, content }) => ({ role, content }))));
      
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: uploadedFile ? formData : JSON.stringify({ 
          messages: activeChat.messages.map(({ role, content }) => ({ role, content })) 
        }),
        headers: uploadedFile ? {} : { 'content-type': 'application/json' }
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
        timestamp: new Date()
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
            if (line.startsWith('0:"')) {
              const match = line.match(/^0:"(.*)"/);
              if (match) {
                assistantText += match[1];
                // Update the message in real-time
                activeChat.messages = activeChat.messages.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: assistantText }
                    : m
                );
                chats = chats.map(c => c.id === activeChat?.id ? activeChat : c);
                scrollToBottom();
              }
            }
          }
        }
      }

      saveChatsToStorage();
      removeFile();
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

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

<div class="flex h-screen bg-white">
  <!-- Sidebar -->
  <div class={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-50 border-r border-gray-200 flex flex-col`}>
    <div class="p-4 border-b border-gray-200">
      <button
        onclick={createNewChat}
        class="w-full btn btn-primary rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        New Chat
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2">
      {#each chats as chat}
        <div
          class={`p-3 rounded-lg mb-2 cursor-pointer group relative ${
            activeChat?.id === chat.id ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100'
          }`}
          onclick={() => selectChat(chat)}
        >
          <div class="text-sm font-medium truncate">{chat.title}</div>
          <div class="text-xs text-gray-500 mt-1">{chat.createdAt.toLocaleDateString()}</div>
          <button
            onclick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs"
          >
            ✕
          </button>
        </div>
      {/each}
    </div>
  </div>

  <!-- Main Chat Area -->
  <div class="flex-1 flex flex-col">
    <!-- Header -->
    <header class="border-b border-gray-200 p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button onclick={toggleSidebar} class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
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
      {#if !activeChat || activeChat.messages.length === 0}
        <div class="text-center text-gray-500 mt-20">
          <div class="text-4xl mb-4">💬</div>
          <h2 class="text-xl font-semibold mb-2">Start a conversation</h2>
          <p>Ask me anything about your app, or any general question!</p>
        </div>
      {:else}
        {#each activeChat.messages as message}
          <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div class="max-w-3xl">
              <div class={`rounded-2xl px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div class="whitespace-pre-wrap">{message.content.replace(/\\n/g, '\n')}</div>
              </div>
              <div class={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        {/each}
      {/if}
      
      {#if loading}
        <div class="flex justify-start">
          <div class="bg-gray-100 rounded-2xl px-4 py-3">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
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
      {#if uploadedFile}
        <div class="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
            <span class="text-sm text-blue-900">{uploadedFile.name}</span>
          </div>
          <button onclick={removeFile} class="text-red-500 hover:text-red-700">
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
          <input
            bind:this={fileInput}
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onchange={handleFileSelect}
            class="hidden"
          />
          <button
            onclick={() => fileInput?.click()}
            class="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Upload file"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </button>
          
          <button
            onclick={sendMessage}
            disabled={loading || (!input.trim() && !uploadedFile)}
            class="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
