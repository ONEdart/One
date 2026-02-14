// js/pages/Profile.js
// Profile page for One - Solid White Design (Static Version)

export default {
  name: 'ProfilePage',
  
  data() {
    return {
      // User data - static untuk demo
      user: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'JD',
        joinDate: '2023-06-15',
        storageUsed: 42.8,
        storageTotal: 100,
        fileCount: 156,
        folderCount: 12
      },
      
      // Form states
      editMode: false,
      isSaving: false,
      
      // Form data
      form: {
        name: 'John Doe',
        email: 'john.doe@example.com'
      },
      
      // Password form
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      showPasswordForm: false,
      isChangingPassword: false,
      
      // Forgot password state
      showForgotPassword: false,
      forgotPasswordEmail: '',
      isResettingPassword: false,
      
      // Success/error states
      showSuccess: false,
      showError: false,
      successMessage: '',
      errorMessage: '',
      
      // Developer zone
      showDeveloperZone: false,
      
      // Usage statistics
      usageStats: [
        { type: 'Documents', count: 45, size: '12.4 GB', color: 'blue' },
        { type: 'Images', count: 89, size: '18.7 GB', color: 'green' },
        { type: 'Videos', count: 12, size: '8.2 GB', color: 'purple' },
        { type: 'Others', count: 32, size: '3.5 GB', color: 'yellow' }
      ],
      
      // Recent activity
      recentActivity: [
        { id: 1, action: 'Uploaded', file: 'Project_Report.pdf', time: '10 minutes ago' },
        { id: 2, action: 'Created', file: 'New Folder', time: '1 hour ago' },
        { id: 3, action: 'Shared', file: 'Meeting_Notes.docx', time: 'Yesterday' },
        { id: 4, action: 'Downloaded', file: 'Client_Presentation.pptx', time: '2 days ago' }
      ]
    }
  },
  
  computed: {
    storagePercentage() {
      return ((this.user.storageUsed / this.user.storageTotal) * 100).toFixed(1)
    },
    
    usedStorageGB() {
      return this.user.storageUsed.toFixed(1)
    },
    
    remainingStorage() {
      return (this.user.storageTotal - this.user.storageUsed).toFixed(1)
    },
    
    // Account age in months
    accountAge() {
      const joinDate = new Date(this.user.joinDate)
      const today = new Date()
      const months = (today.getFullYear() - joinDate.getFullYear()) * 12 + 
                    (today.getMonth() - joinDate.getMonth())
      return months > 0 ? months : 1
    },
    
    // Format join date
    formattedJoinDate() {
      const date = new Date(this.user.joinDate)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  },
  
  methods: {
    // Toggle edit mode
    toggleEdit() {
      if (this.editMode) {
        this.cancelEdit()
      } else {
        this.editMode = true
        this.form.name = this.user.name
        this.form.email = this.user.email
      }
    },
    
    // Cancel edit
    cancelEdit() {
      this.editMode = false
      this.form.name = this.user.name
      this.form.email = this.user.email
      this.showError = false
      this.showSuccess = false
    },
    
    // Save profile - Simulasi saja karena static
    saveProfile() {
      if (!this.form.name.trim() || !this.form.email.trim()) {
        this.showError = true
        this.errorMessage = 'Please fill in all fields'
        return
      }
      
      this.isSaving = true
      this.showSuccess = false
      this.showError = false
      
      // Simulate API call delay
      setTimeout(() => {
        this.isSaving = false
        
        // Simulate random error (10% chance)
        if (Math.random() < 0.1) {
          this.showError = true
          this.errorMessage = 'Failed to save changes. Please try again.'
        } else {
          // Update user data locally
          this.user.name = this.form.name
          this.user.email = this.form.email
          
          this.showSuccess = true
          this.successMessage = 'Profile updated successfully!'
          this.editMode = false
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            this.showSuccess = false
          }, 3000)
          
          // Simulate updating avatar initials
          if (this.form.name !== 'John Doe') {
            const initials = this.getInitials(this.form.name)
            this.user.avatar = initials
          }
        }
      }, 800)
    },
    
    // Change password
    changePassword() {
      if (!this.passwordForm.currentPassword.trim() || 
          !this.passwordForm.newPassword.trim() || 
          !this.passwordForm.confirmPassword.trim()) {
        this.showError = true
        this.errorMessage = 'Please fill in all password fields'
        return
      }
      
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.showError = true
        this.errorMessage = 'New passwords do not match'
        return
      }
      
      if (this.passwordForm.newPassword.length < 6) {
        this.showError = true
        this.errorMessage = 'Password must be at least 6 characters long'
        return
      }
      
      this.isChangingPassword = true
      this.showSuccess = false
      this.showError = false
      
      // Simulate API call delay
      setTimeout(() => {
        this.isChangingPassword = false
        
        // Simulate random error (10% chance)
        if (Math.random() < 0.1) {
          this.showError = true
          this.errorMessage = 'Failed to change password. Please try again.'
        } else {
          // Clear password form
          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
          
          this.showSuccess = true
          this.successMessage = 'Password changed successfully!'
          this.showPasswordForm = false
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            this.showSuccess = false
          }, 3000)
        }
      }, 800)
    },
    
    // Forgot password
    resetPassword() {
      if (!this.forgotPasswordEmail.trim()) {
        this.showError = true
        this.errorMessage = 'Please enter your email address'
        return
      }
      
      this.isResettingPassword = true
      this.showSuccess = false
      this.showError = false
      
      // Simulate API call delay
      setTimeout(() => {
        this.isResettingPassword = false
        
        // Simulate random error (10% chance)
        if (Math.random() < 0.1) {
          this.showError = true
          this.errorMessage = 'Failed to send reset link. Please try again.'
        } else {
          // Clear email
          const email = this.forgotPasswordEmail
          this.forgotPasswordEmail = ''
          
          this.showSuccess = true
          this.successMessage = `Password reset link sent to ${email}`
          this.showForgotPassword = false
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            this.showSuccess = false
          }, 3000)
        }
      }, 800)
    },
    
    // Toggle developer zone
    toggleDeveloperZone() {
      this.showDeveloperZone = !this.showDeveloperZone
    },
    
    // Format date for recent activity
    formatTimeAgo(timeStr) {
      return timeStr // Just return the string as is for demo
    },
    
    // Get initials for avatar
    getInitials(name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    },
    
    // Get color class for storage bar
    getStorageBarColor() {
      const percentage = parseFloat(this.storagePercentage)
      if (percentage > 90) return 'bg-red-600'
      if (percentage > 70) return 'bg-orange-600'
      return 'bg-slate-900'
    },
    
    // Get storage usage text color
    getStorageTextColor() {
      const percentage = parseFloat(this.storagePercentage)
      if (percentage > 90) return 'text-red-700'
      if (percentage > 70) return 'text-orange-700'
      return 'text-slate-700'
    },
    
    // Get color for usage stats
    getStatColor(type) {
      const colors = {
        Documents: 'bg-blue-100 text-blue-700',
        Images: 'bg-green-100 text-green-700',
        Videos: 'bg-purple-100 text-purple-700',
        Others: 'bg-yellow-100 text-yellow-700'
      }
      return colors[type] || 'bg-gray-100 text-gray-700'
    },
    
    // Get icon for activity
    getActivityIcon(action) {
      const icons = {
        Uploaded: `
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        `,
        Created: `
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        `,
        Shared: `
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
        `,
        Downloaded: `
          <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
        `
      }
      return icons[action] || icons.Uploaded
    }
  },
  
  mounted() {
    // Initialize form with current user data
    this.form.name = this.user.name
    this.form.email = this.user.email
  },
  
  template: `
    <div class="min-h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        
        <!-- Success Message -->
        <div 
          v-if="showSuccess"
          class="mb-6 p-4 border border-green-300 bg-green-50 rounded-lg animate-fade-in"
        >
          <div class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p class="text-green-800 text-sm font-semibold">
              {{ successMessage }}
            </p>
          </div>
        </div>
        
        <!-- Error Message -->
        <div 
          v-if="showError"
          class="mb-6 p-4 border border-red-300 bg-red-50 rounded-lg animate-fade-in"
        >
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <p class="text-red-800 text-sm font-semibold">
              {{ errorMessage }}
            </p>
          </div>
        </div>
        
        <!-- Page Header -->
        <div class="mb-8 pt-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 class="text-2xl font-bold text-slate-900 mb-2">Profile Settings</h1>
              <p class="text-slate-600">Manage your account information and storage</p>
            </div>
            <router-link
              to="/drive"
              class="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2 self-start"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              <span>Back to Drive</span>
            </router-link>
          </div>
        </div>
        
        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left Column - Profile Overview -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Profile Card -->
            <div class="bg-white border border-slate-300 rounded-lg p-6">
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <!-- Avatar -->
                <div class="flex-shrink-0">
                  <div class="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
                    {{ user.avatar }}
                  </div>
                </div>
                
                <!-- User Info -->
                <div class="flex-1">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h2 class="text-xl font-bold text-slate-900">{{ user.name }}</h2>
                      <p class="text-slate-600">{{ user.email }}</p>
                    </div>
                    <button
                      @click="toggleEdit"
                      class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2 self-start"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      <span v-if="!editMode">Edit Profile</span>
                      <span v-else>Cancel Edit</span>
                    </button>
                  </div>
                  
                  <!-- Account Stats -->
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                      <p class="text-xs text-slate-500 mb-1">Account Age</p>
                      <p class="text-sm font-semibold text-slate-900">{{ accountAge }} months</p>
                    </div>
                    <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                      <p class="text-xs text-slate-500 mb-1">Total Files</p>
                      <p class="text-sm font-semibold text-slate-900">{{ user.fileCount }}</p>
                    </div>
                    <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                      <p class="text-xs text-slate-500 mb-1">Folders</p>
                      <p class="text-sm font-semibold text-slate-900">{{ user.folderCount }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Storage Progress -->
              <div class="mb-6">
                <div class="flex justify-between items-center mb-3">
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900">Storage Usage</h3>
                    <p class="text-xs text-slate-500">Last updated: Today</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold" :class="getStorageTextColor()">
                      {{ usedStorageGB }} GB used of {{ user.storageTotal }} GB
                    </p>
                    <p class="text-xs text-slate-500">{{ remainingStorage }} GB remaining</p>
                  </div>
                </div>
                <div class="h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div 
                    class="h-full transition-all duration-300"
                    :style="{ width: storagePercentage + '%' }"
                    :class="getStorageBarColor()"
                  ></div>
                </div>
                <p class="text-xs text-slate-500">{{ storagePercentage }}% used</p>
              </div>
              
              <!-- Edit Form (when active) -->
              <div 
                v-if="editMode"
                class="mt-6 pt-6 border-t border-slate-300"
              >
                <h3 class="text-lg font-bold text-slate-900 mb-4">Edit Profile Information</h3>
                
                <form @submit.prevent="saveProfile" class="space-y-6">
                  
                  <!-- Name Field -->
                  <div>
                    <label for="name" class="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      v-model="form.name"
                      required
                      placeholder="Enter your full name"
                      class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  
                  <!-- Email Field -->
                  <div>
                    <label for="email" class="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      v-model="form.email"
                      required
                      placeholder="Enter your email address"
                      class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  
                  <!-- Form Actions -->
                  <div class="flex space-x-3 pt-4">
                    <button
                      type="button"
                      @click="cancelEdit"
                      class="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      :disabled="isSaving"
                      class="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span v-if="!isSaving">Save Changes</span>
                      <span v-else class="flex items-center justify-center">
                        <svg class="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    </button>
                  </div>
                  
                </form>
              </div>
            </div>
            
            <!-- Usage Statistics -->
            <div class="bg-white border border-slate-300 rounded-lg p-6">
              <h3 class="text-lg font-bold text-slate-900 mb-6">Storage Breakdown</h3>
              
              <div class="space-y-4">
                <div 
                  v-for="stat in usageStats"
                  :key="stat.type"
                  class="flex items-center justify-between p-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getStatColor(stat.type).split(' ')[0]">
                      <span class="font-semibold text-sm">{{ stat.type.charAt(0) }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ stat.type }}</p>
                      <p class="text-xs text-slate-500">{{ stat.count }} files</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold text-slate-900">{{ stat.size }}</p>
                    <p class="text-xs text-slate-500">{{ ((parseFloat(stat.size) / user.storageUsed) * 100).toFixed(1) }}% of used</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          <!-- Right Column - Quick Info & Actions -->
          <div class="lg:col-span-1 space-y-6">
            
            <!-- Account Info -->
            <div class="bg-white border border-slate-300 rounded-lg p-6">
              <h3 class="text-lg font-bold text-slate-900 mb-4">Account Information</h3>
              
              <div class="space-y-4">
                <div>
                  <p class="text-xs text-slate-500 mb-1">Member Since</p>
                  <p class="text-sm font-semibold text-slate-900">{{ formattedJoinDate }}</p>
                </div>
                
                <div>
                  <p class="text-xs text-slate-500 mb-1">Account ID</p>
                  <p class="text-sm font-semibold text-slate-900">USR-{{ 1000 + Math.floor(Math.random() * 9000) }}</p>
                </div>
                
                <div>
                  <p class="text-xs text-slate-500 mb-1">Last Login</p>
                  <p class="text-sm font-semibold text-slate-900">Today, 10:30 AM</p>
                </div>
                
                <div>
                  <p class="text-xs text-slate-500 mb-1">Account Status</p>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Active
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="bg-white border border-slate-300 rounded-lg p-6">
              <h3 class="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
              
              <div class="space-y-4">
                <div 
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="flex items-start space-x-3 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div class="flex-shrink-0 mt-1" v-html="getActivityIcon(activity.action)"></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate">
                      {{ activity.action }} <span class="font-normal">{{ activity.file }}</span>
                    </p>
                    <p class="text-xs text-slate-500 mt-1">{{ activity.time }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Quick Links -->
            <div class="bg-white border border-slate-300 rounded-lg p-6">
              <h3 class="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              
              <div class="space-y-3">
             
                
                <button
                  @click="showPasswordForm = !showPasswordForm"
                  class="w-full flex items-center justify-between p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                      </svg>
                    </div>
                    <span class="text-sm font-semibold text-slate-900">Change Password</span>
                  </div>
                  <svg class="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                
                <button
                  @click="showForgotPassword = true"
                  class="w-full flex items-center justify-between p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <span class="text-sm font-semibold text-slate-900">Forgot Password</span>
                  </div>
                  <svg class="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                
                <button
                  @click="toggleDeveloperZone"
                  class="w-full flex items-center justify-between p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mr-3">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                      </svg>
                    </div>
                    <span class="text-sm font-semibold text-slate-900">Developer Zone</span>
                  </div>
                  <svg class="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
            
          </div>
          
        </div>
        
        <!-- Change Password Modal -->
        <div
          v-if="showPasswordForm"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all"
          @click.self="showPasswordForm = false"
        >
          <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900">Change Password</h3>
              <button
                @click="showPasswordForm = false"
                class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form @submit.prevent="changePassword" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  v-model="passwordForm.currentPassword"
                  required
                  placeholder="Enter current password"
                  class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  v-model="passwordForm.newPassword"
                  required
                  placeholder="Enter new password"
                  class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  v-model="passwordForm.confirmPassword"
                  required
                  placeholder="Confirm new password"
                  class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              
              <div class="flex space-x-3 pt-4">
                <button
                  type="button"
                  @click="showPasswordForm = false"
                  class="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isChangingPassword"
                  class="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span v-if="!isChangingPassword">Change Password</span>
                  <span v-else class="flex items-center justify-center">
                    <svg class="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Changing...
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Forgot Password Modal -->
        <div
          v-if="showForgotPassword"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all"
          @click.self="showForgotPassword = false"
        >
          <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900">Reset Password</h3>
              <button
                @click="showForgotPassword = false"
                class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="mb-6">
              <p class="text-slate-600 mb-4">Enter your email address and we'll send you a password reset link.</p>
              <form @submit.prevent="resetPassword">
                <div class="mb-4">
                  <label class="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    v-model="forgotPasswordEmail"
                    required
                    placeholder="Enter your email"
                    class="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                
                <div class="flex space-x-3">
                  <button
                    type="button"
                    @click="showForgotPassword = false"
                    class="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isResettingPassword"
                    class="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span v-if="!isResettingPassword">Send Reset Link</span>
                    <span v-else class="flex items-center justify-center">
                      <svg class="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <!-- Developer Zone Modal -->
        <div
          v-if="showDeveloperZone"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all"
          @click.self="showDeveloperZone = false"
        >
          <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900">Developer Zone</h3>
              <button
                @click="showDeveloperZone = false"
                class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="mb-6">
              <div class="p-4 bg-slate-50 border border-slate-300 rounded-lg mb-4">
                <h4 class="text-lg font-bold text-slate-900 mb-2">Local Storage Information</h4>
                <p class="text-sm text-slate-600 mb-3">All data is stored locally in your browser. Changes will persist until you clear browser data.</p>
                
                <div class="grid grid-cols-2 gap-3">
                  <div class="p-3 bg-white border border-slate-300 rounded-lg">
                    <p class="text-xs text-slate-500 mb-1">Profile Data</p>
                    <p class="text-sm font-semibold text-slate-900">Stored Locally</p>
                  </div>
                  <div class="p-3 bg-white border border-slate-300 rounded-lg">
                    <p class="text-xs text-slate-500 mb-1">File System</p>
                    <p class="text-sm font-semibold text-slate-900">In-Memory</p>
                  </div>
                </div>
              </div>
              
              <div class="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p class="text-sm text-yellow-800">
                      <span class="font-bold">Developer Note:</span> This is a frontend-only demo application. 
                      No data is sent to any server. All changes are stored in your browser's memory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button
                @click="showDeveloperZone = false"
                class="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        
        <!-- Footer Note -->
        <div class="mt-8 pt-6 border-t border-slate-300">
          <div class="text-center text-sm text-slate-500">
            <p>Profile information is stored locally in your browser. Changes will be saved until you clear browser data.</p>
            <p class="mt-1">This is a demo application for personal use.</p>
          </div>
        </div>
        
      </div>
    </div>
  `
}