// js/router.js
// Ekspor sebagai default module

// Import pages (as modules)
import Login from './pages/Login.js';
import SignUp from './pages/SignUp.js';
import ForgotPassword from './pages/ForgotPassword.js';
import Drive from './pages/Drive.js';
import PublicDrive from './pages/PublicDrive.js';
import Profile from './pages/Profile.js';
import NotFound from './pages/NotFound.js';

// Import Firebase auth untuk router guard
import { auth } from '../firebaseConfig.js';

const routes = [
  {
    path: '/',
    redirect: '/login', // Redirect ke login bukan drive
    name: 'Home'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      title: 'Login',
      requiresAuth: false // Tidak perlu auth untuk login
    }
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: SignUp,
    meta: { 
      title: 'Sign Up',
      requiresAuth: false
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { 
      title: 'Reset Password',
      requiresAuth: false
    }
  },
  {
    path: '/drive',
    name: 'Drive',
    component: Drive,
    meta: { 
      title: 'My Drive',
      requiresAuth: true // Perlu login
    }
  },
  {
    path: '/public',
    name: 'PublicDrive',
    component: PublicDrive,
    meta: { 
      title: 'Public Drive',
      requiresAuth: false // Publik, tidak perlu login
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { 
      title: 'Profile',
      requiresAuth: true // Perlu login
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { 
      title: 'Page Not Found',
      requiresAuth: false
    }
  }
];

// Function untuk membuat router dengan navigation guards
export function createRouter(routerInstance) {
  // Tambahkan navigation guard ke router
  routerInstance.beforeEach(async (to, from, next) => {
    // Dapatkan user saat ini
    const user = auth.currentUser;
    
    // Cek apakah route memerlukan autentikasi
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    
    // Update title halaman
    if (to.meta.title) {
      document.title = `One - ${to.meta.title}`;
    }
    
    // Logic untuk redirect berdasarkan auth status
    if (requiresAuth && !user) {
      // Jika route butuh auth tapi user belum login, redirect ke login
      next('/login');
    } else if (!requiresAuth && user && 
               (to.path === '/login' || to.path === '/signup' || to.path === '/forgot-password')) {
      // Jika user sudah login dan mencoba akses login/signup, redirect ke drive
      next('/drive');
    } else {
      // Lanjutkan ke route yang diminta
      next();
    }
  });
  
  return routerInstance;
}

export default routes;