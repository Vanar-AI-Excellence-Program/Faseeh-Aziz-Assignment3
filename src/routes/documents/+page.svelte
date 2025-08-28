<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import DocumentUpload from '$lib/components/DocumentUpload.svelte';
  import Toast from '$lib/components/Toast.svelte';

  export let data: {
    user: { id: string; name?: string | null; email?: string | null; role?: string | null };
  };

  let documents: any[] = [];
  let loading = true;
  let showUpload = false;
  let toastMessage = '';
  let toastType: 'success' | 'error' = 'success';
  let showToast = false;

  onMount(async () => {
    await loadDocuments();
  });

  async function loadDocuments() {
    try {
      loading = true;
      const response = await fetch('/api/documents');
      if (response.ok) {
        const result = await response.json();
        documents = result.documents || [];
      } else {
        showToastMessage('Failed to load documents', 'error');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      showToastMessage('Failed to load documents', 'error');
    } finally {
      loading = false;
    }
  }

  async function deleteDocument(documentId: string) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        documents = documents.filter(doc => doc.id !== documentId);
        showToastMessage('Document deleted successfully', 'success');
      } else {
        showToastMessage('Failed to delete document', 'error');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showToastMessage('Failed to delete document', 'error');
    }
  }

  function handleUpload(event: CustomEvent) {
    const { success, message } = event.detail;
    showToastMessage(message, success ? 'success' : 'error');
    
    if (success) {
      showUpload = false;
      loadDocuments();
    }
  }

  function showToastMessage(message: string, type: 'success' | 'error') {
    toastMessage = message;
    toastType = type;
    showToast = true;
    
    setTimeout(() => {
      showToast = false;
    }, 5000);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<svelte:head>
  <title>Documents - Knowledge Base</title>
</svelte:head>

<div class="documents-page">
  <div class="container">
    <!-- Header -->
    <header class="page-header" in:fly={{ y: -20, duration: 300 }}>
      <div class="header-content">
        <h1 class="page-title">Knowledge Base</h1>
        <p class="page-description">
          Upload and manage documents for AI chat retrieval. Your documents are automatically processed and indexed for intelligent search.
        </p>
      </div>
      <button
        class="upload-toggle-button"
        on:click={() => showUpload = !showUpload}
        class:active={showUpload}
      >
        {showUpload ? 'Cancel' : 'Upload Document'}
      </button>
    </header>

    <!-- Upload Section -->
    {#if showUpload}
      <div class="upload-section" in:scale={{ duration: 300 }}>
        <DocumentUpload on:upload={handleUpload} />
      </div>
    {/if}

    <!-- Documents List -->
    <div class="documents-section">
      {#if loading}
        <div class="loading-state" in:fly={{ y: 20, duration: 300 }}>
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p>Loading documents...</p>
        </div>
      {:else if documents.length === 0}
        <div class="empty-state" in:fly={{ y: 20, duration: 300 }}>
          <div class="empty-icon">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3>No documents yet</h3>
          <p>Upload your first document to start building your knowledge base.</p>
          <button
            class="upload-first-button"
            on:click={() => showUpload = true}
          >
            Upload Document
          </button>
        </div>
      {:else}
        <div class="documents-grid">
          {#each documents as document (document.id)}
            <div class="document-card" in:fly={{ y: 20, duration: 300, delay: 100 }}>
              <div class="document-header">
                <div class="document-icon">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div class="document-info">
                  <h3 class="document-name">{document.name}</h3>
                  <p class="document-meta">
                    {document.chunkCount} chunks • {formatDate(document.createdAt)}
                  </p>
                </div>
                <div class="document-actions">
                  <button
                    class="delete-button"
                    on:click={() => deleteDocument(document.id)}
                    title="Delete document"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              {#if document.metadata && Object.keys(document.metadata).length > 0}
                <div class="document-details">
                  {#if document.metadata.filename}
                    <div class="detail-item">
                      <span class="detail-label">File:</span>
                      <span class="detail-value">{document.metadata.filename}</span>
                    </div>
                  {/if}
                  {#if document.metadata.size}
                    <div class="detail-item">
                      <span class="detail-label">Size:</span>
                      <span class="detail-value">{formatFileSize(document.metadata.size)}</span>
                    </div>
                  {/if}
                  {#if document.metadata.fileType}
                    <div class="detail-item">
                      <span class="detail-label">Type:</span>
                      <span class="detail-value">{document.metadata.fileType}</span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

{#if showToast}
  <Toast message={toastMessage} type={toastType} />
{/if}

<style>
  .documents-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 2rem;
  }

  .header-content {
    flex: 1;
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .page-description {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.6;
  }

  .upload-toggle-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .upload-toggle-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  .upload-toggle-button.active {
    background: rgba(239, 68, 68, 0.8);
    border-color: rgba(239, 68, 68, 0.9);
  }

  .upload-section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .documents-section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .loading-state {
    text-align: center;
    padding: 3rem 0;
  }

  .loading-spinner {
    margin-bottom: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem 0;
  }

  .empty-icon {
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }

  .upload-first-button {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .upload-first-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .documents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .document-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
  }

  .document-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
  }

  .document-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .document-icon {
    color: #3b82f6;
    flex-shrink: 0;
  }

  .document-info {
    flex: 1;
    min-width: 0;
  }

  .document-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.25rem 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .document-meta {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .document-actions {
    flex-shrink: 0;
  }

  .delete-button {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .delete-button:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .document-details {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
    margin-top: 1rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .detail-item:last-child {
    margin-bottom: 0;
  }

  .detail-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .detail-value {
    font-size: 0.875rem;
    color: #374151;
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .upload-toggle-button {
      align-self: flex-start;
    }

    .documents-grid {
      grid-template-columns: 1fr;
    }

    .page-title {
      font-size: 2rem;
    }
  }
</style>

