/**
 * nepaliDate.js
 * Utility to format Bikram Sambat (BS) date and Gregorian (AD) equivalent.
 */
import pkg from 'nepali-date-converter'

const NepaliDate = pkg.default || pkg

export const NEPALI_MONTHS = [
  { en: 'Baisakh', ne: 'वैशाख' },
  { en: 'Jestha', ne: 'जेठ' },
  { en: 'Ashadh', ne: 'असार' },
  { en: 'Shrawan', ne: 'साउन' },
  { en: 'Bhadra', ne: 'भदौ' },
  { en: 'Ashwin', ne: 'असोज' },
  { en: 'Kartik', ne: 'कार्तिक' },
  { en: 'Mangsir', ne: 'मंसिर' },
  { en: 'Poush', ne: 'पुस' },
  { en: 'Magh', ne: 'माघ' },
  { en: 'Falgun', ne: 'फागुन' },
  { en: 'Chaitra', ne: 'चैत' },
]

export const NEPALI_DAYS = [
  { en: 'Sunday', ne: 'आइतबार' },
  { en: 'Monday', ne: 'सोमबार' },
  { en: 'Tuesday', ne: 'मङ्गलबार' },
  { en: 'Wednesday', ne: 'बुधबार' },
  { en: 'Thursday', ne: 'बिहीबार' },
  { en: 'Friday', ne: 'शुक्रबार' },
  { en: 'Saturday', ne: 'शनिबार' },
]

export const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

export function toDevanagariDigits(num) {
  if (num === null || num === undefined) return ''
  return String(num).replace(/\d/g, (d) => DEVANAGARI_DIGITS[parseInt(d, 10)])
}

/**
 * Returns formatted dual calendar representation (BS & AD) for today or a given Date.
 */
export function getDualCalendarDate(dateObj = new Date()) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj)

  // AD formatted
  const adDay = d.getDate()
  const adMonthName = d.toLocaleString('en-US', { month: 'short' })
  const adYear = d.getFullYear()
  const dayOfWeek = d.getDay()
  const dayNameEn = NEPALI_DAYS[dayOfWeek]?.en || ''
  const dayNameNe = NEPALI_DAYS[dayOfWeek]?.ne || ''

  // Accurate BS calculation using official Bikram Sambat conversion tables
  let bsYear = adYear + 57
  let bsMonthIndex = 0
  let bsDay = 1

  try {
    const nepaliDate = new NepaliDate(d)
    bsYear = nepaliDate.getYear()
    bsMonthIndex = nepaliDate.getMonth()
    bsDay = nepaliDate.getDate()
  } catch (e) {
    // Fallback if parsing fails
  }

  const bsMonthNameNe = NEPALI_MONTHS[bsMonthIndex]?.ne || 'कार्तिक'
  const bsMonthNameEn = NEPALI_MONTHS[bsMonthIndex]?.en || 'Kartik'

  return {
    bsDateFormatted: `${toDevanagariDigits(bsDay)} ${bsMonthNameNe} ${toDevanagariDigits(bsYear)}`,
    bsDateWithDay: `${toDevanagariDigits(bsDay)} ${bsMonthNameNe} ${toDevanagariDigits(bsYear)}, ${dayNameNe}`,
    bsNumeric: `${bsYear}-${String(bsMonthIndex + 1).padStart(2, '0')}-${String(bsDay).padStart(2, '0')} BS`,
    bsDateOnly: `${bsYear}-${String(bsMonthIndex + 1).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`,
    adFormatted: `${adDay} ${adMonthName} ${adYear}`,
    adWithDay: `${adDay} ${adMonthName} ${adYear}, ${dayNameEn}`,
    dayNameEn,
    dayNameNe,
  }
}

/**
 * Formats a BS date string "YYYY-MM-DD" into human-readable Devanagari and English representations.
 */
export function formatBsDate(bsDateStr) {
  if (!bsDateStr) return { formatted: '', english: '', numeric: '' }
  try {
    const parts = String(bsDateStr).split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const monthNe = NEPALI_MONTHS[monthIdx]?.ne || ''
      const monthEn = NEPALI_MONTHS[monthIdx]?.en || ''
      return {
        formatted: `${toDevanagariDigits(day)} ${monthNe} ${toDevanagariDigits(year)}`,
        english: `${day} ${monthEn} ${year}`,
        numeric: `${bsDateStr} BS`,
      }
    }
  } catch (e) {
    // ignore
  }
  return {
    formatted: bsDateStr,
    english: bsDateStr,
    numeric: `${bsDateStr} BS`,
  }
}

export const ATTENDANCE_THRESHOLD = 75

/**
 * Calculates number of days in a specific BS month dynamically
 * using the nepali-date-converter calendar tables.
 * @param {number} year - BS year (e.g. 2083)
 * @param {number} monthIndex - 0-indexed month (0 = Baisakh, 6 = Kartik, 11 = Chaitra)
 * @returns {number} Days in month (typically 29 to 32)
 */
export function getDaysInBsMonth(year, monthIndex) {
  for (let day = 32; day >= 29; day--) {
    try {
      const d = new NepaliDate(year, monthIndex, day)
      const bs = d.getBS()
      if (bs.year === year && bs.month === monthIndex) {
        return day
      }
    } catch (e) {}
  }
  return 30
}

/**
 * Returns the day of the week for the 1st of a BS month (0 = Sunday, 6 = Saturday)
 * @param {number} year
 * @param {number} monthIndex
 * @returns {number} 0-6
 */
export function getBsMonthFirstDayOfWeek(year, monthIndex) {
  try {
    const d = new NepaliDate(year, monthIndex, 1)
    return d.getDay()
  } catch (e) {
    return 0
  }
}

/**
 * Formats a BS date "YYYY-MM-DD" into a concise day and month string (e.g. "2 Kartik")
 */
export function formatBsDayMonth(bsDateStr) {
  if (!bsDateStr) return ''
  try {
    const parts = String(bsDateStr).split('-')
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const monthName = NEPALI_MONTHS[monthIdx]?.en || ''
      return `${day} ${monthName}`
    }
  } catch (e) {}
  return bsDateStr
}

/**
 * Formats a month and year into heading format like "Kartik 2083 BS"
 */
export function formatBsYearMonth(year, monthIndex) {
  const monthName = NEPALI_MONTHS[monthIndex]?.en || ''
  return `${monthName} ${year} BS`
}

/**
 * Parses "YYYY-MM-DD" into { year, monthIndex, day }
 */
export function parseBsDate(bsDateStr) {
  if (!bsDateStr) return null
  const parts = String(bsDateStr).split('-')
  if (parts.length !== 3) return null
  return {
    year: parseInt(parts[0], 10),
    monthIndex: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  }
}

/**
 * Generates an editorial heading like "Class 5A · 2 to 4 Kartik 2083 BS"
 */
export function formatBsRangeHeading(fromBs, toBs, className = '') {
  const prefix = className ? `${className} · ` : ''
  if (!fromBs || !toBs) return `${prefix}Attendance Report`

  const fromParsed = parseBsDate(fromBs)
  const toParsed = parseBsDate(toBs)
  if (!fromParsed || !toParsed) return `${prefix}${fromBs} to ${toBs}`

  const fromMonthName = NEPALI_MONTHS[fromParsed.monthIndex]?.en || ''
  const toMonthName = NEPALI_MONTHS[toParsed.monthIndex]?.en || ''

  if (fromBs === toBs) {
    return `${prefix}${fromParsed.day} ${fromMonthName} ${fromParsed.year} BS`
  }

  if (fromParsed.year === toParsed.year && fromParsed.monthIndex === toParsed.monthIndex) {
    return `${prefix}${fromParsed.day} to ${toParsed.day} ${fromMonthName} ${fromParsed.year} BS`
  }

  if (fromParsed.year === toParsed.year) {
    return `${prefix}${fromParsed.day} ${fromMonthName} to ${toParsed.day} ${toMonthName} ${fromParsed.year} BS`
  }

  return `${prefix}${fromParsed.day} ${fromMonthName} ${fromParsed.year} to ${toParsed.day} ${toMonthName} ${toParsed.year} BS`
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Formats a BS date "YYYY-MM-DD" into e.g. "Wed, 11 Kartik"
 */
export function formatBsWithWeekday(bsDateStr) {
  if (!bsDateStr) return ''
  try {
    const nd = new NepaliDate(bsDateStr)
    const dayOfWeek = nd.getDay()
    const weekday = WEEKDAY_SHORT[dayOfWeek] || ''
    const bs = nd.getBS()
    const monthName = NEPALI_MONTHS[bs.month]?.en || ''
    return `${weekday}, ${bs.date} ${monthName}`
  } catch (e) {
    return bsDateStr
  }
}

/**
 * Converts a BS date "YYYY-MM-DD" to short AD format, e.g. "Oct 28, 2026"
 */
export function getAdDateString(bsDateStr) {
  if (!bsDateStr) return ''
  try {
    const nd = new NepaliDate(bsDateStr)
    const jsDate = nd.toJsDate()
    return jsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (e) {
    return ''
  }
}

/**
 * Converts a Bikram Sambat "YYYY-MM-DD" string to start-of-day AD Date
 */
export function toAdDate(bsDateStr) {
  try {
    const nepaliDate = new NepaliDate(bsDateStr)
    return nepaliDate.toJsDate()
  } catch (error) {
    return null
  }
}

export default {
  ATTENDANCE_THRESHOLD,
  NEPALI_MONTHS,
  NEPALI_DAYS,
  DEVANAGARI_DIGITS,
  toDevanagariDigits,
  getDualCalendarDate,
  formatBsDate,
  getDaysInBsMonth,
  getBsMonthFirstDayOfWeek,
  formatBsDayMonth,
  formatBsYearMonth,
  parseBsDate,
  formatBsRangeHeading,
  formatBsWithWeekday,
  getAdDateString,
  toAdDate,
}
