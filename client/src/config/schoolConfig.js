/**
 * Single source of truth for presentation-level school identity.
 * Configured officially for भानु माध्यमिक विद्यालय (Bhanu Secondary School),
 * साँगुरीगढी–५, डाँडाबजार, धनकुटा.
 */

export const schoolConfig = {
  // Primary school identity (the school is the brand)
  schoolName: 'भानु माध्यमिक विद्यालय',
  schoolNameEnglish: 'Bhanu Secondary School',
  schoolNameNepali: 'भानु माध्यमिक विद्यालय',
  shortName: 'भानु मा.वि.',
  shortNameEnglish: 'Bhanu Sec. School',

  // Official Location from School Development Document
  location: 'साँगुरीगढी–५, डाँडाबजार, धनकुटा',
  locationNepali: 'साँगुरीगढी–५, डाँडाबजार, धनकुटा',
  locationEnglish: 'Sangurigadhi-5, Dandabazar, Dhankuta',
  locationShort: 'डाँडाबजार, धनकुटा',
  municipality: 'साँगुरीगढी गाउँपालिका–५',
  district: 'धनकुटा',
  province: 'कोशी प्रदेश',

  // Official Vision (विद्यालयको दृष्टिकोण)
  vision:
    'भानु माध्यमिक विद्यालय, डाँडाबजार तपाईँको मन मुटु भित्र, गुणस्तरीय, प्रविधिमैत्री, व्यावहारिक र जीवनोपयोगी शिक्षाको केन्द्र ।',

  // Official Mission (विद्यालयको ध्येय)
  mission:
    'प्रत्येक विद्यार्थीमा नैतिक आचरण, आलोचनात्मक चेत, नवप्रवर्तनशील क्षमता र प्राविधिक दक्षता अभिवृद्धि गर्दै २१ औँ शताब्दीका चुनौतीहरूसँग प्रतिस्पर्धा गर्न सक्ने स्वावलम्बी नागरिक निर्माण गर्नु।',

  // System purpose description
  purpose: 'विद्यालयको आन्तरिक डिजिटल हाजिरी तथा अभिलेख व्यवस्थापन प्रणाली',
  purposeEnglish: "Internal digital attendance and record management workspace",

  // School classification
  schoolType: 'माध्यमिक विद्यालय',
  schoolTypeEnglish: 'Secondary School',

  // Calendar & Academic standard
  academicYear: '२०८३ BS',
  academicYearEnglish: '2083 BS',
  calendarSystem: 'विक्रम संवत् (वि.सं.)',

  // Unconfirmed details intentionally left null per guidelines
  logo: null,
  address: 'साँगुरीगढी–५, डाँडाबजार, धनकुटा',
  contactEmail: null,
  contactPhone: null,
  website: null,
  principalName: null,
  motto: null,

  // Authorized user roles within this school workspace
  authorizedRoles: [
    {
      id: 'admin',
      title: 'विद्यालय प्रशासक',
      titleEnglish: 'School Administrator',
      description:
        'सम्पूर्ण विद्यालयको हाजिरी प्रणाली, शिक्षक स्वीकृति तथा प्रशासनिक व्यवस्थापन।',
    },
    {
      id: 'teacher',
      title: 'कक्षा शिक्षक',
      titleEnglish: 'Class Teacher',
      description:
        'तोकिएको कक्षा तथा सेक्सनको दैनिक विद्यार्थी हाजिरी तथा रोल कल व्यवस्थापन।',
    },
  ],
}

export default schoolConfig

