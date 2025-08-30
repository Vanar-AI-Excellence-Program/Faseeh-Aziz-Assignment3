import { browser } from '$app/environment';

export function renderMarkdownLite(src: string): string {
  let text = src || '';
  
  // Headers (# ## ###)
  text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
  
  // Code fences ```lang\ncode\n``` with syntax highlighting
  text = text.replace(/```([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const cls = lang ? ` class="language-${lang}"` : '';
    const langLabel = lang ? `<div class="text-xs text-gray-300 mb-2 font-mono bg-gray-700 px-2 py-1 rounded">${lang}</div>` : '';
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Use base64 encoding to safely store the original code in the data attribute
    const base64Code = btoa(unescape(encodeURIComponent(code.trim())));
    const copyButton = `<button class="code-copy-btn bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-2 py-1 rounded text-xs transition-colors cursor-pointer active:scale-95" data-code-b64="${base64Code}">Copy</button>`;
    
    return `<div class="bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto border border-gray-600 shadow-lg" style="background-color: rgb(17 24 39) !important; color: rgb(229 231 235) !important;"><div class="flex justify-between items-center mb-3">${langLabel}${copyButton}</div><pre class="bg-gray-900 text-gray-100" style="background-color: rgb(17 24 39) !important; color: rgb(229 231 235) !important; white-space: pre; overflow-x: auto;"><code${cls}>${escapedCode}</code></pre></div>`;
  });

  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, (_m, code) => {
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Use base64 encoding for inline code as well to be safe
    const base64Code = btoa(unescape(encodeURIComponent(code)));
    
    return `<code class="bg-gray-800 text-gray-100 px-2 py-1 rounded text-sm font-mono border border-gray-600 relative group" style="background-color: rgb(31 41 55) !important; color: rgb(229 231 235) !important;">${escapedCode}<button class="inline-code-copy-btn absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white px-1 py-0.5 rounded text-xs transition-all duration-200 cursor-pointer active:scale-95 z-10" data-code-b64="${base64Code}">Copy</button></code>`;
  });

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
    const cells = content.split('|').map((cell: string) => `<td class="border border-gray-300 px-3 py-2">${cell.trim()}</td>`).join('');
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
    // Skip empty lines entirely to prevent extra spacing
    if (!line) {
      return '';
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
