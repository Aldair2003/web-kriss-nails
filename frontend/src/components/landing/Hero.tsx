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
          src="/images/Estética rosa en salón de manicura.png"
          alt="Kris Beauty Nails"
          fill
          className="object-cover object-left-center scale-1"
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
              ✨ Hola, soy Kriss Beauty Nails
            </h2>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.2] md:leading-tight">
              <span className="inline-block">Diseños únicos</span>{' '}
              <span className="inline-block">para tus uñas</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed"
          >
            Te brindo atención personalizada en <span className="text-pink-300 font-semibold">Acrílico, Polygel, Soft Gel, Gel Semipermanente y Pedicure</span>. 
            Diseños únicos que reflejan tu estilo y personalidad. ¡Ven y disfruta de una experiencia única!
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
            className="flex justify-center gap-3 pt-4"
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
            <Link 
              href="https://www.tiktok.com/@kris.beauty.nails?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-full hover:bg-white/15 transition-all duration-300 backdrop-blur-sm group"
            >
              <svg className="w-5 h-5 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
              <span className="text-sm text-white/90 group-hover:text-white transition-colors">@kris.beauty.nails</span>
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
