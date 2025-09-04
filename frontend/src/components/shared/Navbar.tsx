'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Inicio', href: '/#hero' },
  { name: 'Sobre mí', href: '/#sobre-mi' },
  { name: 'Servicios', href: '/#servicios' },
  { name: 'Galería', href: '/#galeria' },
  { name: 'Reseñas', href: '/#reseñas' },
  { name: 'Contacto', href: '/#contacto' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Cerrar el menú móvil
    setIsOpen(false);

    // Pequeño retraso para permitir que la animación de cierre del menú termine
    setTimeout(() => {
      // Si es la página de inicio, hacer scroll suave
      if (href.startsWith('/#')) {
        const targetId = href.replace('/#', '');
        if (targetId === 'hero') {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        } else {
          const element = document.getElementById(targetId);
          if (element) {
            const offset = 80; // Ajuste para el navbar fijo
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      } else {
        // Si es otra página, navegar normalmente
        window.location.href = href;
      }
    }, 300); // 300ms es la duración de la animación del menú
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              onClick={(e) => handleScroll(e, '/')}
              className="flex items-center gap-2 md:gap-3"
            >
              <div className="relative w-10 h-10 md:w-12 md:h-12 overflow-hidden rounded-full border-2 border-pink-100 shadow-md hover:shadow-lg transition-shadow duration-300">
                <Image
                  src="/images/logooriginal.webp"
                  alt="Kris Beauty Nails"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 40px, 48px"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                  Kris Beauty
                </span>
                <span className="text-xs md:text-sm font-medium text-gray-400 tracking-wider">
                  NAIL STUDIO
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className="text-gray-600 hover:text-pink-600 transition-colors font-medium tracking-wide text-sm"
              >
                {item.name}
              </Link>
            ))}
            <Link href="/agendar">
              <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 py-2 text-sm">
                Agendar Cita
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-full text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Abrir menú principal</span>
              {!isOpen ? (
                <svg className="block h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <motion.div 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="px-2 pt-2 pb-3 space-y-0.5"
              >
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => handleScroll(e, item.href)}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-pink-600 hover:bg-pink-50/50 transition-all"
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mt-3 px-3"
                >
                  <Link href="/agendar" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-full text-sm py-2">
                      Agendar Cita
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </nav>
  );
}
