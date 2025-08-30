<script lang="ts">
  export let provider: 'google' | 'github' = 'google';
  export let action = 'signin';
  export let callbackUrl = '/post-auth';
  export let className = '';
  
  const providers = {
    google: {
      name: 'Google',
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      logo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.35 11.1h-9.18v2.98h5.39c-.23 1.48-1.62 4.34-5.39 4.34-3.25 0-5.9-2.68-5.9-5.98s2.65-5.98 5.9-5.98c1.85 0 3.1.78 3.81 1.45l2.59-2.5C17.94 3.6 16.02 2.7 14 2.7 8.9 2.7 4.75 6.84 4.75 12.02S8.9 21.35 14 21.35c7.01 0 8.65-6.14 7.35-10.25Z"/></svg>`
    },
    github: {
      name: 'GitHub',
      bgColor: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white',
      borderColor: 'border-gray-900',
      logo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.56 1.07 1.56 1.07.9 1.57 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05.8-.23 1.65-.35 2.5-.35.85 0 1.7.12 2.5.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.49C19.13 20.6 22 16.78 22 12.26 22 6.58 17.52 2 12 2Z"/></svg>`
    }
  };
  
  const config = providers[provider];

  // Action to inject trusted HTML (generated locally)
  function setHtml(node: HTMLElement, params: { html: string }) {
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
</script>

<form method="POST" action="/auth/{action}/{provider}?callbackUrl={callbackUrl}" class="contents">
  <button 
    type="submit" 
    class="
      w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm
      transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95
      {config.bgColor} {config.textColor} {config.borderColor}
      {className}
    "
    aria-label="Continue with {config.name}"
  >
    <span class="flex-shrink-0" use:setHtml={{ html: config.logo }}></span>
    Continue with {config.name}
  </button>
</form>
