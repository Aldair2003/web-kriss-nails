'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface LightboxProps {
  images: {
    src: string
    alt: string
  }[]
  initialIndex?: number
  onClose: () => void
  isOpen: boolean
}

export const Lightbox = ({
  images,
  initialIndex = 0,
  onClose,
  isOpen,
}: LightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        onClick={onClose}
      >
        <button
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20"
          onClick={onClose}
        >
          <XMarkIcon className="h-6 w-6 text-white" />
        </button>

        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
        >
          <ChevronLeftIcon className="h-6 w-6 text-white" />
        </button>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="relative h-[80vh] w-[80vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-contain"
            quality={100}
            priority
          />
        </motion.div>

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
        >
          <ChevronRightIcon className="h-6 w-6 text-white" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
} 