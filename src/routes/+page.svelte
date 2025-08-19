 

<!-- Top banner header -->
<div class="w-full bg-[#00ABE4] text-white">
  <div class="mx-auto max-w-7xl px-6 py-1.5 text-center text-xs md:text-sm font-medium whitespace-nowrap">
    Welcome to AuthenBot!
  </div>

  <!-- Secondary header: logo/name left, login right -->
  <div class="w-full bg-[#E9F1FA]">
    <div class="mx-auto max-w-7xl flex items-center justify-between px-4 md:px-6 py-3 gap-4 relative z-20">
      <a href="/" class="flex items-center gap-2 shrink-0">
        <img src="/images/applogo_1.png" alt="AuthenBot Logo" class="h-8 w-8 object-contain" />
        <span class="text-lg font-bold text-[#00ABE4]">AuthenBot</span>
      </a>
      <a href="/login" class="inline-flex items-center justify-center rounded-full px-5 py-1.5 text-sm font-semibold text-[#00ABE4] bg-white ring-2 ring-[#00ABE4] shadow-sm hover:bg-white/95 hover:shadow-md transition shrink-0">
        Login
      </a>
    </div>
  </div>
</div>

<section class="relative bg-[#E9F1FA] mt-0 overflow-x-hidden">
  <!-- Decorative bubbles/bots/screws (non-interactive) -->
  <div class="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden">
    <!-- Subtle dotted grid background -->
    <div class="absolute inset-0 opacity-10" aria-hidden="true" style="background-image: radial-gradient(#00ABE4 0.8px, transparent 0.8px); background-size: 18px 18px;"></div>

    <!-- Bubbles -->
    <div class="hidden md:block absolute top-10 right-24 h-10 w-10 rounded-full bg-white/80 border-2 border-[#00ABE4] shadow" aria-hidden="true"></div>
    <div class="hidden md:block absolute bottom-16 left-10 h-6 w-6 rounded-full bg-white/80 border-2 border-[#00ABE4] shadow" aria-hidden="true"></div>

    <!-- Screw icons -->
    <div class="hidden md:flex absolute top-20 left-8 h-10 w-10 items-center justify-center rounded-full bg-white/90 border-2 border-[#00ABE4] shadow relative" aria-hidden="true">
      <span class="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 bg-[#00ABE4]"></span>
      <span class="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-[#00ABE4]"></span>
    </div>
    <div class="hidden lg:flex absolute bottom-24 right-20 h-8 w-8 items-center justify-center rounded-full bg-white/90 border-2 border-[#00ABE4] shadow relative" aria-hidden="true">
      <span class="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-[#00ABE4]"></span>
      <span class="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-[#00ABE4]"></span>
    </div>

    <!-- Mini bot badges -->
    <svg aria-hidden="true" class="hidden lg:block absolute top-28 right-48 h-10 w-10 drop-shadow" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="14" width="28" height="20" rx="6" fill="#FFFFFF" stroke="#00ABE4" stroke-width="2"/>
      <circle cx="20" cy="24" r="3" fill="#00ABE4"/>
      <circle cx="36" cy="12" r="3" fill="#00ABE4"/>
      <circle cx="30" cy="24" r="3" fill="#00ABE4"/>
    </svg>
    <svg aria-hidden="true" class="hidden md:block absolute bottom-28 left-1/3 h-8 w-8 drop-shadow" viewBox="0 0 48 48" fill="none">
      <rect x="12" y="16" width="24" height="16" rx="5" fill="#FFFFFF" stroke="#00ABE4" stroke-width="2"/>
      <circle cx="22" cy="24" r="2.5" fill="#00ABE4"/>
      <circle cx="28" cy="24" r="2.5" fill="#00ABE4"/>
    </svg>

    <!-- Soft radial glow blobs -->
    <div class="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-20" aria-hidden="true" style="background: radial-gradient(circle at center, #00ABE4 0%, #E9F1FA 60%, transparent 70%);"></div>
    <div class="absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl opacity-10" aria-hidden="true" style="background: radial-gradient(circle at center, #00ABE4 0%, #E9F1FA 60%, transparent 70%);"></div>

    <!-- Bottom wave -->
    <svg aria-hidden="true" class="absolute bottom-0 left-0 right-0 h-24 w-full opacity-20" viewBox="0 0 1440 200" preserveAspectRatio="none">
      <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,40 1440,100 L1440,200 L0,200 Z" fill="#00ABE4"></path>
    </svg>
  </div>
  <div class="grid w-full items-center gap-0 md:grid-cols-2">
    <!-- Copy + CTA (left) -->
    <div class="order-1 md:order-1 space-y-5 px-6 pt-5 pb-6 md:px-10 md:pt-6 md:pb-8 lg:px-16 max-w-xl">

      <h1 class="text-pretty text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
        Where Work Happens
      </h1>
      <p class="inline-flex items-center rounded-full bg-white text-[#00ABE4] px-4 py-1.5 text-sm md:text-base font-semibold shadow-sm ring-2 ring-[#00ABE4]">
        Safe · Smart · Seamless
      </p>
      <p class="max-w-2xl text-lg md:text-xl leading-7 text-gray-700">
        Built for thinkers, trusted by teams. Where secure access meets smarter conversations.
      </p>

      <!-- CTA only (email removed) -->
      <div class="flex w-full max-w-md items-center gap-3 flex-wrap">
        <a href="/login?signup=1" class="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition shadow-md bg-[#00ABE4] hover:brightness-110">
          Get Started
        </a>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        Already have an account? <a class="underline decoration-[#00ABE4] underline-offset-4 hover:decoration-2" href="/login">Sign in</a>.
      </p>
    </div>

    <!-- Illustration (right) -->
    <div class="order-2 md:order-2 relative h-56 sm:h-64 md:h-[320px] lg:h-[400px] xl:h-[480px] rounded-2xl overflow-hidden shadow-2xl shadow-[#00ABE4]/30 ring-1 ring-[#00ABE4]/10">
      <img
        src="/images/chatbot_pic1.gif"
        alt="Chatbot illustration"
        class="absolute inset-0 size-full object-cover"
      />
    </div>
  </div>
</section>
