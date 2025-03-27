'use client'

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { motion } from 'framer-motion';
import {
  InstagramIcon,
  WhatsappIcon,
} from '@/components/ui/icons/SocialIcons'
import Image from 'next/image';
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Inicio', href: '/#hero' },
  { name: 'Sobre mí', href: '/#sobre-mi' },
  { name: 'Servicios', href: '/#servicios' },
  { name: 'Galería', href: '/#galeria' },
  { name: 'Reseñas', href: '/#reseñas' },
  { name: 'Contacto', href: '/#contacto' },
];

const contactInfo = {
  phone: '+593 99 382 6728',
  instagram: '@kriss.beauty.nails',
  schedule: {
    weekdays: '8:00 AM - 9:00 PM',
    weekend: '8:00 AM - 9:00 PM',
  },
};

export function Footer() {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

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
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <Container>
        <div className="py-6 md:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Logo y descripción */}
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/logokris.jpg"
                  alt="Kris Beauty Nails"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-pink-400/20"
                />
                <span className="text-lg font-semibold bg-gradient-to-r from-pink-400 to-pink-300 bg-clip-text text-transparent">
                  Kris Beauty Nails
                </span>
              </Link>
              <p className="text-sm text-gray-400">
                Tu destino de belleza para uñas perfectas. Especialistas en diseños únicos y cuidado profesional.
              </p>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h3 className="text-base font-semibold text-white mb-2">Enlaces Rápidos</h3>
              <ul className="space-y-1.5">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={(e) => handleScroll(e, item.href)}
                      className="text-sm text-gray-400 hover:text-pink-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Horario */}
            <div>
              <h3 className="text-base font-semibold text-white mb-2">Horario de Atención</h3>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li>Lunes a Viernes: 8:00 AM - 9:00 PM</li>
                <li>Sábados y Domingos: 8:00 AM - 9:00 PM</li>
                <li className="text-pink-400 font-medium">* Solo con cita previa</li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-base font-semibold text-white mb-2">Contacto</h3>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="https://maps.app.goo.gl/9qUdgxEuWbqKzu3v6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    <span>Av. Jaime Roldos Aguilera, Vuelta Larga</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/593993826728"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    <span>+593 99 382 6728</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/kriss.beauty.nails"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    <InstagramIcon className="h-4 w-4" />
                    <span>@kriss.beauty.nails</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px bg-gray-800 my-4 md:my-6" />

          {/* Copyright y redes sociales */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              © {new Date().getFullYear()} Kris Beauty Nails. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com/kriss.beauty.nails"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full bg-gray-800 hover:bg-pink-500/20 text-gray-400 hover:text-pink-400 transition-all"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/593993826728"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full bg-gray-800 hover:bg-pink-500/20 text-gray-400 hover:text-pink-400 transition-all"
              >
                <WhatsappIcon className="h-4 w-4" />
              </a>
              <a
                href="https://maps.app.goo.gl/9qUdgxEuWbqKzu3v6"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full bg-gray-800 hover:bg-pink-500/20 text-gray-400 hover:text-pink-400 transition-all"
              >
                <MapPinIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
