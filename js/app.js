// js/app.js
// Main Vue app for One - Solid White Design with Firebase Integration

// Import Firebase dari firebaseConfig.js
import { auth, signOut, onAuthStateChanged } from '../firebaseConfig.js';

export default {
  name: 'App',
  
  data() {
    return {
      year: new Date().getFullYear(),
      showMobileMenu: false,
      currentRoute: '',
      currentUser: null,
      isLoading: true,
      unsubscribeAuth: null,
      showUserDropdown: false // Tambah state untuk dropdown user
    }
  },
  
  computed: {
    // Get current page title from route meta or route name
    pageTitle() {
      const route = this.$route
      if (route.meta && route.meta.title) {
        return route.meta.title
      }
      return route.name ? route.name : 'One'
    },
    
    // Check if current route is auth page (for hiding topbar)
    isAuthPage() {
      const authRoutes = ['Login', 'SignUp', 'ForgotPassword']
      return authRoutes.includes(this.$route.name)
    },
    
    // Check if current route is 404 page
    isNotFoundPage() {
      return this.$route.name === 'NotFound'
    },
    
    // Get user initials for avatar
    userInitials() {
      if (!this.currentUser || !this.currentUser.email) return 'U'
      const email = this.currentUser.email
      // Take first letter of email or first part before @
      return email.charAt(0).toUpperCase()
    },
    
    // Get user display name or email
    userName() {
      if (!this.currentUser) return 'User'
      
      if (this.currentUser.displayName) {
        return this.currentUser.displayName
      } else if (this.currentUser.email) {
        return this.currentUser.email.split('@')[0]
      }
      return 'User'
    }
  },
  
  watch: {
    // Watch route changes to update currentRoute and hide mobile menu
    '$route'(to, from) {
      this.currentRoute = to.name
      this.showMobileMenu = false
      this.showUserDropdown = false // Tutup dropdown saat route berubah
    }
  },
  
  mounted() {
    this.currentRoute = this.$route.name
    
    // Set up auth state listener
    this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      this.currentUser = user
      this.isLoading = false
      
      console.log('Auth state changed:', user ? user.email : 'No user')
      
      // If user is logged in and on auth page, redirect to drive
      if (user && (this.$route.path === '/login' || 
                  this.$route.path === '/signup' || 
                  this.$route.path === '/forgot-password')) {
        this.$router.push('/drive')
      }
      
      // If user is not logged in and on protected page, redirect to login
      // (This is handled by router guard, but just in case)
      if (!user && this.$route.meta && this.$route.meta.requiresAuth) {
        this.$router.push('/login')
      }
    }, (error) => {
      console.error('Auth state error:', error)
      this.isLoading = false
    })
  },
  
  beforeUnmount() {
    // Clean up auth listener
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth()
    }
  },
  
  methods: {
    // Toggle mobile menu
    toggleMobileMenu() {
      this.showMobileMenu = !this.showMobileMenu
      this.showUserDropdown = false // Tutup dropdown user saat mobile menu aktif
    },
    
    // Toggle user dropdown
    toggleUserDropdown() {
      this.showUserDropdown = !this.showUserDropdown
    },
    
    // Close user dropdown
    closeUserDropdown() {
      this.showUserDropdown = false
    },
    
    // Logout with Firebase
    async handleLogout() {
      try {
        // Show loading state
        this.isLoading = true
        
        // Sign out from Firebase
        await signOut(auth)
        
        // Success - redirect to login
        this.$router.push('/login')
        console.log('User signed out successfully')
        
      } catch (error) {
        console.error('Logout error:', error)
        alert('Logout failed: ' + error.message)
      } finally {
        this.isLoading = false
        this.showMobileMenu = false
        this.showUserDropdown = false
      }
    },
    
    // Navigate to profile
    goToProfile() {
      this.$router.push('/profile')
      this.showMobileMenu = false
      this.showUserDropdown = false
    },
    
    // Navigate to drive
    goToDrive() {
      this.$router.push('/drive')
      this.showMobileMenu = false
      this.showUserDropdown = false
    }
  },
  
  template: `
    <div class="min-h-screen bg-white text-slate-900 flex flex-col">
      
      <!-- Topbar - Only show on non-auth pages and when user is authenticated -->
      <header 
        v-if="!isAuthPage && !isNotFoundPage && currentUser && !isLoading" 
        class="border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between"
      >
        
        <!-- Left: Logo & Title -->
        <div class="flex items-center space-x-4">
          <router-link to="/drive" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div class="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">O</span>
            </div>
            <h1 class="text-lg font-semibold text-slate-900">One</h1>
          </router-link>
          
          <!-- Breadcrumb (simplified) -->
          <div class="hidden sm:flex items-center text-sm text-slate-600">
            <span class="font-medium">{{ pageTitle }}</span>
          </div>
        </div>
        
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-3">
          <!-- User avatar with dropdown -->
          <div class="flex items-center space-x-3 mr-4">
            <div class="relative">
              <!-- Avatar button -->
              <button 
                @click="toggleUserDropdown"
                class="flex items-center space-x-2 focus:outline-none"
              >
                <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {{ userInitials }}
                </div>
                <span class="text-sm text-slate-700 hidden lg:inline">{{ userName }}</span>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" :class="{'transform rotate-180': showUserDropdown}">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- User dropdown menu -->
              <div 
                v-if="showUserDropdown"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1"
              >
                <!-- User info -->
                <div class="px-4 py-3 border-b border-slate-100">
                  <p class="text-sm font-medium text-slate-900">{{ userName }}</p>
                  <p class="text-xs text-slate-500 truncate mt-1">{{ currentUser.email }}</p>
                </div>
                
                <!-- Menu items -->
                <router-link 
                  to="/profile" 
                  @click="closeUserDropdown"
                  class="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg class="w-4 h-4 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Profile
                </router-link>
                
                <button 
                  @click="handleLogout"
                  :disabled="isLoading"
                  class="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="w-4 h-4 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  <span v-if="!isLoading">Logout</span>
                  <span v-else class="flex items-center">
                    <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <router-link 
            to="/drive" 
            class="px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors"
            :class="currentRoute === 'Drive' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900'"
          >
            Drive
          </router-link>
          <router-link 
            to="/public" 
            class="px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors"
            :class="currentRoute === 'PublicDrive' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900'"
          >
            Public
          </router-link>
        </nav>
        
        <!-- Mobile Menu Button -->
        <button 
          @click="toggleMobileMenu"
          class="md:hidden p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <svg v-if="!showMobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
      </header>
      
      <!-- Loading Spinner -->
      <div v-if="isLoading && !isAuthPage && !isNotFoundPage" class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-600">Loading...</p>
        </div>
      </div>
      
      <!-- Mobile Menu -->
      <div 
        v-if="showMobileMenu && !isAuthPage && !isNotFoundPage && currentUser"
        class="md:hidden border-b border-slate-200 px-4 py-3 bg-white z-50"
      >
        <div class="flex items-center space-x-3 mb-4 pb-4 border-b border-slate-100">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
            {{ userInitials }}
          </div>
          <div>
            <p class="font-medium text-slate-900">{{ userName }}</p>
            <p class="text-xs text-slate-500 truncate max-w-[200px]">{{ currentUser.email }}</p>
          </div>
        </div>
        
        <div class="flex flex-col space-y-2">
          <button 
            @click="goToDrive"
            class="px-3 py-2 rounded-md text-sm text-left hover:bg-slate-100 transition-colors"
            :class="currentRoute === 'Drive' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900'"
          >
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              Drive
            </span>
          </button>
          <router-link 
            to="/public" 
            @click="showMobileMenu = false"
            class="px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors"
            :class="currentRoute === 'PublicDrive' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900'"
          >
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Public Drive
            </span>
          </router-link>
          <button 
            @click="goToProfile"
            class="px-3 py-2 rounded-md text-sm text-left hover:bg-slate-100 transition-colors"
            :class="currentRoute === 'Profile' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900'"
          >
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Profile
            </span>
          </button>
          <button 
            @click="handleLogout"
            :disabled="isLoading"
            class="px-3 py-2 rounded-md text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed mt-4 pt-4 border-t border-slate-100"
          >
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span v-if="!isLoading">Logout</span>
              <span v-else>Logging out...</span>
            </span>
          </button>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <main class="flex-1">
        <!-- Show loading overlay during auth check for protected routes -->
        <div v-if="isLoading && $route.meta && $route.meta.requiresAuth && !currentUser" class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-600">Checking authentication...</p>
          </div>
        </div>
        <router-view v-else />
      </main>
      
      <!-- Footer - Only show on non-auth pages when user is authenticated -->
      <footer 
        v-if="!isAuthPage && !isNotFoundPage && currentUser && !isLoading" 
        class="border-t border-slate-200 px-4 sm:px-6 py-4"
      >
        <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <!-- Copyright -->
          <div class="text-sm text-slate-500">
            © {{ year }} One · Secure File Storage
          </div>
          
          <!-- Footer Links -->
          <div class="flex items-center space-x-4 text-sm">
            <router-link to="/profile" class="text-slate-600 hover:text-slate-900 transition-colors">
              Account
            </router-link>
            <span class="text-slate-300">•</span>
            <a href="#" class="text-slate-600 hover:text-slate-900 transition-colors">Help</a>
            <span class="text-slate-300">•</span>
            <a href="#" class="text-slate-600 hover:text-slate-900 transition-colors">Privacy</a>
            <span class="text-slate-300">•</span>
            <a href="#" class="text-slate-600 hover:text-slate-900 transition-colors">Terms</a>
          </div>
          
          <!-- Status Indicator -->
          <div class="text-xs flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-slate-400">Connected</span>
          </div>
          
        </div>
      </footer>
      
    </div>
  `
}