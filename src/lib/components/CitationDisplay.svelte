<script lang="ts">
    export let citations: Array<{
        documentId: string;
        documentName: string;
        chunkIndex: number;
        text: string;
        similarity: number;
    }> = [];

    function handleCitationClick(documentId: string, chunkIndex: number) {
        // Emit an event that parent components can listen to
        const event = new CustomEvent('citationClick', {
            detail: { documentId, chunkIndex }
        });
        // Use window.dispatchEvent instead of global dispatchEvent
        window.dispatchEvent(event);
    }

    function formatSimilarity(similarity: number): string {
        return (similarity * 100).toFixed(1);
    }
</script>

{#if citations && citations.length > 0}
    <div class="citations-container">
        <div class="citations-header">
            <h4 class="citations-title">Sources</h4>
            <span class="citations-count">{citations.length} source{citations.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div class="citations-list">
            {#each citations as citation, index}
                <div class="citation-item">
                    <div class="citation-header">
                        <span class="citation-number">{index + 1}.</span>
                        <button 
                            class="citation-link"
                            on:click={() => handleCitationClick(citation.documentId, citation.chunkIndex)}
                            title="View source document"
                        >
                            <strong>{citation.documentName}</strong>
                            <span class="citation-chunk">(chunk {citation.chunkIndex})</span>
                        </button>
                        <span class="citation-similarity">
                            {formatSimilarity(citation.similarity)}% match
                        </span>
                    </div>
                    
                    <div class="citation-preview">
                        <p class="citation-text">
                            {citation.text.length > 200 
                                ? citation.text.substring(0, 200) + '...' 
                                : citation.text
                            }
                        </p>
                    </div>
                    
                    <div class="citation-marker">
                        <code class="citation-code">
                            [doc:{citation.documentId}, chunk:{citation.chunkIndex}]
                        </code>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    .citations-container {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 0.875rem;
    }

    .citations-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .citations-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin: 0;
    }

    .citations-count {
        font-size: 0.75rem;
        color: #6b7280;
        background-color: #e5e7eb;
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
    }

    .citations-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .citation-item {
        padding: 0.75rem;
        background-color: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        margin-bottom: 0.75rem;
    }

    .citation-item:last-child {
        margin-bottom: 0;
    }

    .citation-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .citation-number {
        font-weight: 600;
        color: #6b7280;
        min-width: 1.5rem;
    }

    .citation-link {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        text-align: left;
        color: #3b82f6;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        transition: color 0.2s ease;
    }

    .citation-link:hover {
        color: #2563eb;
        text-decoration: underline;
    }

    .citation-chunk {
        font-weight: normal;
        color: #6b7280;
        font-size: 0.75rem;
    }

    .citation-similarity {
        margin-left: auto;
        font-size: 0.75rem;
        color: #059669;
        background-color: #d1fae5;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-weight: 500;
    }

    .citation-preview {
        margin-bottom: 0.5rem;
    }

    .citation-text {
        color: #4b5563;
        line-height: 1.4;
        margin: 0;
        font-size: 0.8125rem;
    }

    .citation-marker {
        display: flex;
        justify-content: flex-end;
    }

    .citation-code {
        background-color: #f3f4f6;
        color: #374151;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        border: 1px solid #d1d5db;
    }

    /* Dark mode support */
    :global(.dark) .citations-container {
        background-color: #1f2937;
        border-color: #374151;
    }

    :global(.dark) .citations-header {
        border-bottom-color: #374151;
    }

    :global(.dark) .citations-title {
        color: #f9fafb;
    }

    :global(.dark) .citations-count {
        color: #9ca3af;
        background-color: #374151;
    }

    :global(.dark) .citation-item {
        background-color: #111827;
        border-color: #374151;
    }

    :global(.dark) .citation-number {
        color: #9ca3af;
    }

    :global(.dark) .citation-link {
        color: #60a5fa;
    }

    :global(.dark) .citation-link:hover {
        color: #93c5fd;
    }

    :global(.dark) .citation-chunk {
        color: #9ca3af;
    }

    :global(.dark) .citation-similarity {
        color: #34d399;
        background-color: #064e3b;
    }

    :global(.dark) .citation-text {
        color: #d1d5db;
    }

    :global(.dark) .citation-code {
        background-color: #374151;
        color: #f9fafb;
        border-color: #4b5563;
    }
</style>
