'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/headerFoto.jpg"
          alt="Kris Beauty Nails"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      <Container className="relative z-10 py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4 space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="space-y-3 md:space-y-4"
          >
            <h2 className="text-base sm:text-lg text-pink-300 font-medium tracking-wider">
              Tu experta en belleza
            </h2>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.2] md:leading-tight">
              <span className="inline-block">Transforma tus</span>{' '}
              <span className="inline-block">uñas en arte</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed"
          >
            Especialista en diseños únicos y personalizados para tus uñas.
            Déjame crear la manicura perfecta para ti.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto sm:max-w-2xl"
          >
            <Link href="/agendar" className="w-full">
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-6 text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-[60px] sm:h-[64px] flex items-center justify-center"
              >
                Reserva tu Cita
              </Button>
            </Link>
            <Link href="/#servicios" className="w-full">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-white/40 px-8 py-6 text-base sm:text-lg rounded-full backdrop-blur-sm transition-all duration-300 h-[60px] sm:h-[64px] flex items-center justify-center"
              >
                Explora mis Servicios
              </Button>
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center pt-4"
          >
            <Link 
              href="https://www.instagram.com/kriss.beauty.nails/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-full hover:bg-white/15 transition-all duration-300 backdrop-blur-sm group"
            >
              <svg className="w-5 h-5 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-sm text-white/90 group-hover:text-white transition-colors">@kriss.beauty.nails</span>
            </Link>
          </motion.div>
        </div>
      </Container>

      {/* Decorative Elements */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 mx-auto w-full flex justify-center items-center pb-6 sm:pb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <motion.div
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white/80 text-sm md:text-base font-light tracking-wider">Descubre mi trabajo</span>
          <svg 
            className="w-5 h-5 md:w-6 md:h-6 text-pink-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
