import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FiEye, FiEyeOff, FiAlertCircle, FiX } from 'react-icons/fi'

// Loading Spinner Component
const LoadingSpinner = ({ size = 20, color = '#ffffff' }) => (
  <div style={{
    display: 'inline-block',
    width: size,
    height: size,
    border: `3px solid ${color}30`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }} />
)

// Google Logo SVG Component
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.348 6.173 0 7.55 0 9s.348 2.827.957 4.042l2.84-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </g>
  </svg>
)

// Custom Alert Component
const CustomAlert = ({ message, type = 'error', onClose }) => {
  const isSuccess = type === 'success'
  
  return (
    <div style={{
      background: isSuccess 
        ? 'linear-gradient(135deg, rgba(26,177,206,0.15) 0%, rgba(68,97,171,0.15) 100%)'
        : 'linear-gradient(135deg, rgba(196,18,98,0.15) 0%, rgba(196,18,98,0.1) 100%)',
      border: `2px solid ${isSuccess ? 'rgba(26,177,206,0.4)' : 'rgba(196,18,98,0.4)'}`,
      borderRadius: '0.875rem',
      padding: '1rem',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      position: 'relative',
      backdropFilter: 'blur(10px)',
      boxShadow: isSuccess 
        ? '0 4px 20px rgba(26,177,206,0.2)'
        : '0 4px 20px rgba(196,18,98,0.2)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: isSuccess 
          ? 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)'
          : 'linear-gradient(135deg, #c41262 0%, #c41262 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '0.125rem'
      }}>
        <FiAlertCircle 
          style={{
            color: '#ffffff',
            fontSize: '0.875rem'
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: isSuccess ? '#1ab1ce' : '#fca5a5',
          fontSize: '0.875rem',
          fontWeight: '600',
          lineHeight: '1.5',
          wordWrap: 'break-word'
        }}>
          {message}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: isSuccess ? '#1ab1ce' : '#fca5a5',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.25rem',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.background = isSuccess 
              ? 'rgba(26,177,206,0.2)' 
              : 'rgba(196,18,98,0.2)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
          }}
        >
          <FiX style={{ fontSize: '1rem' }} />
        </button>
      )}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Helper function to get user-friendly error messages
const getErrorMessage = (error) => {
  if (!error) return 'An error occurred. Please try again.'
  
  const errorCode = error.code || ''
  const errorMessage = error.message || ''
  
  // Map Firebase error codes to user-friendly messages
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address. Please check your email or sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again or use "Forgot password?" to reset it.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
    'auth/invalid-verification-id': 'Invalid verification. Please try again.',
    'auth/missing-email': 'Please enter your email address.',
    'auth/missing-password': 'Please enter your password.'
  }
  
  // Check if we have a custom message for this error code
  if (errorMessages[errorCode]) {
    return errorMessages[errorCode]
  }
  
  // If error message contains common patterns, extract and format
  if (errorMessage.includes('password') && errorMessage.includes('wrong')) {
    return 'Incorrect password. Please try again or use "Forgot password?" to reset it.'
  }
  
  if (errorMessage.includes('user-not-found') || errorMessage.includes('no user')) {
    return 'No account found with this email address. Please check your email or sign up.'
  }
  
  if (errorMessage.includes('email-already-in-use') || errorMessage.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.'
  }
  
  // Return a generic friendly message if we can't map it
  return 'An error occurred. Please try again.'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode) // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, signup, loginWithGoogle, resetPassword } = useAuth()

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  }

  const validateName = (name) => {
    // Only letters, spaces, hyphens, and apostrophes allowed
    const nameRegex = /^[A-Za-z\s'-]+$/
    return nameRegex.test(name) && name.trim().length >= 2
  }

  const restrictToNumbers = (value) => {
    // Remove any non-numeric characters
    return value.replace(/[^0-9]/g, '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!validateEmail(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      if (mode === 'signin') {
        if (!password.trim()) {
          setError('Please enter your password')
          setLoading(false)
          return
        }
        await login(email, password)
        onClose()
      } else {
        // Sign up validations
        if (!firstName.trim()) {
          setError('Please enter your first name')
          setLoading(false)
          return
        }

        if (!validateName(firstName)) {
          setError('First name must contain only letters and be at least 2 characters long')
          setLoading(false)
          return
        }

        if (!lastName.trim()) {
          setError('Please enter your last name')
          setLoading(false)
          return
        }

        if (!validateName(lastName)) {
          setError('Last name must contain only letters and be at least 2 characters long')
          setLoading(false)
          return
        }

        if (!password.trim()) {
          setError('Please enter a password')
          setLoading(false)
          return
        }

        if (!validatePassword(password)) {
          setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        const displayName = `${firstName.trim()} ${lastName.trim()}`
        await signup(email, password, displayName, firstName.trim(), lastName.trim())
        onClose()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Reset form when mode changes
  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to sign in with Google. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setError('Password reset email sent! Check your inbox.')
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      if (errorMsg.includes('user-not-found')) {
        setError('No account found with this email address.')
      } else {
        setError(errorMsg || 'Failed to send password reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}
    onClick={onClose}
    >
      <div style={{
        background: 'linear-gradient(180deg, #0a0e1a 0%, #16192c 100%)',
        border: '2px solid rgba(68,97,171,0.5)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(68,97,171,0.3)',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            fontSize: '1.5rem',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(68,97,171,0.2)'
            e.target.style.color = '#1ab1ce'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
            e.target.style.color = '#9ca3af'
          }}
        >
          ×
        </button>

        <h2 style={{
          color: '#ffffff',
          fontSize: '1.75rem',
          fontWeight: '900',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>

        {error && (
          <CustomAlert 
            message={error}
            type={error.includes('sent!') || error.includes('success') ? 'success' : 'error'}
            onClose={() => setError('')}
          />
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    First Name <span style={{color: '#c41262'}}>*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens, and apostrophes
                      const value = e.target.value.replace(/[^A-Za-z\s'-]/g, '')
                      setFirstName(value)
                    }}
                    placeholder="John"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1ab1ce'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(68,97,171,0.3)'}
                    required
                    minLength={2}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    Last Name <span style={{color: '#c41262'}}>*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens, and apostrophes
                      const value = e.target.value.replace(/[^A-Za-z\s'-]/g, '')
                      setLastName(value)
                    }}
                    placeholder="Doe"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1ab1ce'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(68,97,171,0.3)'}
                    required
                    minLength={2}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Email <span style={{color: '#c41262'}}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(22,25,44,0.8)',
                border: '2px solid rgba(68,97,171,0.3)',
                borderRadius: '0.5rem',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1ab1ce'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(68,97,171,0.3)'}
              required
            />
          </div>

          <div style={{ marginBottom: mode === 'signup' ? '1rem' : '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Password <span style={{color: '#c41262'}}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters with uppercase, lowercase, number & special char' : 'Enter your password'}
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 0.75rem',
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1ab1ce'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(68,97,171,0.3)'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1ab1ce'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {mode === 'signup' && password && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: validatePassword(password) ? '#1ab1ce' : '#fca5a5'
              }}>
                {validatePassword(password) ? '✓ Password meets requirements' : 'Password must have: 8+ chars, uppercase, lowercase, number, special char (@$!%*?&)'}
              </div>
            )}
            {mode === 'signin' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1ab1ce',
                  fontSize: '0.75rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Forgot password?
              </button>
            )}
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#d1d5db',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Confirm Password <span style={{color: '#c41262'}}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 0.75rem',
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '0.5rem',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1ab1ce'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(68,97,171,0.3)'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1ab1ce'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {confirmPassword && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: password === confirmPassword ? '#1ab1ce' : '#fca5a5'
                }}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading 
                ? 'rgba(68,97,171,0.5)' 
                : 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1rem',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <LoadingSpinner size={16} color="#ffffff" />
                <span style={{marginLeft: '0.5rem'}}>Loading...</span>
              </>
            ) : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'rgba(68,97,171,0.3)'
          }} />
          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>OR</span>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'rgba(68,97,171,0.3)'
          }} />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: 'rgba(22,25,44,0.8)',
            border: '2px solid rgba(68,97,171,0.3)',
            borderRadius: '0.5rem',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.borderColor = '#1ab1ce'
              e.target.style.background = 'rgba(68,97,171,0.2)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.borderColor = 'rgba(68,97,171,0.3)'
              e.target.style.background = 'rgba(22,25,44,0.8)'
            }
          }}
        >
          <GoogleLogo />
          Continue with Google
        </button>

        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem'
        }}>
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => handleModeChange('signup')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1ab1ce',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'underline'
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => handleModeChange('signin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1ab1ce',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'underline'
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  )
}


