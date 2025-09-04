'use client'

import { motion } from 'framer-motion'
import {
  PhoneIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  InstagramIcon,
  WhatsappIcon,
  TikTokIcon,
} from '@/components/ui/icons/SocialIcons'
import { Container } from '@/components/ui/container'

const contactInfo = {
  phone: '+593 99 382 6728',
  instagram: '@kriss.beauty.nails',
  tiktok: '@kris.beauty.nails',

  schedule: {
    weekdays: '9:00 AM',
    weekend: '9:00 AM - 7:00 PM',
  },
      social: {
      instagram: 'https://instagram.com/kriss.beauty.nails',
      whatsapp: 'https://wa.me/593993826728',
      tiktok: 'https://www.tiktok.com/@kris.beauty.nails?is_from_webapp=1&sender_device=pc',
    },
}

interface ContactItemProps {
  icon: React.ComponentType<React.ComponentProps<'svg'>>
  title: string
  content: React.ReactNode
}

const ContactItem = ({ icon: Icon, title, content }: ContactItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.5 }}
    className="flex items-start space-x-2 sm:space-x-3"
  >
    <div className="rounded-full bg-pink-500/10 p-1.5 sm:p-2 md:p-3">
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-pink-600" />
    </div>
    <div>
      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{title}</h3>
      <div className="mt-0.5 text-xs sm:text-sm md:text-base text-gray-600">{content}</div>
    </div>
  </motion.div>
)

export function Contact() {
  return (
    <section id="contacto" className="py-8 sm:py-12 md:py-16 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-pink-50/30 to-white" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-pink-200/20 to-transparent rounded-full blur-3xl transform -translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-pink-200/20 to-transparent rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4" />
      </div>

      <Container className="relative">
        <div className="mb-6 sm:mb-8 md:mb-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-pink-400 bg-clip-text text-transparent inline-block mb-3"
          >
            Contáctanos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Estamos aquí para atenderte y resolver todas tus dudas.
          </motion.p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          {/* Información de contacto */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="space-y-3 sm:space-y-4 md:space-y-6 bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 shadow-[0_20px_50px_rgba(219,39,119,0.1)]"
          >

            <ContactItem
              icon={PhoneIcon}
              title="WhatsApp"
              content={contactInfo.phone}
            />
            <ContactItem
              icon={ClockIcon}
              title="Horario de Atención"
              content={
                <div className="space-y-0.5">
                  <div>Lunes a Viernes: {contactInfo.schedule.weekdays}</div>
                  <div>Sábados y Domingos: {contactInfo.schedule.weekend}</div>
                  <div className="mt-1 sm:mt-1.5 md:mt-2 font-medium text-pink-600 text-xs sm:text-sm md:text-base">* Solo bajo cita previa</div>
                </div>
              }
            />

            {/* Redes sociales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="flex gap-1.5 sm:gap-2 md:gap-3 pt-2 sm:pt-3"
            >
              {[
                { href: contactInfo.social.instagram, icon: InstagramIcon },
                { href: contactInfo.social.whatsapp, icon: WhatsappIcon },
                { href: contactInfo.social.tiktok, icon: TikTokIcon },
              ].map((social, index) => (
                <motion.a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-full bg-pink-500/10 p-1.5 sm:p-2 md:p-3 transition-colors hover:bg-pink-500/20"
                >
                  <social.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-pink-600" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </Container>

      {/* WhatsApp flotante */}
      <motion.a
        href={contactInfo.social.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
      >
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-3 sm:p-4 rounded-full shadow-[0_8px_16px_rgba(219,39,119,0.3)] hover:shadow-[0_12px_24px_rgba(219,39,119,0.4)] transition-all duration-300">
          <WhatsappIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </motion.a>
    </section>
  )
}
