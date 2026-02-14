// js/pages/Login.js
// Login page for One - Solid White Design with Firebase Integration

// Import Firebase modules dari firebaseConfig.js
import { 
  auth,
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from '../../firebaseConfig.js'; // Tambahkan .js di akhir

export default {
  name: 'LoginPage',
  
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      isSubmitting: false,
      showPassword: false,
      
      // Firebase error handling
      hasError: false,
      errorMessage: '',
      
      // Auth providers
      googleProvider: null,
      githubProvider: null
    }
  },
  
  mounted() {
    // Check if user is already logged in
    this.checkAuthState()
    
    // Initialize providers
    this.googleProvider = new GoogleAuthProvider()
    this.githubProvider = new GithubAuthProvider()
    
    // Configure providers if needed
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    })
  },
  
  methods: {
    async handleSubmit() {
      // Validate inputs
      if (!this.email || !this.password) {
        this.showError('Please enter both email and password')
        return
      }
      
      if (!this.validateEmail(this.email)) {
        this.showError('Please enter a valid email address')
        return
      }
      
      this.isSubmitting = true
      this.hasError = false
      
      try {
        // Set persistence based on remember me
        const persistence = this.rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence
        
        await setPersistence(auth, persistence)
        
        // Sign in with email and password
        await signInWithEmailAndPassword(auth, this.email, this.password)
        
        // Success - redirect to drive page
        this.$router.push('/drive')
        
      } catch (error) {
        this.handleFirebaseError(error)
      } finally {
        this.isSubmitting = false
      }
    },
    
    async handleGoogleLogin() {
      this.isSubmitting = true
      this.hasError = false
      
      try {
        // Set persistence
        const persistence = this.rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence
        await setPersistence(auth, persistence)
        
        // Sign in with Google
        const result = await signInWithPopup(auth, this.googleProvider)
        
        // Optional: You can access the Google Access Token
        // const credential = GoogleAuthProvider.credentialFromResult(result)
        // const token = credential.accessToken
        
        // Get user info
        const user = result.user
        
        // Success - redirect to drive page
        this.$router.push('/drive')
        
      } catch (error) {
        this.handleFirebaseError(error)
      } finally {
        this.isSubmitting = false
      }
    },
    
    async handleGitHubLogin() {
      this.isSubmitting = true
      this.hasError = false
      
      try {
        // Set persistence
        const persistence = this.rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence
        await setPersistence(auth, persistence)
        
        // Sign in with GitHub
        const result = await signInWithPopup(auth, this.githubProvider)
        
        // Optional: You can access the GitHub Access Token
        // const credential = GithubAuthProvider.credentialFromResult(result)
        // const token = credential.accessToken
        
        // Get user info
        const user = result.user
        
        // Success - redirect to drive page
        this.$router.push('/drive')
        
      } catch (error) {
        this.handleFirebaseError(error)
      } finally {
        this.isSubmitting = false
      }
    },
    
    handleFirebaseError(error) {
      console.error('Login error:', error)
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/invalid-email':
          this.showError('Invalid email address format')
          break
        case 'auth/user-disabled':
          this.showError('This account has been disabled')
          break
        case 'auth/user-not-found':
          this.showError('No account found with this email')
          break
        case 'auth/wrong-password':
          this.showError('Incorrect password. Please try again')
          break
        case 'auth/too-many-requests':
          this.showError('Too many failed attempts. Please try again later')
          break
        case 'auth/popup-blocked':
          this.showError('Popup was blocked by browser. Please allow popups and try again')
          break
        case 'auth/popup-closed-by-user':
          // User closed the popup, no need to show error
          break
        case 'auth/cancelled-popup-request':
          // Multiple popups were opened, no need to show error
          break
        case 'auth/operation-not-supported-in-this-environment':
          this.showError('This browser does not support popup authentication. Please try a different browser.')
          break
        case 'auth/unauthorized-domain':
          this.showError('This domain is not authorized. Please contact support.')
          break
        default:
          this.showError(error.message || 'Login failed. Please try again')
      }
    },
    
    showError(message) {
      this.hasError = true
      this.errorMessage = message
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        this.hasError = false
      }, 5000)
    },
    
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    },
    
    togglePassword() {
      this.showPassword = !this.showPassword
    },
    
    goToPublicDrive() {
      // Navigate to public drive without login
      this.$router.push('/public')
    },
    
    checkAuthState() {
      // Check if user is already authenticated
      auth.onAuthStateChanged((user) => {
        if (user && this.$route.path === '/login') {
          // User is already logged in, redirect to drive
          this.$router.push('/drive')
        }
      })
    }
  },
  
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-gradient-to-br from-slate-50 to-white">
      <div class="w-full max-w-md">
        <!-- Card Container -->
        <div class="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-lg">
          
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span class="text-white font-bold text-2xl">O</span>
            </div>
            <h1 class="text-3xl font-bold text-slate-900 mb-2">Sign in to One</h1>
            <p class="text-slate-600 text-sm">
              Enter your credentials to access your private files
            </p>
          </div>
          
          <!-- Error Message -->
          <div v-if="hasError" class="mb-6 p-4 border border-red-300 bg-red-50 rounded-lg">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-red-800 text-sm font-medium">{{ errorMessage }}</p>
            </div>
          </div>
          
          <!-- Social Login Buttons -->
          <div class="space-y-3 mb-6">
            <button
              @click="handleGoogleLogin"
              :disabled="isSubmitting"
              class="w-full py-3 px-4 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center justify-center space-x-3"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            
            <button
              @click="handleGitHubLogin"
              :disabled="isSubmitting"
              class="w-full py-3 px-4 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center justify-center space-x-3"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>
          
          <!-- Divider -->
          <div class="my-6 relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-slate-600 font-medium">Or sign in with email</span>
            </div>
          </div>
          
          <!-- Login Form -->
          <form @submit.prevent="handleSubmit" class="space-y-6">
            
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                v-model="email"
                required
                class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm hover:shadow"
                placeholder="you@example.com"
              />
            </div>
            
            <!-- Password Field -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label for="password" class="block text-sm font-semibold text-slate-900">
                  Password
                </label>
                <router-link 
                  to="/forgot-password" 
                  class="text-sm text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Forgot password?
                </router-link>
              </div>
              
              <div class="relative">
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  required
                  class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm hover:shadow pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  @click="togglePassword"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-sm text-slate-600 hover:text-slate-900"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Remember Me -->
            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                v-model="rememberMe"
                class="h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 focus:ring-offset-0"
              />
              <label for="remember-me" class="ml-3 block text-sm text-slate-700">
                Remember me for 30 days
              </label>
            </div>
            
            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm font-semibold rounded-lg hover:from-slate-800 hover:to-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            >
              <span v-if="!isSubmitting" class="flex items-center justify-center">
                Sign in
              </span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>
            
          </form>
          
          <!-- Public Drive Access (No Login Required) -->
          <div class="mt-8 mb-4">
            <button
              @click="goToPublicDrive"
              class="w-full py-3 px-4 border border-blue-600 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow flex items-center justify-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span>Public Drive (No Login Required)</span>
            </button>
            <p class="text-xs text-slate-500 text-center mt-2">
              Browse and manage public files without signing in
            </p>
          </div>
          
        </div>
        
        <!-- Sign Up Link -->
        <div class="mt-8 text-center">
          <p class="text-sm text-slate-600">
            Don't have an account?
            <router-link to="/signup" class="font-semibold text-slate-900 hover:text-slate-700 hover:underline">
              Sign up for free
            </router-link>
          </p>
        </div>
        
        <!-- Demo Note -->
        <div class="mt-6 p-4 border border-slate-300 bg-slate-50 rounded-lg">
          <p class="text-xs text-slate-600 text-center">
            Using Firebase Authentication. Real user data will be stored.
          </p>
        </div>
        
      </div>
    </div>
  `
}