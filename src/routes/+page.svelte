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

<!-- Modern Professional Header -->
<header class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <button 
        on:click={navigateToHome}
        class="flex items-center gap-3 group" 
        aria-label="AuthenBot Home"
      >
        <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="w-6 h-6 object-contain" />
        </div>
        <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AuthenBot
        </span>
      </button>

      <!-- Navigation -->
      <nav class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">
          Features
        </a>
        <a href="#about" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">
          About
        </a>
        <a href="#contact" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">
          Contact
        </a>
      </nav>

      <!-- CTA Buttons -->
      <div class="flex items-center gap-4">
        <button 
          on:click={navigateToLogin}
          class="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
        >
          Sign In
        </button>
        <button 
          on:click={navigateToSignup}
          class="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200"
        >
          Get Started
        </button>
      </div>
    </div>
  </div>
</header>

<!-- Hero Section -->
<section class="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
  <!-- Background Elements -->
  <div class="absolute inset-0 -z-10">
    <!-- Gradient Background -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
    
    <!-- Floating Elements -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
    
    <!-- Grid Pattern -->
    <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0); background-size: 40px 40px;"></div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div class="max-w-4xl mx-auto">
      <!-- Badge -->
      <div class="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium mb-8 animate-fade-in-up">
        <span class="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
        Secure AI-Powered Authentication Platform
      </div>

      <!-- Main Headline -->
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight animate-fade-in-up" style="animation-delay: 0.1s;">
        Where Security Meets
        <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Intelligence
        </span>
      </h1>

      <!-- Subtitle -->
      <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style="animation-delay: 0.2s;">
        Enterprise-grade authentication with AI-powered chat assistance. Secure, scalable, and intelligent - built for modern teams.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style="animation-delay: 0.3s;">
        <button 
          on:click={navigateToSignup}
          class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300"
        >
          Start Free Trial
          <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </button>
        <button 
          on:click={navigateToLogin}
          class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
        >
          Sign In
        </button>
      </div>

      <!-- Trust Indicators -->
      <div class="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400 animate-fade-in-up" style="animation-delay: 0.4s;">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          SOC 2 Compliant
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          GDPR Ready
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          99.9% Uptime
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section id="features" class="py-20 bg-white dark:bg-gray-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
        Powerful Features for Modern Teams
      </h2>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Everything you need to secure your applications and enhance team productivity with AI assistance.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <!-- Authentication -->
      <div class="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Secure Authentication</h3>
        <p class="text-gray-600 dark:text-gray-400">Multi-factor authentication, OAuth integration, and enterprise-grade security protocols.</p>
      </div>

      <!-- AI Chat -->
      <div class="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
        <div class="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI-Powered Chat</h3>
        <p class="text-gray-600 dark:text-gray-400">Intelligent conversation assistance with context awareness and natural language processing.</p>
      </div>

      <!-- Admin Dashboard -->
      <div class="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
        <div class="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Admin Dashboard</h3>
        <p class="text-gray-600 dark:text-gray-400">Comprehensive user management, analytics, and system monitoring tools.</p>
      </div>

      <!-- API Integration -->
      <div class="group p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/50 dark:border-orange-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
        <div class="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Easy Integration</h3>
        <p class="text-gray-600 dark:text-gray-400">RESTful APIs, SDKs, and webhooks for seamless integration with your existing systems.</p>
      </div>
    </div>
  </div>
</section>

<!-- About Section -->
<section id="about" class="py-20 bg-gray-50 dark:bg-gray-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Built for the Future of Work
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          AuthenBot combines cutting-edge authentication technology with AI-powered assistance to create a platform that's not just secure, but intelligent. We believe that security should be invisible to users while providing administrators with powerful tools to protect their systems.
        </p>
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
            <p class="text-gray-700 dark:text-gray-300">Enterprise-grade security with zero-trust architecture</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
            <p class="text-gray-700 dark:text-gray-300">AI-powered insights and automated threat detection</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
            <p class="text-gray-700 dark:text-gray-300">Scalable infrastructure that grows with your business</p>
          </div>
        </div>
      </div>
      <div class="relative">
        <div class="relative z-10">
          <img src="/images/chatbot_pic1.gif" alt="AI Chat Interface" class="rounded-2xl shadow-2xl" />
        </div>
        <!-- Decorative Elements -->
        <div class="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 blur-2xl"></div>
        <div class="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-pink-400 to-red-400 rounded-full opacity-20 blur-2xl"></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section id="contact" class="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
  <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
    <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
      Ready to Get Started?
    </h2>
    <p class="text-xl text-blue-100 mb-8">
      Join thousands of teams who trust AuthenBot for their authentication and AI needs.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button 
        on:click={navigateToSignup}
        class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
      >
        Start Free Trial
        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
        </svg>
      </button>
      <button 
        on:click={navigateToLogin}
        class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300"
      >
        Sign In to Existing Account
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-white py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="col-span-1 md:col-span-2">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="w-6 h-6 object-contain" />
          </div>
          <span class="text-xl font-bold">AuthenBot</span>
        </div>
        <p class="text-gray-400 mb-4 max-w-md">
          Secure, intelligent authentication platform with AI-powered assistance for modern teams.
        </p>
      </div>
      <div>
        <h3 class="font-semibold mb-4">Product</h3>
        <ul class="space-y-2 text-gray-400">
          <li><a href="#features" class="hover:text-white transition-colors">Features</a></li>
          <li><a href="#about" class="hover:text-white transition-colors">About</a></li>
          <li><a href="/login" class="hover:text-white transition-colors">Pricing</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-semibold mb-4">Company</h3>
        <ul class="space-y-2 text-gray-400">
          <li><a href="#contact" class="hover:text-white transition-colors">Contact</a></li>
          <li><a href="/login" class="hover:text-white transition-colors">Support</a></li>
          <li><a href="/login" class="hover:text-white transition-colors">Privacy</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
      <p>&copy; 2024 AuthenBot. All rights reserved.</p>
    </div>
  </div>
</footer>

<style>
  /* Custom animations */
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
    opacity: 0;
  }

  /* Smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .text-5xl {
      font-size: 3rem;
    }
    
    .text-6xl {
      font-size: 3.5rem;
    }
    
    .text-7xl {
      font-size: 4rem;
    }
  }
</style>
