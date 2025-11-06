import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Validate that all required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missingVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
)

if (missingVars.length > 0) {
  console.warn(
    '⚠️ Missing Firebase environment variables:',
    missingVars.join(', ')
  )
  console.warn('Please create a .env file with your Firebase configuration.')
}

// Initialize Firebase with error handling
let app
let auth
let db
let firebaseError = null

// Check if config has all required values before initializing
// Handle both undefined and string 'undefined' values
const hasValidConfig = Object.values(firebaseConfig).every(
  value => {
    if (value === undefined || value === null) return false
    if (typeof value === 'string' && (value.trim() === '' || value === 'undefined')) return false
    return true
  }
)

if (!hasValidConfig) {
  const missingVars = requiredEnvVars.filter(
    varName => {
      const value = import.meta.env[varName]
      return !value || value === 'undefined' || value === ''
    }
  )
  firebaseError = `Missing Firebase configuration variables: ${missingVars.join(', ')}. Please set these in GitHub Secrets (for GitHub Pages) or .env file (for local development).`
  console.error('❌ Firebase not configured:', firebaseError)
  console.error('Missing variables:', missingVars)
  console.error('Current env values:', {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? '***' : undefined,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || undefined,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || undefined,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
  })
} else {
  try {
    // Double-check that we have valid string values (not undefined)
    const configToUse = {
      apiKey: String(firebaseConfig.apiKey || ''),
      authDomain: String(firebaseConfig.authDomain || ''),
      projectId: String(firebaseConfig.projectId || ''),
      storageBucket: String(firebaseConfig.storageBucket || ''),
      messagingSenderId: String(firebaseConfig.messagingSenderId || ''),
      appId: String(firebaseConfig.appId || '')
    }
    
    app = initializeApp(configToUse)
    auth = getAuth(app)
    db = getFirestore(app)
    console.log('✅ Firebase initialized successfully')
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    firebaseError = `Firebase initialization failed: ${error.message}. Please check your configuration.`
    // Still export fallback values to prevent app crash
    app = null
    auth = null
    db = null
  }
}

export { auth, db, firebaseError }
export default app

