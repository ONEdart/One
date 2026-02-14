// js/pages/ForgotPassword.js
// Forgot Password page for One - Solid White Design with Firebase Integration

// Import Firebase modules dari firebaseConfig.js
import { 
  auth, 
  sendPasswordResetEmail 
} from '../../firebaseConfig.js';

export default {
  name: 'ForgotPasswordPage',
  
  data() {
    return {
      email: '',
      isSubmitting: false,
      isSubmitted: false,
      hasError: false,
      errorMessage: '',
      
      // Timer untuk countdown resend
      countdown: 0,
      timer: null,
      
      // Untuk tracking resend attempts
      resetAttempts: 0,
      lastResetRequest: null
    }
  },
  
  methods: {
    async handleSubmit() {
      // Validasi email
      if (!this.email || !this.validateEmail(this.email)) {
        this.hasError = true
        this.errorMessage = 'Please enter a valid email address'
        return
      }
      
      // Rate limiting: cegah spam request (1 menit cooldown)
      const now = new Date()
      if (this.lastResetRequest && (now - this.lastResetRequest) < 60000) {
        this.hasError = true
        this.errorMessage = 'Please wait 1 minute before requesting another reset'
        return
      }
      
      // Set state
      this.isSubmitting = true
      this.hasError = false
      this.errorMessage = ''
      
      try {
        // Kirim email reset password menggunakan Firebase
        await sendPasswordResetEmail(auth, this.email)
        
        // Success state
        console.log('[ForgotPassword] Password reset email sent to:', this.email)
        
        // Update tracking
        this.lastResetRequest = now
        this.resetAttempts++
        this.isSubmitted = true
        
        // Mulai countdown untuk resend
        this.startCountdown()
        
      } catch (error) {
        console.error('[ForgotPassword] Error:', error.code, error.message)
        this.handleFirebaseError(error)
      } finally {
        this.isSubmitting = false
      }
    },
    
    handleFirebaseError(error) {
      this.hasError = true
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/invalid-email':
          this.errorMessage = 'Invalid email address format'
          break
        case 'auth/user-not-found':
          // Untuk keamanan, jangan kasih tahu email tidak terdaftar
          // Tampilkan pesan yang sama seperti success (security best practice)
          this.isSubmitted = true
          this.startCountdown()
          console.log('[ForgotPassword] Email not found, but showing success for security')
          return // Keluar tanpa set error message
        case 'auth/too-many-requests':
          this.errorMessage = 'Too many requests. Please try again later.'
          break
        case 'auth/network-request-failed':
          this.errorMessage = 'Network error. Please check your connection.'
          break
        default:
          this.errorMessage = error.message || 'Failed to send reset email. Please try again.'
      }
    },
    
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    },
    
    startCountdown() {
      this.countdown = 30
      
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--
        } else {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 1000)
    },
    
    async handleResend() {
      // Prevent multiple clicks during countdown or submission
      if (this.countdown > 0 || this.isSubmitting) return
      
      this.isSubmitting = true
      this.hasError = false
      
      try {
        // Kirim ulang email reset
        await sendPasswordResetEmail(auth, this.email)
        console.log('[ForgotPassword] Resent password reset email to:', this.email)
        
        // Reset countdown
        if (this.timer) {
          clearInterval(this.timer)
        }
        this.countdown = 30
        this.startCountdown()
        
      } catch (error) {
        console.error('[ForgotPassword] Resend error:', error)
        this.handleFirebaseError(error)
      } finally {
        this.isSubmitting = false
      }
    },
    
    resetForm() {
      this.email = ''
      this.isSubmitted = false
      this.hasError = false
      this.errorMessage = ''
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  },
  
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-gradient-to-br from-slate-50 to-white">
      <div class="w-full max-w-md">
        <!-- Card Container -->
        <div class="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-lg">
          
          <!-- Success State -->
          <div v-if="isSubmitted">
            
            <!-- Success Icon -->
            <div class="text-center mb-8">
              <div class="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-slate-900 mb-2">Check your email</h1>
              <p class="text-slate-600 text-sm mb-2">
                We've sent a password reset link to
              </p>
              <p class="text-slate-900 font-medium text-lg">{{ email }}</p>
            </div>
            
            <!-- Instructions -->
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <h3 class="text-sm font-semibold text-slate-900 mb-2">What to do next:</h3>
              <ul class="text-sm text-slate-700 space-y-2">
                <li class="flex items-start">
                  <svg class="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Check your inbox for an email from Firebase Authentication</span>
                </li>
                <li class="flex items-start">
                  <svg class="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Click the reset password link in the email</span>
                </li>
                <li class="flex items-start">
                  <svg class="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Follow the instructions to create a new password</span>
                </li>
              </ul>
            </div>
            
            <!-- Important Notes -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p class="text-sm text-blue-800 font-medium mb-1">Important notes:</p>
                  <ul class="text-xs text-blue-700 space-y-1">
                    <li>The reset link expires in 1 hour</li>
                    <li>If you don't see the email, check your spam folder</li>
                    <li>Make sure you entered the correct email address</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <!-- Resend Button -->
            <div class="space-y-3 mb-6">
              <button
                @click="handleResend"
                :disabled="countdown > 0 || isSubmitting"
                class="w-full py-3 px-4 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
              >
                <span v-if="!isSubmitting">
                  <span v-if="countdown > 0">
                    Resend available in {{ countdown }}s
                  </span>
                  <span v-else>
                    Resend email
                  </span>
                </span>
                <span v-else class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 text-slate-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              </button>
              
              <button
                @click="resetForm"
                class="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm font-semibold rounded-lg hover:from-slate-800 hover:to-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow"
              >
                Use a different email
              </button>
            </div>
            
            <!-- Back to Login -->
            <div class="pt-6 border-t border-slate-200 text-center">
              <router-link 
                to="/login" 
                class="inline-flex items-center text-sm font-semibold text-slate-900 hover:text-slate-700 hover:underline"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to login
              </router-link>
            </div>
            
          </div>
          
          <!-- Form State (Default) -->
          <div v-else>
            
            <!-- Header -->
            <div class="text-center mb-8">
              <div class="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="text-white font-bold text-2xl">O</span>
              </div>
              <h1 class="text-3xl font-bold text-slate-900 mb-2">Reset your password</h1>
              <p class="text-slate-600 text-sm">
                Enter your email and we'll send you a link to reset your password
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
            
            <!-- Forgot Password Form -->
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
                  autocomplete="email"
                  class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm hover:shadow"
                  placeholder="you@example.com"
                />
                <p class="mt-2 text-xs text-slate-500">
                  Enter the email address associated with your account
                </p>
              </div>
              
              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm font-semibold rounded-lg hover:from-slate-800 hover:to-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
              >
                <span v-if="!isSubmitting" class="flex items-center justify-center">
                  Send reset link
                </span>
                <span v-else class="flex items-center justify-center">
                  <svg class="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              </button>
              
            </form>
            
            <!-- Firebase Note -->
            <div class="mt-8 p-4 border border-slate-300 bg-slate-50 rounded-lg">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-slate-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p class="text-sm text-slate-700 font-medium mb-1">Powered by Firebase Authentication</p>
                  <p class="text-xs text-slate-600">
                    You'll receive an email from Firebase with a secure reset link. This is a real email service.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Back to Login -->
            <div class="mt-8 pt-6 border-t border-slate-200 text-center">
              <router-link 
                to="/login" 
                class="inline-flex items-center text-sm font-semibold text-slate-900 hover:text-slate-700 hover:underline"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to login
              </router-link>
            </div>
            
          </div>
          
        </div>
        
        <!-- Sign Up Link (konsisten dengan Login) -->
        <div class="mt-8 text-center">
          <p class="text-sm text-slate-600">
            Don't have an account?
            <router-link to="/signup" class="font-semibold text-slate-900 hover:text-slate-700 hover:underline">
              Sign up for free
            </router-link>
          </p>
        </div>
        
      </div>
    </div>
  `
}