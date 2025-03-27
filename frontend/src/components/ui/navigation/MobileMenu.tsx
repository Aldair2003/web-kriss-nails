'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface MobileMenuProps {
  links: {
    href: string
    label: string
  }[]
}

export const MobileMenu = ({ links }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    document.body.style.overflow = isOpen ? 'unset' : 'hidden'
  }

  return (
    <div className="lg:hidden">
      <button
        onClick={toggleMenu}
        className="rounded-lg p-2 hover:bg-gray-100"
        aria-label="Menú"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={toggleMenu}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 right-0 z-50 w-64 bg-white px-6 py-4 shadow-xl"
            >
              <div className="mb-8 flex justify-end">
                <button
                  onClick={toggleMenu}
                  className="rounded-lg p-2 hover:bg-gray-100"
                  aria-label="Cerrar menú"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <nav className="space-y-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-4 py-2 text-lg hover:bg-gray-100"
                    onClick={toggleMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 