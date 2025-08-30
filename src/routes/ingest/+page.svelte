<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  export let data: {
    user: { id: string; name?: string | null; email?: string | null; role?: string | null };
  };

  let fileInput: HTMLInputElement;
  let selectedFile: File | null = null;
  let isUploading = false;
  let uploadProgress = '';
  let uploadResult: any = null;
  let error: string | null = null;

  onMount(() => {
    // Redirect if not authenticated
    if (!data.user?.id) {
      goto('/login');
    }
  });

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      selectedFile = target.files[0];
      error = null;
      uploadResult = null;
    }
  }

  async function uploadFile() {
    if (!selectedFile) {
      error = 'Please select a file first';
      return;
    }

    // Check file type
    if (!selectedFile.type.startsWith('text/') && !selectedFile.name.endsWith('.txt')) {
      error = 'Only text files (.txt) are supported';
      return;
    }

    isUploading = true;
    uploadProgress = 'Starting upload...';
    error = null;
    uploadResult = null;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      uploadProgress = 'Processing file and generating chunks...';

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      uploadProgress = 'Generating embeddings...';
      const result = await response.json();
      
      uploadResult = result;
      uploadProgress = 'Upload completed successfully!';
      
      // Reset file input
      if (fileInput) {
        fileInput.value = '';
      }
      selectedFile = null;

    } catch (err: any) {
      error = err.message || 'Upload failed';
      uploadProgress = '';
    } finally {
      isUploading = false;
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<svelte:head>
  <title>Document Ingestion - RAG System</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        📄 Document Ingestion
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Upload text documents to build your knowledge base for AI-powered search and chat
      </p>
    </div>

    <!-- Upload Section -->
    <div class="max-w-2xl mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Upload Document
        </h2>

        <!-- File Selection -->
        <div class="mb-6">
          <label for="file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Text File
          </label>
          <input
            bind:this={fileInput}
            type="file"
            id="file"
            accept=".txt,text/*"
            on:change={handleFileSelect}
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
            Only .txt files are currently supported. Maximum file size: 10MB
          </p>
        </div>

        <!-- File Info -->
        {#if selectedFile}
          <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Selected File:</h3>
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Name:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
              <p><strong>Type:</strong> {selectedFile.type || 'text/plain'}</p>
            </div>
          </div>
        {/if}

        <!-- Upload Button -->
        <button
          on:click={uploadFile}
          disabled={!selectedFile || isUploading}
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
            Upload & Process Document
          {/if}
        </button>

        <!-- Progress -->
        {#if uploadProgress}
          <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p class="text-sm text-green-800 dark:text-green-200">{uploadProgress}</p>
          </div>
        {/if}

        <!-- Error -->
        {#if error}
          <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        {/if}

        <!-- Success Result -->
        {#if uploadResult}
          <div class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 class="font-medium text-green-900 dark:text-green-100 mb-2">✅ Upload Successful!</h3>
            <div class="text-sm text-green-800 dark:text-green-200 space-y-1">
              <p><strong>Document ID:</strong> {uploadResult.documentId}</p>
              <p><strong>Name:</strong> {uploadResult.documentName}</p>
              <p><strong>Total Chunks:</strong> {uploadResult.totalChunks}</p>
              <p><strong>Successful Chunks:</strong> {uploadResult.successfulChunks}</p>
              {#if uploadResult.failedChunks > 0}
                <p><strong>Failed Chunks:</strong> {uploadResult.failedChunks}</p>
              {/if}
            </div>
            <p class="mt-2 text-green-700 dark:text-green-300">{uploadResult.message}</p>
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
            <p>Upload your text document (.txt files only for now)</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">2</div>
            <p>Our system automatically splits the document into intelligent chunks (~500 tokens each)</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">3</div>
            <p>Each chunk gets converted to a vector embedding using AI</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">4</div>
            <p>Your document is now searchable and can be used to provide context in AI chat responses</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
