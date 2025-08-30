<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  export let data: {
    user: { id: string; name?: string | null; email?: string | null; role?: string | null };
  };

  let fileInput: HTMLInputElement;
  let selectedFiles: File[] = [];
  let isUploading = false;
  let uploadProgress = '';
  let uploadResults: any[] = [];
  let error: string | null = null;
  let successMessage = '';

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  onMount(() => {
    // Redirect if not authenticated
    if (!data.user?.id) {
      goto('/login');
    }
  });

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const newFiles = Array.from(target.files);
      
      // Check if adding these files would exceed the limit
      if (selectedFiles.length + newFiles.length > MAX_FILES) {
        error = `You can only upload up to ${MAX_FILES} files at a time`;
        return;
      }

      // Validate each file
      for (const file of newFiles) {
        if (!file.type.startsWith('text/') && !file.name.endsWith('.txt')) {
          error = 'Only text files (.txt) are supported';
          return;
        }
        
        if (file.size > MAX_FILE_SIZE) {
          error = `File ${file.name} is too large. Maximum size is 10MB`;
          return;
        }
      }

      // Add valid files
      selectedFiles = [...selectedFiles, ...newFiles];
      error = null;
      successMessage = '';
      
      // Reset file input
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    error = null;
    successMessage = '';
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function uploadFiles() {
    if (selectedFiles.length === 0) {
      error = 'Please select at least one file to upload';
      return;
    }

    isUploading = true;
    uploadProgress = 'Starting upload...';
    error = null;
    successMessage = '';
    uploadResults = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        uploadProgress = `Processing file ${i + 1} of ${selectedFiles.length}: ${file.name}`;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/ingest', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to upload ${file.name}: ${errorData.error || 'Upload failed'}`);
        }

        const result = await response.json();
        uploadResults.push({
          fileName: file.name,
          ...result
        });
      }

      uploadProgress = 'All files uploaded successfully!';
      successMessage = `Successfully uploaded ${uploadResults.length} document(s). You can now return to chat and the AI will use these documents as context.`;
      
      // Clear selected files after successful upload
      selectedFiles = [];

    } catch (err: any) {
      error = err.message || 'Upload failed';
      uploadProgress = '';
    } finally {
      isUploading = false;
    }
  }

  function goToChat() {
    goto('/chat');
  }
</script>

<svelte:head>
  <title>Document Upload - RAG System</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        📄 Document Upload
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Upload up to 5 text documents to enhance your AI chat experience with context-aware responses
      </p>
    </div>

    <!-- Upload Section -->
    <div class="max-w-4xl mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Upload Documents
        </h2>

        <!-- File Selection -->
        <div class="mb-6">
          <label for="file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Text Files (up to {MAX_FILES})
          </label>
          <input
            bind:this={fileInput}
            type="file"
            id="file"
            accept=".txt,text/*"
            multiple
            onchange={handleFileSelect}
            class="block w-full text-sm text-gray-500 dark:text-gray-400
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   dark:file:bg-blue-900/20 dark:file:text-blue-300
                   hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30
                   file:cursor-pointer cursor-pointer
                   border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-gray-50 dark:bg-gray-700"
          />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Only .txt files are supported. Maximum file size: 10MB per file. You can upload up to {MAX_FILES} files.
          </p>
        </div>

        <!-- Selected Files List -->
        {#if selectedFiles.length > 0}
          <div class="mb-6">
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">Selected Files ({selectedFiles.length}/{MAX_FILES}):</h3>
            <div class="space-y-2">
              {#each selectedFiles as file, index}
                <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-blue-900 dark:text-blue-100">{file.name}</p>
                    <p class="text-xs text-blue-700 dark:text-blue-300">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onclick={() => removeFile(index)}
                    class="ml-3 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Remove file"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Upload Button -->
        <button
          onclick={uploadFiles}
          disabled={selectedFiles.length === 0 || isUploading}
          class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold
                 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {#if isUploading}
            <span class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          {:else}
            Upload & Process {selectedFiles.length} Document{selectedFiles.length !== 1 ? 's' : ''}
          {/if}
        </button>

        <!-- Progress -->
        {#if uploadProgress}
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p class="text-sm text-blue-800 dark:text-blue-200">{uploadProgress}</p>
          </div>
        {/if}

        <!-- Error -->
        {#if error}
          <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        {/if}

        <!-- Success Message -->
        {#if successMessage}
          <div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 class="font-medium text-green-900 dark:text-green-100 mb-2">✅ Upload Successful!</h3>
            <p class="text-sm text-green-800 dark:text-green-200 mb-3">{successMessage}</p>
            <button
              onclick={goToChat}
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Go to Chat
            </button>
          </div>
        {/if}

        <!-- Upload Results -->
        {#if uploadResults.length > 0}
          <div class="mt-6">
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">Upload Results:</h3>
            <div class="space-y-3">
              {#each uploadResults as result}
                <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 class="font-medium text-green-900 dark:text-green-100">{result.fileName}</h4>
                  <div class="text-xs text-green-800 dark:text-green-200 space-y-1 mt-1">
                    <p><strong>Document ID:</strong> {result.documentId}</p>
                    <p><strong>Total Chunks:</strong> {result.totalChunks}</p>
                    <p><strong>Successful Chunks:</strong> {result.successfulChunks}</p>
                    {#if result.failedChunks > 0}
                      <p><strong>Failed Chunks:</strong> {result.failedChunks}</p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Info Section -->
      <div class="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          How It Works
        </h2>
        <div class="space-y-4 text-gray-600 dark:text-gray-300">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">1</div>
            <p>Upload up to 5 text documents (.txt files only)</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">2</div>
            <p>Our system automatically processes and stores your documents for AI context</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">3</div>
            <p>Return to chat and the AI will use your documents to provide context-aware responses</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">4</div>
            <p>Say "answer out of context" to get responses without using your documents</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="mt-8 text-center">
        <button
          onclick={goToChat}
          class="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Chat
        </button>
      </div>
    </div>
  </div>
</div>
