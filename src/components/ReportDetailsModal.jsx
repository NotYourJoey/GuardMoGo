import { useState } from 'react'
import { FiAlertTriangle, FiCheckCircle, FiFileText, FiBarChart2 } from 'react-icons/fi'

export default function ReportDetailsModal({ isOpen, onClose, number, reports, reportCount }) {
  if (!isOpen || !reports || reports.length === 0) return null

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Unknown date'
    }
  }

  return (
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
        maxWidth: '600px',
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

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <FiAlertTriangle style={{ fontSize: '1.5rem', color: '#c41262' }} />
            <h2 style={{
              color: '#c41262',
              fontSize: '1.5rem',
              fontWeight: '900',
              margin: 0
            }}>
              Number Flagged
            </h2>
          </div>
          <div style={{
            color: '#ffffff',
            fontWeight: '700',
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            marginBottom: '0.5rem',
            wordBreak: 'break-all',
            overflowWrap: 'break-word',
            maxWidth: '100%'
          }}>
            {number}
          </div>
          <div style={{
            color: '#9ca3af',
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <FiBarChart2 style={{display: 'inline-block', marginRight: '0.5rem', flexShrink: 0}} />
            <span>Reported <strong style={{
              color: '#c41262',
              fontSize: 'clamp(0.8125rem, 2.5vw, 0.9375rem)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>{(reportCount || reports.length).toLocaleString()}</strong> time{reportCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Reports List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            fontWeight: '800',
            marginBottom: '0.5rem',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            All Reports ({reports.length.toLocaleString()})
          </h3>
          
          {reports.map((report, index) => (
            <div
              key={report.id || index}
              style={{
                background: 'rgba(22,25,44,0.8)',
                border: '2px solid rgba(68,97,171,0.3)',
                borderRadius: '1rem',
                padding: '1.25rem',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Report Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <div style={{
                    color: '#1ab1ce',
                    fontWeight: '700',
                    fontSize: '0.875rem'
                  }}>
                    Report #{index + 1}
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
                            textTransform: 'capitalize'
                          }}>
                            {report.status === 'pending' || report.status === 'reviewed' ? 'active' : report.status}
                          </div>
                        )}
              </div>

              {/* Fraud Type */}
              {report.fraudType && (
                <div style={{
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem'
                  }}>
                    Fraud Type
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.875rem'
                  }}>
                    {report.fraudType}
                  </div>
                </div>
              )}

              {/* Carrier */}
              {report.carrier && (
                <div style={{
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem'
                  }}>
                    Carrier
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    {report.carrier}
                  </div>
                </div>
              )}

              {/* Description */}
              {report.description && (
                <div style={{
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    Description
                  </div>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    lineHeight: '1.6'
                  }}>
                    {report.description}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {report.verified && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(68,97,171,0.2)'
                }}>
                  <div style={{
                    color: '#1ab1ce',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <FiCheckCircle />
                    <span>Verified</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Warning Message - Only show if 2 or more reports */}
        {reportCount >= 2 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(196, 18, 98, 0.1)',
            border: '1px solid rgba(196, 18, 98, 0.3)',
            borderRadius: '0.875rem',
            color: '#fca5a5',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <FiAlertTriangle style={{fontSize: '1.125rem', flexShrink: 0, marginTop: '0.125rem'}} />
            <div>
              <strong>Warning:</strong> This number has been reported multiple times ({reportCount || reports.length} reports). Exercise extreme caution when dealing with this number.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

