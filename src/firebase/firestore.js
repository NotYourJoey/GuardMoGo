import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment
} from 'firebase/firestore'
import { db } from './config'

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  REPORTS: 'reports',
  NUMBERS: 'numbers',
  COMMENTS: 'comments',
  ALERTS: 'alerts'
}

// ==================== REPORTS ====================

/**
 * Create a new fraud report
 * @param {Object} reportData - Report data
 * @param {string} reportData.number - MoMo number reported
 * @param {string} reportData.description - Description of the fraud
 * @param {string} reportData.category - Category of fraud
 * @param {string} reportData.userId - ID of the user reporting
 * @param {Array} reportData.evidence - Array of evidence URLs/files
 * @returns {Promise<string>} - Report document ID
 */
export const createReport = async (reportData) => {
  try {
    const reportRef = await addDoc(collection(db, COLLECTIONS.REPORTS), {
      ...reportData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active', // Reports are active immediately, no review needed
      verified: true, // Auto-verified when reported
      upvotes: 0,
      downvotes: 0,
      commentsCount: 0
    })

    // Update or create number document
    await updateNumberReport(reportData.number, reportRef.id)

    // Increment user's report count (only if user is authenticated)
    if (reportData.userId) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, reportData.userId), {
          reportsCount: increment(1)
        })
      } catch (error) {
        // If user update fails (e.g., insufficient permissions), log but don't fail the report
        console.warn('Could not update user report count:', error)
      }
    }

    return reportRef.id
  } catch (error) {
    console.error('Error creating report:', error)
    throw error
  }
}

/**
 * Get all reports with optional filters
 * @param {Object} options - Query options
 * @param {number} options.limitCount - Limit number of results
 * @param {string} options.orderByField - Field to order by (default: 'createdAt')
 * @param {string} options.orderDirection - 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Array>} - Array of reports
 */
export const getReports = async ({
  limitCount = 50,
  orderByField = 'createdAt',
  orderDirection = 'desc'
} = {}) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.REPORTS),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching reports:', error)
    throw error
  }
}

/**
 * Get a single report by ID
 * @param {string} reportId - Report document ID
 * @returns {Promise<Object>} - Report data
 */
export const getReport = async (reportId) => {
  try {
    const reportDoc = await getDoc(doc(db, COLLECTIONS.REPORTS, reportId))
    if (reportDoc.exists()) {
      return {
        id: reportDoc.id,
        ...reportDoc.data()
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching report:', error)
    throw error
  }
}

/**
 * Get reports by user ID
 * @param {string} userId - User ID
 * @param {number} limitCount - Limit number of results (default: 50)
 * @returns {Promise<Array>} - Array of reports
 */
export const getUserReports = async (userId, limitCount = 50) => {
  try {
    // First try with orderBy
    let querySnapshot
    try {
      const q = query(
        collection(db, COLLECTIONS.REPORTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      querySnapshot = await getDocs(q)
    } catch (queryError) {
      // If orderBy fails (missing index), try without it
      console.warn('Query with orderBy failed, trying without:', queryError)
      const simpleQuery = query(
        collection(db, COLLECTIONS.REPORTS),
        where('userId', '==', userId),
        limit(limitCount)
      )
      querySnapshot = await getDocs(simpleQuery)
    }
    
    let reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Sort in memory if orderBy failed
    reports.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0
      return bTime - aTime // Descending order
    })

    return reports
  } catch (error) {
    console.error('Error fetching user reports:', error)
    throw error
  }
}

// ==================== NUMBERS ====================

/**
 * Check if a number has been reported
 * @param {string} number - MoMo number to check
 * @returns {Promise<Object|null>} - Number data if found, null otherwise
 */
export const checkNumber = async (number) => {
  try {
    // First, query reports directly to see if any exist for this number
    // This works even if there's no numbers document
    const reportsQuery = query(
      collection(db, COLLECTIONS.REPORTS),
      where('number', '==', number)
    )
    
    const reportsSnapshot = await getDocs(reportsQuery)
    const reports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Sort reports by createdAt in memory (newest first)
    reports.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0
      return bTime - aTime // Descending order
    })

    // Check if number document exists
    const numberDoc = await getDoc(doc(db, COLLECTIONS.NUMBERS, number))
    
    if (numberDoc.exists()) {
      const data = numberDoc.data()
      return {
        ...data,
        reports,
        reportsCount: reports.length
      }
    }

    // If reports exist but no number document, return the reports
    if (reports.length > 0) {
      return {
        number,
        reports,
        reportsCount: reports.length,
        flagged: true
      }
    }

    // No reports found
    return null
  } catch (error) {
    console.error('Error checking number:', error)
    // Provide more specific error message
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your Firestore security rules.')
    }
    throw error
  }
}

/**
 * Update or create number document with report reference
 * Automatically flags the number immediately when reported (no verification needed)
 * @param {string} number - MoMo number (should be normalized)
 * @param {string} reportId - Report document ID
 */
const updateNumberReport = async (number, reportId) => {
  try {
    // Normalize the number to ensure consistency (remove spaces, ensure format)
    const normalizedNumber = number.replace(/\s+/g, '').replace(/^\+233/, '0')
    
    const numberRef = doc(db, COLLECTIONS.NUMBERS, normalizedNumber)
    const numberDoc = await getDoc(numberRef)

    if (numberDoc.exists()) {
      // Update existing number - ensure it's always flagged
      const existingData = numberDoc.data()
      await updateDoc(numberRef, {
        reportsCount: increment(1),
        lastReportedAt: Timestamp.now(),
        reportIds: [...(existingData.reportIds || []), reportId],
        flagged: true, // Always flagged when reported
        verified: true // Auto-verified when reported
      })
    } else {
      // Create new number document - immediately flagged when reported
      await setDoc(numberRef, {
        number: normalizedNumber,
        reportsCount: 1,
        firstReportedAt: Timestamp.now(),
        lastReportedAt: Timestamp.now(),
        reportIds: [reportId],
        flagged: true, // Automatically flagged when first reported
        verified: true // Auto-verified when reported
      })
    }
  } catch (error) {
    console.error('Error updating number:', error)
    throw error
  }
}

/**
 * Get top reported numbers
 * @param {number} limitCount - Number of results (default: 10)
 * @returns {Promise<Array>} - Array of top reported numbers
 */
export const getTopReportedNumbers = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NUMBERS),
      orderBy('reportsCount', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching top numbers:', error)
    throw error
  }
}

// ==================== COMMENTS ====================

/**
 * Add a comment to a report
 * @param {string} reportId - Report document ID
 * @param {Object} commentData - Comment data
 * @param {string} commentData.userId - User ID
 * @param {string} commentData.text - Comment text
 * @returns {Promise<string>} - Comment document ID
 */
export const addComment = async (reportId, commentData) => {
  try {
    const commentRef = await addDoc(
      collection(db, COLLECTIONS.COMMENTS),
      {
        ...commentData,
        reportId,
        createdAt: Timestamp.now()
      }
    )

    // Increment comment count on report
    await updateDoc(doc(db, COLLECTIONS.REPORTS, reportId), {
      commentsCount: increment(1)
    })

    return commentRef.id
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

/**
 * Get comments for a report
 * @param {string} reportId - Report document ID
 * @returns {Promise<Array>} - Array of comments
 */
export const getComments = async (reportId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.COMMENTS),
      where('reportId', '==', reportId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
}

// ==================== DASHBOARD STATS ====================

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} - Dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    // Get total reports
    const reportsSnapshot = await getDocs(collection(db, COLLECTIONS.REPORTS))
    const totalReports = reportsSnapshot.size

    // Get total numbers
    const numbersSnapshot = await getDocs(collection(db, COLLECTIONS.NUMBERS))
    const totalNumbers = numbersSnapshot.size

    // Get active reports (all reports are active immediately)
    const activeQuery = query(
      collection(db, COLLECTIONS.REPORTS),
      where('status', '==', 'active')
    )
    const activeSnapshot = await getDocs(activeQuery)
    const activeReports = activeSnapshot.size

    // Get top reported numbers
    const topNumbers = await getTopReportedNumbers(5)

    return {
      totalReports,
      totalNumbers,
      activeReports,
      topNumbers
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

