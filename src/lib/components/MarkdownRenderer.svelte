<script lang="ts">
    import { marked } from 'marked';
    import { onMount } from 'svelte';

    export let content: string = '';
    export let className: string = '';

    let container: HTMLDivElement;

    // Configure marked for security
    marked.setOptions({
        breaks: true, // Convert line breaks to <br>
        gfm: true,    // GitHub Flavored Markdown
        sanitize: false, // We'll handle sanitization ourselves
        smartLists: true,
        smartypants: true
    });

    // Simple HTML sanitization function
    function sanitizeHtml(html: string): string {
        // Remove potentially dangerous tags and attributes
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
            .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    // Copy code to clipboard
    async function copyCode(codeText: string, button: HTMLButtonElement) {
        try {
            await navigator.clipboard.writeText(codeText);
            
            // Change button to show success state (only icon change, no color change)
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
            
            // Reset button after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 2000);
            
            console.log('Code copied to clipboard');
        } catch (err) {
            console.error('Failed to copy code:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = codeText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Show success state even for fallback (only icon change, no color change)
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 2000);
        }
    }

    // Render markdown to HTML with copy buttons for code blocks
    function renderMarkdown(text: string): string {
        try {
            let html = marked(text);
            
            // Add copy buttons to code blocks
            html = html.replace(
                /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g,
                (match, codeContent) => {
                    const decodedContent = codeContent
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'");
                    
                    return `
                        <div class="code-block-wrapper">
                            <button 
                                class="copy-button" 
                                data-code="${btoa(decodedContent)}"
                                title="Copy code"
                            >
                                <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                            ${match}
                        </div>
                    `;
                }
            );
            
            return sanitizeHtml(html);
        } catch (error) {
            console.error('Markdown rendering error:', error);
            // Fallback to plain text with line breaks
            return text.replace(/\n/g, '<br>');
        }
    }

    // Setup copy button event listeners
    function setupCopyButtons() {
        if (container) {
            const copyButtons = container.querySelectorAll('.copy-button');
            copyButtons.forEach(button => {
                // Remove any existing listeners to prevent duplicates
                button.removeEventListener('click', handleCopyClick);
                button.addEventListener('click', handleCopyClick);
            });
        }
    }

    // Handle copy button click
    function handleCopyClick(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the button element (could be the target or its parent)
        let buttonElement = e.target as HTMLElement;
        while (buttonElement && !buttonElement.classList.contains('copy-button')) {
            buttonElement = buttonElement.parentElement as HTMLElement;
        }
        
        if (buttonElement && buttonElement.classList.contains('copy-button')) {
            const codeData = buttonElement.getAttribute('data-code');
            if (codeData) {
                const decodedContent = atob(codeData);
                copyCode(decodedContent, buttonElement as HTMLButtonElement);
            }
        }
    }

    // Update content when it changes
    $: if (container && content) {
        container.innerHTML = renderMarkdown(content);
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
            setupCopyButtons();
        }, 0);
    }

    onMount(() => {
        // Initial setup
        if (container) {
            setupCopyButtons();
        }
    });
</script>

<div 
    bind:this={container} 
    class="markdown-content {className}"
    class:prose={!className.includes('prose')}
    class:prose-invert={!className.includes('prose-invert')}
>
    {#if !content}
        <span class="text-gray-400">No content</span>
    {/if}
</div>

<style>
    /* Custom markdown styles */
    .markdown-content {
        line-height: 1.6;
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
        max-width: 100%;
        overflow-x: hidden;
    }

    .markdown-content :global(h1) {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 1rem 0 0.5rem 0;
        color: inherit;
    }

    .markdown-content :global(h2) {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0.75rem 0 0.5rem 0;
        color: inherit;
    }

    .markdown-content :global(h3) {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0.5rem 0 0.25rem 0;
        color: inherit;
    }

    .markdown-content :global(h4) {
        font-size: 1rem;
        font-weight: 600;
        margin: 0.5rem 0 0.25rem 0;
        color: inherit;
    }

    .markdown-content :global(p) {
        margin: 0.5rem 0;
        color: inherit;
    }

    .markdown-content :global(ul), .markdown-content :global(ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
        color: inherit;
    }

    .markdown-content :global(li) {
        margin: 0.25rem 0;
        color: inherit;
    }

    .markdown-content :global(blockquote) {
        border-left: 4px solid #3b82f6;
        padding: 1rem;
        margin: 0.5rem 0;
        font-style: italic;
        color: #475569;
        background-color: #f8fafc;
        border-radius: 0.5rem;
        border-left-width: 4px;
    }

    .markdown-content :global(code) {
        background-color: #f3f4f6;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: 'Courier New', monospace;
        font-size: 0.875rem;
        color: #dc2626;
        word-wrap: break-word;
        word-break: break-all;
        overflow-wrap: break-word;
        max-width: 100%;
    }

    .markdown-content :global(pre) {
        background-color: #f8fafc;
        color: #1e293b;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 0.5rem 0;
        max-width: 100%;
        word-wrap: break-word;
        word-break: break-all;
        overflow-wrap: break-word;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    /* Code block wrapper and copy button styles */
    .markdown-content :global(.code-block-wrapper) {
        position: relative;
        margin: 0.5rem 0;
    }

    .markdown-content :global(.copy-button) {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(226, 232, 240, 0.8);
        color: #64748b;
        padding: 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        min-height: 2rem;
        user-select: none;
        backdrop-filter: blur(4px);
    }

    .markdown-content :global(.code-block-wrapper:hover .copy-button) {
        opacity: 1;
    }

    .markdown-content :global(.copy-button:hover) {
        background-color: rgba(255, 255, 255, 1);
        color: #475569;
        border-color: rgba(203, 213, 225, 1);
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
    }

    .markdown-content :global(.copy-icon) {
        width: 1rem;
        height: 1rem;
    }

    .markdown-content :global(pre code) {
        background-color: transparent;
        padding: 0;
        color: inherit;
    }

    .markdown-content :global(a) {
        color: #3b82f6;
        text-decoration: underline;
    }

    .markdown-content :global(a:hover) {
        color: #2563eb;
    }

    .markdown-content :global(strong) {
        font-weight: 600;
        color: inherit;
    }

    .markdown-content :global(em) {
        font-style: italic;
        color: inherit;
    }

    .markdown-content :global(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 0.5rem 0;
    }

    .markdown-content :global(th), .markdown-content :global(td) {
        border: 1px solid #e5e7eb;
        padding: 0.5rem;
        text-align: left;
        color: inherit;
    }

    .markdown-content :global(th) {
        background-color: #f9fafb;
        font-weight: 600;
    }

    .markdown-content :global(hr) {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 1rem 0;
    }

    /* Dark mode support */
    .prose-invert .markdown-content :global(blockquote) {
        border-left-color: #4b5563;
        color: #9ca3af;
    }

    .prose-invert .markdown-content :global(code) {
        background-color: #374151;
        color: #f87171;
    }

    .prose-invert .markdown-content :global(pre) {
        background-color: #000000;
        color: #f9fafb;
    }

    .prose-invert .markdown-content :global(.copy-button) {
        background-color: rgba(17, 24, 39, 0.8);
        border-color: rgba(75, 85, 99, 0.3);
        color: #9ca3af;
    }

    .prose-invert .markdown-content :global(.copy-button:hover) {
        background-color: rgba(31, 41, 55, 0.9);
        color: #f9fafb;
        border-color: rgba(75, 85, 99, 0.5);
    }

    .prose-invert .markdown-content :global(th) {
        background-color: #374151;
    }

    .prose-invert .markdown-content :global(td), .prose-invert .markdown-content :global(th) {
        border-color: #4b5563;
    }

    .prose-invert .markdown-content :global(hr) {
        border-top-color: #4b5563;
    }
</style>
