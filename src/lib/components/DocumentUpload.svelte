<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, scale } from 'svelte/transition';

  const dispatch = createEventDispatcher<{
    upload: { success: boolean; message: string; documentId?: string };
  }>();

  let fileInput: HTMLInputElement;
  let isUploading = false;
  let uploadProgress = 0;
  let selectedFile: File | null = null;
  let documentName = '';

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      selectedFile = target.files[0];
      if (!documentName) {
        documentName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
      }
    }
  }

  function openFileDialog() {
    fileInput?.click();
  }

  async function uploadDocument() {
    if (!selectedFile || !documentName.trim()) {
      dispatch('upload', { success: false, message: 'Please select a file and enter a document name' });
      return;
    }

    isUploading = true;
    uploadProgress = 0;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', documentName.trim());

      // Simulate progress
      const progressInterval = setInterval(() => {
        uploadProgress = Math.min(uploadProgress + 10, 90);
      }, 200);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      uploadProgress = 100;

      if (response.ok) {
        const result = await response.json();
        dispatch('upload', { 
          success: true, 
          message: `Document uploaded successfully! Created ${result.chunksCreated} chunks.`,
          documentId: result.documentId
        });
        
        // Reset form
        selectedFile = null;
        documentName = '';
        if (fileInput) fileInput.value = '';
      } else {
        const error = await response.json();
        dispatch('upload', { success: false, message: error.error || 'Upload failed' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      dispatch('upload', { success: false, message: 'Upload failed. Please try again.' });
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }

  function cancelUpload() {
    selectedFile = null;
    documentName = '';
    if (fileInput) fileInput.value = '';
    isUploading = false;
    uploadProgress = 0;
  }
</script>

<div class="document-upload-container">
  <div class="upload-area" class:uploading={isUploading}>
    {#if !selectedFile}
      <div class="upload-prompt" in:fly={{ y: 20, duration: 300 }}>
        <div class="upload-icon">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <h3 class="upload-title">Upload Document</h3>
        <p class="upload-description">
          Upload a text file to add it to your knowledge base for AI chat retrieval.
        </p>
        <button
          type="button"
          class="upload-button"
          on:click={openFileDialog}
          disabled={isUploading}
        >
          Choose File
        </button>
        <p class="upload-hint">Supports .txt, .md, .json files</p>
      </div>
    {:else}
      <div class="file-selected" in:scale={{ duration: 300 }}>
        <div class="file-info">
          <div class="file-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="file-details">
            <p class="file-name">{selectedFile.name}</p>
            <p class="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>

        <div class="upload-form">
          <label for="document-name" class="form-label">Document Name</label>
          <input
            id="document-name"
            type="text"
            bind:value={documentName}
            placeholder="Enter a name for this document"
            class="form-input"
            disabled={isUploading}
          />

          {#if isUploading}
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: {uploadProgress}%"></div>
              </div>
              <p class="progress-text">Processing document... {uploadProgress}%</p>
            </div>
          {/if}

          <div class="upload-actions">
            {#if !isUploading}
              <button
                type="button"
                class="cancel-button"
                on:click={cancelUpload}
              >
                Cancel
              </button>
              <button
                type="button"
                class="upload-submit-button"
                on:click={uploadDocument}
                disabled={!documentName.trim()}
              >
                Upload Document
              </button>
            {:else}
              <button
                type="button"
                class="upload-submit-button"
                disabled
              >
                Uploading...
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <input
      bind:this={fileInput}
      type="file"
      accept=".txt,.md,.json"
      on:change={handleFileSelect}
      class="hidden"
    />
  </div>
</div>

<style>
  .document-upload-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  .upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    background-color: #f9fafb;
    transition: all 0.3s ease;
  }

  .upload-area:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .upload-area.uploading {
    border-color: #10b981;
    background-color: #ecfdf5;
  }

  .upload-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .upload-icon {
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .upload-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .upload-description {
    color: #6b7280;
    margin: 0;
    max-width: 400px;
  }

  .upload-button {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .upload-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .upload-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .upload-hint {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
  }

  .file-selected {
    text-align: left;
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .file-icon {
    color: #3b82f6;
  }

  .file-details {
    flex: 1;
  }

  .file-name {
    font-weight: 500;
    color: #374151;
    margin: 0 0 0.25rem 0;
  }

  .file-size {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .upload-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }

  .progress-container {
    margin: 1rem 0;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399);
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .upload-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .cancel-button {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-button:hover {
    background-color: #e5e7eb;
  }

  .upload-submit-button {
    background: linear-gradient(135deg, #10b981, #34d399);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .upload-submit-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .upload-submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hidden {
    display: none;
  }
</style>
