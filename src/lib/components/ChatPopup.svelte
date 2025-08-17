<script lang="ts">
  import { onMount } from 'svelte';

  type Message = { id: string; role: 'user' | 'assistant'; content: string };

  export let title: string = 'AI Assistant';
  export let placeholder: string = 'Ask me anything...';

  let isOpen = false;
  let input = '';
  let loading = false;
  let error: string | null = null;
  let messages: Message[] = [];

  function toggle() {
    isOpen = !isOpen;
    error = null;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    input = '';
    error = null;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    messages = [...messages, userMsg];

    loading = true;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) })
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
      messages = [
        ...messages,
        { id: assistantId, role: 'assistant', content: '' }
      ];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('0:"')) {
              // Extract text between 0:" and "
              const match = line.match(/^0:"(.*)"/);
              if (match) {
                assistantText += match[1];
                // Update the message in real-time
                messages = messages.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: assistantText }
                    : m
                );
              }
            }
          }
        }
      } else {
        assistantText = await res.text();
        messages = messages.map(m => 
          m.id === assistantId 
            ? { ...m, content: assistantText.trim() }
            : m
        );
      }
    } catch (e: any) {
      error = e?.message ?? 'Unknown error';
    } finally {
      loading = false;
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<style>
  .popup-shadow {
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
</style>

<!-- Launcher Button -->
<button
  class="fixed bottom-4 right-4 z-50 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 focus:outline-none"
  on:click={toggle}
>
  {isOpen ? 'Close Chat' : 'Chat'}
</button>

{#if isOpen}
  <div class="fixed bottom-16 right-4 z-50 w-full max-w-sm rounded-xl bg-white popup-shadow border">
    <div class="flex items-center justify-between border-b px-4 py-3">
      <div class="font-semibold text-gray-800">{title}</div>
      <button class="text-gray-500 hover:text-gray-700" on:click={toggle}>✕</button>
    </div>

    <div class="h-72 overflow-y-auto px-4 py-3 space-y-3">
      {#if messages.length === 0}
        <div class="text-sm text-gray-500">Ask about your dashboard, settings, or features.</div>
      {/if}

      {#each messages as m}
        <div class={m.role === 'user' ? 'text-right' : 'text-left'}>
          <div class={m.role === 'user' ? 'inline-block rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm whitespace-pre-wrap' : 'inline-block rounded-lg bg-gray-100 text-gray-800 px-3 py-2 text-sm whitespace-pre-wrap'}>
            {m.content.replace(/\\n/g, '\n')}
          </div>
        </div>
      {/each}
    </div>

    {#if error}
      <div class="px-4 pb-2 text-xs text-red-600">{error}</div>
    {/if}

    <div class="border-t px-3 py-3">
      <div class="flex items-center gap-2">
        <textarea
          class="input min-h-[38px] h-[38px] w-full resize-none"
          rows={1}
          placeholder={placeholder}
          bind:value={input}
          on:keydown={onKeyDown}
        ></textarea>
        <button
          class="btn btn-primary px-3 py-2 text-sm"
          on:click={sendMessage}
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
      <div class="mt-1 text-[10px] text-gray-500">Press Enter to send</div>
    </div>
  </div>
{/if}


