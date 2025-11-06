import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, firebaseError } from '../firebase/config'

// Check if Firebase is properly initialized
if (!auth || !db) {
  console.error('Firebase not properly initialized. Check your .env file or GitHub Secrets.')
  if (firebaseError) {
    console.error('Firebase Error:', firebaseError)
  }
}

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState('guest') // 'guest', 'user', 'admin'
  const [userProfile, setUserProfile] = useState(null) // Store user profile data from Firestore
  const [loading, setLoading] = useState(true)

  // Sign up with email and password
  const signup = async (email, password, displayName = '', firstName = '', lastName = '') => {
    if (!auth || !db) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      
      // Update Firebase Auth displayName
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        })
      }
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'user', // Default role
        createdAt: new Date().toISOString(),
        reportsCount: 0
      })

      // Immediately update userProfile state
      setUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName,
        email: email
      })

      return userCredential
    } catch (error) {
      throw error
    }
  }

  // Sign in with email and password
  const login = async (email, password) => {
    if (!auth) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Sign in with Google
  const loginWithGoogle = async () => {
    if (!auth || !db) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }
    const provider = new GoogleAuthProvider()
    try {
      const userCredential = await signInWithPopup(auth, provider)
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          role: 'user',
          createdAt: new Date().toISOString(),
          reportsCount: 0
        })
      }

      return userCredential
    } catch (error) {
      throw error
    }
  }

  // Sign out
  const logout = () => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      return Promise.resolve()
    }
    return signOut(auth)
  }

  // Reset password
  const resetPassword = (email) => {
    if (!auth) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }
    // Optionally set action code settings for custom email handler
    const actionCodeSettings = {
      // URL you want to redirect back to after password reset
      // Change this to your production URL when deploying
      url: window.location.origin + '/reset-password',
      handleCodeInApp: false, // Set to true if you want to handle the code in your app
    }
    return sendPasswordResetEmail(auth, email, actionCodeSettings)
  }

  // Fetch user role and profile from Firestore
  const fetchUserRole = async (uid) => {
    if (!db) {
      return 'guest'
    }
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        // Store user profile data
        setUserProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: userData.displayName || '',
          email: userData.email || ''
        })
        return userData.role || 'user'
      }
      return 'user' // Default role if document doesn't exist
    } catch (error) {
      console.error('Error fetching user role:', error)
      return 'user'
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        const role = await fetchUserRole(user.uid)
        setUserRole(role)
      } else {
        setCurrentUser(null)
        setUserRole('guest')
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    loading,
    firebaseError,
    isFirebaseReady: !!auth && !!db
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

