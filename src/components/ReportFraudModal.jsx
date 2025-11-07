import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createReport } from '../firebase/firestore'
import { FiAlertTriangle, FiLock, FiUser } from 'react-icons/fi'

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

// Carrier number prefixes for validation
const CARRIER_PREFIXES = {
  MTN: ['024', '054', '055', '059', '053'],
  AirtelTigo: ['026', '056', '027', '057'],
  Telecel: ['020', '050']
}

export default function ReportFraudModal({ isOpen, onClose, onOpenAuth }) {
  const [number, setNumber] = useState('')
  const [carrier, setCarrier] = useState('MTN')
  const [customCarrier, setCustomCarrier] = useState('')
  const [fraudType, setFraudType] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  
  // Validation states
  const [numberError, setNumberError] = useState('')
  const [fraudTypeError, setFraudTypeError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [carrierError, setCarrierError] = useState('')
  
  const { currentUser } = useAuth()

  // Validate number format and carrier match
  const validateNumber = (num, selectedCarrier) => {
    if (!num.trim()) {
      return 'Please enter a MoMo number'
    }

    // Remove spaces and normalize
    const normalized = num.replace(/\s+/g, '').replace(/^\+233/, '0')
    
    // Check if it's all digits
    if (!/^\d+$/.test(normalized)) {
      return 'MoMo number should only contain digits'
    }

    // Check length (should be 10 digits starting with 0)
    if (normalized.length !== 10) {
      return 'MoMo number must be 10 digits (e.g., 0244123456)'
    }

    // Check if it starts with 0
    if (!normalized.startsWith('0')) {
      return 'MoMo number must start with 0'
    }

    // Validate carrier prefix match
    if (selectedCarrier !== 'Other' && CARRIER_PREFIXES[selectedCarrier]) {
      const prefix = normalized.substring(0, 3)
      if (!CARRIER_PREFIXES[selectedCarrier].includes(prefix)) {
        const validPrefixes = CARRIER_PREFIXES[selectedCarrier].join(', ')
        return `This number doesn't match ${selectedCarrier} format. ${selectedCarrier} numbers start with: ${validPrefixes}`
      }
    }

    return ''
  }

  // Validate fraud type
  const validateFraudType = (type) => {
    if (!type.trim()) {
      return 'Please enter a fraud type'
    }
    if (type.trim().length < 3) {
      return 'Fraud type must be at least 3 characters'
    }
    if (type.trim().length > 50) {
      return 'Fraud type must be less than 50 characters'
    }
    return ''
  }

  // Validate description
  const validateDescription = (desc) => {
    if (!desc.trim()) {
      return 'Please enter a description'
    }
    if (desc.trim().length < 10) {
      return 'Description must be at least 10 characters'
    }
    if (desc.trim().length > 1000) {
      return 'Description must be less than 1000 characters'
    }
    return ''
  }

  // Validate custom carrier
  const validateCustomCarrier = (carrierName) => {
    if (carrier === 'Other' && !carrierName.trim()) {
      return 'Please specify the carrier name'
    }
    if (carrier === 'Other' && carrierName.trim().length < 2) {
      return 'Carrier name must be at least 2 characters'
    }
    return ''
  }

  // Handle number input with real-time validation
  const handleNumberChange = (e) => {
    const value = e.target.value.replace(/[^\d\s+]/g, '') // Only allow digits, spaces, and +
    setNumber(value)
    
    // Real-time validation
    if (value.trim()) {
      const error = validateNumber(value, carrier)
      setNumberError(error)
    } else {
      setNumberError('')
    }
  }

  // Handle carrier change with re-validation
  const handleCarrierChange = (e) => {
    const newCarrier = e.target.value
    setCarrier(newCarrier)
    setCarrierError('')
    
    // Re-validate number if it exists
    if (number.trim()) {
      const error = validateNumber(number, newCarrier)
      setNumberError(error)
    }
  }

  // Handle fraud type change
  const handleFraudTypeChange = (e) => {
    const value = e.target.value
    setFraudType(value)
    
    if (value.trim()) {
      const error = validateFraudType(value)
      setFraudTypeError(error)
    } else {
      setFraudTypeError('')
    }
  }

  // Handle description change
  const handleDescriptionChange = (e) => {
    const value = e.target.value
    setDescription(value)
    
    if (value.trim()) {
      const error = validateDescription(value)
      setDescriptionError(error)
    } else {
      setDescriptionError('')
    }
  }

  // Handle custom carrier change
  const handleCustomCarrierChange = (e) => {
    const value = e.target.value
    setCustomCarrier(value)
    
    if (carrier === 'Other') {
      const error = validateCustomCarrier(value)
      setCarrierError(error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setShowAuthPrompt(false)
    setLoading(true)

    // Check if user is authenticated
    if (!currentUser) {
      setShowAuthPrompt(true)
      setLoading(false)
      return
    }

    // Comprehensive validation
    const numError = validateNumber(number, carrier)
    const fraudError = validateFraudType(fraudType)
    const descError = validateDescription(description)
    const carrierErr = validateCustomCarrier(customCarrier)

    // Set all error states
    setNumberError(numError)
    setFraudTypeError(fraudError)
    setDescriptionError(descError)
    setCarrierError(carrierErr)

    // Check if there are any errors
    if (numError || fraudError || descError || carrierErr) {
      setError('Please fix the errors in the form before submitting')
      setLoading(false)
      return
    }

    try {
      // Normalize number (remove spaces, ensure starts with 0)
      const normalizedNumber = number.replace(/\s+/g, '').replace(/^\+233/, '0')
      
      const finalCarrier = carrier === 'Other' ? customCarrier.trim() : carrier

      const reportData = {
        number: normalizedNumber,
        carrier: finalCarrier,
        fraudType: fraudType.trim(),
        description: description.trim(),
        userId: currentUser?.uid || null,
        category: fraudType.trim(),
        evidence: [] // Can be extended later for file uploads
      }

      // Create report - this will automatically add the number to the database and flag it
      await createReport(reportData)
      
      setSuccess('Fraud report submitted successfully!')
      
      // Reset form
      setNumber('')
      setCarrier('MTN')
      setCustomCarrier('')
      setFraudType('')
      setDescription('')
      setNumberError('')
      setFraudTypeError('')
      setDescriptionError('')
      setCarrierError('')
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Error submitting report:', err)
      setError(err.message || 'Failed to submit report. Please try again.')
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
      padding: '1rem',
      overflowY: 'auto'
    }}
    onClick={onClose}
    >
      <div style={{
        background: 'linear-gradient(180deg, #0a0e1a 0%, #16192c 100%)',
        border: '2px solid rgba(68,97,171,0.5)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
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
          textAlign: 'center',
          paddingRight: '2rem'
        }}>
          <FiAlertTriangle style={{display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle', color: '#c41262'}} /> Report Fraud
        </h2>

        {/* Authentication Prompt */}
        {showAuthPrompt && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(196,18,98,0.2) 0%, rgba(68,97,171,0.2) 100%)',
            border: '2px solid rgba(196,18,98,0.5)',
            borderRadius: '0.875rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <FiLock style={{fontSize: '2rem', color: '#c41262', marginRight: '0.75rem'}} />
            </div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '1.125rem',
              fontWeight: '800',
              marginBottom: '0.5rem'
            }}>
              Sign In Required
            </h3>
            <p style={{
              color: '#d1d5db',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Please sign in or create an account to submit a fraud report. This helps us maintain accurate records and protect the community.
            </p>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth('signin')
                    setShowAuthPrompt(false)
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,177,206,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <FiUser />
                Sign In
              </button>
              <button
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth('signup')
                    setShowAuthPrompt(false)
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.5)',
                  borderRadius: '0.5rem',
                  color: '#1ab1ce',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(68,97,171,0.3)'
                  e.currentTarget.style.borderColor = '#1ab1ce'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(22,25,44,0.8)'
                  e.currentTarget.style.borderColor = 'rgba(68,97,171,0.5)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(196, 18, 98, 0.2)',
            border: '1px solid rgba(196, 18, 98, 0.5)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#fca5a5',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(26, 177, 206, 0.2)',
            border: '1px solid rgba(26, 177, 206, 0.5)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#1ab1ce',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Number Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              MoMo Number <span style={{color: '#c41262'}}>*</span>
              {carrier !== 'Other' && CARRIER_PREFIXES[carrier] && (
                <span style={{
                  color: '#9ca3af',
                  fontSize: '0.75rem',
                  fontWeight: '400',
                  marginLeft: '0.5rem'
                }}>
                  ({carrier}: {CARRIER_PREFIXES[carrier].join(', ')})
                </span>
              )}
            </label>
            <input
              type="tel"
              value={number}
              onChange={handleNumberChange}
              placeholder={carrier !== 'Other' && CARRIER_PREFIXES[carrier] 
                ? `${CARRIER_PREFIXES[carrier][0]}4123456`
                : "0244123456"}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(22,25,44,0.8)',
                border: `2px solid ${numberError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'}`,
                borderRadius: '0.5rem',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = numberError ? '#c41262' : '#1ab1ce'}
              onBlur={(e) => {
                e.target.style.borderColor = numberError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'
                // Final validation on blur
                if (number.trim()) {
                  const error = validateNumber(number, carrier)
                  setNumberError(error)
                }
              }}
              maxLength={13}
              required
            />
            {numberError && (
              <div style={{
                color: '#fca5a5',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <FiAlertTriangle size={12} />
                {numberError}
              </div>
            )}
          </div>

          {/* Carrier Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Carrier <span style={{color: '#c41262'}}>*</span>
            </label>
            <select
              value={carrier}
              onChange={handleCarrierChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(22,25,44,0.8)',
                border: `2px solid ${carrierError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'}`,
                borderRadius: '0.5rem',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => e.target.style.borderColor = carrierError ? '#c41262' : '#1ab1ce'}
              onBlur={(e) => e.target.style.borderColor = carrierError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'}
            >
              <option value="MTN" style={{background: '#16192c', color: '#ffffff'}}>MTN</option>
              <option value="AirtelTigo" style={{background: '#16192c', color: '#ffffff'}}>AirtelTigo</option>
              <option value="Telecel" style={{background: '#16192c', color: '#ffffff'}}>Telecel</option>
              <option value="Other" style={{background: '#16192c', color: '#ffffff'}}>Other</option>
            </select>
            
            {carrier === 'Other' && (
              <>
                <input
                  type="text"
                  value={customCarrier}
                  onChange={handleCustomCarrierChange}
                  placeholder="Enter carrier name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(22,25,44,0.8)',
                    border: `2px solid ${carrierError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'}`,
                    borderRadius: '0.5rem',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    marginTop: '0.5rem',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = carrierError ? '#c41262' : '#1ab1ce'}
                  onBlur={(e) => {
                    e.target.style.borderColor = carrierError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'
                    const error = validateCustomCarrier(customCarrier)
                    setCarrierError(error)
                  }}
                  required={carrier === 'Other'}
                />
                {carrierError && (
                  <div style={{
                    color: '#fca5a5',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <FiAlertTriangle size={12} />
                    {carrierError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Fraud Type Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Fraud Type <span style={{color: '#c41262'}}>*</span>
              <span style={{
                color: '#9ca3af',
                fontSize: '0.75rem',
                fontWeight: '400',
                marginLeft: '0.5rem'
              }}>
                (3-50 characters)
              </span>
            </label>
            <input
              type="text"
              value={fraudType}
              onChange={handleFraudTypeChange}
              placeholder="e.g., Phishing, Scam, Fake Payment"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(22,25,44,0.8)',
                border: `2px solid ${fraudTypeError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'}`,
                borderRadius: '0.5rem',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = fraudTypeError ? '#c41262' : '#1ab1ce'}
              onBlur={(e) => {
                e.target.style.borderColor = fraudTypeError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'
                const error = validateFraudType(fraudType)
                setFraudTypeError(error)
              }}
              maxLength={50}
              required
            />
            {fraudTypeError && (
              <div style={{
                color: '#fca5a5',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <FiAlertTriangle size={12} />
                {fraudTypeError}
              </div>
            )}
          </div>

          {/* Description Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Description <span style={{color: '#c41262'}}>*</span>
              <span style={{
                color: '#9ca3af',
                fontSize: '0.75rem',
                fontWeight: '400',
                marginLeft: '0.5rem'
              }}>
                ({description.length}/1000 characters, min 10)
              </span>
            </label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Describe what happened in detail..."
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(22,25,44,0.8)',
                border: `2px solid ${descriptionError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'}`,
                borderRadius: '0.5rem',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = descriptionError ? '#c41262' : '#1ab1ce'}
              onBlur={(e) => {
                e.target.style.borderColor = descriptionError ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.3)'
                const error = validateDescription(description)
                setDescriptionError(error)
              }}
              maxLength={1000}
              required
            />
            {descriptionError && (
              <div style={{
                color: '#fca5a5',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <FiAlertTriangle size={12} />
                {descriptionError}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading 
                ? 'rgba(196,18,98,0.5)' 
                : 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <LoadingSpinner size={16} color="#ffffff" />
                <span style={{marginLeft: '0.5rem'}}>Submitting...</span>
              </>
            ) : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
    </>
  )
}
