import { useState, useEffect, useCallback } from 'react'
import {
  SCHOOL_GALLERY_IMAGES,
  GALLERY_CATEGORIES
} from '../assets/schoolImages.js'
import { schoolConfig } from '../config/schoolConfig.js'

export default function SchoolGallery() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeImageIndex, setActiveImageIndex] = useState(null)

  // Filter images based on active tab
  const filteredImages = activeCategory === 'all'
    ? SCHOOL_GALLERY_IMAGES
    : SCHOOL_GALLERY_IMAGES.filter((img) => img.category === activeCategory)

  const currentImage = activeImageIndex !== null ? filteredImages[activeImageIndex] : null

  // Lightbox navigation handlers
  const handleOpenLightbox = (index) => {
    setActiveImageIndex(index)
  }

  const handleCloseLightbox = useCallback(() => {
    setActiveImageIndex(null)
  }, [])

  const handleNext = useCallback(() => {
    if (activeImageIndex === null) return
    setActiveImageIndex((prev) => (prev + 1) % filteredImages.length)
  }, [activeImageIndex, filteredImages.length])

  const handlePrev = useCallback(() => {
    if (activeImageIndex === null) return
    setActiveImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length)
  }, [activeImageIndex, filteredImages.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeImageIndex === null) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseLightbox()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }

    window.addEventListener('keydown', handleKeyDown)
    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [activeImageIndex, handleCloseLightbox, handleNext, handlePrev])

  return (
    <section id="campus-gallery" className="py-16 md:py-24 scroll-mt-14 bg-[#FAF8F5]">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Campus life and community • हाम्रो विद्यालय परिसर
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              Life at Bhanu Secondary School
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Photographs of our campus, morning roll call routines, academic facilities,
              and Himalayan landscapes in Dandabazar, Sangurigadhi-5, Dhankuta.
            </p>
          </div>

          <div className="text-xs text-slate-500 tabular-nums shrink-0">
            {filteredImages.length} photographs
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {GALLERY_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            const count = cat.id === 'all'
              ? SCHOOL_GALLERY_IMAGES.length
              : SCHOOL_GALLERY_IMAGES.filter((i) => i.category === cat.id).length

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setActiveImageIndex(null)
                }}
                className={`min-h-[38px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-blue-500'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[13px] px-1.5 py-0.5 rounded-full tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image, index) => {
            const isFeatured = image.featured && (index === 0 || index === 3)
            return (
              <div
                key={image.id}
                onClick={() => handleOpenLightbox(index)}
                className={`group relative bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${
                  isFeatured ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden bg-slate-100 aspect-[4/3] sm:aspect-[16/10] w-full">
                  <img
                    src={image.src}
                    alt={image.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-semibold backdrop-blur-xs shadow-xs">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M2 6V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M14 6V3C14 2.44772 13.5523 2 13 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M2 10V13C2 13.5523 2.44772 14 3 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M14 10V13C14 13.5523 13.5523 14 13 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      View photograph
                    </span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[13px] capitalize px-2.5 py-0.5 rounded-md bg-white/90 text-slate-800 font-semibold backdrop-blur-xs border border-slate-200">
                      {image.category}
                    </span>
                  </div>
                </div>

                {/* Caption Bar */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {image.title}
                    </h3>
                  </div>
                  <p className="text-xs text-blue-700 font-medium mb-1.5 line-clamp-1">
                    {image.nepaliTitle}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {image.caption}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footnote */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {schoolConfig.schoolName} • {schoolConfig.location}
          </p>
          <p className="italic">
            Capturing daily life, academic learning, and mountain environment at Dandabazar.
          </p>
        </div>
      </div>

      {/* ── Lightbox Modal ────────────────────────────────────── */}
      {currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/80 backdrop-blur-sm transition-all"
          role="dialog"
          aria-modal="true"
          aria-label={currentImage.title}
          onClick={handleCloseLightbox}
        >
          {/* Lightbox Card Container */}
          <div
            className="relative max-w-5xl w-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-xs text-blue-600 font-semibold block capitalize">
                  {currentImage.category} • Photograph {activeImageIndex + 1} of {filteredImages.length}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {currentImage.title}
                </h3>
              </div>

              {/* Close Button */}
              <button
                onClick={handleCloseLightbox}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Close photograph modal"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="relative bg-slate-950 flex items-center justify-center overflow-hidden flex-1 min-h-[300px] max-h-[65vh]">
              <img
                src={currentImage.src}
                alt={currentImage.title}
                className="max-h-[65vh] w-auto max-w-full object-contain mx-auto"
              />

              {/* Prev / Next Navigation Arrows */}
              {filteredImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-900 transition-colors shadow-md backdrop-blur-xs cursor-pointer"
                    aria-label="Previous photograph"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-900 transition-colors shadow-md backdrop-blur-xs cursor-pointer"
                    aria-label="Next photograph"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer Caption */}
            <div className="p-5 bg-white border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                <span className="text-blue-700 font-semibold text-sm sm:text-base">
                  {currentImage.nepaliTitle}
                </span>
                <span className="text-xs text-slate-500">
                  {schoolConfig.locationShort}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentImage.caption}
              </p>
              {currentImage.nepaliCaption && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentImage.nepaliCaption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
