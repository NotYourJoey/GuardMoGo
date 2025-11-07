import { useState, useEffect, useRef } from 'react'
import { useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'
import ReportFraudModal from './components/ReportFraudModal'
import ReportDetailsModal from './components/ReportDetailsModal'
import { checkNumber, createReport, getDashboardStats, getTopReportedNumbers, getUserReports } from './firebase/firestore'
import { 
  FiShield, FiAlertTriangle, FiBarChart2, FiSearch, FiFileText, FiSettings, FiHelpCircle, FiInfo, FiLock,
  FiHome, FiUser, FiCheck, FiPhone, FiDollarSign, FiXCircle, FiClock, FiMessageCircle, FiKey,
  FiCheckCircle, FiAlertCircle, FiCreditCard, FiMail, FiBell, FiRefreshCw, FiGlobe, FiAward, FiX,
  FiDatabase, FiServer, FiActivity, FiUsers, FiShare2, FiTarget, FiStar, FiPackage, FiCalendar,
  FiTrendingUp, FiEye, FiEyeOff
} from 'react-icons/fi'

// Loading Spinner Component
const LoadingSpinner = ({ size = 20, color = '#1ab1ce' }) => (
  <div style={{
    display: 'inline-block',
    width: size,
    height: size,
    border: `3px solid ${color}20`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }} />
)

// Custom hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

// Mobile Layout Component
function MobileLayout({ isScrolled, activeTab, setActiveTab, currentUser, userRole, userProfile, logout, openAuthModal, openReportFraudModal }) {
  const [headerHeight, setHeaderHeight] = useState(150)
  const headerRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchNumber, setSearchNumber] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showReportDetails, setShowReportDetails] = useState(false)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [topNumbers, setTopNumbers] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [userReports, setUserReports] = useState([])
  const [userReportsLoading, setUserReportsLoading] = useState(false)
  const [profileSection, setProfileSection] = useState('main') // 'main', 'reports', 'settings', 'help', 'privacy', 'about'
  const [expandedTip, setExpandedTip] = useState(null) // Index of expanded tip
  const [recentNumbers, setRecentNumbers] = useState([])
  const [recentNumbersLoading, setRecentNumbersLoading] = useState(false)

  const updateHeaderHeight = () => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect()
      const calculatedHeight = Math.ceil(rect.height)
      if (calculatedHeight > 0 && calculatedHeight !== headerHeight) {
        setHeaderHeight(calculatedHeight)
      }
    }
  }

  // Use callback ref to set up observer when element is mounted
  const setHeaderRef = (element) => {
    if (resizeObserverRef.current && headerRef.current) {
      resizeObserverRef.current.disconnect()
    }
    headerRef.current = element
    
    if (element) {
      // Measure immediately
      updateHeaderHeight()
      requestAnimationFrame(() => updateHeaderHeight())
      
      // Set up ResizeObserver
      resizeObserverRef.current = new ResizeObserver(() => {
        updateHeaderHeight()
      })
      resizeObserverRef.current.observe(element)
    }
  }

  useEffect(() => {
    const measureHeight = () => {
      requestAnimationFrame(() => updateHeaderHeight())
    }
    
    window.addEventListener('resize', measureHeight)
    return () => {
      window.removeEventListener('resize', measureHeight)
    }
  }, [])

  // Recalculate header height when tab changes or scroll state changes
  useEffect(() => {
    // Immediate measurement
    updateHeaderHeight()
    requestAnimationFrame(() => {
      updateHeaderHeight()
      setTimeout(() => updateHeaderHeight(), 50)
    })
  }, [activeTab, isScrolled])

  // Reset search when tab changes away from home
  useEffect(() => {
    if (activeTab !== 'home') {
      setShowSearch(false)
      setSearchNumber('')
      setSearchResults(null)
      setSearchError('')
      setShowReportDetails(false)
    }
    // Reset profile section when switching tabs
    if (activeTab !== 'profile') {
      setProfileSection('main')
    }
  }, [activeTab])

  // Load dashboard data when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData()
    }
  }, [activeTab])

  // Load user reports when profile tab is active and user is logged in
  useEffect(() => {
    if (activeTab === 'profile' && currentUser) {
      loadUserReports()
    }
  }, [activeTab, currentUser])

  // Load recent reported numbers when home tab is active
  useEffect(() => {
    if (activeTab === 'home') {
      loadRecentNumbers()
    }
  }, [activeTab])

  const loadDashboardData = async () => {
    setDashboardLoading(true)
    try {
      const stats = await getDashboardStats()
      setDashboardStats(stats)
      
      const top = await getTopReportedNumbers(10)
      setTopNumbers(top)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadUserReports = async () => {
    if (!currentUser) return
    setUserReportsLoading(true)
    try {
      const reports = await getUserReports(currentUser.uid)
      setUserReports(reports)
    } catch (error) {
      console.error('Error loading user reports:', error)
    } finally {
      setUserReportsLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      })
    } catch (error) {
      return 'Unknown date'
    }
  }

  const loadRecentNumbers = async () => {
    setRecentNumbersLoading(true)
    try {
      const top = await getTopReportedNumbers(5)
      setRecentNumbers(top)
    } catch (error) {
      console.error('Error loading recent numbers:', error)
      setRecentNumbers([])
    } finally {
      setRecentNumbersLoading(false)
    }
  }

  // Handle search when clicking on recent number - opens report details modal
  const handleSearchFromRecent = async (number) => {
    setSearchNumber(number)
    setShowSearch(true)
    setSearchError('')
    setSearchLoading(true)
    setSearchResults(null)

    try {
      const normalizedNumber = number.replace(/\s+/g, '').replace(/^\+233/, '0')
      const result = await checkNumber(normalizedNumber)
      setSearchResults(result)
      if (!result) {
        setSearchResults({ reports: [], reportsCount: 0 })
      } else if (result.reports && result.reports.length > 0) {
        // If reports exist, automatically open the report details modal
        setShowReportDetails(true)
      }
    } catch (err) {
      console.error('Error checking number:', err)
      setSearchError('Failed to check number. Please try again.')
      setSearchResults(null)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [])

  // Use a fixed safe padding - 160px should always be enough
  // This prevents any overlap issues during measurement delays
  const paddingTop = 160

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchNumber.trim()) {
      setSearchError('Please enter a MoMo number')
      return
    }

    // Validate number format
    const numberRegex = /^0?\d{9,10}$/
    const normalizedNumber = searchNumber.replace(/\s+/g, '').replace(/^\+233/, '0')
    
    if (!numberRegex.test(normalizedNumber)) {
      setSearchError('Please enter a valid MoMo number (9-10 digits)')
      return
    }

    setSearchError('')
    setSearchLoading(true)
    setSearchResults(null)

    try {
      const result = await checkNumber(normalizedNumber)
      setSearchResults(result)
      if (!result) {
        setSearchResults({ reports: [], reportsCount: 0 })
      }
    } catch (err) {
      console.error('Error checking number:', err)
      setSearchError('Failed to check number. Please try again.')
      setSearchResults(null)
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle Check Number button click - toggle search
  const handleCheckNumberClick = () => {
    if (showSearch) {
      // Close search
      setShowSearch(false)
      setSearchNumber('')
      setSearchResults(null)
      setSearchError('')
      setShowReportDetails(false)
    } else {
      // Open search
      setShowSearch(true)
      setSearchNumber('')
      setSearchResults(null)
      setSearchError('')
      setShowReportDetails(false)
    }
  }

  return (
    <div 
      style={{
        minHeight: '100vh', 
        backgroundColor: '#0a0e1a', 
        paddingBottom: 'max(100px, calc(70px + env(safe-area-inset-bottom)))', 
        overflowX: 'hidden',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Mobile Header */}
      <div 
        ref={setHeaderRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: isScrolled ? 'rgba(10,14,26,0.95)' : 'rgba(10,14,26,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(68,97,171,0.3)',
          zIndex: 100,
          padding: '0.75rem 1rem',
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          transition: 'all 0.3s',
          minHeight: '70px',
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
          <div style={{fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>
            <span style={{color: '#1ab1ce', textShadow: '0 0 10px rgba(26,177,206,0.5)'}}>Guard</span>
            <span style={{color: '#4461ab'}}>Mo</span>
            <span style={{color: '#c41262'}}>Go</span>
          </div>
          {currentUser ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap'}}>
              <span style={{
                fontSize: '0.75rem', 
                color: '#1ab1ce',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '120px'
              }}>
                Hey {userProfile?.firstName 
                  ? userProfile.firstName 
                  : userProfile?.displayName?.split(' ')[0] 
                  || currentUser.displayName?.split(' ')[0] 
                  || currentUser.email?.split('@')[0] 
                  || 'there'}, welcome
              </span>
              <button 
                onClick={logout}
                style={{
                  padding: '0.5rem 0.875rem',
                  background: 'rgba(196,18,98,0.3)',
                  border: '1px solid rgba(196,18,98,0.5)',
                  borderRadius: '0.625rem',
                  color: '#fca5a5',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >Sign Out</button>
            </div>
          ) : (
            <button 
              onClick={() => openAuthModal('signin')}
              style={{
                padding: '0.5rem 0.875rem',
                background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                border: 'none',
                borderRadius: '0.625rem',
                color: 'white',
                fontWeight: '700',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >Sign In</button>
          )}
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div style={{ height: `${headerHeight}px`, flexShrink: 0 }} />

      {/* Mobile Hero Section */}
      {activeTab === 'home' && (
        <div 
          style={{
            padding: '1.5rem 1rem', 
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
            textAlign: 'center', 
            maxWidth: '100%', 
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            padding: '0.625rem 1.25rem',
            marginBottom: '1.5rem',
            marginTop: '0',
            background: 'linear-gradient(135deg, rgba(68,97,171,0.3) 0%, rgba(26,177,206,0.3) 100%)',
            border: '2px solid rgba(26,177,206,0.4)',
            borderRadius: '9999px',
            color: '#1ab1ce',
            fontWeight: '700',
            fontSize: '0.75rem',
            display: 'inline-block',
            whiteSpace: 'nowrap'
          }}>
            <FiShield style={{display: 'inline-block', marginRight: '0.5rem'}} /> Digital Watchdog
          </div>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 7vw, 2rem)',
            fontWeight: '900',
            lineHeight: '1.2',
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em',
            padding: '0 0.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.25rem',
            alignItems: 'center'
          }}>
            <span style={{color: '#ffffff'}}>Report.</span>
            <span style={{
              background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 50%, #c41262 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Verify.</span>
            <span style={{color: '#ffffff'}}>Stay Safe.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
            color: '#d1d5db',
            marginBottom: '1.5rem',
            lineHeight: '1.5',
            padding: '0 0.5rem'
          }}>
            Protect yourself from Mobile Money fraud with real-time alerts and verification.
          </p>

          {/* Mobile Search Bar - Only show when Check Number is clicked */}
          {showSearch && (
          <div style={{
              background: 'linear-gradient(135deg, rgba(26,177,206,0.15) 0%, rgba(68,97,171,0.15) 100%)',
              border: '2px solid rgba(26,177,206,0.4)',
              borderRadius: '1.25rem',
              padding: '1rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(20px)',
            width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 8px 32px rgba(26,177,206,0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FiSearch style={{color: '#ffffff', fontSize: '1.25rem'}} />
                </div>
                <div style={{flex: 1}}>
                  <div style={{
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.9375rem',
                    marginBottom: '0.25rem'
                  }}>
                    Check Number
                  </div>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '0.75rem'
                  }}>
                    Verify if a number has been reported
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'stretch',
                flexWrap: 'nowrap',
                width: '100%'
              }}>
                <div style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: 0
                }}>
                  <FiSearch style={{
                    position: 'absolute',
                    left: '0.75rem',
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />
              <input
                type="tel"
                    placeholder="e.g. 0244123456"
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !searchLoading) {
                        handleSearch()
                      }
                    }}
                style={{
                  width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '0.75rem',
                  outline: 'none',
                  color: '#e5e7eb',
                  fontSize: '0.875rem',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      transition: 'all 0.2s',
                      WebkitAppearance: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1ab1ce'
                      e.target.style.boxShadow = '0 0 0 3px rgba(26,177,206,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(68,97,171,0.3)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={searchLoading}
                  style={{
                    padding: '0.75rem',
                    minWidth: '44px',
                    background: searchLoading 
                      ? 'rgba(68,97,171,0.5)' 
                      : 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    whiteSpace: 'nowrap',
                    cursor: searchLoading ? 'not-allowed' : 'pointer',
                    opacity: searchLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s',
                    boxShadow: searchLoading ? 'none' : '0 4px 12px rgba(26,177,206,0.3)',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (!searchLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,177,206,0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!searchLoading) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,177,206,0.3)'
                    }
                  }}
                >
                  {searchLoading ? (
                    <>
                      <LoadingSpinner size={14} color="#ffffff" />
                      <span className="search-button-text">Searching...</span>
                    </>
                  ) : (
                    <>
                      <FiSearch size={16} />
                      <span className="search-button-text">Search</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Search Error */}
              {searchError && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.625rem',
                  background: 'rgba(196, 18, 98, 0.2)',
                  border: '1px solid rgba(196, 18, 98, 0.5)',
                  borderRadius: '0.5rem',
                  color: '#fca5a5',
                  fontSize: '0.75rem'
                }}>
                  {searchError}
                </div>
              )}

              {/* Search Results */}
              {searchLoading && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#9ca3af',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <LoadingSpinner size={32} color="#1ab1ce" />
                  <div style={{fontSize: '0.875rem'}}>Checking number...</div>
                </div>
              )}
              {searchResults && !searchLoading && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(22,25,44,0.6)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '0.875rem'
                }}>
                  {searchResults.reports && searchResults.reports.length > 0 ? (
                    <div>
                      <div style={{
                        color: '#c41262',
                        fontWeight: '800',
                        fontSize: '0.875rem',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <FiAlertTriangle style={{display: 'inline-block', marginRight: '0.5rem'}} /> Number Flagged
                      </div>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        {searchNumber}
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '0.75rem',
                        marginBottom: '0.75rem'
                      }}>
                        {(searchResults.reportsCount || searchResults.reports.length).toLocaleString()} report(s) found
                      </div>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.8125rem',
                        lineHeight: '1.5',
                        marginBottom: '0.75rem'
                      }}>
                        This number has been reported for fraud. Exercise caution.
                      </div>
                      <button
                        onClick={() => setShowReportDetails(true)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                border: 'none',
                borderRadius: '0.625rem',
                color: 'white',
                fontWeight: '700',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.02)'
                          e.target.style.boxShadow = '0 5px 15px rgba(26,177,206,0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)'
                          e.target.style.boxShadow = 'none'
                        }}
                      >
                        Show More Details →
                      </button>
            </div>
                  ) : (
                    <div style={{
                      color: '#1ab1ce',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ✓ Number appears safe
          </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!showSearch ? (
          <div style={{
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '0.625rem', 
            marginBottom: '1.5rem',
            width: '100%',
            boxSizing: 'border-box'
          }}>
              <button 
                onClick={handleCheckNumberClick}
                style={{
              padding: '0.875rem 0.625rem',
              background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
              border: 'none',
              borderRadius: '0.875rem',
              color: 'white',
              fontWeight: '800',
              fontSize: '0.8125rem',
              boxShadow: '0 10px 30px rgba(26,177,206,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(26,177,206,0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(26,177,206,0.4)'
                }}
              >
                <FiSearch size={18} />
              Check Number
            </button>
              <button 
                onClick={openReportFraudModal}
                style={{
              padding: '0.875rem 0.625rem',
              background: 'transparent',
                  border: '2px solid #c41262',
              borderRadius: '0.875rem',
                  color: '#c41262',
              fontWeight: '800',
              fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(196,18,98,0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <FiAlertTriangle size={18} />
              Report Fraud
            </button>
          </div>
          ) : (
            <div style={{marginBottom: '1.5rem'}}>
              <button 
                onClick={handleCheckNumberClick}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(196,18,98,0.4)',
                borderRadius: '0.875rem',
                  color: '#c41262',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                display: 'flex',
                  alignItems: 'center',
                justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(196,18,98,0.1)'
                  e.currentTarget.style.borderColor = '#c41262'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(22,25,44,0.8)'
                  e.currentTarget.style.borderColor = 'rgba(196,18,98,0.4)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <FiX size={18} />
                Close Search
              </button>
              </div>
          )}
        </div>
      )}

      {/* Mobile Safety Tips Tab */}
      {activeTab === 'features' && (
        <div 
          style={{
            padding: '1.25rem 1rem', 
            maxWidth: '100%', 
            overflowX: 'hidden'
          }}
        >
          <h2 style={{
            fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
            fontWeight: '900',
            marginBottom: '1.25rem',
            color: '#ffffff',
            padding: '0 0.5rem'
          }}><FiShield style={{display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle'}} /> Safety Tips</h2>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
            {[
              {
                icon: <FiCheckCircle />, 
                title: 'Verify Before You Pay', 
                desc: 'Always verify the recipient\'s number before sending money. Use GuardMoGo to check if a number has been reported for fraud.', 
                color: '#1ab1ce',
                details: 'Before making any Mobile Money transfer, take a moment to verify the recipient\'s number. Scammers often use numbers that look legitimate but are actually fraudulent.',
                examples: [
                  'Scenario: Someone calls claiming to be a friend in need of urgent money. They give you a number to send to. ALWAYS call that friend directly on their known number to verify before sending.',
                  'Scenario: You receive a message from what appears to be a legitimate business asking for payment. Use GuardMoGo to check if that number has been reported before sending any money.',
                  'Scenario: A seller on social media asks you to send money to a different number than initially discussed. This is a red flag - verify the new number first.'
                ]
              },
              {
                icon: <FiLock />, 
                title: 'Keep Your PIN Private', 
                desc: 'Never share your MoMo PIN with anyone. No legitimate service will ask for your PIN via phone or message.', 
                color: '#4461ab',
                details: 'Your Mobile Money PIN is like the key to your bank account. Never, under any circumstances, should you share it with anyone, no matter how legitimate they claim to be.',
                examples: [
                  'Scenario: Someone calls claiming to be from MTN/AirtelTigo customer service and asks for your PIN to "verify your account" or "process a refund". This is ALWAYS a scam. Legitimate customer service never asks for your PIN.',
                  'Scenario: You receive a message saying "Your account has been suspended. Reply with your PIN to reactivate." This is a phishing attempt. Never share your PIN via message.',
                  'Scenario: A friend or family member asks for your PIN to "help you" make a transaction. Even if you trust them, never share your PIN. You can make the transaction yourself.'
                ]
              },
              {
                icon: <FiPhone />, 
                title: 'Beware of Unsolicited Calls', 
                desc: 'Be cautious of calls claiming to be from your network provider. Verify by calling the official customer service line.', 
                color: '#c41262',
                details: 'Scammers often impersonate customer service representatives from network providers. They use tactics to create urgency and pressure you into making quick decisions.',
                examples: [
                  'Scenario: You receive a call from "MTN" saying your SIM card will be deactivated in 2 hours unless you provide personal information. Hang up and call MTN\'s official customer service line (100) to verify.',
                  'Scenario: Someone calls claiming to offer a "special promotion" or "account upgrade" but needs your account details. Legitimate promotions never require immediate action over the phone.',
                  'Scenario: A caller says there\'s suspicious activity on your account and asks you to confirm your PIN or personal details. This is a scam. Hang up and call your provider directly.'
                ]
              },
              {
                icon: <FiDollarSign />, 
                title: 'Question Too-Good Deals', 
                desc: 'If a deal seems too good to be true, it probably is. Scammers often use fake promotions to steal money.', 
                color: '#1ab1ce',
                details: 'Scammers prey on people\'s desire for good deals. They create fake promotions, lottery wins, or "limited-time offers" to trick you into sending money or sharing personal information.',
                examples: [
                  'Scenario: You receive a message saying "Congratulations! You\'ve won ₵10,000! Send ₵100 to this number to claim your prize." This is a scam. Legitimate lotteries don\'t require upfront payments.',
                  'Scenario: A seller offers a brand new iPhone for half the market price if you pay via Mobile Money first. This is likely a scam. Legitimate sellers use secure payment methods.',
                  'Scenario: Someone offers you a "guaranteed investment" that doubles your money in a week. This is a classic scam. Real investments don\'t guarantee such returns.'
                ]
              },
              {
                icon: <FiXCircle />, 
                title: 'Never Share OTP Codes', 
                desc: 'One-Time Password (OTP) codes are for your use only. Never share them with anyone, even if they claim to be from your bank.', 
                color: '#4461ab',
                details: 'OTP (One-Time Password) codes are sent to your phone to verify transactions. These codes are meant ONLY for you to complete your own transactions. Sharing them gives scammers access to your account.',
                examples: [
                  'Scenario: Someone calls claiming to be from your bank and asks you to read out the OTP code you just received. This is a scam. Legitimate banks never ask for OTP codes.',
                  'Scenario: You receive a message asking you to share your OTP code to "verify your account" or "unlock a transaction". Never share OTP codes - they are for your transactions only.',
                  'Scenario: A seller asks for an OTP code to "verify your payment". This is a red flag. OTP codes are for your own security, not for sharing with others.'
                ]
              },
              {
                icon: <FiPhone />, 
                title: 'Check Before Responding', 
                desc: 'Before responding to urgent payment requests, verify the sender\'s identity. Use GuardMoGo to check if the number is flagged.', 
                color: '#c41262',
                details: 'Urgency is a common tactic used by scammers. They create fake emergencies or time-sensitive situations to pressure you into acting quickly without thinking. Always take time to verify.',
                examples: [
                  'Scenario: You receive an urgent message from a number claiming to be a family member asking for emergency money. Call that family member directly on their known number to verify before sending anything.',
                  'Scenario: Someone texts you claiming to be a business partner and urgently needs money for a "business deal". Verify the identity by calling them directly or checking the number on GuardMoGo.',
                  'Scenario: A message says "Your account will be closed in 1 hour if you don\'t respond immediately." Legitimate businesses give proper notice and don\'t use such urgent threats.'
                ]
              },
              {
                icon: <FiAlertTriangle />, 
                title: 'Report Suspicious Activity', 
                desc: 'If you encounter a suspicious number or transaction, report it immediately on GuardMoGo to protect others.', 
                color: '#1ab1ce',
                details: 'Reporting suspicious numbers helps protect the entire community. When you report a fraudulent number, you\'re helping others avoid falling victim to the same scam.',
                examples: [
                  'Scenario: You receive a suspicious call or message asking for money or personal information. Report the number on GuardMoGo immediately, even if you didn\'t fall for it.',
                  'Scenario: You notice a fake social media account or advertisement promoting a suspicious Mobile Money scheme. Report it to help others avoid being scammed.',
                  'Scenario: You successfully identify a scam attempt. Take a moment to report it on GuardMoGo - your report could save someone else from losing money.'
                ]
              },
              {
                icon: <FiSearch />, 
                title: 'Double-Check Transaction Details', 
                desc: 'Always verify the recipient\'s name and number before confirming any transaction. Scammers often use similar names.', 
                color: '#4461ab',
                details: 'Before confirming any Mobile Money transaction, carefully review all details. Scammers use tricks like similar names or numbers to trick you into sending money to the wrong person.',
                examples: [
                  'Scenario: You\'re sending money to "John Mensah" but the number shows "John Mensa" (missing the h). This could be a typo or a scam. Verify the correct spelling and number.',
                  'Scenario: A seller gives you a number that\'s one digit different from their previous number. Always verify why the number changed before sending payment.',
                  'Scenario: You receive a payment request from someone with a name very similar to a trusted contact. Double-check by calling that contact directly to verify.'
                ]
              },
              {
                icon: <FiAlertCircle />, 
                title: 'Avoid Clicking Suspicious Links', 
                desc: 'Don\'t click links in unsolicited messages. Always navigate to official websites directly from your browser.', 
                color: '#c41262',
                details: 'Phishing links are designed to steal your personal information or install malware on your device. Scammers create fake websites that look legitimate to trick you into entering your details.',
                examples: [
                  'Scenario: You receive a message with a link claiming to be from your bank asking you to "verify your account". Don\'t click it. Instead, open your browser and go directly to your bank\'s official website.',
                  'Scenario: A message says "Click here to claim your prize" or "Click here to verify your payment". These are likely phishing attempts. Never click links from unsolicited messages.',
                  'Scenario: Someone sends you a link to "check your account balance" or "update your details". Always type the official website address yourself rather than clicking links.'
                ]
              },
              {
                icon: <FiShield />, 
                title: 'Enable Transaction Notifications', 
                desc: 'Turn on SMS and app notifications for all Mobile Money transactions to monitor your account activity.', 
                color: '#1ab1ce',
                details: 'Transaction notifications help you immediately detect any unauthorized activity on your Mobile Money account. If you receive a notification for a transaction you didn\'t make, you can act quickly.',
                examples: [
                  'Scenario: You receive a transaction notification for a payment you didn\'t authorize. Immediately contact your network provider and report the unauthorized transaction.',
                  'Scenario: You notice you\'re not receiving notifications for transactions you make. Check your notification settings and ensure they\'re enabled for all transaction types.',
                  'Scenario: You receive a notification for a small "test" transaction you didn\'t make. This could be a scammer testing your account. Report it immediately.'
                ]
              },
              {
                icon: <FiClock />, 
                title: 'Don\'t Rush Under Pressure', 
                desc: 'Scammers create urgency to prevent you from thinking clearly. Take your time to verify before acting.', 
                color: '#4461ab',
                details: 'One of the most common scam tactics is creating a false sense of urgency. Scammers want you to act quickly without thinking. Legitimate businesses and people will give you time to verify.',
                examples: [
                  'Scenario: Someone calls saying "You must send money within 10 minutes or your account will be closed." This is a scam. Legitimate businesses give proper notice and don\'t use such threats.',
                  'Scenario: A message says "Limited time offer - act now or miss out!" While legitimate sales exist, be extra cautious with urgent payment requests, especially from unknown numbers.',
                  'Scenario: You\'re told "This is your last chance" or "Only 5 minutes left" to complete a transaction. Take a step back, verify the sender, and don\'t let pressure rush your decision.'
                ]
              },
              {
                icon: <FiPhone />, 
                title: 'Verify Official Contact Numbers', 
                desc: 'Always verify contact numbers from official sources. Scammers often use numbers that look similar to legitimate ones.', 
                color: '#c41262',
                details: 'Scammers create fake customer service numbers or use numbers that look similar to legitimate ones. Always get contact information from official websites or documents, not from unsolicited messages.',
                examples: [
                  'Scenario: You receive a call from a number claiming to be customer service. Before sharing any information, hang up and call the official customer service number (like MTN\'s 100 or AirtelTigo\'s 111) to verify.',
                  'Scenario: A message provides a "customer service" number to call. Don\'t use it. Instead, find the official number from the company\'s official website or your SIM card packaging.',
                  'Scenario: Someone gives you a number that\'s "the new customer service line" because the old one isn\'t working. Always verify through official channels before trusting new numbers.'
                ]
              },
              {
                icon: <FiMessageCircle />, 
                title: 'Be Wary of Social Media Requests', 
                desc: 'Scammers often create fake social media accounts to request money. Verify identity before sending money to social media contacts.', 
                color: '#1ab1ce',
                details: 'Social media platforms are common grounds for scammers. They create fake accounts, hack existing accounts, or use social engineering to trick you into sending money.',
                examples: [
                  'Scenario: You receive a message on social media from someone claiming to be a friend asking for urgent money. Call that friend directly on their known phone number to verify before sending anything.',
                  'Scenario: A social media account offers you a "business opportunity" that requires upfront payment via Mobile Money. Research the business and verify its legitimacy before investing.',
                  'Scenario: Someone on social media asks you to send money to a "different number" because their "usual number isn\'t working." Always verify through a separate communication channel.'
                ]
              },
              {
                icon: <FiKey />, 
                title: 'Use Strong Security Measures', 
                desc: 'Enable biometric authentication, use strong PINs, and never save your PIN in easily accessible places.', 
                color: '#4461ab',
                details: 'Protecting your Mobile Money account starts with strong security practices. Use all available security features to protect your account from unauthorized access.',
                examples: [
                  'Scenario: Your Mobile Money app offers fingerprint or face recognition. Enable these features as they provide an extra layer of security beyond just a PIN.',
                  'Scenario: You\'re tempted to write down your PIN because it\'s hard to remember. Instead, use a PIN that\'s memorable to you but not easily guessable (avoid birthdays, phone numbers, etc.).',
                  'Scenario: You share your phone with family members. Make sure your Mobile Money app is locked or requires authentication so others can\'t access your account.'
                ]
              },
              {
                icon: <FiCreditCard />, 
                title: 'Monitor Your Account Regularly', 
                desc: 'Check your Mobile Money account balance and transaction history regularly to spot any unauthorized activity early.', 
                color: '#c41262',
                details: 'Regular monitoring helps you catch fraudulent transactions quickly. Review your account daily or weekly to ensure all transactions are legitimate.',
                examples: [
                  'Scenario: You notice a small withdrawal you don\'t remember making. This could be a scammer testing your account. Contact your provider immediately.',
                  'Scenario: Your account balance is lower than expected. Check your transaction history to identify any unauthorized transfers.',
                  'Scenario: You see multiple failed transaction attempts. This might indicate someone is trying to access your account. Change your PIN immediately.'
                ]
              },
              {
                icon: <FiMail />, 
                title: 'Verify Email and SMS Communications', 
                desc: 'Be cautious of emails or SMS messages claiming to be from your provider. Verify through official channels.', 
                color: '#1ab1ce',
                details: 'Scammers send fake emails and SMS messages that look like they\'re from legitimate sources. Always verify communications through official channels.',
                examples: [
                  'Scenario: You receive an email "from MTN" asking you to verify your account by clicking a link. Don\'t click it. Instead, log into your account through the official app or website.',
                  'Scenario: An SMS says your account will be suspended and provides a link to fix it. This is likely a phishing attempt. Contact customer service directly.',
                  'Scenario: A message claims you\'ve won a prize and asks for your account details. Legitimate providers never ask for account details via email or SMS.'
                ]
              },
              {
                icon: <FiBell />, 
                title: 'Set Up Account Alerts', 
                desc: 'Configure alerts for all transactions, balance changes, and account activities to stay informed about your account status.', 
                color: '#4461ab',
                details: 'Account alerts notify you immediately of any activity on your Mobile Money account. This helps you detect unauthorized transactions quickly.',
                examples: [
                  'Scenario: You receive an alert for a transaction you didn\'t make. Immediately contact your provider and report the unauthorized activity.',
                  'Scenario: You get an alert about a balance change you weren\'t expecting. Check your transaction history to verify the change.',
                  'Scenario: Alerts help you track all account activity, making it easier to spot suspicious patterns or unauthorized access attempts.'
                ]
              },
              {
                icon: <FiRefreshCw />, 
                title: 'Change Your PIN Regularly', 
                desc: 'Update your Mobile Money PIN periodically to reduce the risk of unauthorized access if your PIN is compromised.', 
                color: '#c41262',
                details: 'Regularly changing your PIN adds an extra layer of security. If someone learns your PIN, changing it will prevent them from accessing your account.',
                examples: [
                  'Scenario: You suspect someone might know your PIN. Change it immediately through your Mobile Money app or by dialing the official USSD code.',
                  'Scenario: You haven\'t changed your PIN in over a year. Consider updating it every 3-6 months for better security.',
                  'Scenario: After sharing your phone with someone temporarily, change your PIN as a precautionary measure.'
                ]
              },
              {
                icon: <FiGlobe />, 
                title: 'Be Cautious with Public Wi-Fi', 
                desc: 'Avoid accessing your Mobile Money account on public Wi-Fi networks. Use your mobile data or a secure connection instead.', 
                color: '#1ab1ce',
                details: 'Public Wi-Fi networks are often unsecured and can be used by hackers to intercept your data. Always use secure connections when accessing financial accounts.',
                examples: [
                  'Scenario: You\'re at a café and want to check your Mobile Money balance. Use your mobile data instead of the café\'s Wi-Fi to protect your information.',
                  'Scenario: You need to make a Mobile Money transaction while using public Wi-Fi. Wait until you\'re on a secure network or use your mobile data.',
                  'Scenario: If you must use public Wi-Fi, use a VPN to encrypt your connection and protect your account information.'
                ]
              },
              {
                icon: <FiAward />, 
                title: 'Use Official Apps Only', 
                desc: 'Only download Mobile Money apps from official app stores or your network provider\'s website. Avoid third-party apps.', 
                color: '#4461ab',
                details: 'Fake apps can steal your login credentials and personal information. Always use official apps from trusted sources.',
                examples: [
                  'Scenario: You see a "cheaper" Mobile Money app in an unofficial app store. Don\'t download it. Only use apps from Google Play Store, Apple App Store, or your provider\'s official website.',
                  'Scenario: Someone recommends a "better" Mobile Money app they found online. Verify it\'s the official app before downloading.',
                  'Scenario: You receive a link to download a Mobile Money app via email or SMS. Go directly to the official app store instead of clicking the link.'
                ]
              },
              {
                icon: <FiAlertTriangle />, 
                title: 'Recognize Common Scam Patterns', 
                desc: 'Learn to identify common scam tactics like fake job offers, romance scams, and fake emergency requests.', 
                color: '#c41262',
                details: 'Scammers use predictable patterns. Understanding these patterns helps you recognize scams before falling victim.',
                examples: [
                  'Scenario: Someone offers you a "work from home" job that requires you to pay a "registration fee" via Mobile Money. This is a scam. Legitimate jobs don\'t require upfront payments.',
                  'Scenario: Someone you met online asks you to send money for an "emergency" before you\'ve met in person. This is likely a romance scam.',
                  'Scenario: A "government official" calls asking for money to process a "benefit" or "refund". Government services don\'t require upfront payments via Mobile Money.'
                ]
              },
              {
                icon: <FiShield />, 
                title: 'Keep Your Phone Secure', 
                desc: 'Use a strong password or PIN to lock your phone. Enable remote tracking in case your phone is lost or stolen.', 
                color: '#1ab1ce',
                details: 'Protecting your phone is the first line of defense for your Mobile Money account. A stolen or unlocked phone gives scammers easy access.',
                examples: [
                  'Scenario: Your phone doesn\'t have a lock screen. Anyone who picks it up can access your Mobile Money app. Set up a PIN, password, or biometric lock immediately.',
                  'Scenario: You lose your phone. If you have remote tracking enabled, you can locate it or remotely wipe your data to protect your accounts.',
                  'Scenario: Someone borrows your phone briefly. Make sure your Mobile Money app requires additional authentication (like a PIN) even if your phone is unlocked.'
                ]
              },
              {
                icon: <FiCheckCircle />, 
                title: 'Verify Business Legitimacy', 
                desc: 'Before sending money to a business or service, verify their legitimacy through official channels and reviews.', 
                color: '#4461ab',
                details: 'Many scammers pose as legitimate businesses. Always verify a business exists and is legitimate before making payments.',
                examples: [
                  'Scenario: A business asks you to pay via Mobile Money before receiving goods or services. Research the business online, check reviews, and verify their contact information.',
                  'Scenario: Someone claims to be from a well-known company but uses a different payment number. Contact the company directly through their official website to verify.',
                  'Scenario: A "business" only accepts Mobile Money and refuses other payment methods. This is suspicious. Legitimate businesses usually offer multiple payment options.'
                ]
              },
              {
                icon: <FiUser />, 
                title: 'Never Share Your PIN with Anyone', 
                desc: 'Your Mobile Money PIN is private. Never share it with anyone, including family members, friends, or people claiming to be customer service.', 
                color: '#c41262',
                details: 'Your PIN is the key to your Mobile Money account. Sharing it with anyone, even trusted individuals, puts your account at risk. Legitimate customer service representatives will never ask for your PIN.',
                examples: [
                  'Scenario: Someone calls claiming to be from customer service and asks for your PIN to "verify your account" or "fix a problem". This is a scam. Hang up immediately.',
                  'Scenario: A family member asks for your PIN to "help you with a transaction". Never share your PIN. Instead, you can make the transaction yourself or be present when they help.',
                  'Scenario: You receive a message asking you to send your PIN to "activate a new feature". This is fraudulent. Your provider never needs your PIN for any service.'
                ]
              },
              {
                icon: <FiFileText />, 
                title: 'Keep Transaction Receipts', 
                desc: 'Save transaction receipts and confirmation messages. They serve as proof of payment and help resolve disputes.', 
                color: '#1ab1ce',
                details: 'Transaction receipts are important records that can help you track your spending, prove payments, and resolve disputes with merchants or service providers.',
                examples: [
                  'Scenario: You pay for goods but the seller claims they didn\'t receive payment. Your transaction receipt serves as proof that you completed the payment.',
                  'Scenario: You need to track your spending for budgeting purposes. Keeping receipts helps you review all your Mobile Money transactions.',
                  'Scenario: A merchant disputes a payment you made. Your transaction receipt with the reference number helps customer service resolve the issue quickly.'
                ]
              },
              {
                icon: <FiAlertCircle />, 
                title: 'Be Cautious with Investment Opportunities', 
                desc: 'Be skeptical of investment opportunities that promise high returns with little risk. Legitimate investments don\'t guarantee quick profits.', 
                color: '#4461ab',
                details: 'Investment scams are common in the Mobile Money space. Scammers promise unrealistic returns to trick you into sending money. Real investments carry risk and don\'t guarantee profits.',
                examples: [
                  'Scenario: Someone offers you an "investment opportunity" that promises to double your money in one month. This is almost certainly a scam. Real investments don\'t guarantee such returns.',
                  'Scenario: An "investment advisor" asks you to send money via Mobile Money to "join an exclusive investment program". Legitimate investment advisors use regulated platforms, not direct Mobile Money transfers.',
                  'Scenario: You\'re promised "guaranteed returns" on an investment. No legitimate investment can guarantee returns. Be very skeptical of such claims.'
                ]
              },
              {
                icon: <FiCheck />, 
                title: 'Verify Identity Before Large Transactions', 
                desc: 'For significant amounts, always verify the recipient\'s identity through multiple channels before sending money.', 
                color: '#c41262',
                details: 'Large transactions require extra caution. Always verify the recipient\'s identity through multiple methods before sending significant amounts of money.',
                examples: [
                  'Scenario: You need to send a large payment to a new business partner. Call them directly, verify their business registration, and confirm the payment details before sending.',
                  'Scenario: Someone asks you to send a large amount for a "business deal". Verify their identity, check their business credentials, and get everything in writing before proceeding.',
                  'Scenario: A family member requests a large emergency payment from a new number. Call them on their known number to verify the request is legitimate before sending.'
                ]
              },
              {
                icon: <FiDatabase />, 
                title: 'Don\'t Store Payment Info Insecurely', 
                desc: 'Avoid saving payment details, PINs, or account information in unsecured notes, messages, or cloud storage.', 
                color: '#1ab1ce',
                details: 'Storing sensitive payment information insecurely makes it vulnerable to theft. If your device is compromised, scammers can access this information.',
                examples: [
                  'Scenario: You save your Mobile Money PIN in a notes app on your phone. If your phone is lost or hacked, scammers can access your PIN. Instead, memorize it or use a secure password manager.',
                  'Scenario: You send yourself payment details via email or messaging apps. These can be intercepted. Only share sensitive information through secure, encrypted channels when necessary.',
                  'Scenario: You store account numbers in a public cloud storage folder. Use secure, encrypted storage or better yet, memorize important account information.'
                ]
              },
              {
                icon: <FiCalendar />, 
                title: 'Be Wary of Refund Scams', 
                desc: 'Scammers often claim you\'re owed a refund and ask for your account details or a "processing fee". Legitimate refunds don\'t require upfront payments.', 
                color: '#4461ab',
                details: 'Refund scams are common. Scammers claim you\'re eligible for a refund and then ask for your account details or a "processing fee" to release the refund. Legitimate refunds are processed automatically.',
                examples: [
                  'Scenario: You receive a call claiming you\'re owed a refund and need to pay a "processing fee" to receive it. This is a scam. Legitimate refunds don\'t require upfront payments.',
                  'Scenario: A message says you\'ve been "overcharged" and asks for your account details to process a refund. Don\'t share your details. Contact the business directly through official channels.',
                  'Scenario: Someone claims to be processing a refund but needs you to "verify your account" by sending money first. This is fraudulent. Real refunds are credited directly to your account.'
                ]
              },
              {
                icon: <FiShield />, 
                title: 'Use Two-Factor Authentication When Available', 
                desc: 'Enable two-factor authentication (2FA) on your Mobile Money app if the feature is available. It adds an extra layer of security.', 
                color: '#1ab1ce',
                details: 'Two-factor authentication requires a second verification step (like a code sent to your phone) in addition to your PIN. This makes it much harder for scammers to access your account.',
                examples: [
                  'Scenario: Your Mobile Money app offers two-factor authentication. Enable it so that even if someone learns your PIN, they still need access to your phone to complete transactions.',
                  'Scenario: You receive a prompt to enable 2FA after logging in. Take the time to set it up - the extra security is worth the small inconvenience.',
                  'Scenario: Someone tries to access your account but can\'t complete the transaction because 2FA requires a code from your phone. This extra layer protects your account.'
                ]
              },
              {
                icon: <FiXCircle />, 
                title: 'Don\'t Trust Caller ID Alone', 
                desc: 'Scammers can spoof phone numbers to make calls appear to come from legitimate sources. Always verify by calling back on official numbers.', 
                color: '#c41262',
                details: 'Caller ID spoofing allows scammers to make their calls appear to come from legitimate businesses or government agencies. Never trust caller ID alone - always verify by calling back on official numbers.',
                examples: [
                  'Scenario: You receive a call that appears to be from your bank asking for account information. Don\'t trust the caller ID. Hang up and call your bank\'s official customer service number to verify.',
                  'Scenario: A call appears to be from a government agency asking for payment. Scammers often spoof government numbers. Verify by calling the official agency number yourself.',
                  'Scenario: Someone calls claiming to be from customer service, and the number looks legitimate. Still, hang up and call the official customer service number to confirm the call was legitimate.'
                ]
              },
              {
                icon: <FiDollarSign />, 
                title: 'Be Careful with QR Code Payments', 
                desc: 'Only scan QR codes from trusted sources. Scammers can create malicious QR codes that redirect to fake payment pages.', 
                color: '#4461ab',
                details: 'QR codes make payments convenient, but they can also be used by scammers. Always verify the source of a QR code before scanning it, and double-check the payment details before confirming.',
                examples: [
                  'Scenario: A stranger asks you to scan a QR code to receive payment. Verify the source and check the payment details carefully before confirming.',
                  'Scenario: You see a QR code posted in a public place for "quick payments". Only scan QR codes from trusted, official sources like verified businesses.',
                  'Scenario: A QR code redirects you to a payment page that looks different from your usual Mobile Money interface. This could be a fake page. Close it and use your official app instead.'
                ]
              },
              {
                icon: <FiMail />, 
                title: 'Verify Before Sending Money to "Family" in Emergencies', 
                desc: 'Scammers often impersonate family members in "emergency" situations. Always verify by calling the person directly on their known number.', 
                color: '#c41262',
                details: 'Emergency scams are common - scammers claim to be family members in urgent need of money. The urgency makes people act quickly without verifying. Always take time to verify the request.',
                examples: [
                  'Scenario: You receive a message from a number claiming to be your child asking for emergency money. Call your child directly on their known number to verify before sending anything.',
                  'Scenario: Someone texts claiming to be a family member in an accident and urgently needs money. Don\'t send money immediately - call that family member directly to confirm.',
                  'Scenario: A message says "This is [family member], I lost my phone, please send money to this new number." Always verify by calling the family member on their known number first.'
                ]
              },
              {
                icon: <FiAlertTriangle />, 
                title: 'Check for Spelling and Grammar Errors', 
                desc: 'Official messages from legitimate companies are usually well-written. Multiple spelling or grammar errors can indicate a scam.', 
                color: '#1ab1ce',
                details: 'While not foolproof, many scam messages contain spelling and grammar errors. Legitimate businesses typically send well-written, professional messages. Use this as one indicator, but don\'t rely on it alone.',
                examples: [
                  'Scenario: You receive a message with multiple spelling errors claiming to be from your bank. Legitimate banks send professional, error-free messages. This is likely a scam.',
                  'Scenario: A message has poor grammar and informal language but claims to be from an official source. Professional companies use proper grammar and formal language.',
                  'Scenario: An "official" message uses all caps, excessive exclamation marks, or unusual formatting. Legitimate businesses use professional formatting.'
                ]
              },
              {
                icon: <FiKey />, 
                title: 'Log Out After Using Shared Devices', 
                desc: 'If you access your Mobile Money account on a shared or public device, always log out completely when finished.', 
                color: '#4461ab',
                details: 'Shared devices can be accessed by others. Always log out completely from your Mobile Money app or account when using shared computers, tablets, or phones.',
                examples: [
                  'Scenario: You check your Mobile Money balance on a friend\'s phone. Make sure to log out completely before returning the device to prevent unauthorized access.',
                  'Scenario: You use a public computer to access your account. Always log out and clear browser history to protect your account information.',
                  'Scenario: You temporarily use someone else\'s device. Set a reminder to log out, or better yet, avoid accessing your Mobile Money account on devices you don\'t own.'
                ]
              },
              {
                icon: <FiCreditCard />, 
                title: 'Protect Your Bank Account Information', 
                desc: 'Never share your bank account number, card details, or online banking credentials with anyone. Banks never ask for this information via phone or email.', 
                color: '#c41262',
                details: 'Your bank account information is highly sensitive. Scammers use various tactics to obtain this information, which they can then use to drain your accounts. Legitimate banks have strict policies about never asking for this information.',
                examples: [
                  'Scenario: Someone calls claiming to be from your bank and asks for your account number to "verify your identity". Hang up immediately - banks never ask for this over the phone.',
                  'Scenario: An email asks you to "update your banking details" by clicking a link and entering your account information. This is a phishing attempt. Contact your bank directly instead.',
                  'Scenario: A website asks for your full card number, CVV, and PIN to "process a payment". Only enter card details on secure, verified payment gateways of trusted merchants.'
                ]
              },
              {
                icon: <FiShield />, 
                title: 'Monitor All Financial Accounts Regularly', 
                desc: 'Check all your financial accounts (bank, credit cards, Mobile Money) regularly to spot unauthorized transactions early.', 
                color: '#1ab1ce',
                details: 'Regular monitoring of all your financial accounts helps you detect fraud quickly. The sooner you notice unauthorized activity, the faster you can report it and minimize losses.',
                examples: [
                  'Scenario: You check your bank statement and notice a small transaction you don\'t recognize. Report it immediately - scammers often test with small amounts before making larger withdrawals.',
                  'Scenario: You review your credit card statement and see charges from merchants you\'ve never used. Contact your credit card company immediately to dispute the charges.',
                  'Scenario: You notice your account balance is lower than expected. Review all recent transactions across all your accounts to identify any unauthorized activity.'
                ]
              },
              {
                icon: <FiLock />, 
                title: 'Use Strong, Unique Passwords for Financial Accounts', 
                desc: 'Create strong, unique passwords for each financial account. Use a password manager to keep track of them securely.', 
                color: '#4461ab',
                details: 'Weak or reused passwords make it easy for scammers to access your accounts. Each financial account should have a unique, strong password that you don\'t use elsewhere.',
                examples: [
                  'Scenario: You use the same password for your bank account and email. If one is compromised, both are at risk. Use unique passwords for each account.',
                  'Scenario: Your password is easy to guess (like "password123" or your birthday). Use a combination of letters, numbers, and symbols that\'s hard to guess.',
                  'Scenario: You write down all your passwords in a notebook. Instead, use a reputable password manager that encrypts your passwords securely.'
                ]
              },
              {
                icon: <FiUser />, 
                title: 'Protect Your Personal Information', 
                desc: 'Be cautious about sharing personal information like your date of birth, ID number, or address. Scammers use this for identity theft.', 
                color: '#c41262',
                details: 'Identity theft occurs when scammers use your personal information to open accounts, make purchases, or commit fraud in your name. Only share personal information when absolutely necessary and with trusted entities.',
                examples: [
                  'Scenario: Someone asks for your date of birth and ID number to "verify your identity" for a prize. Legitimate organizations rarely need this information upfront - be very cautious.',
                  'Scenario: A website asks for your full address, ID number, and date of birth just to sign up for a newsletter. This is excessive - only provide what\'s necessary.',
                  'Scenario: You receive a call asking you to "confirm your personal details" for security. Don\'t provide this information - instead, ask for their name and call the organization back on their official number.'
                ]
              },
              {
                icon: <FiAlertTriangle />, 
                title: 'Be Skeptical of Unsolicited Financial Offers', 
                desc: 'If you didn\'t request it, be very cautious. Legitimate financial institutions don\'t typically make unsolicited offers via phone, email, or text.', 
                color: '#1ab1ce',
                details: 'Scammers often contact people out of the blue with "amazing" financial offers. Legitimate financial institutions rarely make unsolicited offers, especially via phone or text message.',
                examples: [
                  'Scenario: You receive a call offering you a "pre-approved loan" with "no credit check required". This is likely a scam. Legitimate lenders always check credit and don\'t make unsolicited loan offers.',
                  'Scenario: A text message says you\'ve been "selected" for a special credit card offer. Delete it - legitimate credit card companies don\'t send unsolicited offers via text.',
                  'Scenario: Someone emails you about an "investment opportunity" you didn\'t request. Be very skeptical - legitimate investment opportunities don\'t come through unsolicited emails.'
                ]
              },
              {
                icon: <FiFileText />, 
                title: 'Review Financial Statements Carefully', 
                desc: 'Read all bank statements, credit card statements, and financial documents carefully. Look for any unauthorized transactions or suspicious activity.', 
                color: '#4461ab',
                details: 'Financial statements contain important information about your account activity. Reviewing them carefully helps you catch unauthorized transactions, errors, or signs of fraud early.',
                examples: [
                  'Scenario: You receive your monthly bank statement and notice a small charge you don\'t recognize. Even if it\'s small, investigate it - it could be a test transaction before a larger fraud.',
                  'Scenario: Your credit card statement shows a subscription you don\'t remember signing up for. Contact the merchant and your credit card company to dispute the charge.',
                  'Scenario: You notice your account has been charged multiple times for the same transaction. This could be an error or fraud - report it immediately.'
                ]
              },
              {
                icon: <FiTrendingUp />, 
                title: 'Educate Yourself About Common Scams', 
                desc: 'Stay informed about current scam tactics. Scammers constantly evolve their methods, so ongoing education is key to protection.', 
                color: '#1ab1ce',
                details: 'Financial scams evolve constantly. Staying informed about current scam tactics helps you recognize and avoid them. Follow trusted financial news sources and security advisories.',
                examples: [
                  'Scenario: You read about a new type of investment scam in the news. This knowledge helps you recognize and avoid similar scams when you encounter them.',
                  'Scenario: Your bank sends out a security alert about a new phishing technique. Read it carefully - this information could protect you from falling victim.',
                  'Scenario: You attend a financial literacy workshop and learn about common fraud tactics. This education helps you make better financial decisions and avoid scams.'
                ]
              },
              {
                icon: <FiCheckCircle />, 
                title: 'Verify Before You Trust', 
                desc: 'Always verify the identity of anyone asking for money or personal information. When in doubt, contact the organization directly using official contact information.', 
                color: '#c41262',
                details: 'Verification is your best defense against fraud. Never trust unsolicited requests for money or information. Always verify by contacting the organization directly through official channels.',
                examples: [
                  'Scenario: You receive a call claiming to be from your bank asking you to transfer money. Hang up and call your bank\'s official customer service number to verify the request.',
                  'Scenario: An email claims to be from a government agency asking for payment. Don\'t trust it - contact the agency directly through their official website or phone number.',
                  'Scenario: Someone claiming to be a business partner asks for payment to a new account. Verify the request by calling them directly on their known number before sending money.'
                ]
              },
              {
                icon: <FiEye />, 
                title: 'Keep Your Financial Information Private', 
                desc: 'Don\'t discuss your financial situation, account balances, or investment details in public or on social media. Scammers use this information to target you.', 
                color: '#4461ab',
                details: 'Sharing financial information publicly makes you a target for scammers. They use this information to craft personalized scams or identify high-value targets.',
                examples: [
                  'Scenario: You post on social media about receiving a large payment or bonus. Scammers see this and may target you with investment scams or fake opportunities.',
                  'Scenario: You discuss your account balance or financial situation in a public place. Someone nearby could overhear and use this information to target you.',
                  'Scenario: You share details about your investments or financial plans online. Keep this information private to avoid becoming a target for financial scams.'
                ]
              },
              {
                icon: <FiShield />, 
                title: 'Report Suspicious Activity Immediately', 
                desc: 'If you suspect fraud or notice unauthorized activity, report it to your financial institution immediately. Quick action can minimize losses.', 
                color: '#1ab1ce',
                details: 'Time is critical when dealing with financial fraud. The sooner you report suspicious activity, the faster your financial institution can take action to protect your accounts and potentially recover lost funds.',
                examples: [
                  'Scenario: You notice an unauthorized transaction on your account. Call your bank immediately - many banks have fraud protection that can reverse transactions if reported quickly.',
                  'Scenario: You receive a suspicious call asking for financial information. Report it to your bank and the relevant authorities - your report could help prevent others from being scammed.',
                  'Scenario: You suspect your account has been compromised. Contact your financial institution immediately to freeze your account and prevent further unauthorized access.'
                ]
              }
            ].map((tip, idx) => (
              <div 
                key={idx} 
                onClick={() => setExpandedTip(expandedTip === idx ? null : idx)}
                style={{
                background: 'rgba(22,25,44,0.8)',
                  border: `2px solid ${tip.color}40`,
                borderRadius: '1rem',
                padding: '1.25rem',
                backdropFilter: 'blur(10px)',
                width: '100%',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tip.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${tip.color}40`
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  display: 'flex', 
                  gap: '0.875rem',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '45px',
                    height: '45px',
                    background: `linear-gradient(135deg, ${tip.color} 0%, ${tip.color}dd 100%)`,
                    borderRadius: '0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    lineHeight: '1',
                    color: '#ffffff'
                  }}>{tip.icon}</div>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      color: '#ffffff', 
                      fontWeight: '800', 
                      fontSize: '1rem', 
                      lineHeight: '1.2',
                      margin: 0,
                        padding: 0
                      }}>{tip.title}</h3>
                      <span style={{
                        color: tip.color,
                        fontSize: '0.875rem',
                        transition: 'transform 0.3s ease',
                        transform: expandedTip === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}>▼</span>
                    </div>
                    <p style={{
                      color: '#9ca3af', 
                      fontSize: '0.8125rem', 
                      lineHeight: '1.5',
                      margin: 0,
                      padding: 0,
                      marginBottom: expandedTip === idx ? '0.75rem' : 0
                    }}>{tip.desc}</p>
                    
                    {/* Expanded Details */}
                    {expandedTip === idx && (
                      <div style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: `1px solid ${tip.color}30`
                      }}>
                        <p style={{
                          color: '#d1d5db',
                          fontSize: '0.8125rem',
                          lineHeight: '1.6',
                          marginBottom: '1rem'
                        }}>
                          {tip.details}
                        </p>
                        
                        <div style={{
                          marginTop: '1rem'
                        }}>
                          <div style={{
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '0.8125rem',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span>📋</span>
                            <span>Example Scenarios:</span>
                  </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}>
                            {tip.examples.map((example, exIdx) => (
                              <div
                                key={exIdx}
                                style={{
                                  background: 'rgba(68,97,171,0.1)',
                                  border: `1px solid ${tip.color}20`,
                                  borderRadius: '0.625rem',
                                  padding: '0.875rem',
                                  fontSize: '0.75rem',
                                  lineHeight: '1.6',
                                  color: '#d1d5db'
                                }}
                              >
                                <span style={{
                                  color: tip.color,
                                  fontWeight: '700',
                                  marginRight: '0.5rem'
                                }}>•</span>
                                {example}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div 
          style={{
            padding: '1.25rem 1rem', 
            maxWidth: '100%', 
            overflowX: 'hidden'
          }}
        >
          <h2 style={{
            fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
            fontWeight: '900',
            marginBottom: '1.25rem',
            color: '#ffffff',
            padding: '0 0.5rem'
          }}><FiBarChart2 style={{display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle'}} /> Fraud Dashboard</h2>

          {dashboardLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              color: '#9ca3af',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <LoadingSpinner size={40} color="#1ab1ce" />
              <div style={{fontSize: '0.875rem'}}>Loading dashboard data...</div>
            </div>
          ) : (
            <>
          {/* Stats Cards */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
            <div style={{
                  background: 'linear-gradient(135deg, rgba(26,177,206,0.15) 0%, rgba(68,97,171,0.15) 100%)',
                  border: '2px solid rgba(26,177,206,0.4)',
                  borderRadius: '1.25rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 4px 20px rgba(26,177,206,0.2), 0 0 0 1px rgba(26,177,206,0.1) inset',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,177,206,0.35), 0 0 0 1px rgba(26,177,206,0.2) inset'
                  e.currentTarget.style.borderColor = '#1ab1ce'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,177,206,0.2), 0 0 0 1px rgba(26,177,206,0.1) inset'
                  e.currentTarget.style.borderColor = 'rgba(26,177,206,0.4)'
                }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'radial-gradient(circle, rgba(26,177,206,0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: '-10px',
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(68,97,171,0.15) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  <div style={{position: 'relative', zIndex: 1, width: '100%', overflow: 'hidden'}}>
                    <div style={{
                      fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.5rem',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
              textAlign: 'center'
            }}>
                      {dashboardStats?.totalReports ? dashboardStats.totalReports.toLocaleString() : '0'}
            </div>
            <div style={{
                      color: '#9ca3af',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem'
                    }}>
                      <FiFileText style={{fontSize: '0.875rem'}} />
                      Total Reports
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(196,18,98,0.15) 0%, rgba(68,97,171,0.15) 100%)',
                  border: '2px solid rgba(196,18,98,0.4)',
                  borderRadius: '1.25rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 4px 20px rgba(196,18,98,0.2), 0 0 0 1px rgba(196,18,98,0.1) inset',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(196,18,98,0.35), 0 0 0 1px rgba(196,18,98,0.2) inset'
                  e.currentTarget.style.borderColor = '#c41262'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,18,98,0.2), 0 0 0 1px rgba(196,18,98,0.1) inset'
                  e.currentTarget.style.borderColor = 'rgba(196,18,98,0.4)'
                }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'radial-gradient(circle, rgba(196,18,98,0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: '-10px',
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(68,97,171,0.15) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  <div style={{position: 'relative', zIndex: 1, width: '100%', overflow: 'hidden'}}>
                    <div style={{
                      fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.5rem',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
              textAlign: 'center'
            }}>
                      {dashboardStats?.totalNumbers ? dashboardStats.totalNumbers.toLocaleString() : '0'}
                    </div>
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem'
                    }}>
                      <FiAlertTriangle style={{fontSize: '0.875rem'}} />
                      Flagged Numbers
                    </div>
                  </div>
            </div>
          </div>

              {/* Additional Stats */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
          <div style={{
                  background: 'linear-gradient(135deg, rgba(26,177,206,0.15) 0%, rgba(68,97,171,0.15) 100%)',
                  border: '2px solid rgba(26,177,206,0.4)',
                  borderRadius: '1.25rem',
            padding: '1.25rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 4px 20px rgba(26,177,206,0.2), 0 0 0 1px rgba(26,177,206,0.1) inset',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,177,206,0.35), 0 0 0 1px rgba(26,177,206,0.2) inset'
                  e.currentTarget.style.borderColor = '#1ab1ce'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,177,206,0.2), 0 0 0 1px rgba(26,177,206,0.1) inset'
                  e.currentTarget.style.borderColor = 'rgba(26,177,206,0.4)'
                }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '-15px',
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(26,177,206,0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  <div style={{position: 'relative', zIndex: 1, width: '100%', overflow: 'hidden'}}>
                    <div style={{
                      fontSize: 'clamp(1.125rem, 3.5vw, 1.75rem)',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.5rem',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      textAlign: 'center'
                    }}>
                      {dashboardStats?.activeReports ? dashboardStats.activeReports.toLocaleString() : '0'}
                    </div>
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem'
                    }}>
                      <FiCheckCircle style={{fontSize: '0.875rem'}} />
                      Active Reports
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(68,97,171,0.15) 0%, rgba(26,177,206,0.15) 100%)',
                  border: '2px solid rgba(68,97,171,0.4)',
                  borderRadius: '1.25rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 4px 20px rgba(68,97,171,0.2), 0 0 0 1px rgba(68,97,171,0.1) inset',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(68,97,171,0.35), 0 0 0 1px rgba(68,97,171,0.2) inset'
                  e.currentTarget.style.borderColor = '#4461ab'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(68,97,171,0.2), 0 0 0 1px rgba(68,97,171,0.1) inset'
                  e.currentTarget.style.borderColor = 'rgba(68,97,171,0.4)'
                }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '-15px',
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(68,97,171,0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  <div style={{position: 'relative', zIndex: 1, width: '100%', overflow: 'hidden'}}>
                    <div style={{
                        fontSize: 'clamp(1.125rem, 3.5vw, 1.75rem)',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #4461ab 0%, #1ab1ce 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.5rem',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      textAlign: 'center'
                    }}>
                      {topNumbers.length > 0 ? topNumbers.length.toLocaleString() : '0'}
                    </div>
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem'
                    }}>
                      <FiBarChart2 style={{fontSize: '0.875rem'}} />
                      Top Tracked
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Reported Numbers */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                border: '2px solid rgba(196,18,98,0.4)',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                backdropFilter: 'blur(20px)',
                marginBottom: '1.5rem',
            width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 25px rgba(196,18,98,0.2), 0 0 0 1px rgba(196,18,98,0.1) inset'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(196,18,98,0.15) 0%, transparent 70%)',
                  borderRadius: '50%'
                }} />
                <h3 style={{
                  color: '#ffffff',
                  fontWeight: '800',
                  marginBottom: '1.25rem',
                  fontSize: '1.125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(196,18,98,0.4)'
                  }}>
                    <FiAlertTriangle style={{color: '#ffffff', fontSize: '1.125rem'}} />
                  </div>
                  Top Reported Numbers
                </h3>
                {topNumbers.length > 0 ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.625rem'}}>
                    {topNumbers.map((item, idx) => {
                      const maxReports = topNumbers[0]?.reportsCount || 1
                      const barWidth = ((item.reportsCount || 0) / maxReports) * 100
                      return (
                        <div 
                          key={item.id || idx} 
                          onClick={() => handleSearchFromRecent(item.number || item.id)}
                          style={{
                            background: 'linear-gradient(135deg, rgba(68,97,171,0.12) 0%, rgba(196,18,98,0.08) 100%)',
                            borderRadius: '1rem',
                            padding: '1rem',
                            border: '2px solid rgba(68,97,171,0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 2px 10px rgba(68,97,171,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(68,97,171,0.25) 0%, rgba(196,18,98,0.15) 100%)'
                            e.currentTarget.style.borderColor = '#4461ab'
                            e.currentTarget.style.transform = 'translateX(4px) scale(1.02)'
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(68,97,171,0.25)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(68,97,171,0.12) 0%, rgba(196,18,98,0.08) 100%)'
                            e.currentTarget.style.borderColor = 'rgba(68,97,171,0.3)'
                            e.currentTarget.style.transform = 'translateX(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 2px 10px rgba(68,97,171,0.1)'
                          }}
                        >
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                            <span style={{color: '#ffffff', fontWeight: '700', fontSize: '0.875rem'}}>{item.number || item.id}</span>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    background: '#c41262',
                    borderRadius: '9999px',
                    color: 'white',
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                              whiteSpace: 'nowrap'
                            }}>
                              <span style={{
                                fontSize: 'clamp(0.625rem, 2vw, 0.6875rem)',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word'
                              }}>
                                {item.reportsCount || 0} report{item.reportsCount !== 1 ? 's' : ''}
                              </span>
                            </span>
                </div>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(196,18,98,0.2)',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #c41262 0%, #4461ab 100%)',
                              borderRadius: '9999px',
                              transition: 'width 0.3s ease'
                            }} />
            </div>
          </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    color: '#9ca3af',
                    fontSize: '0.875rem'
                  }}>
                    No reported numbers yet
                  </div>
                )}
              </div>

              {/* Activity Summary */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                border: '2px solid rgba(26,177,206,0.4)',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                backdropFilter: 'blur(20px)',
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 25px rgba(26,177,206,0.2), 0 0 0 1px rgba(26,177,206,0.1) inset'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  left: '-50px',
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(26,177,206,0.15) 0%, transparent 70%)',
                  borderRadius: '50%'
                }} />
                <h3 style={{
                  color: '#ffffff',
                  fontWeight: '800',
                  marginBottom: '1.25rem',
                  fontSize: '1.125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(26,177,206,0.4)'
                  }}>
                    <FiBarChart2 style={{color: '#ffffff', fontSize: '1.125rem'}} />
                  </div>
                  Activity Summary
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1}}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.875rem',
                    background: 'rgba(26,177,206,0.08)',
                    border: '1px solid rgba(26,177,206,0.2)',
                    borderRadius: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(26,177,206,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(26,177,206,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(26,177,206,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(26,177,206,0.2)'
                  }}
                  >
                    <span style={{
                      color: '#d1d5db',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FiBarChart2 style={{fontSize: '0.875rem', color: '#1ab1ce'}} />
                      Average Reports per Number
                    </span>
                    <span style={{
                      color: '#1ab1ce',
                      fontSize: '0.9375rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {dashboardStats?.totalNumbers > 0 
                        ? ((dashboardStats.totalReports / dashboardStats.totalNumbers) || 0).toFixed(1)
                        : '0.0'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.875rem',
                    background: 'rgba(68,97,171,0.08)',
                    border: '1px solid rgba(68,97,171,0.2)',
                    borderRadius: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(68,97,171,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(68,97,171,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(68,97,171,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(68,97,171,0.2)'
                  }}
                  >
                    <span style={{
                      color: '#d1d5db',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FiAlertTriangle style={{fontSize: '0.875rem', color: '#c41262'}} />
                      Most Reported Number
                    </span>
                    <span style={{
                      color: '#ffffff',
                      fontSize: '0.9375rem',
                      fontWeight: '800'
                    }}>
                      {topNumbers[0]?.number || topNumbers[0]?.id || 'N/A'}
                    </span>
                  </div>
                  {topNumbers[0] && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.875rem',
                      background: 'rgba(196,18,98,0.08)',
                      border: '1px solid rgba(196,18,98,0.2)',
                      borderRadius: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(196,18,98,0.15)'
                      e.currentTarget.style.borderColor = 'rgba(196,18,98,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(196,18,98,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(196,18,98,0.2)'
                    }}
                    >
                      <span style={{
                        color: '#d1d5db',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <FiFileText style={{fontSize: '0.875rem', color: '#c41262'}} />
                        Highest Report Count
                      </span>
                      <span style={{
                        color: '#c41262',
                        fontSize: 'clamp(0.8125rem, 2.5vw, 0.9375rem)',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                      }}>
                        {(topNumbers[0]?.reportsCount || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile Profile Tab */}
      {activeTab === 'profile' && (
        <div 
          style={{
            padding: '1.25rem 1rem', 
            maxWidth: '100%', 
            overflowX: 'hidden',
            position: 'relative'
          }}
        >
          {profileSection === 'main' && (
            <>
              {/* User Info Card */}
          <div style={{
            background: 'rgba(22,25,44,0.8)',
            border: '2px solid rgba(68,97,171,0.3)',
            borderRadius: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '1.25rem',
            backdropFilter: 'blur(10px)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                  fontSize: currentUser && (currentUser.displayName || currentUser.email) ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  textTransform: 'uppercase'
                }}>
                  {currentUser ? (
                    (() => {
                      // Prioritize userProfile firstName and lastName if available
                      let name = 'User'
                      if (userProfile?.firstName && userProfile?.lastName) {
                        name = `${userProfile.firstName} ${userProfile.lastName}`
                      } else if (userProfile?.displayName) {
                        name = userProfile.displayName
                      } else if (currentUser.displayName) {
                        name = currentUser.displayName
                      } else if (currentUser.email) {
                        name = currentUser.email.split('@')[0]
                      }
                      // Get initials from name (first letter of each word, max 2)
                      const initials = name.split(' ').slice(0, 2).map(word => word[0]?.toUpperCase() || '').join('') || name[0]?.toUpperCase() || 'U'
                      return initials
                    })()
                  ) : '👤'}
                </div>
                <h3 style={{color: '#ffffff', fontWeight: '800', marginBottom: '0.5rem', fontSize: '1.125rem'}}>
                  {currentUser ? (
                    userProfile?.firstName && userProfile?.lastName
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : userProfile?.displayName
                      ? userProfile.displayName
                      : (currentUser.displayName || currentUser.email?.split('@')[0] || 'User')
                  ) : 'Guest User'}
                </h3>
                <p style={{color: '#9ca3af', fontSize: '0.8125rem', marginBottom: '0.75rem'}}>
                  {currentUser ? currentUser.email : 'Sign in for full access'}
                </p>
                {currentUser && userRole && (
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: userRole === 'admin' ? 'rgba(196,18,98,0.2)' : 'rgba(68,97,171,0.2)',
                    border: `1px solid ${userRole === 'admin' ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.5)'}`,
                    borderRadius: '9999px',
                    color: userRole === 'admin' ? '#fca5a5' : '#1ab1ce',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {userRole}
                  </div>
                )}
          </div>

              {/* Stats Summary */}
              {currentUser && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(26,177,206,0.15) 0%, rgba(68,97,171,0.15) 100%)',
                    border: '2px solid rgba(26,177,206,0.4)',
                    borderRadius: '1.25rem',
                    padding: '1.25rem',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 20px rgba(26,177,206,0.2), 0 0 0 1px rgba(26,177,206,0.1) inset',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,177,206,0.35), 0 0 0 1px rgba(26,177,206,0.2) inset'
                    e.currentTarget.style.borderColor = '#1ab1ce'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,177,206,0.2), 0 0 0 1px rgba(26,177,206,0.1) inset'
                    e.currentTarget.style.borderColor = 'rgba(26,177,206,0.4)'
                  }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '80px',
                      height: '80px',
                      background: 'radial-gradient(circle, rgba(26,177,206,0.2) 0%, transparent 70%)',
                      borderRadius: '50%'
                    }} />
                    <div style={{position: 'relative', zIndex: 1, width: '100%', overflow: 'hidden'}}>
                      <div style={{
                        fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                        textAlign: 'center'
                      }}>
                        {userReports.length.toLocaleString()}
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem'
                      }}>
                        <FiFileText style={{fontSize: '0.875rem'}} />
                        My Reports
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(68,97,171,0.15) 0%, rgba(26,177,206,0.15) 100%)',
                    border: '2px solid rgba(68,97,171,0.4)',
                    borderRadius: '1.25rem',
                    padding: '1.25rem',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 20px rgba(68,97,171,0.2), 0 0 0 1px rgba(68,97,171,0.1) inset',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(68,97,171,0.35), 0 0 0 1px rgba(68,97,171,0.2) inset'
                    e.currentTarget.style.borderColor = '#4461ab'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(68,97,171,0.2), 0 0 0 1px rgba(68,97,171,0.1) inset'
                    e.currentTarget.style.borderColor = 'rgba(68,97,171,0.4)'
                  }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '80px',
                      height: '80px',
                      background: 'radial-gradient(circle, rgba(68,97,171,0.2) 0%, transparent 70%)',
                      borderRadius: '50%'
                    }} />
                    <div style={{position: 'relative', zIndex: 1, width: '100%', overflow: 'hidden'}}>
                      <div style={{
                        fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #4461ab 0%, #1ab1ce 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                        textAlign: 'center'
                      }}>
                        {userReports.filter(r => r.status === 'active' || r.status === 'pending' || r.status === 'reviewed').length.toLocaleString()}
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem'
                      }}>
                        <FiCheckCircle style={{fontSize: '0.875rem'}} />
                        Active
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
                {currentUser ? (
                  <>
                    <button 
                      onClick={() => setProfileSection('reports')}
                      style={{
                padding: '1rem',
                background: 'rgba(22,25,44,0.8)',
                border: '2px solid rgba(68,97,171,0.3)',
                borderRadius: '0.875rem',
                color: '#ffffff',
                fontWeight: '700',
                textAlign: 'left',
                backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <FiFileText style={{fontSize: '1.25rem'}} />
                      <span style={{flex: 1}}>My Reports ({userReports.length})</span>
                      <span style={{color: '#9ca3af'}}>→</span>
                    </button>
                    <button 
                      onClick={() => setProfileSection('settings')}
                      style={{
                        padding: '1rem',
                        background: 'rgba(22,25,44,0.8)',
                        border: '2px solid rgba(68,97,171,0.3)',
                        borderRadius: '0.875rem',
                        color: '#ffffff',
                        fontWeight: '700',
                        textAlign: 'left',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <FiSettings style={{fontSize: '1.25rem'}} />
                      <span style={{flex: 1}}>Settings</span>
                      <span style={{color: '#9ca3af'}}>→</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => openAuthModal('signin')}
                    style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      border: 'none',
                      borderRadius: '0.875rem',
                      color: '#ffffff',
                      fontWeight: '700',
                      textAlign: 'center',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                width: '100%',
                boxSizing: 'border-box'
                    }}
                  >
                    Sign In to Access Features
                  </button>
                )}
                <button 
                  onClick={() => setProfileSection('help')}
                  style={{
                    padding: '1rem',
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '0.875rem',
                    color: '#ffffff',
                    fontWeight: '700',
                    textAlign: 'left',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <FiHelpCircle style={{fontSize: '1.25rem'}} />
                  <span style={{flex: 1}}>Help & Support</span>
                  <span style={{color: '#9ca3af'}}>→</span>
                </button>
                <button 
                  onClick={() => setProfileSection('about')}
                  style={{
                    padding: '1rem',
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '0.875rem',
                    color: '#ffffff',
                    fontWeight: '700',
                    textAlign: 'left',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <FiInfo style={{fontSize: '1.25rem'}} />
                  <span style={{flex: 1}}>About GuardMoGo</span>
                  <span style={{color: '#9ca3af'}}>→</span>
                </button>
                <button 
                  onClick={() => setProfileSection('privacy')}
                  style={{
                    padding: '1rem',
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '0.875rem',
                    color: '#ffffff',
                    fontWeight: '700',
                    textAlign: 'left',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <FiLock style={{fontSize: '1.25rem'}} />
                  <span style={{flex: 1}}>Privacy Policy</span>
                  <span style={{color: '#9ca3af'}}>→</span>
                </button>
              </div>
            </>
          )}

          {/* My Reports Section */}
          {profileSection === 'reports' && currentUser && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  onClick={() => setProfileSection('main')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1ab1ce',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ←
                </button>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
                  fontWeight: '900',
                  color: '#ffffff',
                  margin: 0
                }}>
                  My Reports
                </h2>
              </div>

              {userReportsLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  color: '#9ca3af',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <LoadingSpinner size={40} color="#1ab1ce" />
                  <div style={{fontSize: '0.875rem'}}>Loading your reports...</div>
                </div>
              ) : userReports.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
                  {userReports.map((report) => (
                    <div
                      key={report.id}
                      style={{
                        background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                        border: '2px solid rgba(68,97,171,0.4)',
                        borderRadius: '1.25rem',
                        padding: '1.25rem',
                        backdropFilter: 'blur(20px)',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(68,97,171,0.15), 0 0 0 1px rgba(68,97,171,0.1) inset',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4461ab'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(68,97,171,0.25), 0 0 0 1px rgba(68,97,171,0.2) inset'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(68,97,171,0.4)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(68,97,171,0.15), 0 0 0 1px rgba(68,97,171,0.1) inset'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle, rgba(68,97,171,0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none'
                      }} />
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{flex: 1}}>
                          <div style={{
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '0.9375rem',
                            marginBottom: '0.25rem'
                          }}>
                            {report.number}
                          </div>
                          <div style={{
                            color: '#9ca3af',
                            fontSize: '0.75rem'
                          }}>
                            {formatDate(report.createdAt)}
                          </div>
                        </div>
                        {report.status && (
                          <div style={{
                            padding: '0.25rem 0.625rem',
                            background: report.status === 'resolved' 
                              ? 'rgba(26, 177, 206, 0.2)' 
                              : (report.status === 'active' || report.status === 'pending' || report.status === 'reviewed')
                              ? 'rgba(68, 97, 171, 0.2)'
                              : 'rgba(196, 18, 98, 0.2)',
                            border: `1px solid ${
                              report.status === 'resolved' 
                                ? 'rgba(26, 177, 206, 0.5)' 
                                : (report.status === 'active' || report.status === 'pending' || report.status === 'reviewed')
                                ? 'rgba(68, 97, 171, 0.5)'
                                : 'rgba(196, 18, 98, 0.5)'
                            }`,
                            borderRadius: '9999px',
                            color: report.status === 'resolved' 
                              ? '#1ab1ce' 
                              : (report.status === 'active' || report.status === 'pending' || report.status === 'reviewed')
                              ? '#4461ab'
                              : '#fca5a5',
                            fontSize: '0.6875rem',
                            fontWeight: '700',
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap'
                          }}>
                            {report.status === 'pending' || report.status === 'reviewed' ? 'active' : report.status}
                          </div>
                        )}
                      </div>
                      {report.fraudType && (
                        <div style={{
                          color: '#1ab1ce',
                          fontSize: '0.8125rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem'
                        }}>
                          {report.fraudType}
                        </div>
                      )}
                      {report.description && (
                        <p style={{
                          color: '#d1d5db',
                          fontSize: '0.8125rem',
                          lineHeight: '1.5',
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {report.description}
                        </p>
                      )}
                    </div>
            ))}
          </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  color: '#9ca3af'
                }}>
                  <FiFileText style={{fontSize: '2rem', marginBottom: '0.5rem', color: '#9ca3af'}} />
                  <div style={{fontSize: '0.9375rem', marginBottom: '0.5rem'}}>No reports yet</div>
                  <div style={{fontSize: '0.8125rem'}}>Start reporting fraud to help protect others</div>
                </div>
              )}
        </div>
      )}

          {/* Help & Support Section */}
          {profileSection === 'help' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  onClick={() => setProfileSection('main')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1ab1ce',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ←
                </button>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
            fontWeight: '900',
            color: '#ffffff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(26,177,206,0.4)'
                  }}>
                    <FiHelpCircle style={{color: '#ffffff', fontSize: '1.25rem'}} />
                  </div>
                  Help & Support
                </h2>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiHelpCircle />
                    Frequently Asked Questions
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        How do I check if a number is fraudulent?
                      </div>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.8125rem',
                        lineHeight: '1.6'
                      }}>
                        Click "Check Number" on the home screen, enter the MoMo number you want to verify, and tap "Search". If the number has been reported, you'll see details about the reports.
                      </div>
                    </div>
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        How do I report a fraudulent number?
                      </div>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.8125rem',
                        lineHeight: '1.6'
                      }}>
                        Click "Report Fraud" on the home screen, fill in the number, carrier, fraud type, and description. You'll need to sign in to submit a report.
                      </div>
                    </div>
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        Is my information secure?
                      </div>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.8125rem',
                        lineHeight: '1.6'
                      }}>
                        Yes, we take your privacy seriously. Your personal information is encrypted and stored securely. We only use your email for account management.
                      </div>
                    </div>
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        Can I report anonymously?
                      </div>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.8125rem',
                        lineHeight: '1.6'
                      }}>
                        Currently, you need to create an account to submit reports. This helps us maintain the integrity of our database and prevent false reports.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem'
                  }}>
                    Safety Tips
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.6',
                    marginBottom: '0.75rem'
                  }}>
                    Visit the "Safety Tips" tab to learn how to protect yourself from Mobile Money fraud.
                  </div>
                  <button
                    onClick={() => setActiveTab('features')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      border: 'none',
                      borderRadius: '0.625rem',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    View Safety Tips →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* About GuardMoGo Section */}
          {profileSection === 'about' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  onClick={() => setProfileSection('main')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1ab1ce',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ←
                </button>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
                  fontWeight: '900',
                  color: '#ffffff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(26,177,206,0.4)'
                  }}>
                    <FiInfo style={{color: '#ffffff', fontSize: '1.25rem'}} />
                  </div>
                  About GuardMoGo
                </h2>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 50%, #c41262 100%)',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: '900',
                      color: '#ffffff'
                    }}>
                      GM
                    </div>
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '900',
                        fontSize: '1.125rem'
                      }}>
                        GuardMoGo
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '0.75rem'
                      }}>
                        Digital Watchdog
                      </div>
                    </div>
                  </div>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                    marginBottom: '1rem'
                  }}>
                    GuardMoGo is a community-driven platform designed to protect Mobile Money users from fraud. Our mission is to create a safer digital payment environment by allowing users to verify and report suspicious numbers.
                  </div>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    lineHeight: '1.7'
                  }}>
                    By working together, we can identify and prevent fraudulent activities, making Mobile Money transactions safer for everyone.
                  </div>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiTarget style={{fontSize: '1.125rem'}} />
                    Our Mission
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.6',
                    marginBottom: '0.75rem'
                  }}>
                    To empower Mobile Money users with the tools and information they need to protect themselves from fraud and scams.
                  </div>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiStar style={{fontSize: '1.125rem'}} />
                    Key Features
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {[
                      {icon: <FiSearch />, text: 'Number Verification - Check if a number has been reported'},
                      {icon: <FiAlertTriangle />, text: 'Fraud Reporting - Submit reports to protect others'},
                      {icon: <FiBarChart2 />, text: 'Real-time Dashboard - Track fraud trends and statistics'},
                      {icon: <FiShield />, text: 'Safety Tips - Learn how to protect yourself from scams'}
                    ].map((feature, idx) => (
              <div key={idx} style={{
                display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          color: '#1ab1ce',
                          fontSize: '1.125rem',
                          flexShrink: 0,
                          marginTop: '0.125rem'
                        }}>
                          {feature.icon}
                        </div>
                        <div style={{
                          color: '#d1d5db',
                          fontSize: '0.8125rem',
                          lineHeight: '1.6'
                        }}>
                          {feature.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiPackage style={{fontSize: '1.125rem'}} />
                    Version
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem'
                  }}>
                    GuardMoGo v1.0.0
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Policy Section */}
          {profileSection === 'privacy' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  onClick={() => setProfileSection('main')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1ab1ce',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ←
                </button>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
                  fontWeight: '900',
                  color: '#ffffff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(26,177,206,0.4)'
                  }}>
                    <FiLock style={{color: '#ffffff', fontSize: '1.25rem'}} />
                  </div>
                  Privacy Policy
                </h2>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={{
                background: 'rgba(22,25,44,0.8)',
                border: '2px solid rgba(68,97,171,0.3)',
                borderRadius: '1rem',
                padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiLock />
                    Data Collection
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7',
                    marginBottom: '0.75rem'
                  }}>
                    We collect minimal information necessary to provide our services:
                  </div>
                  <ul style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7',
                    paddingLeft: '1.25rem',
                    margin: 0
                  }}>
                    <li>Email address (for account creation and authentication)</li>
                    <li>Display name (first and last name)</li>
                    <li>Fraud reports you submit (number, carrier, fraud type, description)</li>
                    <li>Usage data (reports count, activity statistics)</li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiActivity style={{fontSize: '1.125rem'}} />
                    How We Use Your Data
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7'
                  }}>
                    Your data is used exclusively to:
                  </div>
                  <ul style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7',
                    paddingLeft: '1.25rem',
                    marginTop: '0.5rem',
                    marginBottom: 0
                  }}>
                    <li>Provide fraud verification services</li>
                    <li>Maintain your account and report history</li>
                    <li>Improve our platform and services</li>
                    <li>Generate anonymous statistics and trends</li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiClock style={{fontSize: '1.125rem'}} />
                    Data Retention
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7'
                  }}>
                    We retain your data for as long as necessary to provide our services. You can request account deletion at any time.
                  </div>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiUsers style={{fontSize: '1.125rem'}} />
                    Your Rights
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7'
                  }}>
                    You have the right to:
                  </div>
                  <ul style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7',
                    paddingLeft: '1.25rem',
                    marginTop: '0.5rem',
                    marginBottom: 0
                  }}>
                    <li>Access your personal data</li>
                    <li>Request deletion of your account and data</li>
                    <li>Update or correct your information</li>
                    <li>Opt out of data collection (some features may be limited)</li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiShare2 style={{fontSize: '1.125rem'}} />
                    Data Sharing
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7'
                  }}>
                    We do not sell or share your personal information. Fraud reports are shared anonymously with the community to help protect all users.
                  </div>
                </div>

                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    color: '#1ab1ce',
                    fontWeight: '800',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiRefreshCw style={{fontSize: '1.125rem'}} />
                    Updates to Privacy Policy
                  </h3>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7'
                  }}>
                    We may update this privacy policy from time to time. Significant changes will be communicated through the app or via email. Continued use of GuardMoGo after changes indicates acceptance of the updated policy.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {profileSection === 'settings' && currentUser && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  onClick={() => setProfileSection('main')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1ab1ce',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ←
                </button>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
                  fontWeight: '900',
                  color: '#ffffff',
                  margin: 0
                }}>
                  Settings
                </h2>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
                {userProfile?.firstName && userProfile?.lastName && (
                  <>
                    <div style={{
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '0.875rem',
                      padding: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div style={{color: '#d1d5db', fontSize: '0.8125rem', marginBottom: '0.5rem'}}>First Name</div>
                      <div style={{color: '#ffffff', fontSize: '0.9375rem', fontWeight: '600'}}>{userProfile.firstName}</div>
                    </div>
                    <div style={{
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '0.875rem',
                      padding: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div style={{color: '#d1d5db', fontSize: '0.8125rem', marginBottom: '0.5rem'}}>Last Name</div>
                      <div style={{color: '#ffffff', fontSize: '0.9375rem', fontWeight: '600'}}>{userProfile.lastName}</div>
                    </div>
                  </>
                )}
                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '0.875rem',
                  padding: '1rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{color: '#d1d5db', fontSize: '0.8125rem', marginBottom: '0.5rem'}}>Email</div>
                  <div style={{color: '#ffffff', fontSize: '0.9375rem', fontWeight: '600'}}>{currentUser.email}</div>
                </div>
                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '0.875rem',
                  padding: '1rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{color: '#d1d5db', fontSize: '0.8125rem', marginBottom: '0.5rem'}}>Account Type</div>
                  <div style={{color: '#ffffff', fontSize: '0.9375rem', fontWeight: '600', textTransform: 'capitalize'}}>
                    {userRole || 'User'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  style={{
                    padding: '1rem',
                    background: 'rgba(196,18,98,0.2)',
                    border: '2px solid rgba(196,18,98,0.5)',
                    borderRadius: '0.875rem',
                    color: '#fca5a5',
                    fontWeight: '700',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                width: '100%',
                boxSizing: 'border-box'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Fraud Alerts for Mobile */}
      {activeTab === 'home' && (
        <div style={{padding: '1.5rem 1rem', marginTop: '1.5rem', maxWidth: '100%', overflowX: 'hidden'}}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            padding: '0 0.5rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
              fontWeight: '900',
              color: '#ffffff',
              margin: 0
            }}>
              <FiAlertTriangle style={{display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle', color: '#c41262'}} /> Recent Fraud Alerts
            </h2>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1ab1ce',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              View All →
            </button>
          </div>

          {recentNumbersLoading ? (
                <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              color: '#9ca3af',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <LoadingSpinner size={32} color="#1ab1ce" />
              <div>Loading recent alerts...</div>
            </div>
          ) : recentNumbers.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
              {recentNumbers.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => handleSearchFromRecent(item.number || item.id)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                    border: '2px solid rgba(196,18,98,0.4)',
                    borderRadius: '1.25rem',
                    padding: '1.25rem',
                    backdropFilter: 'blur(20px)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: '100%',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(196,18,98,0.15), 0 0 0 1px rgba(196,18,98,0.1) inset'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c41262'
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(196,18,98,0.3), 0 0 0 1px rgba(196,18,98,0.2) inset'
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(22,25,44,1) 0%, rgba(30,35,55,1) 100%)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(196,18,98,0.4)'
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,18,98,0.15), 0 0 0 1px rgba(196,18,98,0.1) inset'
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)'
                  }}
                >
                  {/* Decorative gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100px',
                    height: '100px',
                    background: 'radial-gradient(circle, rgba(196,18,98,0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }} />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flex: 1,
                      minWidth: 0
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
                  borderRadius: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(196,18,98,0.4), 0 0 0 2px rgba(196,18,98,0.2) inset',
                        transition: 'all 0.3s'
                      }}>
                        <FiAlertTriangle style={{fontSize: '1.375rem', color: '#ffffff'}} />
                      </div>
                      <div style={{flex: 1, minWidth: 0, position: 'relative', zIndex: 1}}>
                        <div style={{
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '0.9375rem',
                          marginBottom: '0.375rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.number || item.id}
                        </div>
                        <div style={{
                          color: '#9ca3af',
                          fontSize: 'clamp(0.6875rem, 2vw, 0.75rem)',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          maxWidth: '100%'
                        }}>
                          {(item.reportsCount || 0).toLocaleString()} report{item.reportsCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '0.5rem 0.875rem',
                      background: 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
                      borderRadius: '0.75rem',
                  color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      boxShadow: '0 4px 15px rgba(196,18,98,0.4), 0 0 0 2px rgba(196,18,98,0.2) inset',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}>
                      <FiAlertTriangle style={{fontSize: '0.875rem'}} />
                      Flagged
                </div>
                  </div>
                  {item.lastReportedAt && (
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(68,97,171,0.2)'
                    }}>
                      Last reported: {formatDate(item.lastReportedAt)}
                    </div>
                  )}
              </div>
            ))}
          </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              background: 'rgba(22,25,44,0.8)',
              border: '2px solid rgba(68,97,171,0.3)',
              borderRadius: '1rem',
              color: '#9ca3af'
            }}>
              <FiShield style={{fontSize: '2rem', marginBottom: '0.5rem', color: '#9ca3af'}} />
              <div style={{fontSize: '0.9375rem', marginBottom: '0.5rem'}}>No recent alerts</div>
              <div style={{fontSize: '0.8125rem'}}>Be the first to report suspicious numbers</div>
            </div>
          )}
        </div>
      )}

      {/* Report Details Modal */}
      {searchResults && searchResults.reports && searchResults.reports.length > 0 && (
        <ReportDetailsModal
          isOpen={showReportDetails}
          onClose={() => setShowReportDetails(false)}
          number={searchResults.number || searchNumber}
          reports={searchResults.reports}
          reportCount={searchResults.reportsCount || searchResults.reports.length}
        />
      )}

      {/* Bottom Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,14,26,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(68,97,171,0.3)',
        padding: '0.625rem 0 max(0.875rem, env(safe-area-inset-bottom)) 0',
        paddingLeft: 'max(0, env(safe-area-inset-left))',
        paddingRight: 'max(0, env(safe-area-inset-right))',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -5px 20px rgba(0,0,0,0.3)',
        minHeight: '70px',
        boxSizing: 'border-box'
      }}>
        {[
          {icon: <FiHome />, label: 'Home', tab: 'home'},
          {icon: <FiShield />, label: 'Safety Tips', tab: 'features'},
          {icon: <FiBarChart2 />, label: 'Dashboard', tab: 'dashboard'},
          {icon: <FiUser />, label: 'Profile', tab: 'profile'}
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(item.tab)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              background: 'transparent',
              border: 'none',
              color: activeTab === item.tab ? '#1ab1ce' : '#6b7280',
              fontSize: '1.125rem',
              cursor: 'pointer',
              padding: '0.375rem 0.75rem',
              transition: 'all 0.2s',
              minWidth: '60px',
              flex: 1,
              maxWidth: '100px'
            }}
          >
            <span style={{lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{item.icon}</span>
            <span style={{fontSize: '0.625rem', fontWeight: '700', lineHeight: '1'}}>{item.label}</span>
        </button>
        ))}
      </div>
    </div>
  )
}

// Desktop Layout Component
function DesktopLayout({ isScrolled, currentUser, userRole, userProfile, logout, openAuthModal, openReportFraudModal }) {
  const [searchNumber, setSearchNumber] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showReportDetails, setShowReportDetails] = useState(false)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [topNumbers, setTopNumbers] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [recentNumbers, setRecentNumbers] = useState([])
  const [recentNumbersLoading, setRecentNumbersLoading] = useState(false)
  const [selectedTip, setSelectedTip] = useState(null) // Selected tip for modal
  const [activeSection, setActiveSection] = useState('home') // 'home', 'dashboard', 'safety-tips', 'profile'
  const [profileSection, setProfileSection] = useState('main') // 'main', 'reports', 'settings', 'help', 'privacy', 'about'
  const [userReports, setUserReports] = useState([])
  const [userReportsLoading, setUserReportsLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false) // Show/hide search section

  // Load dashboard data
  useEffect(() => {
    if (activeSection === 'dashboard') {
      loadDashboardData()
    }
  }, [activeSection])

  // Load recent numbers on mount
  useEffect(() => {
    loadRecentNumbers()
  }, [])

  // Load user reports when profile section is active
  useEffect(() => {
    if (activeSection === 'profile' && currentUser) {
      loadUserReports()
    }
  }, [activeSection, currentUser])

  const loadUserReports = async () => {
    if (!currentUser) return
    setUserReportsLoading(true)
    try {
      const reports = await getUserReports(currentUser.uid)
      setUserReports(reports)
    } catch (error) {
      console.error('Error loading user reports:', error)
    } finally {
      setUserReportsLoading(false)
    }
  }


  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedTip) {
        setSelectedTip(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedTip])

  const loadDashboardData = async () => {
    setDashboardLoading(true)
    try {
      const stats = await getDashboardStats()
      setDashboardStats(stats)
      const top = await getTopReportedNumbers(10)
      setTopNumbers(top)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadRecentNumbers = async () => {
    setRecentNumbersLoading(true)
    try {
      const top = await getTopReportedNumbers(5)
      setRecentNumbers(top)
    } catch (error) {
      console.error('Error loading recent numbers:', error)
    } finally {
      setRecentNumbersLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchNumber.trim()) {
      setSearchError('Please enter a number')
      return
    }

    setSearchLoading(true)
    setSearchError('')
    setSearchResults(null)

    try {
      const normalized = searchNumber.replace(/\s+/g, '').replace(/^\+233/, '0')
      const result = await checkNumber(normalized)
      setSearchResults(result)
    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error.message || 'Failed to search number')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchFromRecent = async (number) => {
    setSearchNumber(number)
    setSearchLoading(true)
    setSearchError('')
    setSearchResults(null)

    try {
      const normalized = number.replace(/\s+/g, '').replace(/^\+233/, '0')
      const result = await checkNumber(normalized)
      setSearchResults(result)
      if (result && result.reports && result.reports.length > 0) {
        setShowReportDetails(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error.message || 'Failed to search number')
    } finally {
      setSearchLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (userProfile?.firstName) {
      return userProfile.firstName
    }
    if (userProfile?.displayName) {
      return userProfile.displayName.split(' ')[0]
    }
    if (currentUser?.displayName) {
      return currentUser.displayName.split(' ')[0]
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0]
    }
    return 'there'
  }

  // Get user initials
  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase()
    }
    if (userProfile?.displayName) {
      const parts = userProfile.displayName.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return userProfile.displayName[0].toUpperCase()
    }
    if (currentUser?.displayName) {
      const parts = currentUser.displayName.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return currentUser.displayName[0].toUpperCase()
    }
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#0a0e1a', position: 'relative', overflowX: 'hidden'}}>
      {/* Desktop content - use the existing desktop layout */}
      {/* Dramatic animated background */}
      <div style={{position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0}}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '-10%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(26,177,206,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '-10%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(196,18,98,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'pulse 4s ease-in-out infinite',
          animationDelay: '1s'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '40%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(68,97,171,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'pulse 4s ease-in-out infinite',
          animationDelay: '2s'
        }}></div>
      </div>

      {/* Desktop Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        transition: 'all 0.3s',
        backgroundColor: isScrolled ? 'rgba(10,14,26,0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        boxShadow: isScrolled ? '0 10px 30px rgba(68,97,171,0.2)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(68,97,171,0.3)' : 'none'
      }}>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: 'clamp(0.75rem, 2vw, 2rem)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 'clamp(60px, 8vh, 80px)', flexWrap: 'wrap', gap: '1rem'}}>
            <div style={{fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '900', letterSpacing: '-0.02em'}}>
              <span style={{color: '#1ab1ce', textShadow: '0 0 20px rgba(26,177,206,0.5)'}}>Guard</span>
              <span style={{color: '#4461ab', textShadow: '0 0 20px rgba(68,97,171,0.5)'}}>Mo</span>
              <span style={{color: '#c41262', textShadow: '0 0 20px rgba(196,18,98,0.5)'}}>Go</span>
            </div>
            <div style={{display: 'flex', gap: 'clamp(0.75rem, 2vw, 2rem)', alignItems: 'center', flexWrap: 'wrap'}}>
              <button 
                onClick={() => setActiveSection('home')}
                style={{
                  color: activeSection === 'home' ? '#1ab1ce' : '#d1d5db',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.2s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >Home</button>
              <button 
                onClick={() => setActiveSection('dashboard')}
                style={{
                  color: activeSection === 'dashboard' ? '#1ab1ce' : '#d1d5db',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.2s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >Dashboard</button>
              <button 
                onClick={() => setActiveSection('safety-tips')}
                style={{
                  color: activeSection === 'safety-tips' ? '#1ab1ce' : '#d1d5db',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.2s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >Safety Tips</button>
              {currentUser ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div 
                    onClick={() => {
                      setActiveSection('profile')
                      setProfileSection('main')
                    }}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(26,177,206,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >{getUserInitials()}</div>
                  <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>Hey {getUserDisplayName()}!</span>
                  {userRole === 'admin' && (
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(196,18,98,0.2)',
                      border: '1px solid rgba(196,18,98,0.5)',
                      borderRadius: '0.5rem',
                      color: '#fca5a5',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>ADMIN</span>
                  )}
                  <button 
                    onClick={logout}
                    style={{
                      padding: '0.75rem 2rem',
                      background: 'rgba(196,18,98,0.3)',
                      border: '1px solid rgba(196,18,98,0.5)',
                      borderRadius: '0.75rem',
                      color: '#fca5a5',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(10px)'
                    }}
                  >Sign Out</button>
                </div>
              ) : (
                  <button 
                    onClick={() => openAuthModal('signin')}
                    style={{
                      padding: '0.75rem 2rem',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      color: 'white',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 10px 30px rgba(26,177,206,0.4)'
                    }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(26,177,206,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(26,177,206,0.4)'
                  }}
                >Sign In/Sign Up</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Hero Section - Only show on home */}
      {activeSection === 'home' && (
      <section style={{
        position: 'relative',
        paddingTop: 'clamp(100px, 15vh, 160px)',
        paddingBottom: 'clamp(60px, 10vh, 120px)',
        paddingLeft: 'clamp(1rem, 3vw, 2rem)',
        paddingRight: 'clamp(1rem, 3vw, 2rem)',
        overflow: 'hidden',
        zIndex: 10
      }}>
        <div style={{maxWidth: '1280px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10, padding: '0 clamp(0.5rem, 2vw, 1rem)'}}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 2rem',
            marginBottom: '3rem',
            background: 'linear-gradient(135deg, rgba(68,97,171,0.3) 0%, rgba(26,177,206,0.3) 50%, rgba(68,97,171,0.3) 100%)',
            border: '2px solid rgba(26,177,206,0.4)',
            borderRadius: '9999px',
            color: '#1ab1ce',
            fontWeight: '700',
            fontSize: '1.1rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 40px rgba(26,177,206,0.3)'
          }}>
            <span>Your Digital Watchdog Against MoMo Fraud</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(3rem, 12vw, 8rem)',
            fontWeight: '900',
            lineHeight: '1.1',
            marginBottom: '2rem',
            letterSpacing: '-0.04em'
          }}>
            <div style={{
              display: 'block',
              background: 'linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Report.</div>
            <div style={{
              display: 'block',
              background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 50%, #c41262 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease infinite'
            }}>Verify.</div>
            <div style={{
              display: 'block',
              background: 'linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Stay Safe.</div>
          </h1>

          <p style={{
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            color: '#d1d5db',
            marginBottom: '3rem',
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6',
            fontWeight: '300'
          }}>
            Protect yourself from Mobile Money fraud. Check any MoMo number, report suspicious activity, 
            and stay informed with <span style={{color: '#1ab1ce', fontWeight: '700'}}>real-time alerts</span>.
          </p>

          <div style={{display: 'flex', gap: 'clamp(0.75rem, 2vw, 1.5rem)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'clamp(2rem, 5vh, 4rem)'}}>
            <button 
              onClick={() => {
                setShowSearch(!showSearch)
                if (!showSearch) {
                  setTimeout(() => {
                    document.getElementById('desktop-search-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    document.getElementById('desktop-search-input')?.focus()
                  }, 100)
                } else {
                  setSearchNumber('')
                  setSearchResults(null)
                  setSearchError('')
                  setShowReportDetails(false)
                }
              }}
              style={{
              padding: 'clamp(0.875rem, 2vw, 1.25rem) clamp(1.5rem, 4vw, 3rem)',
              background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
              border: 'none',
              borderRadius: '1rem',
              color: 'white',
              fontSize: 'clamp(0.9375rem, 2vw, 1.25rem)',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 20px 60px rgba(26,177,206,0.5)',
              transform: 'scale(1)'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {showSearch ? 'Close Search' : 'Check a Number →'}
            </button>
            <button 
              onClick={openReportFraudModal}
              style={{
              padding: 'clamp(0.875rem, 2vw, 1.25rem) clamp(1.5rem, 4vw, 3rem)',
              background: 'transparent',
                border: '3px solid #c41262',
              borderRadius: '1rem',
                color: '#c41262',
              fontSize: 'clamp(0.9375rem, 2vw, 1.25rem)',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
                e.target.style.background = 'rgba(196,18,98,0.1)'
                e.target.style.borderColor = '#c41262'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
                e.target.style.borderColor = '#c41262'
            }}
            >
              Report Fraud
            </button>
          </div>

          {/* Desktop Search Section - Only show when showSearch is true */}
          {showSearch && (
          <div style={{maxWidth: '800px', margin: '0 auto', padding: '0 clamp(0.5rem, 2vw, 1rem)', marginBottom: 'clamp(2rem, 5vh, 4rem)'}}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(26,177,206,0.15) 0%, rgba(68,97,171,0.15) 100%)',
              border: '2px solid rgba(26,177,206,0.4)',
              borderRadius: '1.25rem',
              padding: '1.5rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(26,177,206,0.2)'
            }}>
            <div style={{
              display: 'flex',
                alignItems: 'center',
              gap: '1rem',
                marginBottom: '1rem',
                justifyContent: 'space-between'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flex: 1}}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FiSearch style={{color: '#ffffff', fontSize: '1.5rem'}} />
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '1.125rem',
                      marginBottom: '0.25rem'
                    }}>
                      Check Number
                    </div>
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.875rem'
                    }}>
                      Verify if a number has been reported
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSearch(false)
                    setSearchNumber('')
                    setSearchResults(null)
                    setSearchError('')
                    setShowReportDetails(false)
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(196,18,98,0.2)',
                    border: '1px solid rgba(196,18,98,0.5)',
                    borderRadius: '0.5rem',
                    color: '#fca5a5',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(196,18,98,0.3)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(196,18,98,0.2)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <FiX size={16} style={{display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle'}} />
                  Close
                </button>
              </div>
              
              <div style={{
                display: 'flex', 
                gap: '0.75rem', 
                alignItems: 'stretch',
                flexWrap: 'wrap',
                width: '100%'
              }}>
                <div style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: 0
                }}>
                  <FiSearch style={{
                    position: 'absolute',
                    left: '1rem',
                    color: '#9ca3af',
                    fontSize: '1rem',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />
              <input
                    id="desktop-search-input"
                type="tel"
                    placeholder="e.g. 0244123456"
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !searchLoading) {
                        handleSearch()
                      }
                    }}
                style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '0.75rem',
                  outline: 'none',
                  color: '#e5e7eb',
                      fontSize: '1rem',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      transition: 'all 0.2s',
                      WebkitAppearance: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1ab1ce'
                      e.target.style.boxShadow = '0 0 0 3px rgba(26,177,206,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(68,97,171,0.3)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={searchLoading}
                  style={{
                    padding: 'clamp(0.875rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                    minWidth: 'clamp(100px, 20vw, 120px)',
                    flex: '0 0 auto',
                    background: searchLoading 
                      ? 'rgba(68,97,171,0.5)' 
                      : 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                border: 'none',
                    borderRadius: '0.75rem',
                color: 'white',
                    fontWeight: '700',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    whiteSpace: 'nowrap',
                    cursor: searchLoading ? 'not-allowed' : 'pointer',
                    opacity: searchLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: searchLoading ? 'none' : '0 4px 12px rgba(26,177,206,0.3)',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (!searchLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,177,206,0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!searchLoading) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,177,206,0.3)'
                    }
                  }}
                >
                  {searchLoading ? (
                    <>
                      <LoadingSpinner size={18} color="#ffffff" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <FiSearch size={18} />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Search Error */}
              {searchError && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(196, 18, 98, 0.2)',
                  border: '1px solid rgba(196, 18, 98, 0.5)',
                  borderRadius: '0.5rem',
                  color: '#fca5a5',
                  fontSize: '0.875rem'
                }}>
                  {searchError}
                </div>
              )}

              {/* Search Results */}
              {searchLoading && (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem',
                  color: '#9ca3af',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}>
                  <LoadingSpinner size={40} color="#1ab1ce" />
                  <div style={{fontSize: '1rem'}}>Checking number...</div>
                </div>
              )}
              {searchResults && !searchLoading && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1.5rem',
                  background: 'rgba(22,25,44,0.6)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '0.875rem'
                }}>
                  {searchResults.reports && searchResults.reports.length > 0 ? (
                    <div>
                      <div style={{
                        color: '#c41262',
                fontWeight: '800',
                        fontSize: '1rem',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <FiAlertTriangle style={{display: 'inline-block'}} /> Number Flagged
                      </div>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        {searchNumber}
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '0.875rem',
                        marginBottom: '0.75rem'
                      }}>
                        {(searchResults.reportsCount || searchResults.reports.length).toLocaleString()} report(s) found
                      </div>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.9375rem',
                        lineHeight: '1.5',
                        marginBottom: '1rem'
                      }}>
                        This number has been reported for fraud. Exercise caution.
                      </div>
                      <button
                        onClick={() => setShowReportDetails(true)}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                          border: 'none',
                          borderRadius: '0.625rem',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '1rem',
                cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.02)'
                          e.target.style.boxShadow = '0 5px 15px rgba(26,177,206,0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)'
                          e.target.style.boxShadow = 'none'
                        }}
                      >
                        Show More Details →
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      color: '#1ab1ce',
                      fontWeight: '700',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ✓ Number appears safe
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </section>
      )}

      {/* Recent Fraud Alerts Section */}
      {activeSection === 'home' && (
        <section style={{
        position: 'relative',
          paddingTop: '60px',
        paddingBottom: '120px',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        background: 'linear-gradient(180deg, #0a0e1a 0%, #16192c 50%, #0a0e1a 100%)',
        zIndex: 10
      }}>
        <div style={{maxWidth: '1280px', margin: '0 auto'}}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2.5rem'
            }}>
              <h2 style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: '900',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <FiAlertTriangle style={{color: '#c41262', fontSize: '2.5rem'}} />
                Recent Fraud Alerts
              </h2>
              <button
                onClick={() => setActiveSection('dashboard')}
                style={{
                  background: 'transparent',
                  border: '2px solid #1ab1ce',
                  borderRadius: '0.75rem',
              color: '#1ab1ce',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '0.75rem 1.5rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(26,177,206,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                }}
              >
                View All →
              </button>
            </div>

            {recentNumbersLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#9ca3af',
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                <LoadingSpinner size={40} color="#1ab1ce" />
                <div>Loading recent alerts...</div>
          </div>
            ) : recentNumbers.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {recentNumbers.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => handleSearchFromRecent(item.number || item.id)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                      border: '2px solid rgba(196,18,98,0.4)',
                      borderRadius: '1.5rem',
                      padding: '1.5rem',
                      backdropFilter: 'blur(20px)',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(196,18,98,0.15)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c41262'
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(196,18,98,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(196,18,98,0.4)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,18,98,0.15)'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '120px',
                      height: '120px',
                      background: 'radial-gradient(circle, rgba(196,18,98,0.15) 0%, transparent 70%)',
                      borderRadius: '50%',
                      pointerEvents: 'none'
                    }} />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flex: 1,
                        minWidth: 0
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          background: 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
                          borderRadius: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 15px rgba(196,18,98,0.4)'
                        }}>
                          <FiAlertTriangle style={{fontSize: '1.5rem', color: '#ffffff'}} />
                        </div>
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '1.125rem',
                            marginBottom: '0.5rem',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {item.number || item.id}
                          </div>
                          <div style={{
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                          }}>
                            {(item.reportsCount || 0).toLocaleString()} report{item.reportsCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #c41262 0%, #4461ab 100%)',
                        borderRadius: '0.75rem',
                        color: 'white',
                        fontSize: '0.75rem',
              fontWeight: '800',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(196,18,98,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <FiAlertTriangle style={{fontSize: '0.875rem'}} />
                        Flagged
                      </div>
                    </div>
                    {item.lastReportedAt && (
                      <div style={{
                        color: '#9ca3af',
              fontSize: '0.875rem',
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(68,97,171,0.2)'
            }}>
                        Last reported: {formatDate(item.lastReportedAt)}
            </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'rgba(22,25,44,0.8)',
                border: '2px solid rgba(68,97,171,0.3)',
                borderRadius: '1.5rem',
                color: '#9ca3af'
              }}>
                <FiShield style={{fontSize: '3rem', marginBottom: '1rem', color: '#9ca3af'}} />
                <div style={{fontSize: '1.125rem', marginBottom: '0.5rem'}}>No recent alerts</div>
                <div style={{fontSize: '0.9375rem'}}>Be the first to report suspicious numbers</div>
              </div>
            )}
        </div>
      </section>
      )}

      {/* Desktop Dashboard Section */}
      {activeSection === 'dashboard' && (
        <section style={{
        position: 'relative',
          paddingTop: '160px',
        paddingBottom: '120px',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        background: 'linear-gradient(180deg, #0a0e1a 0%, #16192c 50%, #0a0e1a 100%)',
        zIndex: 10
      }}>
        <div style={{maxWidth: '1280px', margin: '0 auto'}}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              fontWeight: '900',
              marginBottom: '3rem',
              color: '#ffffff',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <FiBarChart2 style={{color: '#1ab1ce'}} />
              Dashboard
            </h2>

            {dashboardLoading ? (
            <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#9ca3af',
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                <LoadingSpinner size={40} color="#1ab1ce" />
                <div>Loading dashboard data...</div>
              </div>
            ) : dashboardStats ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '2rem',
                  marginBottom: '4rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                    border: '2px solid rgba(26,177,206,0.4)',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 10px 40px rgba(26,177,206,0.2)'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                      <FiFileText style={{fontSize: '2rem', color: '#1ab1ce'}} />
                      <h3 style={{color: '#ffffff', fontSize: '1.25rem', fontWeight: '800'}}>Total Reports</h3>
                    </div>
                    <div style={{color: '#1ab1ce', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900'}}>
                      {(dashboardStats.totalReports || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
              border: '2px solid rgba(68,97,171,0.4)',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 10px 40px rgba(68,97,171,0.2)'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                      <FiPhone style={{fontSize: '2rem', color: '#4461ab'}} />
                      <h3 style={{color: '#ffffff', fontSize: '1.25rem', fontWeight: '800'}}>Flagged Numbers</h3>
                    </div>
                    <div style={{color: '#4461ab', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900'}}>
                      {(dashboardStats.totalNumbers || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                    border: '2px solid rgba(196,18,98,0.4)',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 10px 40px rgba(196,18,98,0.2)'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                      <FiCheckCircle style={{fontSize: '2rem', color: '#c41262'}} />
                      <h3 style={{color: '#ffffff', fontSize: '1.25rem', fontWeight: '800'}}>Active Reports</h3>
                    </div>
                    <div style={{color: '#c41262', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900'}}>
                      {(dashboardStats.activeReports || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {topNumbers.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '800',
                      color: '#ffffff',
                      marginBottom: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <FiTrendingUp style={{color: '#1ab1ce'}} />
                      Top Reported Numbers
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      {topNumbers.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => handleSearchFromRecent(item.number || item.id)}
                          style={{
                            background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                            border: '2px solid rgba(68,97,171,0.4)',
                            borderRadius: '1.5rem',
                            padding: '1.5rem',
                            backdropFilter: 'blur(20px)',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1ab1ce'
                            e.currentTarget.style.transform = 'translateY(-5px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(68,97,171,0.4)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                          }}>
                            <div style={{
                              color: '#ffffff',
                              fontWeight: '700',
                              fontSize: '1.125rem',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word'
                            }}>
                              {item.number || item.id}
                            </div>
                            <div style={{
                              padding: '0.5rem 1rem',
                              background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                              borderRadius: '0.75rem',
                              color: 'white',
              fontSize: '0.875rem',
                              fontWeight: '800'
            }}>
                              {(item.reportsCount || 0).toLocaleString()} reports
            </div>
                          </div>
                          {item.lastReportedAt && (
                            <div style={{
                              color: '#9ca3af',
                              fontSize: '0.875rem'
                            }}>
                              Last reported: {formatDate(item.lastReportedAt)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </section>
      )}

      {/* Desktop Safety Tips Section */}
      {activeSection === 'safety-tips' && (
        <section style={{
          position: 'relative',
          paddingTop: '160px',
          paddingBottom: '120px',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          background: 'linear-gradient(180deg, #0a0e1a 0%, #16192c 50%, #0a0e1a 100%)',
          zIndex: 10
        }}>
          <div style={{maxWidth: '1400px', margin: '0 auto'}}>
            <div style={{textAlign: 'center', marginBottom: '4rem'}}>
            <h2 style={{
                fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              fontWeight: '900',
              marginBottom: '1.5rem',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <FiShield style={{color: '#1ab1ce', fontSize: '3rem'}} />
                Safety Tips
            </h2>
            <p style={{
                fontSize: '1.25rem',
                color: '#9ca3af',
                maxWidth: '800px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
                Comprehensive safety tips to protect yourself from Mobile Money and financial fraud. Click on any tip to view detailed information and real-world scenarios.
            </p>
          </div>
          <div style={{
            display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '2rem'
          }}>
            {[
                {
                  icon: <FiCheckCircle size={28} />, 
                  title: 'Verify Before You Pay', 
                  desc: 'Always verify the recipient\'s number before sending money. Use GuardMoGo to check if a number has been reported for fraud.', 
                  color: '#1ab1ce',
                  details: 'Before making any Mobile Money transfer, take a moment to verify the recipient\'s number. Scammers often use numbers that look legitimate but are actually fraudulent.',
                  examples: [
                    'Scenario: Someone calls claiming to be a friend in need of urgent money. They give you a number to send to. ALWAYS call that friend directly on their known number to verify before sending.',
                    'Scenario: You receive a message from what appears to be a legitimate business asking for payment. Use GuardMoGo to check if that number has been reported before sending any money.',
                    'Scenario: A seller on social media asks you to send money to a different number than initially discussed. This is a red flag - verify the new number first.'
                  ]
                },
                {
                  icon: <FiLock size={28} />, 
                  title: 'Keep Your PIN Private', 
                  desc: 'Never share your MoMo PIN with anyone. No legitimate service will ask for your PIN via phone or message.', 
                  color: '#4461ab',
                  details: 'Your Mobile Money PIN is like the key to your bank account. Never, under any circumstances, should you share it with anyone, no matter how legitimate they claim to be.',
                  examples: [
                    'Scenario: Someone calls claiming to be from MTN/AirtelTigo customer service and asks for your PIN to "verify your account" or "process a refund". This is ALWAYS a scam. Legitimate customer service never asks for your PIN.',
                    'Scenario: You receive a message saying "Your account has been suspended. Reply with your PIN to reactivate." This is a phishing attempt. Never share your PIN via message.',
                    'Scenario: A friend or family member asks for your PIN to "help you" make a transaction. Even if you trust them, never share your PIN. You can make the transaction yourself.'
                  ]
                },
                {
                  icon: <FiPhone size={28} />, 
                  title: 'Beware of Unsolicited Calls', 
                  desc: 'Be cautious of calls claiming to be from your network provider. Verify by calling the official customer service line.', 
                  color: '#c41262',
                  details: 'Scammers often impersonate customer service representatives from network providers. They use tactics to create urgency and pressure you into making quick decisions.',
                  examples: [
                    'Scenario: You receive a call from "MTN" saying your SIM card will be deactivated in 2 hours unless you provide personal information. Hang up and call MTN\'s official customer service line (100) to verify.',
                    'Scenario: Someone calls claiming to offer a "special promotion" or "account upgrade" but needs your account details. Legitimate promotions never require immediate action over the phone.',
                    'Scenario: A caller says there\'s suspicious activity on your account and asks you to confirm your PIN or personal details. This is a scam. Hang up and call your provider directly.'
                  ]
                },
                {
                  icon: <FiDollarSign size={28} />, 
                  title: 'Question Too-Good Deals', 
                  desc: 'If a deal seems too good to be true, it probably is. Scammers often use fake promotions to steal money.', 
                  color: '#1ab1ce',
                  details: 'Scammers prey on people\'s desire for good deals. They create fake promotions, lottery wins, or "limited-time offers" to trick you into sending money or sharing personal information.',
                  examples: [
                    'Scenario: You receive a message saying "Congratulations! You\'ve won ₵10,000! Send ₵100 to this number to claim your prize." This is a scam. Legitimate lotteries don\'t require upfront payments.',
                    'Scenario: A seller offers a brand new iPhone for half the market price if you pay via Mobile Money first. This is likely a scam. Legitimate sellers use secure payment methods.',
                    'Scenario: Someone offers you a "guaranteed investment" that doubles your money in a week. This is a classic scam. Real investments don\'t guarantee such returns.'
                  ]
                },
                {
                  icon: <FiXCircle size={28} />, 
                  title: 'Never Share OTP Codes', 
                  desc: 'One-Time Password (OTP) codes are for your use only. Never share them with anyone, even if they claim to be from your bank.', 
                  color: '#4461ab',
                  details: 'OTP (One-Time Password) codes are sent to your phone to verify transactions. These codes are meant ONLY for you to complete your own transactions. Sharing them gives scammers access to your account.',
                  examples: [
                    'Scenario: Someone calls claiming to be from your bank and asks you to read out the OTP code you just received. This is a scam. Legitimate banks never ask for OTP codes.',
                    'Scenario: You receive a message asking you to share your OTP code to "verify your account" or "unlock a transaction". Never share OTP codes - they are for your transactions only.',
                    'Scenario: A seller asks for an OTP code to "verify your payment". This is a red flag. OTP codes are for your own security, not for sharing with others.'
                  ]
                },
                {
                  icon: <FiPhone size={28} />, 
                  title: 'Check Before Responding', 
                  desc: 'Before responding to urgent payment requests, verify the sender\'s identity. Use GuardMoGo to check if the number is flagged.', 
                  color: '#c41262',
                  details: 'Urgency is a common tactic used by scammers. They create fake emergencies or time-sensitive situations to pressure you into acting quickly without thinking. Always take time to verify.',
                  examples: [
                    'Scenario: You receive an urgent message from a number claiming to be a family member asking for emergency money. Call that family member directly on their known number to verify before sending anything.',
                    'Scenario: Someone texts you claiming to be a business partner and urgently needs money for a "business deal". Verify the identity by calling them directly or checking the number on GuardMoGo.',
                    'Scenario: A message says "Your account will be closed in 1 hour if you don\'t respond immediately." Legitimate businesses give proper notice and don\'t use such urgent threats.'
                  ]
                },
                {
                  icon: <FiAlertTriangle size={28} />, 
                  title: 'Report Suspicious Activity', 
                  desc: 'If you encounter a suspicious number or transaction, report it immediately on GuardMoGo to protect others.', 
                  color: '#1ab1ce',
                  details: 'Reporting suspicious numbers helps protect the entire community. When you report a fraudulent number, you\'re helping others avoid falling victim to the same scam.',
                  examples: [
                    'Scenario: You receive a suspicious call or message asking for money or personal information. Report the number on GuardMoGo immediately, even if you didn\'t fall for it.',
                    'Scenario: You notice a fake social media account or advertisement promoting a suspicious Mobile Money scheme. Report it to help others avoid being scammed.',
                    'Scenario: You successfully identify a scam attempt. Take a moment to report it on GuardMoGo - your report could save someone else from losing money.'
                  ]
                },
                {
                  icon: <FiSearch size={28} />, 
                  title: 'Double-Check Transaction Details', 
                  desc: 'Always verify the recipient\'s name and number before confirming any transaction. Scammers often use similar names.', 
                  color: '#4461ab',
                  details: 'Before confirming any Mobile Money transaction, carefully review all details. Scammers use tricks like similar names or numbers to trick you into sending money to the wrong person.',
                  examples: [
                    'Scenario: You\'re sending money to "John Mensah" but the number shows "John Mensa" (missing the h). This could be a typo or a scam. Verify the correct spelling and number.',
                    'Scenario: A seller gives you a number that\'s one digit different from their previous number. Always verify why the number changed before sending payment.',
                    'Scenario: You receive a payment request from someone with a name very similar to a trusted contact. Double-check by calling that contact directly to verify.'
                  ]
                },
                {
                  icon: <FiAlertCircle size={28} />, 
                  title: 'Avoid Clicking Suspicious Links', 
                  desc: 'Don\'t click links in unsolicited messages. Always navigate to official websites directly from your browser.', 
                  color: '#c41262',
                  details: 'Phishing links are designed to steal your personal information or install malware on your device. Scammers create fake websites that look legitimate to trick you into entering your details.',
                  examples: [
                    'Scenario: You receive a message with a link claiming to be from your bank asking you to "verify your account". Don\'t click it. Instead, open your browser and go directly to your bank\'s official website.',
                    'Scenario: A message says "Click here to claim your prize" or "Click here to verify your payment". These are likely phishing attempts. Never click links from unsolicited messages.',
                    'Scenario: Someone sends you a link to "check your account balance" or "update your details". Always type the official website address yourself rather than clicking links.'
                  ]
                },
                {
                  icon: <FiShield size={28} />, 
                  title: 'Enable Transaction Notifications', 
                  desc: 'Turn on SMS and app notifications for all Mobile Money transactions to monitor your account activity.', 
                  color: '#1ab1ce',
                  details: 'Transaction notifications help you immediately detect any unauthorized activity on your Mobile Money account. If you receive a notification for a transaction you didn\'t make, you can act quickly.',
                  examples: [
                    'Scenario: You receive a transaction notification for a payment you didn\'t authorize. Immediately contact your network provider and report the unauthorized transaction.',
                    'Scenario: You notice you\'re not receiving notifications for transactions you make. Check your notification settings and ensure they\'re enabled for all transaction types.',
                    'Scenario: You receive a notification for a small "test" transaction you didn\'t make. This could be a scammer testing your account. Report it immediately.'
                  ]
                },
                {
                  icon: <FiClock size={28} />, 
                  title: 'Don\'t Rush Under Pressure', 
                  desc: 'Scammers create urgency to prevent you from thinking clearly. Take your time to verify before acting.', 
                  color: '#4461ab',
                  details: 'One of the most common scam tactics is creating a false sense of urgency. Scammers want you to act quickly without thinking. Legitimate businesses and people will give you time to verify.',
                  examples: [
                    'Scenario: Someone calls saying "You must send money within 10 minutes or your account will be closed." This is a scam. Legitimate businesses give proper notice and don\'t use such threats.',
                    'Scenario: A message says "Limited time offer - act now or miss out!" While legitimate sales exist, be extra cautious with urgent payment requests, especially from unknown numbers.',
                    'Scenario: You\'re told "This is your last chance" or "Only 5 minutes left" to complete a transaction. Take a step back, verify the sender, and don\'t let pressure rush your decision.'
                  ]
                },
                {
                  icon: <FiPhone size={28} />, 
                  title: 'Verify Official Contact Numbers', 
                  desc: 'Always verify contact numbers from official sources. Scammers often use numbers that look similar to legitimate ones.', 
                  color: '#c41262',
                  details: 'Scammers create fake customer service numbers or use numbers that look similar to legitimate ones. Always get contact information from official websites or documents, not from unsolicited messages.',
                  examples: [
                    'Scenario: You receive a call from a number claiming to be customer service. Before sharing any information, hang up and call the official customer service number (like MTN\'s 100 or AirtelTigo\'s 111) to verify.',
                    'Scenario: A message provides a "customer service" number to call. Don\'t use it. Instead, find the official number from the company\'s official website or your SIM card packaging.',
                    'Scenario: Someone gives you a number that\'s "the new customer service line" because the old one isn\'t working. Always verify through official channels before trusting new numbers.'
                  ]
                },
                {
                  icon: <FiMessageCircle size={28} />, 
                  title: 'Be Wary of Social Media Requests', 
                  desc: 'Scammers often create fake social media accounts to request money. Verify identity before sending money to social media contacts.', 
                  color: '#1ab1ce',
                  details: 'Social media platforms are common grounds for scammers. They create fake accounts, hack existing accounts, or use social engineering to trick you into sending money.',
                  examples: [
                    'Scenario: You receive a message on social media from someone claiming to be a friend asking for urgent money. Call that friend directly on their known phone number to verify before sending anything.',
                    'Scenario: A social media account offers you a "business opportunity" that requires upfront payment via Mobile Money. Research the business and verify its legitimacy before investing.',
                    'Scenario: Someone on social media asks you to send money to a "different number" because their "usual number isn\'t working." Always verify through a separate communication channel.'
                  ]
                },
                {
                  icon: <FiKey size={28} />, 
                  title: 'Use Strong Security Measures', 
                  desc: 'Enable biometric authentication, use strong PINs, and never save your PIN in easily accessible places.', 
                  color: '#4461ab',
                  details: 'Protecting your Mobile Money account starts with strong security practices. Use all available security features to protect your account from unauthorized access.',
                  examples: [
                    'Scenario: Your Mobile Money app offers fingerprint or face recognition. Enable these features as they provide an extra layer of security beyond just a PIN.',
                    'Scenario: You\'re tempted to write down your PIN because it\'s hard to remember. Instead, use a PIN that\'s memorable to you but not easily guessable (avoid birthdays, phone numbers, etc.).',
                    'Scenario: You share your phone with family members. Make sure your Mobile Money app is locked or requires authentication so others can\'t access your account.'
                  ]
                },
                {
                  icon: <FiCreditCard size={28} />, 
                  title: 'Monitor Your Account Regularly', 
                  desc: 'Check your Mobile Money account balance and transaction history regularly to spot any unauthorized activity early.', 
                  color: '#c41262',
                  details: 'Regular monitoring helps you catch fraudulent transactions quickly. Review your account daily or weekly to ensure all transactions are legitimate.',
                  examples: [
                    'Scenario: You notice a small withdrawal you don\'t remember making. This could be a scammer testing your account. Contact your provider immediately.',
                    'Scenario: Your account balance is lower than expected. Check your transaction history to identify any unauthorized transfers.',
                    'Scenario: You see multiple failed transaction attempts. This might indicate someone is trying to access your account. Change your PIN immediately.'
                  ]
                },
                {
                  icon: <FiMail size={28} />, 
                  title: 'Verify Email and SMS Communications', 
                  desc: 'Be cautious of emails or SMS messages claiming to be from your provider. Verify through official channels.', 
                  color: '#1ab1ce',
                  details: 'Scammers send fake emails and SMS messages that look like they\'re from legitimate sources. Always verify communications through official channels.',
                  examples: [
                    'Scenario: You receive an email "from MTN" asking you to verify your account by clicking a link. Don\'t click it. Instead, log into your account through the official app or website.',
                    'Scenario: An SMS says your account will be suspended and provides a link to fix it. This is likely a phishing attempt. Contact customer service directly.',
                    'Scenario: A message claims you\'ve won a prize and asks for your account details. Legitimate providers never ask for account details via email or SMS.'
                  ]
                },
                {
                  icon: <FiBell size={28} />, 
                  title: 'Set Up Account Alerts', 
                  desc: 'Configure alerts for all transactions, balance changes, and account activities to stay informed about your account status.', 
                  color: '#4461ab',
                  details: 'Account alerts notify you immediately of any activity on your Mobile Money account. This helps you detect unauthorized transactions quickly.',
                  examples: [
                    'Scenario: You receive an alert for a transaction you didn\'t make. Immediately contact your provider and report the unauthorized activity.',
                    'Scenario: You get an alert about a balance change you weren\'t expecting. Check your transaction history to verify the change.',
                    'Scenario: Alerts help you track all account activity, making it easier to spot suspicious patterns or unauthorized access attempts.'
                  ]
                },
                {
                  icon: <FiRefreshCw size={28} />, 
                  title: 'Change Your PIN Regularly', 
                  desc: 'Update your Mobile Money PIN periodically to reduce the risk of unauthorized access if your PIN is compromised.', 
                  color: '#c41262',
                  details: 'Regularly changing your PIN adds an extra layer of security. If someone learns your PIN, changing it will prevent them from accessing your account.',
                  examples: [
                    'Scenario: You suspect someone might know your PIN. Change it immediately through your Mobile Money app or by dialing the official USSD code.',
                    'Scenario: You haven\'t changed your PIN in over a year. Consider updating it every 3-6 months for better security.',
                    'Scenario: After sharing your phone with someone temporarily, change your PIN as a precautionary measure.'
                  ]
                },
                {
                  icon: <FiGlobe size={28} />, 
                  title: 'Be Cautious with Public Wi-Fi', 
                  desc: 'Avoid accessing your Mobile Money account on public Wi-Fi networks. Use your mobile data or a secure connection instead.', 
                  color: '#1ab1ce',
                  details: 'Public Wi-Fi networks are often unsecured and can be used by hackers to intercept your data. Always use secure connections when accessing financial accounts.',
                  examples: [
                    'Scenario: You\'re at a café and want to check your Mobile Money balance. Use your mobile data instead of the café\'s Wi-Fi to protect your information.',
                    'Scenario: You need to make a Mobile Money transaction while using public Wi-Fi. Wait until you\'re on a secure network or use your mobile data.',
                    'Scenario: If you must use public Wi-Fi, use a VPN to encrypt your connection and protect your account information.'
                  ]
                },
                {
                  icon: <FiAward size={28} />, 
                  title: 'Use Official Apps Only', 
                  desc: 'Only download Mobile Money apps from official app stores or your network provider\'s website. Avoid third-party apps.', 
                  color: '#4461ab',
                  details: 'Fake apps can steal your login credentials and personal information. Always use official apps from trusted sources.',
                  examples: [
                    'Scenario: You see a "cheaper" Mobile Money app in an unofficial app store. Don\'t download it. Only use apps from Google Play Store, Apple App Store, or your provider\'s official website.',
                    'Scenario: Someone recommends a "better" Mobile Money app they found online. Verify it\'s the official app before downloading.',
                    'Scenario: You receive a link to download a Mobile Money app via email or SMS. Go directly to the official app store instead of clicking the link.'
                  ]
                },
                {
                  icon: <FiAlertTriangle size={28} />, 
                  title: 'Recognize Common Scam Patterns', 
                  desc: 'Learn to identify common scam tactics like fake job offers, romance scams, and fake emergency requests.', 
                  color: '#c41262',
                  details: 'Scammers use predictable patterns. Understanding these patterns helps you recognize scams before falling victim.',
                  examples: [
                    'Scenario: Someone offers you a "work from home" job that requires you to pay a "registration fee" via Mobile Money. This is a scam. Legitimate jobs don\'t require upfront payments.',
                    'Scenario: Someone you met online asks you to send money for an "emergency" before you\'ve met in person. This is likely a romance scam.',
                    'Scenario: A "government official" calls asking for money to process a "benefit" or "refund". Government services don\'t require upfront payments via Mobile Money.'
                  ]
                },
                {
                  icon: <FiShield size={28} />, 
                  title: 'Keep Your Phone Secure', 
                  desc: 'Use a strong password or PIN to lock your phone. Enable remote tracking in case your phone is lost or stolen.', 
                  color: '#1ab1ce',
                  details: 'Protecting your phone is the first line of defense for your Mobile Money account. A stolen or unlocked phone gives scammers easy access.',
                  examples: [
                    'Scenario: Your phone doesn\'t have a lock screen. Anyone who picks it up can access your Mobile Money app. Set up a PIN, password, or biometric lock immediately.',
                    'Scenario: You lose your phone. If you have remote tracking enabled, you can locate it or remotely wipe your data to protect your accounts.',
                    'Scenario: Someone borrows your phone briefly. Make sure your Mobile Money app requires additional authentication (like a PIN) even if your phone is unlocked.'
                  ]
                },
                {
                  icon: <FiCheckCircle size={28} />, 
                  title: 'Verify Business Legitimacy', 
                  desc: 'Before sending money to a business or service, verify their legitimacy through official channels and reviews.', 
                  color: '#4461ab',
                  details: 'Many scammers pose as legitimate businesses. Always verify a business exists and is legitimate before making payments.',
                  examples: [
                    'Scenario: A business asks you to pay via Mobile Money before receiving goods or services. Research the business online, check reviews, and verify their contact information.',
                    'Scenario: Someone claims to be from a well-known company but uses a different payment number. Contact the company directly through their official website to verify.',
                    'Scenario: A "business" only accepts Mobile Money and refuses other payment methods. This is suspicious. Legitimate businesses usually offer multiple payment options.'
                  ]
                },
                {
                  icon: <FiUser size={28} />, 
                  title: 'Never Share Your PIN with Anyone', 
                  desc: 'Your Mobile Money PIN is private. Never share it with anyone, including family members, friends, or people claiming to be customer service.', 
                  color: '#c41262',
                  details: 'Your PIN is the key to your Mobile Money account. Sharing it with anyone, even trusted individuals, puts your account at risk. Legitimate customer service representatives will never ask for your PIN.',
                  examples: [
                    'Scenario: Someone calls claiming to be from customer service and asks for your PIN to "verify your account" or "fix a problem". This is a scam. Hang up immediately.',
                    'Scenario: A family member asks for your PIN to "help you with a transaction". Never share your PIN. Instead, you can make the transaction yourself or be present when they help.',
                    'Scenario: You receive a message asking you to send your PIN to "activate a new feature". This is fraudulent. Your provider never needs your PIN for any service.'
                  ]
                },
                {
                  icon: <FiFileText size={28} />, 
                  title: 'Keep Transaction Receipts', 
                  desc: 'Save transaction receipts and confirmation messages. They serve as proof of payment and help resolve disputes.', 
                  color: '#1ab1ce',
                  details: 'Transaction receipts are important records that can help you track your spending, prove payments, and resolve disputes with merchants or service providers.',
                  examples: [
                    'Scenario: You pay for goods but the seller claims they didn\'t receive payment. Your transaction receipt serves as proof that you completed the payment.',
                    'Scenario: You need to track your spending for budgeting purposes. Keeping receipts helps you review all your Mobile Money transactions.',
                    'Scenario: A merchant disputes a payment you made. Your transaction receipt with the reference number helps customer service resolve the issue quickly.'
                  ]
                },
                {
                  icon: <FiAlertCircle size={28} />, 
                  title: 'Be Cautious with Investment Opportunities', 
                  desc: 'Be skeptical of investment opportunities that promise high returns with little risk. Legitimate investments don\'t guarantee quick profits.', 
                  color: '#4461ab',
                  details: 'Investment scams are common in the Mobile Money space. Scammers promise unrealistic returns to trick you into sending money. Real investments carry risk and don\'t guarantee profits.',
                  examples: [
                    'Scenario: Someone offers you an "investment opportunity" that promises to double your money in one month. This is almost certainly a scam. Real investments don\'t guarantee such returns.',
                    'Scenario: An "investment advisor" asks you to send money via Mobile Money to "join an exclusive investment program". Legitimate investment advisors use regulated platforms, not direct Mobile Money transfers.',
                    'Scenario: You\'re promised "guaranteed returns" on an investment. No legitimate investment can guarantee returns. Be very skeptical of such claims.'
                  ]
                },
                {
                  icon: <FiCheck size={28} />, 
                  title: 'Verify Identity Before Large Transactions', 
                  desc: 'For significant amounts, always verify the recipient\'s identity through multiple channels before sending money.', 
                  color: '#c41262',
                  details: 'Large transactions require extra caution. Always verify the recipient\'s identity through multiple methods before sending significant amounts of money.',
                  examples: [
                    'Scenario: You need to send a large payment to a new business partner. Call them directly, verify their business registration, and confirm the payment details before sending.',
                    'Scenario: Someone asks you to send a large amount for a "business deal". Verify their identity, check their business credentials, and get everything in writing before proceeding.',
                    'Scenario: A family member requests a large emergency payment from a new number. Call them on their known number to verify the request is legitimate before sending.'
                  ]
                },
                {
                  icon: <FiDatabase size={28} />, 
                  title: 'Don\'t Store Payment Info Insecurely', 
                  desc: 'Avoid saving payment details, PINs, or account information in unsecured notes, messages, or cloud storage.', 
                  color: '#1ab1ce',
                  details: 'Storing sensitive payment information insecurely makes it vulnerable to theft. If your device is compromised, scammers can access this information.',
                  examples: [
                    'Scenario: You save your Mobile Money PIN in a notes app on your phone. If your phone is lost or hacked, scammers can access your PIN. Instead, memorize it or use a secure password manager.',
                    'Scenario: You send yourself payment details via email or messaging apps. These can be intercepted. Only share sensitive information through secure, encrypted channels when necessary.',
                    'Scenario: You store account numbers in a public cloud storage folder. Use secure, encrypted storage or better yet, memorize important account information.'
                  ]
                },
                {
                  icon: <FiCalendar size={28} />, 
                  title: 'Be Wary of Refund Scams', 
                  desc: 'Scammers often claim you\'re owed a refund and ask for your account details or a "processing fee". Legitimate refunds don\'t require upfront payments.', 
                  color: '#4461ab',
                  details: 'Refund scams are common. Scammers claim you\'re eligible for a refund and then ask for your account details or a "processing fee" to release the refund. Legitimate refunds are processed automatically.',
                  examples: [
                    'Scenario: You receive a call claiming you\'re owed a refund and need to pay a "processing fee" to receive it. This is a scam. Legitimate refunds don\'t require upfront payments.',
                    'Scenario: A message says you\'ve been "overcharged" and asks for your account details to process a refund. Don\'t share your details. Contact the business directly through official channels.',
                    'Scenario: Someone claims to be processing a refund but needs you to "verify your account" by sending money first. This is fraudulent. Real refunds are credited directly to your account.'
                  ]
                },
                {
                  icon: <FiShield size={28} />, 
                  title: 'Use Two-Factor Authentication When Available', 
                  desc: 'Enable two-factor authentication (2FA) on your Mobile Money app if the feature is available. It adds an extra layer of security.', 
                  color: '#1ab1ce',
                  details: 'Two-factor authentication requires a second verification step (like a code sent to your phone) in addition to your PIN. This makes it much harder for scammers to access your account.',
                  examples: [
                    'Scenario: Your Mobile Money app offers two-factor authentication. Enable it so that even if someone learns your PIN, they still need access to your phone to complete transactions.',
                    'Scenario: You receive a prompt to enable 2FA after logging in. Take the time to set it up - the extra security is worth the small inconvenience.',
                    'Scenario: Someone tries to access your account but can\'t complete the transaction because 2FA requires a code from your phone. This extra layer protects your account.'
                  ]
                },
                {
                  icon: <FiXCircle size={28} />, 
                  title: 'Don\'t Trust Caller ID Alone', 
                  desc: 'Scammers can spoof phone numbers to make calls appear to come from legitimate sources. Always verify by calling back on official numbers.', 
                  color: '#c41262',
                  details: 'Caller ID spoofing allows scammers to make their calls appear to come from legitimate businesses or government agencies. Never trust caller ID alone - always verify by calling back on official numbers.',
                  examples: [
                    'Scenario: You receive a call that appears to be from your bank asking for account information. Don\'t trust the caller ID. Hang up and call your bank\'s official customer service number to verify.',
                    'Scenario: A call appears to be from a government agency asking for payment. Scammers often spoof government numbers. Verify by calling the official agency number yourself.',
                    'Scenario: Someone calls claiming to be from customer service, and the number looks legitimate. Still, hang up and call the official customer service number to confirm the call was legitimate.'
                  ]
                },
                {
                  icon: <FiDollarSign size={28} />, 
                  title: 'Be Careful with QR Code Payments', 
                  desc: 'Only scan QR codes from trusted sources. Scammers can create malicious QR codes that redirect to fake payment pages.', 
                  color: '#4461ab',
                  details: 'QR codes make payments convenient, but they can also be used by scammers. Always verify the source of a QR code before scanning it, and double-check the payment details before confirming.',
                  examples: [
                    'Scenario: A stranger asks you to scan a QR code to receive payment. Verify the source and check the payment details carefully before confirming.',
                    'Scenario: You see a QR code posted in a public place for "quick payments". Only scan QR codes from trusted, official sources like verified businesses.',
                    'Scenario: A QR code redirects you to a payment page that looks different from your usual Mobile Money interface. This could be a fake page. Close it and use your official app instead.'
                  ]
                },
                {
                  icon: <FiMail size={28} />, 
                  title: 'Verify Before Sending Money to "Family" in Emergencies', 
                  desc: 'Scammers often impersonate family members in "emergency" situations. Always verify by calling the person directly on their known number.', 
                  color: '#c41262',
                  details: 'Emergency scams are common - scammers claim to be family members in urgent need of money. The urgency makes people act quickly without verifying. Always take time to verify the request.',
                  examples: [
                    'Scenario: You receive a message from a number claiming to be your child asking for emergency money. Call your child directly on their known number to verify before sending anything.',
                    'Scenario: Someone texts claiming to be a family member in an accident and urgently needs money. Don\'t send money immediately - call that family member directly to confirm.',
                    'Scenario: A message says "This is [family member], I lost my phone, please send money to this new number." Always verify by calling the family member on their known number first.'
                  ]
                },
                {
                  icon: <FiAlertTriangle size={28} />, 
                  title: 'Check for Spelling and Grammar Errors', 
                  desc: 'Official messages from legitimate companies are usually well-written. Multiple spelling or grammar errors can indicate a scam.', 
                  color: '#1ab1ce',
                  details: 'While not foolproof, many scam messages contain spelling and grammar errors. Legitimate businesses typically send well-written, professional messages. Use this as one indicator, but don\'t rely on it alone.',
                  examples: [
                    'Scenario: You receive a message with multiple spelling errors claiming to be from your bank. Legitimate banks send professional, error-free messages. This is likely a scam.',
                    'Scenario: A message has poor grammar and informal language but claims to be from an official source. Professional companies use proper grammar and formal language.',
                    'Scenario: An "official" message uses all caps, excessive exclamation marks, or unusual formatting. Legitimate businesses use professional formatting.'
                  ]
                },
                {
                  icon: <FiKey size={28} />, 
                  title: 'Log Out After Using Shared Devices', 
                  desc: 'If you access your Mobile Money account on a shared or public device, always log out completely when finished.', 
                  color: '#4461ab',
                  details: 'Shared devices can be accessed by others. Always log out completely from your Mobile Money app or account when using shared computers, tablets, or phones.',
                  examples: [
                    'Scenario: You check your Mobile Money balance on a friend\'s phone. Make sure to log out completely before returning the device to prevent unauthorized access.',
                    'Scenario: You use a public computer to access your account. Always log out and clear browser history to protect your account information.',
                    'Scenario: You temporarily use someone else\'s device. Set a reminder to log out, or better yet, avoid accessing your Mobile Money account on devices you don\'t own.'
                  ]
                },
                {
                  icon: <FiCreditCard size={28} />, 
                  title: 'Protect Your Bank Account Information', 
                  desc: 'Never share your bank account number, card details, or online banking credentials with anyone. Banks never ask for this information via phone or email.', 
                  color: '#c41262',
                  details: 'Your bank account information is highly sensitive. Scammers use various tactics to obtain this information, which they can then use to drain your accounts. Legitimate banks have strict policies about never asking for this information.',
                  examples: [
                    'Scenario: Someone calls claiming to be from your bank and asks for your account number to "verify your identity". Hang up immediately - banks never ask for this over the phone.',
                    'Scenario: An email asks you to "update your banking details" by clicking a link and entering your account information. This is a phishing attempt. Contact your bank directly instead.',
                    'Scenario: A website asks for your full card number, CVV, and PIN to "process a payment". Only enter card details on secure, verified payment gateways of trusted merchants.'
                  ]
                },
                {
                  icon: <FiShield size={28} />, 
                  title: 'Monitor All Financial Accounts Regularly', 
                  desc: 'Check all your financial accounts (bank, credit cards, Mobile Money) regularly to spot unauthorized transactions early.', 
                  color: '#1ab1ce',
                  details: 'Regular monitoring of all your financial accounts helps you detect fraud quickly. The sooner you notice unauthorized activity, the faster you can report it and minimize losses.',
                  examples: [
                    'Scenario: You check your bank statement and notice a small transaction you don\'t recognize. Report it immediately - scammers often test with small amounts before making larger withdrawals.',
                    'Scenario: You review your credit card statement and see charges from merchants you\'ve never used. Contact your credit card company immediately to dispute the charges.',
                    'Scenario: You notice your account balance is lower than expected. Review all recent transactions across all your accounts to identify any unauthorized activity.'
                  ]
                },
                {
                  icon: <FiLock size={28} />, 
                  title: 'Use Strong, Unique Passwords for Financial Accounts', 
                  desc: 'Create strong, unique passwords for each financial account. Use a password manager to keep track of them securely.', 
                  color: '#4461ab',
                  details: 'Weak or reused passwords make it easy for scammers to access your accounts. Each financial account should have a unique, strong password that you don\'t use elsewhere.',
                  examples: [
                    'Scenario: You use the same password for your bank account and email. If one is compromised, both are at risk. Use unique passwords for each account.',
                    'Scenario: Your password is easy to guess (like "password123" or your birthday). Use a combination of letters, numbers, and symbols that\'s hard to guess.',
                    'Scenario: You write down all your passwords in a notebook. Instead, use a reputable password manager that encrypts your passwords securely.'
                  ]
                },
                {
                  icon: <FiUser size={28} />, 
                  title: 'Protect Your Personal Information', 
                  desc: 'Be cautious about sharing personal information like your date of birth, ID number, or address. Scammers use this for identity theft.', 
                  color: '#c41262',
                  details: 'Identity theft occurs when scammers use your personal information to open accounts, make purchases, or commit fraud in your name. Only share personal information when absolutely necessary and with trusted entities.',
                  examples: [
                    'Scenario: Someone asks for your date of birth and ID number to "verify your identity" for a prize. Legitimate organizations rarely need this information upfront - be very cautious.',
                    'Scenario: A website asks for your full address, ID number, and date of birth just to sign up for a newsletter. This is excessive - only provide what\'s necessary.',
                    'Scenario: You receive a call asking you to "confirm your personal details" for security. Don\'t provide this information - instead, ask for their name and call the organization back on their official number.'
                  ]
                },
                {
                  icon: <FiAlertTriangle size={28} />, 
                  title: 'Be Skeptical of Unsolicited Financial Offers', 
                  desc: 'If you didn\'t request it, be very cautious. Legitimate financial institutions don\'t typically make unsolicited offers via phone, email, or text.', 
                  color: '#1ab1ce',
                  details: 'Scammers often contact people out of the blue with "amazing" financial offers. Legitimate financial institutions rarely make unsolicited offers, especially via phone or text message.',
                  examples: [
                    'Scenario: You receive a call offering you a "pre-approved loan" with "no credit check required". This is likely a scam. Legitimate lenders always check credit and don\'t make unsolicited loan offers.',
                    'Scenario: A text message says you\'ve been "selected" for a special credit card offer. Delete it - legitimate credit card companies don\'t send unsolicited offers via text.',
                    'Scenario: Someone emails you about an "investment opportunity" you didn\'t request. Be very skeptical - legitimate investment opportunities don\'t come through unsolicited emails.'
                  ]
                },
                {
                  icon: <FiFileText size={28} />, 
                  title: 'Review Financial Statements Carefully', 
                  desc: 'Read all bank statements, credit card statements, and financial documents carefully. Look for any unauthorized transactions or suspicious activity.', 
                  color: '#4461ab',
                  details: 'Financial statements contain important information about your account activity. Reviewing them carefully helps you catch unauthorized transactions, errors, or signs of fraud early.',
                  examples: [
                    'Scenario: You receive your monthly bank statement and notice a small charge you don\'t recognize. Even if it\'s small, investigate it - it could be a test transaction before a larger fraud.',
                    'Scenario: Your credit card statement shows a subscription you don\'t remember signing up for. Contact the merchant and your credit card company to dispute the charge.',
                    'Scenario: You notice your account has been charged multiple times for the same transaction. This could be an error or fraud - report it immediately.'
                  ]
                },
                {
                  icon: <FiTrendingUp size={28} />, 
                  title: 'Educate Yourself About Common Scams', 
                  desc: 'Stay informed about current scam tactics. Scammers constantly evolve their methods, so ongoing education is key to protection.', 
                  color: '#1ab1ce',
                  details: 'Financial scams evolve constantly. Staying informed about current scam tactics helps you recognize and avoid them. Follow trusted financial news sources and security advisories.',
                  examples: [
                    'Scenario: You read about a new type of investment scam in the news. This knowledge helps you recognize and avoid similar scams when you encounter them.',
                    'Scenario: Your bank sends out a security alert about a new phishing technique. Read it carefully - this information could protect you from falling victim.',
                    'Scenario: You attend a financial literacy workshop and learn about common fraud tactics. This education helps you make better financial decisions and avoid scams.'
                  ]
                },
                {
                  icon: <FiCheckCircle size={28} />, 
                  title: 'Verify Before You Trust', 
                  desc: 'Always verify the identity of anyone asking for money or personal information. When in doubt, contact the organization directly using official contact information.', 
                  color: '#c41262',
                  details: 'Verification is your best defense against fraud. Never trust unsolicited requests for money or information. Always verify by contacting the organization directly through official channels.',
                  examples: [
                    'Scenario: You receive a call claiming to be from your bank asking you to transfer money. Hang up and call your bank\'s official customer service number to verify the request.',
                    'Scenario: An email claims to be from a government agency asking for payment. Don\'t trust it - contact the agency directly through their official website or phone number.',
                    'Scenario: Someone claiming to be a business partner asks for payment to a new account. Verify the request by calling them directly on their known number before sending money.'
                  ]
                },
                {
                  icon: <FiEye size={28} />, 
                  title: 'Keep Your Financial Information Private', 
                  desc: 'Don\'t discuss your financial situation, account balances, or investment details in public or on social media. Scammers use this information to target you.', 
                  color: '#4461ab',
                  details: 'Sharing financial information publicly makes you a target for scammers. They use this information to craft personalized scams or identify high-value targets.',
                  examples: [
                    'Scenario: You post on social media about receiving a large payment or bonus. Scammers see this and may target you with investment scams or fake opportunities.',
                    'Scenario: You discuss your account balance or financial situation in a public place. Someone nearby could overhear and use this information to target you.',
                    'Scenario: You share details about your investments or financial plans online. Keep this information private to avoid becoming a target for financial scams.'
                  ]
                },
                {
                  icon: <FiShield size={28} />, 
                  title: 'Report Suspicious Activity Immediately', 
                  desc: 'If you suspect fraud or notice unauthorized activity, report it to your financial institution immediately. Quick action can minimize losses.', 
                  color: '#1ab1ce',
                  details: 'Time is critical when dealing with financial fraud. The sooner you report suspicious activity, the faster your financial institution can take action to protect your accounts and potentially recover lost funds.',
                  examples: [
                    'Scenario: You notice an unauthorized transaction on your account. Call your bank immediately - many banks have fraud protection that can reverse transactions if reported quickly.',
                    'Scenario: You receive a suspicious call asking for financial information. Report it to your bank and the relevant authorities - your report could help prevent others from being scammed.',
                    'Scenario: You suspect your account has been compromised. Contact your financial institution immediately to freeze your account and prevent further unauthorized access.'
                  ]
                }
              ].map((tip, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTip(tip)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                    border: `2px solid ${tip.color}40`,
                borderRadius: '1.5rem',
                    padding: '2rem',
                cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    animation: `fadeInUp 0.6s ease-out ${idx * 0.05}s both`
              }}
              onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = tip.color
                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)'
                    e.currentTarget.style.boxShadow = `0 12px 40px ${tip.color}25`
              }}
              onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${tip.color}40`
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Animated gradient overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: `radial-gradient(circle, ${tip.color}15 0%, transparent 70%)`,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    transition: 'all 0.4s',
                    opacity: 0.5
                  }} />
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.25rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: `linear-gradient(135deg, ${tip.color} 0%, ${tip.color}dd 100%)`,
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 8px 25px ${tip.color}50`,
                      flexShrink: 0,
                      transition: 'all 0.3s'
                    }}>
                      {tip.icon}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                <h3 style={{
                        color: '#ffffff',
                        fontSize: '1.375rem',
                  fontWeight: '800',
                        marginBottom: '0.75rem',
                        lineHeight: '1.3'
                      }}>{tip.title}</h3>
                <p style={{
                  color: '#9ca3af',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        marginBottom: '1rem'
                      }}>{tip.desc}</p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: tip.color,
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginTop: '0.5rem'
                      }}>
                        <span>Learn more</span>
                        <FiAlertTriangle size={16} />
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Desktop Profile Section */}
      {activeSection === 'profile' && (
        <section style={{
          paddingTop: 'clamp(100px, 15vh, 160px)',
          paddingBottom: '4rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
          maxWidth: '1280px',
          margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
          <div style={{maxWidth: '900px', margin: '0 auto'}}>
            {profileSection === 'main' && (
              <>
                {/* User Info Card */}
                <div style={{
                background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                  textAlign: 'center',
                  marginBottom: '2rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                    borderRadius: '50%',
                    margin: '0 auto 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: '#ffffff',
                    textTransform: 'uppercase'
                  }}>
                    {currentUser ? (
                      (() => {
                        let name = 'User'
                        if (userProfile?.firstName && userProfile?.lastName) {
                          name = `${userProfile.firstName} ${userProfile.lastName}`
                        } else if (userProfile?.displayName) {
                          name = userProfile.displayName
                        } else if (currentUser.displayName) {
                          name = currentUser.displayName
                        } else if (currentUser.email) {
                          name = currentUser.email.split('@')[0]
                        }
                        const initials = name.split(' ').slice(0, 2).map(word => word[0]?.toUpperCase() || '').join('') || name[0]?.toUpperCase() || 'U'
                        return initials
                      })()
                    ) : 'U'}
                  </div>
                  <h2 style={{color: '#ffffff', fontWeight: '800', marginBottom: '0.75rem', fontSize: '1.75rem'}}>
                    {currentUser ? (
                      userProfile?.firstName && userProfile?.lastName
                        ? `${userProfile.firstName} ${userProfile.lastName}`
                        : userProfile?.displayName
                        ? userProfile.displayName
                        : (currentUser.displayName || currentUser.email?.split('@')[0] || 'User')
                    ) : 'Guest User'}
                  </h2>
                  <p style={{color: '#9ca3af', fontSize: '1rem', marginBottom: '1rem'}}>
                    {currentUser ? currentUser.email : 'Sign in for full access'}
                  </p>
                  {currentUser && userRole && (
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      background: userRole === 'admin' ? 'rgba(196,18,98,0.2)' : 'rgba(68,97,171,0.2)',
                      border: `1px solid ${userRole === 'admin' ? 'rgba(196,18,98,0.5)' : 'rgba(68,97,171,0.5)'}`,
                      borderRadius: '9999px',
                      color: userRole === 'admin' ? '#fca5a5' : '#1ab1ce',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {userRole}
                    </div>
                  )}
                </div>

                {/* Stats Summary */}
                {currentUser && (
          <div style={{
            display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                  }}>
              <div style={{
                      background: 'linear-gradient(135deg, rgba(26,177,206,0.15) 0%, rgba(68,97,171,0.15) 100%)',
                      border: '2px solid rgba(26,177,206,0.4)',
                      borderRadius: '1.5rem',
                      padding: '2rem',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                      boxShadow: '0 4px 20px rgba(26,177,206,0.2)'
                    }}>
                      <div style={{
                        fontSize: '2.5rem',
                fontWeight: '900',
                        background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.75rem'
                      }}>
                        {userReports.length.toLocaleString()}
              </div>
                      <div style={{
                color: '#9ca3af',
                        fontSize: '1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <FiFileText />
                        My Reports
                      </div>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(68,97,171,0.15) 0%, rgba(26,177,206,0.15) 100%)',
                      border: '2px solid rgba(68,97,171,0.4)',
                      borderRadius: '1.5rem',
                      padding: '2rem',
                      textAlign: 'center',
                position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 4px 20px rgba(68,97,171,0.2)'
                    }}>
                      <div style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #4461ab 0%, #1ab1ce 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.75rem'
                      }}>
                        {userReports.filter(r => r.status === 'active' || r.status === 'pending' || r.status === 'reviewed').length.toLocaleString()}
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '1rem',
                        fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <FiCheckCircle />
                        Active
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {currentUser ? (
                    <>
                      <button 
                        onClick={() => setProfileSection('reports')}
                        style={{
                          padding: '1.25rem',
                          background: 'rgba(22,25,44,0.8)',
                          border: '2px solid rgba(68,97,171,0.3)',
                          borderRadius: '1rem',
                          color: '#ffffff',
                          fontWeight: '700',
                          textAlign: 'left',
                          backdropFilter: 'blur(10px)',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#4461ab'
                          e.currentTarget.style.transform = 'translateX(5px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(68,97,171,0.3)'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        <FiFileText style={{fontSize: '1.5rem'}} />
                        <span style={{flex: 1}}>My Reports ({userReports.length})</span>
                        <span style={{color: '#9ca3af'}}>→</span>
                      </button>
                      <button 
                        onClick={() => setProfileSection('settings')}
                        style={{
                          padding: '1.25rem',
                          background: 'rgba(22,25,44,0.8)',
                          border: '2px solid rgba(68,97,171,0.3)',
                          borderRadius: '1rem',
                          color: '#ffffff',
                          fontWeight: '700',
                          textAlign: 'left',
                          backdropFilter: 'blur(10px)',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#4461ab'
                          e.currentTarget.style.transform = 'translateX(5px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(68,97,171,0.3)'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        <FiSettings style={{fontSize: '1.5rem'}} />
                        <span style={{flex: 1}}>Settings</span>
                        <span style={{color: '#9ca3af'}}>→</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => openAuthModal('signin')}
                      style={{
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                        border: 'none',
                        borderRadius: '1rem',
                        color: '#ffffff',
                        fontWeight: '700',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      Sign In to Access Features
                    </button>
                  )}
                  <button 
                    onClick={() => setProfileSection('help')}
                    style={{
                      padding: '1.25rem',
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '1rem',
                      color: '#ffffff',
                      fontWeight: '700',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4461ab'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(68,97,171,0.3)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <FiHelpCircle style={{fontSize: '1.5rem'}} />
                    <span style={{flex: 1}}>Help & Support</span>
                    <span style={{color: '#9ca3af'}}>→</span>
                  </button>
                  <button 
                    onClick={() => setProfileSection('about')}
                    style={{
                      padding: '1.25rem',
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '1rem',
                      color: '#ffffff',
                      fontWeight: '700',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4461ab'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(68,97,171,0.3)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <FiInfo style={{fontSize: '1.5rem'}} />
                    <span style={{flex: 1}}>About GuardMoGo</span>
                    <span style={{color: '#9ca3af'}}>→</span>
                  </button>
                  <button 
                    onClick={() => setProfileSection('privacy')}
                    style={{
                      padding: '1.25rem',
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '1rem',
                      color: '#ffffff',
                      fontWeight: '700',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4461ab'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(68,97,171,0.3)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <FiLock style={{fontSize: '1.5rem'}} />
                    <span style={{flex: 1}}>Privacy Policy</span>
                    <span style={{color: '#9ca3af'}}>→</span>
                  </button>
                </div>
              </>
            )}

            {/* My Reports Section */}
            {profileSection === 'reports' && currentUser && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <button
                    onClick={() => setProfileSection('main')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                  color: '#1ab1ce',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    ←
                  </button>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#ffffff',
                    margin: 0
                  }}>
                    My Reports
                  </h2>
                </div>

                {userReportsLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: '#9ca3af',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                  }}>
                    <LoadingSpinner size={50} color="#1ab1ce" />
                    <div style={{fontSize: '1rem'}}>Loading your reports...</div>
                  </div>
                ) : userReports.length > 0 ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {userReports.map((report) => (
                      <div
                        key={report.id}
                        style={{
                          background: 'linear-gradient(135deg, rgba(22,25,44,0.95) 0%, rgba(30,35,55,0.95) 100%)',
                          border: '2px solid rgba(68,97,171,0.4)',
                          borderRadius: '1.5rem',
                          padding: '1.5rem',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 4px 20px rgba(68,97,171,0.15)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#4461ab'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 8px 30px rgba(68,97,171,0.25)'
                }}
                onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(68,97,171,0.4)'
                  e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(68,97,171,0.15)'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '1rem'
                        }}>
                          <div style={{flex: 1}}>
                            <div style={{
                              color: '#ffffff',
                              fontWeight: '700',
                              fontSize: '1.125rem',
                              marginBottom: '0.5rem'
                            }}>
                              {report.number}
                            </div>
                            <div style={{
                              color: '#9ca3af',
                              fontSize: '0.875rem'
                            }}>
                              {formatDate(report.createdAt)}
                            </div>
                          </div>
                          {report.status && (
                            <div style={{
                              padding: '0.5rem 1rem',
                              background: report.status === 'resolved' 
                                ? 'rgba(26, 177, 206, 0.2)' 
                                : (report.status === 'active' || report.status === 'pending' || report.status === 'reviewed')
                                ? 'rgba(68, 97, 171, 0.2)'
                                : 'rgba(196, 18, 98, 0.2)',
                              border: `1px solid ${
                                report.status === 'resolved' 
                                  ? 'rgba(26, 177, 206, 0.5)' 
                                  : (report.status === 'active' || report.status === 'pending' || report.status === 'reviewed')
                                  ? 'rgba(68, 97, 171, 0.5)'
                                  : 'rgba(196, 18, 98, 0.5)'
                              }`,
                              borderRadius: '9999px',
                              color: report.status === 'resolved' 
                                ? '#1ab1ce' 
                                : (report.status === 'active' || report.status === 'pending' || report.status === 'reviewed')
                                ? '#4461ab'
                                : '#fca5a5',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textTransform: 'capitalize'
                            }}>
                              {report.status === 'pending' || report.status === 'reviewed' ? 'active' : report.status}
                            </div>
                          )}
                        </div>
                        {report.fraudType && (
                          <div style={{
                            color: '#1ab1ce',
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            marginBottom: '0.75rem'
                          }}>
                            {report.fraudType}
                          </div>
                        )}
                        {report.description && (
                          <p style={{
                            color: '#d1d5db',
                            fontSize: '0.9375rem',
                            lineHeight: '1.6',
                            margin: 0
                          }}>
                            {report.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '1.5rem',
                    color: '#9ca3af'
                  }}>
                    <FiFileText style={{fontSize: '3rem', marginBottom: '1rem', color: '#9ca3af'}} />
                    <div style={{fontSize: '1.125rem', marginBottom: '0.5rem'}}>No reports yet</div>
                    <div style={{fontSize: '0.9375rem'}}>Start reporting fraud to help protect others</div>
                  </div>
                )}
              </div>
            )}

            {/* Settings Section */}
            {profileSection === 'settings' && currentUser && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <button
                    onClick={() => setProfileSection('main')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                  color: '#1ab1ce',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    ←
                  </button>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#ffffff',
                    margin: 0
                  }}>
                    Settings
                  </h2>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {userProfile?.firstName && userProfile?.lastName && (
                    <>
                      <div style={{
                        background: 'rgba(22,25,44,0.8)',
                        border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1rem',
                        padding: '1.5rem',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{color: '#d1d5db', fontSize: '0.9375rem', marginBottom: '0.75rem'}}>First Name</div>
                        <div style={{color: '#ffffff', fontSize: '1.125rem', fontWeight: '600'}}>{userProfile.firstName}</div>
                      </div>
                      <div style={{
                        background: 'rgba(22,25,44,0.8)',
                        border: '2px solid rgba(68,97,171,0.3)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{color: '#d1d5db', fontSize: '0.9375rem', marginBottom: '0.75rem'}}>Last Name</div>
                        <div style={{color: '#ffffff', fontSize: '1.125rem', fontWeight: '600'}}>{userProfile.lastName}</div>
                      </div>
                    </>
                  )}
                  <div style={{
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{color: '#d1d5db', fontSize: '0.9375rem', marginBottom: '0.75rem'}}>Email</div>
                    <div style={{color: '#ffffff', fontSize: '1.125rem', fontWeight: '600'}}>{currentUser.email}</div>
                  </div>
                  <div style={{
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{color: '#d1d5db', fontSize: '0.9375rem', marginBottom: '0.75rem'}}>Account Type</div>
                    <div style={{color: '#ffffff', fontSize: '1.125rem', fontWeight: '600', textTransform: 'capitalize'}}>
                      {userRole || 'User'}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    style={{
                      padding: '1.25rem',
                      background: 'rgba(196,18,98,0.2)',
                      border: '2px solid rgba(196,18,98,0.5)',
                      borderRadius: '1rem',
                      color: '#fca5a5',
                      fontWeight: '700',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(196,18,98,0.3)'
                }}
                onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(196,18,98,0.2)'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Help & Support, About, Privacy sections - reuse mobile content but adapt for desktop */}
            {profileSection === 'help' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <button
                    onClick={() => setProfileSection('main')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1ab1ce',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    ←
                  </button>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#ffffff',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(26,177,206,0.4)'
                    }}>
                      <FiHelpCircle style={{color: '#ffffff', fontSize: '1.5rem'}} />
                    </div>
                    Help & Support
                  </h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                  <div style={{
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                <h3 style={{
                  color: '#1ab1ce',
                  fontWeight: '800',
                      fontSize: '1.25rem',
                  marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <FiHelpCircle />
                      Frequently Asked Questions
                    </h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                      {[
                        {q: 'How do I check if a number is fraudulent?', a: 'Click "Check Number" on the home screen, enter the MoMo number you want to verify, and tap "Search". If the number has been reported, you\'ll see details about the reports.'},
                        {q: 'How do I report a fraudulent number?', a: 'Click "Report Fraud" on the home screen, fill in the number, carrier, fraud type, and description. You\'ll need to sign in to submit a report.'},
                        {q: 'Is my information secure?', a: 'Yes, we take your privacy seriously. Your personal information is encrypted and stored securely. We only use your email for account management.'},
                        {q: 'Can I report anonymously?', a: 'Currently, you need to create an account to submit reports. This helps us maintain the integrity of our database and prevent false reports.'}
                      ].map((faq, idx) => (
                        <div key={idx}>
                          <div style={{
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '1rem',
                            marginBottom: '0.75rem'
                          }}>
                            {faq.q}
                          </div>
                          <div style={{
                            color: '#d1d5db',
                            fontSize: '0.9375rem',
                            lineHeight: '1.7'
                          }}>
                            {faq.a}
                          </div>
              </div>
            ))}
          </div>
                  </div>
                  <div style={{
                    background: 'rgba(22,25,44,0.8)',
                    border: '2px solid rgba(68,97,171,0.3)',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <h3 style={{
                      color: '#1ab1ce',
                      fontWeight: '800',
                      fontSize: '1.25rem',
                      marginBottom: '1rem'
                    }}>
                      Safety Tips
                    </h3>
                    <div style={{
                      color: '#d1d5db',
                      fontSize: '0.9375rem',
                      lineHeight: '1.7',
                      marginBottom: '1.5rem'
                    }}>
                      Visit the "Safety Tips" section to learn how to protect yourself from Mobile Money fraud.
                    </div>
                    <button
                      onClick={() => setActiveSection('safety-tips')}
                      style={{
                        padding: '1rem 2rem',
                        background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(26,177,206,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                }}
                    >
                      View Safety Tips →
                    </button>
              </div>
                </div>
              </div>
            )}

            {/* About and Privacy sections would be similar - I'll add a simplified version */}
            {profileSection === 'about' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <button
                    onClick={() => setProfileSection('main')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1ab1ce',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    ←
                  </button>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#ffffff',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(26,177,206,0.4)'
                    }}>
                      <FiInfo style={{color: '#ffffff', fontSize: '1.5rem'}} />
                    </div>
                    About GuardMoGo
                  </h2>
                </div>
                <div style={{
                  background: 'rgba(22,25,44,0.8)',
                  border: '2px solid rgba(68,97,171,0.3)',
                  borderRadius: '1.5rem',
                  padding: '2rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '1rem',
                    lineHeight: '1.8',
                    marginBottom: '1.5rem'
                  }}>
                    GuardMoGo is a community-driven platform designed to protect Mobile Money users from fraud. Our mission is to create a safer digital payment environment by allowing users to verify and report suspicious numbers.
                  </div>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '1rem',
                    lineHeight: '1.8'
                  }}>
                    By working together, we can identify and prevent fraudulent activities, making Mobile Money transactions safer for everyone.
                  </div>
                </div>
              </div>
            )}

            {profileSection === 'privacy' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <button
                    onClick={() => setProfileSection('main')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1ab1ce',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    ←
                  </button>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#ffffff',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #1ab1ce 0%, #4461ab 100%)',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(26,177,206,0.4)'
                    }}>
                      <FiLock style={{color: '#ffffff', fontSize: '1.5rem'}} />
                    </div>
                    Privacy Policy
                  </h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                  {[
                    {title: 'Data Collection', content: 'We collect minimal information necessary to provide our services: email address, display name, fraud reports you submit, and usage data.'},
                    {title: 'How We Use Your Data', content: 'Your data is used exclusively to provide fraud verification services, maintain your account and report history, improve our platform, and generate anonymous statistics.'},
                    {title: 'Data Retention', content: 'We retain your data for as long as necessary to provide our services. You can request account deletion at any time.'},
                    {title: 'Your Rights', content: 'You have the right to access your personal data, request deletion of your account and data, update or correct your information, and opt out of data collection.'},
                    {title: 'Data Sharing', content: 'We do not sell or share your personal information. Fraud reports are shared anonymously with the community to help protect all users.'}
                  ].map((section, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(22,25,44,0.8)',
                      border: '2px solid rgba(68,97,171,0.3)',
                      borderRadius: '1.5rem',
                      padding: '2rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <h3 style={{
                        color: '#1ab1ce',
                        fontWeight: '800',
                        fontSize: '1.25rem',
                        marginBottom: '1rem'
                      }}>
                        {section.title}
                      </h3>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.9375rem',
                        lineHeight: '1.8'
                      }}>
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </section>
      )}

      {/* Desktop Footer */}
      <footer style={{
        background: 'linear-gradient(180deg, #0a0e1a 0%, #050810 100%)',
        borderTop: '1px solid rgba(68,97,171,0.3)',
        paddingTop: '4rem',
        paddingBottom: '2rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{maxWidth: '1280px', margin: '0 auto'}}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '3rem',
            marginBottom: '3rem',
            minWidth: 0
          }}>
            {/* Brand Column */}
            <div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                marginBottom: '1rem'
              }}>
                <span style={{color: '#1ab1ce', textShadow: '0 0 10px rgba(26,177,206,0.5)'}}>Guard</span>
                <span style={{color: '#4461ab'}}>Mo</span>
                <span style={{color: '#c41262'}}>Go</span>
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                Your digital watchdog protecting users from Mobile Money fraud. Report. Verify. Stay Safe.
              </p>
            </div>

            {/* Features Column */}
            <div>
              <h4 style={{
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '800',
                marginBottom: '1.5rem',
                marginTop: 0,
                padding: 0
              }}>Features</h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <li style={{padding: 0, margin: 0}}>
                  <button
                    onClick={() => {
                      setActiveSection('home')
                      setShowSearch(true)
                      setTimeout(() => {
                        document.getElementById('desktop-search-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        document.getElementById('desktop-search-input')?.focus()
                      }, 100)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >Check Number</button>
                  </li>
                <li>
                  <button
                    onClick={openReportFraudModal}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >Report Fraud</button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('dashboard')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >Fraud Dashboard</button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('safety-tips')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >Safety Tips</button>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 style={{
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '800',
                marginBottom: '1.5rem',
                marginTop: 0,
                padding: 0
              }}>Company</h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <li style={{padding: 0, margin: 0}}>
                  <button
                    onClick={() => {
                      setActiveSection('profile')
                      setProfileSection('about')
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >About Us</button>
                  </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveSection('profile')
                      setProfileSection('privacy')
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >Privacy Policy</button>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 style={{
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '800',
                marginBottom: '1.5rem',
                marginTop: 0,
                padding: 0
              }}>Support</h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <li style={{padding: 0, margin: 0}}>
                  <button
                    onClick={() => {
                      setActiveSection('profile')
                      setProfileSection('help')
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >Help Center</button>
                  </li>
                <li>
                  <button
                    onClick={() => setActiveSection('safety-tips')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      display: 'block',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      margin: 0,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1ab1ce'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >Safety Tips</button>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div style={{
            borderTop: '1px solid rgba(68,97,171,0.2)',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: '1rem',
            overflow: 'hidden'
          }}>
            <p style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              margin: 0,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              © {new Date().getFullYear()} GuardMoGo. All rights reserved.
            </p>
            <div style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'nowrap',
              flexShrink: 0
            }}>
              <a href="#" style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1ab1ce'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >Privacy</a>
              <a href="#" style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1ab1ce'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >Terms</a>
              <a href="#" style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1ab1ce'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Safety Tip Details Modal */}
      {selectedTip && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTip(null)
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(22,25,44,0.98) 0%, rgba(30,35,55,0.98) 100%)',
              border: `3px solid ${selectedTip.color}`,
              borderRadius: '2rem',
              padding: '3rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: `0 30px 80px ${selectedTip.color}40`,
              position: 'relative',
              animation: 'fadeInUp 0.4s ease-out'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTip(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(196,18,98,0.2)',
                border: '2px solid rgba(196,18,98,0.5)',
                color: '#fca5a5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(196,18,98,0.4)'
                e.currentTarget.style.transform = 'rotate(90deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(196,18,98,0.2)'
                e.currentTarget.style.transform = 'rotate(0deg)'
              }}
            >
              <FiX size={20} />
            </button>

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.5rem',
              marginBottom: '2rem',
              paddingRight: '3rem'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: `linear-gradient(135deg, ${selectedTip.color} 0%, ${selectedTip.color}dd 100%)`,
                borderRadius: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: `0 10px 30px ${selectedTip.color}50`,
                flexShrink: 0
              }}>
                {selectedTip.icon}
              </div>
              <div style={{flex: 1}}>
                <h2 style={{
                  color: '#ffffff',
                  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                  fontWeight: '900',
                  marginBottom: '0.75rem',
                  lineHeight: '1.2'
                }}>{selectedTip.title}</h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '1.125rem',
                  lineHeight: '1.6'
                }}>{selectedTip.desc}</p>
              </div>
            </div>

            {/* Details */}
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: `rgba(${selectedTip.color === '#1ab1ce' ? '26,177,206' : selectedTip.color === '#4461ab' ? '68,97,171' : '196,18,98'},0.15)`,
              borderRadius: '1rem',
              borderLeft: `5px solid ${selectedTip.color}`
            }}>
              <p style={{
                margin: 0,
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '1.0625rem',
                lineHeight: '1.7'
              }}>{selectedTip.details}</p>
            </div>

            {/* Example Scenarios */}
            <div>
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: '800',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <FiAlertTriangle size={24} style={{color: selectedTip.color}} />
                Example Scenarios:
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {selectedTip.examples.map((example, exIdx) => (
                  <div
                    key={exIdx}
                    style={{
                      padding: '1.25rem',
                      background: 'rgba(22,25,44,0.7)',
                      borderRadius: '0.875rem',
                      borderLeft: `4px solid ${selectedTip.color}`,
                      transition: 'all 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(22,25,44,0.9)'
                      e.currentTarget.style.transform = 'translateX(5px)'
                      e.currentTarget.style.boxShadow = `0 8px 25px ${selectedTip.color}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(22,25,44,0.7)'
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <p style={{
                      margin: 0,
                      color: '#d1d5db',
                      fontSize: '1rem',
                      lineHeight: '1.7'
                    }}>{example}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {searchResults && searchResults.reports && searchResults.reports.length > 0 && (
        <ReportDetailsModal
          isOpen={showReportDetails}
          onClose={() => setShowReportDetails(false)}
          number={searchResults.number || searchNumber}
          reports={searchResults.reports}
          reportCount={searchResults.reportsCount || searchResults.reports.length}
        />
      )}
    </div>
  )
}

// Main App Component
function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('signin')
  const [reportFraudModalOpen, setReportFraudModalOpen] = useState(false)
  const { currentUser, userRole, userProfile, logout } = useAuth()
  const isMobile = useIsMobile()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const openAuthModal = (mode = 'signin') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  const openReportFraudModal = () => {
    setReportFraudModalOpen(true)
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      {isMobile ? (
        <MobileLayout 
          isScrolled={isScrolled} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          userRole={userRole}
          userProfile={userProfile}
          logout={logout}
          openAuthModal={openAuthModal}
          openReportFraudModal={openReportFraudModal}
        />
      ) : (
        <DesktopLayout 
          isScrolled={isScrolled}
          currentUser={currentUser}
          userRole={userRole}
          userProfile={userProfile}
          logout={logout}
          openAuthModal={openAuthModal}
          openReportFraudModal={openReportFraudModal}
        />
      )}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
      <ReportFraudModal 
        isOpen={reportFraudModalOpen} 
        onClose={() => setReportFraudModalOpen(false)}
        onOpenAuth={openAuthModal}
      />
    </>
  )
}

export default App
