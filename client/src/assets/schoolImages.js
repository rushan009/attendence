import himalayanPeaks from './school/himalayan-peaks.jpg'
import campusFacadeBus from './school/campus-facade-bus.jpg'
import facultyMeeting from './school/faculty-meeting.jpg'
import assemblyStage from './school/assembly-stage.jpg'
import assemblyWide from './school/assembly-wide.jpg'
import assemblyBanner from './school/assembly-banner.jpg'
import assemblyFlag from './school/assembly-flag.jpg'
import primaryAssembly from './school/primary-assembly.jpg'
import campusVolleyball from './school/campus-volleyball.jpg'
import schoolLeadership from './school/school-leadership.jpg'
import campusHills from './school/campus-hills.jpg'
import academicBuildings from './school/academic-buildings.jpg'
import culturalMuseum from './school/cultural-museum.jpg'
import studentCraft from './school/student-craft.jpg'
import himalayaSchoolView from './school/himalaya-school-view.jpg'
import schoolMottoBoard from './school/school-motto-board.jpg'
import sunflowerGardens from './school/sunflower-gardens.jpg'
import mistyTerrace from './school/misty-terrace.jpg'

export {
  himalayanPeaks,
  campusFacadeBus,
  facultyMeeting,
  assemblyStage,
  assemblyWide,
  assemblyBanner,
  assemblyFlag,
  primaryAssembly,
  campusVolleyball,
  schoolLeadership,
  campusHills,
  academicBuildings,
  culturalMuseum,
  studentCraft,
  himalayaSchoolView,
  schoolMottoBoard,
  sunflowerGardens,
  mistyTerrace
}

export const GALLERY_CATEGORIES = [
  { id: 'all', label: 'All Photographs', ne: 'सबै तस्बिरहरू' },
  { id: 'campus', label: 'Campus & Scenery', ne: 'विद्यालय परिसर र प्रकृति' },
  { id: 'students', label: 'Students & Assemblies', ne: 'विद्यार्थी तथा प्रार्थना सभा' },
  { id: 'faculty', label: 'Faculty & Administration', ne: 'शिक्षक तथा प्रशासनिक टोली' },
  { id: 'culture', label: 'Culture & Creative Arts', ne: 'संस्कृति र सिर्जनशीलता' }
]

export const SCHOOL_GALLERY_IMAGES = [
  {
    id: 'himalaya-school-view',
    src: himalayaSchoolView,
    title: 'Bhanu Secondary School & Himalayan Peaks',
    nepaliTitle: 'हिमशृङ्खलाको काखमा भानु माध्यमिक विद्यालय',
    category: 'campus',
    aspect: 'landscape',
    caption: 'The school campus in Dandabazar, framed against the majestic snow peaks of the Eastern Himalayas rising behind the green hills.',
    nepaliCaption: 'डाँडाबजारको रमणीय डाँडामा अवस्थित विद्यालय र पृष्ठभूमिको मनमोहक हिमशृङ्खला।',
    featured: true
  },
  {
    id: 'campus-volleyball',
    src: campusVolleyball,
    title: 'School Courtyard & Morning Sports',
    nepaliTitle: 'विद्यालयको खेलमैदान र भलिबल खेल',
    category: 'campus',
    aspect: 'landscape',
    caption: 'Students gathered in the central courtyard during a volleyball match overlooking the terraced hills of Sangurigadhi.',
    nepaliCaption: 'साँगुरीगढीको पहाडी दृश्यसँगै प्राङ्गणमा भलिबल प्रतियोगिता र विद्यार्थीहरूको उत्साह।',
    featured: true
  },
  {
    id: 'himalayan-peaks',
    src: himalayanPeaks,
    title: 'Panoramic Vista of the Himalayas',
    nepaliTitle: 'साँगुरीगढीबाट देखिने मनोरम हिमदृश्य',
    category: 'campus',
    aspect: 'panoramic',
    caption: 'Clear morning view of the Himalayan ranges visible directly from the Sangurigadhi-5 mountain ridge.',
    nepaliCaption: 'डाँडाबजारबाट बिहानीपख देखिने कञ्चनजङ्घा तथा कुम्भकर्ण हिमशृङ्खला। (तस्बिर: सरोज लिम्बू)',
    featured: true
  },
  {
    id: 'sunflower-gardens',
    src: sunflowerGardens,
    title: 'Terraced Campus Gardens & Sunflowers',
    nepaliTitle: 'सिँढीयुक्त बगैँचा र सूर्यमुखी फूलहरू',
    category: 'campus',
    aspect: 'landscape',
    caption: 'Blooming sunflower terraces and stone staircases connecting classroom blocks along the hillsides.',
    nepaliCaption: 'विद्यालय परिसरको हरियाली, फुल्दै गरेका सूर्यमुखी फूल र ढुङ्गेनी सिँढीहरू।',
    featured: true
  },
  {
    id: 'assembly-stage',
    src: assemblyStage,
    title: 'Student Body Morning Assembly',
    nepaliTitle: 'विद्यार्थी तथा शिक्षकहरूको संयुक्त प्रार्थना सभा',
    category: 'students',
    aspect: 'landscape',
    caption: 'Students and educators assembled at the outdoor stage canopy for the morning routine and pledge.',
    nepaliCaption: 'विशेष कार्यक्रम तथा दैनिक बिहानी प्रार्थना सभामा सहभागी विद्यार्थी तथा शिक्षक वर्ग।',
    featured: true
  },
  {
    id: 'primary-assembly',
    src: primaryAssembly,
    title: 'Primary School Assembly & Teachers',
    nepaliTitle: 'आधारभूत तहका विद्यार्थी तथा शिक्षकहरू',
    category: 'students',
    aspect: 'landscape',
    caption: 'Junior school students in uniform with their teachers on the campus assembly pavilion.',
    nepaliCaption: 'विद्यालय पोसाकमा सजिएका प्राथमिक तहका साना नानीबाबुहरू र शिक्षकशिक्षिका।',
    featured: false
  },
  {
    id: 'student-craft',
    src: studentCraft,
    title: 'Student Handicraft & Creative Expression',
    nepaliTitle: 'विद्यार्थीको हस्तकला र सिर्जनात्मक प्रतिभा',
    category: 'culture',
    aspect: 'portrait',
    caption: 'A student proudly presenting handmade floral craft and gift packaging wearing the official Bhanu Secondary School crest.',
    nepaliCaption: 'विद्यालयको लोगो अङ्कित पोसाकमा आफ्ना हातले बनाएका आकर्षक हस्तकला सामग्री प्रदर्शन गर्दै विद्यार्थी।',
    featured: true
  },
  {
    id: 'cultural-museum',
    src: culturalMuseum,
    title: 'School Cultural Heritage & Art Gallery',
    nepaliTitle: 'विद्यालयको सांस्कृतिक सङ्ग्रहालय र कलाकक्ष',
    category: 'culture',
    aspect: 'landscape',
    caption: 'Classroom exhibition preserving indigenous crafts, traditional utensils, national symbols, and student artwork.',
    nepaliCaption: 'परम्परागत नेपाली कला, माटो तथा काठका सामग्री र विद्यार्थीका हस्तकलाले सजिएको सांस्कृतिक कक्ष।',
    featured: true
  },
  {
    id: 'school-leadership',
    src: schoolLeadership,
    title: 'School Administration & Faculty Leadership',
    nepaliTitle: 'विद्यालय व्यवस्थापन तथा प्रशासनिक नेतृत्व',
    category: 'faculty',
    aspect: 'landscape',
    caption: 'School leadership, headmaster, and faculty representatives outside the administration block and campus transport.',
    nepaliCaption: 'विद्यालयको शैक्षिक तथा प्रशासनिक नेतृत्व सम्हाल्नुहुने आदरणीय शिक्षक तथा प्रशासकहरू।',
    featured: true
  },
  {
    id: 'faculty-meeting',
    src: facultyMeeting,
    title: 'Faculty Academic Coordination Conference',
    nepaliTitle: 'शिक्षक तथा कर्मचारीहरूको शैक्षिक समन्वय बैठक',
    category: 'faculty',
    aspect: 'landscape',
    caption: 'Educators and staff conducting a regular academic review and curriculum planning session in the school conference hall.',
    nepaliCaption: 'शैक्षिक सुधार, दैनिक पठनपाठन र विद्यार्थी मूल्याङ्कन सम्बन्धमा आयोजित बैठक।',
    featured: true
  },
  {
    id: 'academic-buildings',
    src: academicBuildings,
    title: 'Multi-Storey Academic & Technical Wings',
    nepaliTitle: 'विद्यालयका आधुनिक शैक्षिक भवनहरू',
    category: 'campus',
    aspect: 'landscape',
    caption: 'Modern multi-storey blue-roofed academic blocks housing general classrooms and technical stream laboratories.',
    nepaliCaption: 'साँगुरीगढीको हरियाली बीच नीलो जस्तापाताले छाएका बहुवर्षीय पक्की शैक्षिक भवनहरू।',
    featured: false
  },
  {
    id: 'school-motto-board',
    src: schoolMottoBoard,
    title: 'Campus Entry Motto & Student Pledge',
    nepaliTitle: 'दैनिक प्रेरणादायी विद्यार्थी प्रतिज्ञा',
    category: 'culture',
    aspect: 'portrait',
    caption: '“आज म विद्यालय आएँ, अनुशासित भएर हरेक घण्टीमा कम्तिमा एक एक वटा नयाँ कुरा सिक्ने छु।” (Today I came to school. Disciplined, in every period I will learn at least one new thing.)',
    nepaliCaption: 'दैनिक बिहान विद्यालय प्रवेश गर्दा प्रत्येक विद्यार्थीलाई अनुशासित र जिज्ञासु बनाउने मूल मन्त्र।',
    featured: true
  },
  {
    id: 'campus-facade-bus',
    src: campusFacadeBus,
    title: 'Main School Wing & Student Transport',
    nepaliTitle: 'विद्यालयको मुख्य प्रवेशद्वार तथा बस सेवा',
    category: 'faculty',
    aspect: 'portrait',
    caption: 'The front entrance showing the school nameplate: Shree Bhanu Secondary School (Model General Technical Stream) and school bus.',
    nepaliCaption: 'नमुना प्राविधिक धार सहितको भानु माध्यमिक विद्यालयको मुख्य भवन र यातायात सेवा।',
    featured: false
  },
  {
    id: 'misty-terrace',
    src: mistyTerrace,
    title: 'Morning Fog Over Mountain Walkways',
    nepaliTitle: 'कुहिरोमा ढाकिएको पहाडी बाटो र परिसर',
    category: 'campus',
    aspect: 'landscape',
    caption: 'Atmospheric mountain mist rolling over the red-tiled roof stairway and stone terrace classrooms in Dandabazar.',
    nepaliCaption: 'बिहानी कुहिरोले ढाकिएको रमणीय पहाडी वातावरण र विद्यालय जोड्ने पैदल मार्ग।',
    featured: false
  },
  {
    id: 'campus-hills',
    src: campusHills,
    title: 'Sangurigadhi-5 Green Ridge & Surrounds',
    nepaliTitle: 'डाँडाबजारको सुन्दर प्राकृतिक परिदृश्य',
    category: 'campus',
    aspect: 'landscape',
    caption: 'Panoramic perspective showing the Dandabazar settlement, agricultural terraces, and lush high-altitude forest.',
    nepaliCaption: 'समुद्र सतहबाट करिब १८०० मिटर उचाइमा रहेको डाँडाबजारको प्राकृतिक सुन्दरता।',
    featured: false
  },
  {
    id: 'assembly-banner',
    src: assemblyBanner,
    title: 'Child Protection & Safe School Campaign',
    nepaliTitle: 'बाल अधिकार तथा सुरक्षित विद्यालय अभियान',
    category: 'students',
    aspect: 'landscape',
    caption: 'Students demonstrating commitment to child safety, inclusive education, and disciplined school life.',
    nepaliCaption: 'बाल अधिकार संरक्षण र सुरक्षित विद्यालय वातावरण निर्माणका लागि गरिएको प्रतिबद्धता।',
    featured: false
  }
]
