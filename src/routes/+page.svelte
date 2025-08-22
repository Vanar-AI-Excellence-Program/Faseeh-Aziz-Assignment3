<script lang="ts">
  import { goto } from '$app/navigation';
  
  // Client-side navigation functions
  function navigateToSignup() {
    goto('/login?signup=1');
  }
  
  function navigateToLogin() {
    goto('/login');
  }
  
  function navigateToHome() {
    goto('/');
  }
</script>

<!-- Top banner header -->
<div class="w-full bg-[#00ABE4] text-white">
  <div class="mx-auto max-w-7xl px-6 py-2 text-center text-xs md:text-sm font-medium">
    <span class="inline-flex items-center gap-2">
      <span class="animate-pulse">🚀</span>
      Welcome to AuthenBot - Your Secure AI Assistant
    </span>
  </div>

  <!-- Secondary header: logo/name left, login right -->
  <div class="w-full bg-[#E9F1FA] border-b border-[#00ABE4]/10">
    <div class="mx-auto max-w-7xl flex items-center justify-between px-4 md:px-6 py-4 gap-4 relative z-20">
      <button 
        on:click={navigateToHome}
        class="flex items-center gap-3 shrink-0 group" 
        aria-label="AuthenBot Home"
      >
        <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="h-8 w-8 object-contain transition-transform group-hover:scale-105" />
        <span class="text-lg font-bold text-[#00ABE4] transition-colors group-hover:text-[#0095c7]">AuthenBot</span>
      </button>
      <button 
        on:click={navigateToLogin}
        class="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-[#00ABE4] bg-white ring-2 ring-[#00ABE4] shadow-sm hover:bg-white/95 hover:shadow-md hover:ring-[#0095c7] focus:outline-none focus:ring-4 focus:ring-[#00ABE4]/20 transition-all duration-200 shrink-0"
        aria-label="Sign in to AuthenBot"
      >
        Login
      </button>
    </div>
  </div>
</div>

<!-- Hero Section -->
<section class="relative bg-[#E9F1FA] overflow-x-hidden min-h-screen flex items-center">
  <!-- Enhanced decorative elements -->
  <div class="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden">
    <!-- Large background circles for more visual impact -->
    <div class="absolute -top-40 -right-40 w-80 h-80 bg-[#00ABE4] rounded-full opacity-8 animate-pulse"></div>
    <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-[#00ABE4] rounded-full opacity-6 animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#00ABE4] rounded-full opacity-5 animate-pulse" style="animation-delay: 2s;"></div>
    
    <!-- Large geometric shapes for more presence -->
    <div class="absolute top-10 right-10 w-32 h-32 border-4 border-[#00ABE4] rotate-45 animate-spin opacity-15" style="animation-duration: 30s;"></div>
    <div class="absolute bottom-10 left-10 w-24 h-24 border-4 border-[#00ABE4] rounded-full animate-pulse opacity-20"></div>
    <div class="absolute top-1/3 right-1/4 w-20 h-20 border-3 border-[#00ABE4] rotate-12 animate-spin opacity-18" style="animation-duration: 25s;"></div>
    
    <!-- Large wave patterns -->
    <svg class="absolute top-0 left-0 w-full h-32 opacity-15 animate-pulse" viewBox="0 0 1440 200" fill="none">
      <path d="M0,100 Q360,50 720,100 T1440,100 L1440,200 L0,200 Z" fill="#00ABE4"/>
    </svg>
    <svg class="absolute bottom-0 right-0 w-full h-40 opacity-12 animate-pulse" style="animation-delay: 1s;" viewBox="0 0 1440 200" fill="none">
      <path d="M0,100 Q360,150 720,100 T1440,100 L1440,200 L0,200 Z" fill="#00ABE4"/>
    </svg>
    
    <!-- Large floating elements -->
    <div class="absolute top-20 left-20 w-16 h-16 bg-[#00ABE4] rounded-full animate-bounce opacity-40" style="animation-delay: 0s; animation-duration: 3s;"></div>
    <div class="absolute top-40 right-40 w-12 h-12 bg-[#00ABE4] rounded-full animate-bounce opacity-35" style="animation-delay: 1s; animation-duration: 2.5s;"></div>
    <div class="absolute bottom-40 left-1/3 w-14 h-14 bg-[#00ABE4] rounded-full animate-bounce opacity-45" style="animation-delay: 2s; animation-duration: 2.8s;"></div>
    <div class="absolute bottom-20 right-1/3 w-10 h-10 bg-[#00ABE4] rounded-full animate-bounce opacity-50" style="animation-delay: 0.5s; animation-duration: 2.2s;"></div>
    
    <!-- Additional floating particles for more background activity -->
    <div class="absolute top-1/3 left-1/5 w-6 h-6 bg-[#00ABE4] rounded-full animate-float opacity-60"></div>
    <div class="absolute top-2/3 right-1/6 w-8 h-8 bg-[#00ABE4] rounded-full animate-float opacity-40" style="animation-delay: 1.5s;"></div>
    <div class="absolute bottom-1/3 left-1/6 w-4 h-4 bg-[#00ABE4] rounded-full animate-float opacity-70" style="animation-delay: 2.5s;"></div>
    <div class="absolute top-1/2 right-1/4 w-5 h-5 bg-[#00ABE4] rounded-full animate-float opacity-55" style="animation-delay: 0.8s;"></div>
    
    <!-- Animated geometric shapes -->
    <div class="absolute top-16 right-1/4 w-12 h-12 border-3 border-[#00ABE4] rotate-45 animate-spin opacity-40" style="animation-duration: 20s;"></div>
    <div class="absolute bottom-16 left-1/3 w-10 h-10 border-3 border-[#00ABE4] rounded-full animate-pulse opacity-50"></div>
    
    <!-- Additional geometric shapes -->
    <div class="absolute top-1/4 left-1/3 w-8 h-8 border-3 border-[#00ABE4] rotate-12 animate-spin opacity-35" style="animation-duration: 15s;"></div>
    <div class="absolute bottom-1/4 right-1/5 w-6 h-6 border-3 border-[#00ABE4] rounded-full animate-pulse opacity-45"></div>
    <div class="absolute top-3/4 left-1/4 w-7 h-7 border-3 border-[#00ABE4] rotate-30 animate-spin opacity-30" style="animation-duration: 25s;"></div>
    
    <!-- Animated wave lines -->
    <svg class="absolute top-1/4 left-0 w-48 h-24 opacity-30 animate-pulse" viewBox="0 0 100 50" fill="none">
      <path d="M0,25 Q25,10 50,25 T100,25" stroke="#00ABE4" stroke-width="3" fill="none"/>
    </svg>
    <svg class="absolute bottom-1/4 right-0 w-48 h-24 opacity-30 animate-pulse" style="animation-delay: 1s;" viewBox="0 0 100 50" fill="none">
      <path d="M0,25 Q25,40 50,25 T100,25" stroke="#00ABE4" stroke-width="3" fill="none"/>
    </svg>
    
    <!-- Additional wave lines -->
    <svg class="absolute top-1/2 left-1/4 w-36 h-18 opacity-25 animate-pulse" style="animation-delay: 0.5s;" viewBox="0 0 100 50" fill="none">
      <path d="M0,25 Q25,15 50,25 T100,25" stroke="#00ABE4" stroke-width="2.5" fill="none"/>
    </svg>
    <svg class="absolute bottom-1/3 right-1/3 w-32 h-16 opacity-25 animate-pulse" style="animation-delay: 1.5s;" viewBox="0 0 100 50" fill="none">
      <path d="M0,25 Q25,35 50,25 T100,25" stroke="#00ABE4" stroke-width="2.5" fill="none"/>
    </svg>

    <!-- Enhanced dotted grid background -->
    <div class="absolute inset-0 opacity-15" aria-hidden="true" style="background-image: radial-gradient(#00ABE4 1px, transparent 1px); background-size: 20px 20px;"></div>
    
    <!-- Additional background patterns -->
    <div class="absolute inset-0 opacity-8" aria-hidden="true" style="background-image: linear-gradient(45deg, #00ABE4 25%, transparent 25%), linear-gradient(-45deg, #00ABE4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #00ABE4 75%), linear-gradient(-45deg, transparent 75%, #00ABE4 75%); background-size: 80px 80px; background-position: 0 0, 0 40px, 40px -40px, -40px 0px;"></div>
    
    <!-- Large glowing orbs -->
    <div class="absolute top-1/6 right-1/6 w-24 h-24 bg-[#00ABE4] rounded-full opacity-15 animate-glow blur-2xl"></div>
    <div class="absolute bottom-1/6 left-1/6 w-20 h-20 bg-[#00ABE4] rounded-full opacity-12 animate-glow blur-xl" style="animation-delay: 1s;"></div>
    <div class="absolute top-2/3 left-2/3 w-22 h-22 bg-[#00ABE4] rounded-full opacity-10 animate-glow blur-2xl" style="animation-delay: 2s;"></div>
    
    <!-- Large data flow circles -->
    <svg class="absolute top-1/4 right-1/4 w-32 h-32 opacity-20 animate-spin" style="animation-duration: 12s;" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="40" stroke="#00ABE4" stroke-width="3" stroke-dasharray="8,8" fill="none"/>
      <circle cx="50" cy="50" r="25" stroke="#00ABE4" stroke-width="2" stroke-dasharray="5,5" fill="none"/>
    </svg>
    
    <!-- Large connection dots -->
    <div class="absolute top-1/3 right-1/3 w-4 h-4 bg-[#00ABE4] rounded-full animate-ping opacity-60" style="animation-delay: 0.5s;"></div>
    <div class="absolute bottom-1/3 right-1/3 w-4 h-4 bg-[#00ABE4] rounded-full animate-ping opacity-60" style="animation-delay: 1s;"></div>
    <div class="absolute top-2/3 left-1/4 w-3 h-3 bg-[#00ABE4] rounded-full animate-ping opacity-70" style="animation-delay: 1.5s;"></div>

    <!-- Enhanced bubbles with staggered animation -->
    <div class="hidden md:block absolute top-10 right-24 h-10 w-10 rounded-full bg-white/80 border-2 border-[#00ABE4] shadow animate-bounce" style="animation-delay: 0s; animation-duration: 3s;" aria-hidden="true"></div>
    <div class="hidden md:block absolute bottom-16 left-10 h-6 w-6 rounded-full bg-white/80 border-2 border-[#00ABE4] shadow animate-bounce" style="animation-delay: 1s; animation-duration: 2.5s;" aria-hidden="true"></div>
    <div class="hidden lg:block absolute top-32 left-1/4 h-4 w-4 rounded-full bg-white/80 border-2 border-[#00ABE4] shadow animate-bounce" style="animation-delay: 2s; animation-duration: 2s;" aria-hidden="true"></div>

    <!-- Enhanced screw icons -->
    <div class="hidden md:flex absolute top-20 left-8 h-10 w-10 items-center justify-center rounded-full bg-white/90 border-2 border-[#00ABE4] shadow relative animate-pulse" aria-hidden="true">
      <span class="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 bg-[#00ABE4]"></span>
      <span class="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-[#00ABE4]"></span>
    </div>
    <div class="hidden lg:flex absolute bottom-24 right-20 h-8 w-8 items-center justify-center rounded-full bg-white/90 border-2 border-[#00ABE4] shadow relative animate-pulse" aria-hidden="true">
      <span class="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-[#00ABE4]"></span>
      <span class="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-[#00ABE4]"></span>
    </div>

    <!-- Enhanced mini bot badges -->
    <svg aria-hidden="true" class="hidden lg:block absolute top-28 right-48 h-10 w-10 drop-shadow animate-pulse" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="14" width="28" height="20" rx="6" fill="#FFFFFF" stroke="#00ABE4" stroke-width="2"/>
      <circle cx="20" cy="24" r="3" fill="#00ABE4"/>
      <circle cx="36" cy="12" r="3" fill="#00ABE4"/>
      <circle cx="30" cy="24" r="3" fill="#00ABE4"/>
    </svg>
    <svg aria-hidden="true" class="hidden md:block absolute bottom-28 left-1/3 h-8 w-8 drop-shadow animate-pulse" viewBox="0 0 48 48" fill="none">
      <rect x="12" y="16" width="24" height="16" rx="5" fill="#FFFFFF" stroke="#00ABE4" stroke-width="2"/>
      <circle cx="22" cy="24" r="2.5" fill="#00ABE4"/>
      <circle cx="28" cy="24" r="2.5" fill="#00ABE4"/>
    </svg>

    <!-- Enhanced soft radial glow blobs -->
    <div class="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-20 animate-pulse" aria-hidden="true" style="background: radial-gradient(circle at center, #00ABE4 0%, #E9F1FA 60%, transparent 70%);"></div>
    <div class="absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl opacity-10 animate-pulse" aria-hidden="true" style="animation-delay: 1s; background: radial-gradient(circle at center, #00ABE4 0%, #E9F1FA 60%, transparent 70%);"></div>

    <!-- Enhanced bottom wave -->
    <svg aria-hidden="true" class="absolute bottom-0 left-0 right-0 h-24 w-full opacity-20" viewBox="0 0 1440 200" preserveAspectRatio="none">
      <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,40 1440,100 L1440,200 L0,200 Z" fill="#00ABE4"></path>
    </svg>
  </div>

  <div class="grid w-full items-center gap-12 md:grid-cols-2 max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-12">
    <!-- Enhanced Copy + CTA (left) -->
    <div class="order-1 md:order-1 space-y-8 px-0 max-w-xl">

      <div class="space-y-4">
        <h1 class="text-pretty text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl lg:text-6xl xl:text-7xl">
          Where Work Happens
        </h1>
        <div class="h-1 w-24 bg-[#00ABE4] rounded-full animate-pulse"></div>
      </div>

      <div class="flex flex-wrap gap-3">
        <span class="inline-flex items-center rounded-full bg-white text-[#00ABE4] px-4 py-2 text-sm md:text-base font-semibold shadow-sm ring-2 ring-[#00ABE4] transition-all duration-200 hover:shadow-md hover:ring-[#0095c7] animate-bounce" style="animation-delay: 0s; animation-duration: 2s;">
          🔒 Safe
        </span>
        <span class="inline-flex items-center rounded-full bg-white text-[#00ABE4] px-4 py-2 text-sm md:text-base font-semibold shadow-sm ring-2 ring-[#00ABE4] transition-all duration-200 hover:shadow-md hover:ring-[#0095c7] animate-bounce" style="animation-delay: 0.5s; animation-duration: 2s;">
          🤖 Smart
        </span>
        <span class="inline-flex items-center rounded-full bg-white text-[#00ABE4] px-4 py-2 text-sm md:text-base font-semibold shadow-sm ring-2 ring-[#00ABE4] transition-all duration-200 hover:shadow-md hover:ring-[#0095c7] animate-bounce" style="animation-delay: 1s; animation-duration: 2s;">
          ⚡ Seamless
        </span>
      </div>

      <p class="max-w-2xl text-lg md:text-xl leading-7 text-gray-700">
        Built for thinkers, trusted by teams. Where secure access meets smarter conversations with AI-powered assistance.
      </p>

      <!-- Enhanced CTA section -->
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <button 
            on:click={navigateToSignup}
            class="group inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-300 shadow-lg bg-[#00ABE4] hover:bg-[#0095c7] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#00ABE4]/20 focus:bg-[#0095c7] active:scale-95 animate-pulse"
            aria-label="Get started with AuthenBot for free"
          >
            Get Started Free
            <svg class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </button>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
          <div class="flex items-center gap-2">
            <svg class="h-4 w-4 text-green-500 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>Secure AI conversations</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="h-4 w-4 text-green-500 flex-shrink-0 animate-pulse" style="animation-delay: 0.5s;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>No setup required</span>
          </div>
        </div>

        <p class="text-sm text-gray-600">
          Already have an account? 
          <button 
            on:click={navigateToLogin}
            class="underline decoration-[#00ABE4] underline-offset-4 hover:decoration-2 font-medium transition-colors hover:text-[#00ABE4] focus:outline-none focus:ring-2 focus:ring-[#00ABE4]/20 rounded bg-transparent border-none cursor-pointer" 
            aria-label="Sign in to existing account"
          >
            Sign in
          </button>.
        </p>
      </div>
    </div>

    <!-- Enhanced Illustration (right) with multiple animated elements -->
    <div class="order-2 md:order-2 relative h-64 sm:h-72 md:h-[400px] lg:h-[480px] xl:h-[520px] rounded-2xl overflow-hidden shadow-2xl shadow-[#00ABE4]/30 ring-1 ring-[#00ABE4]/10 transform hover:scale-[1.02] transition-transform duration-500 focus-within:scale-[1.02]">
      <img
        src="/images/chatbot_pic1.gif"
        alt="AI-powered chatbot illustration showing secure conversation interface"
        class="absolute inset-0 size-full object-cover"
        loading="eager"
      />
      <!-- Overlay gradient for better text contrast -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#00ABE4]/10 to-transparent"></div>
      
      <!-- Animated floating elements over the image -->
      <div class="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full animate-ping"></div>
      <div class="absolute bottom-4 left-4 w-6 h-6 bg-[#00ABE4]/30 rounded-full animate-pulse"></div>
      <div class="absolute top-1/2 left-4 w-4 h-4 bg-white/40 rounded-full animate-bounce" style="animation-delay: 1s;"></div>
      
      <!-- Animated data flow lines -->
      <svg class="absolute top-1/4 right-1/4 w-16 h-16 opacity-60 animate-spin" style="animation-duration: 8s;" viewBox="0 0 50 50" fill="none">
        <circle cx="25" cy="25" r="20" stroke="#00ABE4" stroke-width="2" stroke-dasharray="5,5" fill="none"/>
        <circle cx="25" cy="25" r="12" stroke="#00ABE4" stroke-width="1" stroke-dasharray="3,3" fill="none"/>
      </svg>
      
      <!-- Animated connection dots -->
      <div class="absolute top-1/3 right-1/3 w-2 h-2 bg-[#00ABE4] rounded-full animate-ping" style="animation-delay: 0.5s;"></div>
      <div class="absolute bottom-1/3 right-1/3 w-2 h-2 bg-[#00ABE4] rounded-full animate-ping" style="animation-delay: 1s;"></div>
    </div>
  </div>
</section>

<style>
  /* Custom animations */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(0, 171, 228, 0.5); }
    50% { box-shadow: 0 0 20px rgba(0, 171, 228, 0.8); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }
</style>
