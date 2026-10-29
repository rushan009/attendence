import pkg from "nepali-date-converter";

const NepaliDate = pkg.default || pkg;

/**
 * Returns today's date in Nepal Time (UTC+5:45) with both BS date string
 * and start-of-day AD Date object.
 */
export function getNepalToday() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(now); // "YYYY-MM-DD"
  const startOfDayAd = new Date(`${dateStr}T00:00:00+05:45`);

  const nepaliDate = new NepaliDate(startOfDayAd);
  const dateBs = nepaliDate.format("YYYY-MM-DD");

  return {
    dateStr,
    dateAd: startOfDayAd,
    dateBs,
  };
}

/**
 * Converts an AD date (Date instance or ISO string) to Bikram Sambat "YYYY-MM-DD"
 */
export function toBsDate(adDate) {
  try {
    const d = adDate instanceof Date ? adDate : new Date(adDate);
    const nepaliDate = new NepaliDate(d);
    return nepaliDate.format("YYYY-MM-DD");
  } catch (error) {
    return null;
  }
}

/**
 * Converts a Bikram Sambat "YYYY-MM-DD" string to start-of-day AD Date
 */
export function toAdDate(bsDateStr) {
  try {
    const nepaliDate = new NepaliDate(bsDateStr);
    return nepaliDate.toJsDate();
  } catch (error) {
    return null;
  }
}

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
      const d = new NepaliDate(year, monthIndex, day);
      const bs = d.getBS();
      if (bs.year === year && bs.month === monthIndex) {
        return day;
      }
    } catch (e) {}
  }
  return 30;
}

export default {
  getNepalToday,
  toBsDate,
  toAdDate,
  getDaysInBsMonth,
};
