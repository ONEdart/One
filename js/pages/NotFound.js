// js/pages/NotFound.js
// 404 Not Found page for One - Solid White Design

export default {
  name: 'NotFoundPage',
  
  data() {
    return {
      messages: [
        "The page you're looking for doesn't exist.",
        "This page has moved or no longer exists.",
        "We couldn't find what you're looking for.",
        "Looks like you've followed a broken link."
      ],
      currentMessage: 0,
      isMessageTransitioning: false,
      is404Visible: false,
      isContentVisible: false
    }
  },
  
  mounted() {
    // Animate elements in sequence
    setTimeout(() => {
      this.is404Visible = true
    }, 100)
    
    setTimeout(() => {
      this.isContentVisible = true
    }, 500)
    
    // Rotate through messages every 5 seconds with fade transition
    this.messageInterval = setInterval(() => {
      this.isMessageTransitioning = true
      setTimeout(() => {
        this.currentMessage = (this.currentMessage + 1) % this.messages.length
        this.isMessageTransitioning = false
      }, 300)
    }, 5000)
  },
  
  beforeUnmount() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval)
    }
  },
  
  methods: {
    goBack() {
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/drive')
      }
    },
    
    refreshPage() {
      window.location.reload()
    },
    
    navigateToHome() {
      this.$router.push('/drive')
    }
  },
  
  template: `
    <div class="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 bg-gradient-to-b from-white to-slate-50">
      <div class="w-full max-w-lg text-center">
        
        <!-- 404 Graphic with animation -->
        <div class="relative mb-12">
          <div 
            class="text-9xl font-bold text-slate-900 opacity-5 transition-all duration-1000 ease-out"
            :class="{'translate-y-0 opacity-5': is404Visible, 'translate-y-4 opacity-0': !is404Visible}"
          >404</div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div 
              class="text-6xl font-bold text-slate-900 relative"
              :class="{'translate-y-0 opacity-100': is404Visible, 'translate-y-8 opacity-0': !is404Visible}"
              style="transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <span class="relative inline-block">
                <span class="relative z-10">404</span>
                <span 
                  class="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 blur-xl opacity-50 rounded-full"
                  style="animation: pulse-glow 2s infinite"
                ></span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- Title with fade animation -->
        <h1 
          class="text-3xl font-semibold text-slate-900 mb-6 transition-all duration-700 ease-out"
          :class="{'translate-y-0 opacity-100': isContentVisible, 'translate-y-6 opacity-0': !isContentVisible}"
          style="transition-delay: 100ms"
        >
          Page not found
        </h1>
        
        <!-- Rotating Message with crossfade -->
        <div class="h-16 mb-8 flex items-center justify-center overflow-hidden">
          <div class="relative w-full max-w-md h-full">
            <div 
              v-for="(message, index) in messages"
              :key="index"
              class="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
              :class="{
                'translate-y-0 opacity-100': currentMessage === index && !isMessageTransitioning,
                '-translate-y-4 opacity-0': currentMessage !== index || isMessageTransitioning
              }"
            >
              <p class="text-lg text-slate-600 px-4">
                {{ message }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Error Details with slide animation -->
        <div 
          class="mb-10 p-5 bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-700 ease-out overflow-hidden"
          :class="{'translate-y-0 opacity-100': isContentVisible, 'translate-y-8 opacity-0': !isContentVisible}"
          style="transition-delay: 200ms"
        >
          <div class="text-sm text-slate-600">
            <p class="mb-3 flex items-center justify-center">
              <span class="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              <strong class="mr-2">URL:</strong>
              <span class="font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                {{ $route.fullPath }}
              </span>
            </p>
            <p class="flex items-center justify-center">
              <span class="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" style="animation-delay: 0.5s"></span>
              <strong class="mr-2">Status:</strong>
              <span class="text-red-600 font-medium bg-red-50 px-2 py-1 rounded border border-red-100">
                404 Not Found
              </span>
            </p>
          </div>
        </div>
        
        <!-- Action Buttons with staggered animation -->
        <div 
          class="flex flex-col sm:flex-row gap-4 justify-center mb-10 transition-all duration-700 ease-out"
          :class="{'translate-y-0 opacity-100': isContentVisible, 'translate-y-8 opacity-0': !isContentVisible}"
          style="transition-delay: 300ms"
        >
          
          <!-- Go Back Button -->
          <button
            @click="goBack"
            class="group px-6 py-3 border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
          >
            <svg 
              class="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span>Go Back</span>
          </button>
          
          <!-- Home Button -->
          <button
            @click="navigateToHome"
            class="group px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <svg 
              class="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>Go to Home</span>
          </button>
          
          <!-- Refresh Button -->
          <button
            @click="refreshPage"
            class="group px-6 py-3 border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
          >
            <svg 
              class="w-4 h-4 mr-2 transition-transform duration-500 group-hover:rotate-180" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>Refresh Page</span>
          </button>
          
        </div>
        
        <!-- Help Section with fade animation -->
        <div 
          class="text-sm text-slate-500 transition-all duration-700 ease-out"
          :class="{'translate-y-0 opacity-100': isContentVisible, 'translate-y-8 opacity-0': !isContentVisible}"
          style="transition-delay: 400ms"
        >
          <p class="mb-3">Need help? Try one of these options:</p>
          <div class="flex flex-wrap justify-center gap-4">
            <a 
              href="#" 
              class="text-slate-900 hover:text-slate-700 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-slate-900 after:transition-all after:duration-300 hover:after:w-full"
            >
              Visit Help Center
            </a>
            <span class="text-slate-300">•</span>
            <a 
              href="#" 
              class="text-slate-900 hover:text-slate-700 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-slate-900 after:transition-all after:duration-300 hover:after:w-full"
            >
              Contact Support
            </a>
            <span class="text-slate-300">•</span>
            <a 
              href="#" 
              class="text-slate-900 hover:text-slate-700 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-slate-900 after:transition-all after:duration-300 hover:after:w-full"
            >
              Report an Issue
            </a>
          </div>
        </div>
        
        <!-- Footer Note with slide animation -->
        <div 
          class="mt-12 pt-6 border-t border-slate-200 transition-all duration-700 ease-out"
          :class="{'translate-y-0 opacity-100': isContentVisible, 'translate-y-8 opacity-0': !isContentVisible}"
          style="transition-delay: 500ms"
        >
          <p class="text-xs text-slate-400">
            Error code: 404 • Request ID: {{ Date.now().toString(36) }} • One Drive
          </p>
        </div>
        
      </div>
    </div>
  `
}