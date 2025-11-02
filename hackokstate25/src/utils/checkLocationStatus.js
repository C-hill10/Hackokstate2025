/**
 * Check if a location is currently open based on its hours
 * @param {Array} hours - Array of hour entries with day and hours fields
 * @returns {Object} - { isOpen: boolean, reason: string }
 */
export function checkLocationStatus(hours) {
    if (!hours || !Array.isArray(hours) || hours.length === 0) {
        return { isOpen: null, reason: 'No hours information available' }
    }

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Map day names to day numbers
    const dayMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
    }

    // Helper function to parse time string (e.g., "8 a.m.", "11 p.m.")
    function parseTime(timeStr) {
        const trimmed = timeStr.trim().toLowerCase()

        // Handle "Closed"
        if (trimmed.includes('closed')) {
            return null
        }

        // Extract hour and period (am/pm)
        const match = trimmed.match(/(\d{1,2})\s*(:(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/)
        if (!match) return null

        let hour = parseInt(match[1])
        const minute = match[3] ? parseInt(match[3]) : 0
        const period = match[4].toLowerCase()

        // Convert to 24-hour format
        if (period.includes('p')) {
            if (hour !== 12) hour += 12
        } else if (period.includes('a')) {
            if (hour === 12) hour = 0
        }

        return hour * 60 + minute // Return time in minutes
    }

    // Helper function to check if current day matches day range
    function dayMatches(dayStr, currentDayNum) {
        const dayLower = dayStr.toLowerCase().trim()

        // Handle "Daily"
        if (dayLower === 'daily') {
            return true
        }

        // Handle "Closed"
        if (dayLower.includes('closed')) {
            return false
        }

        // Handle day ranges like "Monday - Thursday"
        if (dayLower.includes('-')) {
            const [startDay, endDay] = dayLower.split('-').map(d => d.trim())
            const startDayNum = dayMap[startDay]
            const endDayNum = dayMap[endDay]

            if (startDayNum !== undefined && endDayNum !== undefined) {
                // Handle wrapping (e.g., Friday - Sunday)
                if (startDayNum > endDayNum) {
                    return currentDayNum >= startDayNum || currentDayNum <= endDayNum
                } else {
                    return currentDayNum >= startDayNum && currentDayNum <= endDayNum
                }
            }
        }

        // Handle single day
        const dayNum = dayMap[dayLower]
        return dayNum !== undefined && dayNum === currentDayNum
    }

    // Check each hour entry
    for (const entry of hours) {
        const { day, hours: hoursStr } = entry

        if (!day || !hoursStr) continue

        // Check if current day matches
        if (!dayMatches(day, currentDay)) {
            continue
        }

        // Check if closed
        if (hoursStr.toLowerCase().includes('closed')) {
            return { isOpen: false, reason: `Closed on ${day}` }
        }

        // Parse hours string (e.g., "8 a.m. to 11 p.m.")
        const timeMatch = hoursStr.match(/(.+?)\s+to\s+(.+)/i)
        if (!timeMatch) {
            // Try to parse as single time or other formats
            return { isOpen: null, reason: `Unable to parse hours: ${hoursStr}` }
        }

        const openTime = parseTime(timeMatch[1])
        const closeTime = parseTime(timeMatch[2])

        if (openTime === null || closeTime === null) {
            continue // Skip this entry if we can't parse times
        }

        // Check if current time is within open hours
        // Handle case where closing time is next day (e.g., 11 p.m. to 1 a.m.)
        if (closeTime < openTime) {
            // Closing time is next day
            if (currentTimeInMinutes >= openTime || currentTimeInMinutes < closeTime) {
                return { isOpen: true, reason: `Open until ${timeMatch[2]}` }
            }
        } else {
            // Normal hours (same day)
            if (currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime) {
                return { isOpen: true, reason: `Open until ${timeMatch[2]}` }
            }
        }
    }

    // If we get here, no matching hours found for current day/time
    return { isOpen: false, reason: 'Not open at this time' }
}
