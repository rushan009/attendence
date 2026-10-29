/**
 * Public Holidays Configuration (Bikram Sambat BS)
 * Single source of truth for official public holidays in Nepal.
 * Structured so that a MongoDB / Mongoose collection can replace it later.
 */

export const publicHolidays = [
  { dateBs: "2083-01-01", name: "Nepali New Year (नयाँ वर्ष)" },
  { dateBs: "2083-01-18", name: "Majdur Diwas / May Day (मजदुर दिवस)" },
  { dateBs: "2083-02-15", name: "Buddha Jayanti (बुद्ध जयन्ती)" },
  { dateBs: "2083-05-03", name: "Janai Purnima / Rakshya Bandhan (जनै पूर्णिमा)" },
  { dateBs: "2083-05-18", name: "Gai Jatra (गाई जात्रा)" },
  { dateBs: "2083-05-24", name: "Krishna Janmashtami (श्रीकृष्ण जन्माष्टमी)" },
  { dateBs: "2083-06-03", name: "Constitution Day (संविधान दिवस)" },
  { dateBs: "2083-07-01", name: "Ghatasthapana (घटस्थापना)" },
  { dateBs: "2083-07-07", name: "Fulpati (फूलपाती)" },
  { dateBs: "2083-07-08", name: "Maha Ashtami (महा अष्टमी)" },
  { dateBs: "2083-07-09", name: "Maha Navami (महा नवमी)" },
  { dateBs: "2083-07-10", name: "Vijaya Dashami (विजया दशमी)" },
  { dateBs: "2083-07-11", name: "Ekadashi (एकादशी)" },
  { dateBs: "2083-07-12", name: "Dwadashi (द्वादशी)" },
  { dateBs: "2083-07-28", name: "Laxmi Puja (लक्ष्मी पूजा)" },
  { dateBs: "2083-07-29", name: "Govardhan Puja (गोवर्धन पूजा)" },
  { dateBs: "2083-07-30", name: "Bhai Tika (भाइटीका)" },
  { dateBs: "2083-08-06", name: "Chhath Parva (छठ पर्व)" },
  { dateBs: "2083-09-10", name: "Udhauli / Yomari Punhi (उधौली पर्व)" },
  { dateBs: "2083-09-11", name: "Christmas Day (क्रिसमस डे)" },
  { dateBs: "2083-10-01", name: "Maghe Sankranti (माघे संक्रान्ति)" },
  { dateBs: "2083-10-16", name: "Martyrs' Day (शहीद दिवस)" },
  { dateBs: "2083-10-21", name: "Sonam Lhosar (सोनाम ल्होसार)" },
  { dateBs: "2083-11-07", name: "National Democracy Day (राष्ट्रिय प्रजातन्त्र दिवस)" },
  { dateBs: "2083-11-19", name: "Maha Shivaratri (महाशिवरात्रि)" },
  { dateBs: "2083-11-24", name: "International Women's Day (महिला दिवस)" },
  { dateBs: "2083-11-29", name: "Fagu Purnima / Holi (होली पर्व)" },
  { dateBs: "2083-12-14", name: "Ghode Jatra (घोडे जात्रा)" },
];

/**
 * Returns holiday matching exact BS date or null
 * @param {string} dateBs - "YYYY-MM-DD"
 */
export const getHolidayByBsDate = (dateBs) => {
  if (!dateBs) return null;
  return publicHolidays.find((h) => h.dateBs === dateBs) || null;
};

/**
 * Returns all holidays within the BS date range [fromBs, toBs]
 * @param {string} fromBs - "YYYY-MM-DD"
 * @param {string} toBs - "YYYY-MM-DD"
 */
export const getHolidaysInRange = (fromBs, toBs) => {
  return publicHolidays.filter((h) => h.dateBs >= fromBs && h.dateBs <= toBs);
};

export default {
  publicHolidays,
  getHolidayByBsDate,
  getHolidaysInRange,
};
