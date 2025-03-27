'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/container';

export function About() {
  const features = [
    {
      icon: "✨",
      title: "Diseños Únicos",
      description: "Especializada en uñas acrílicas, con un toque mágico en forma almond y francés espectacular."
    },
    {
      icon: "💝",
      title: "Experiencia Personal",
      description: "Cada clienta es única. Me encanta crear un ambiente de confianza y hacer de tu visita un momento especial."
    },
    {
      icon: "✨",
      title: "Calidad Premium",
      description: "Uso productos de alta calidad que cuidan tus uñas naturales y garantizan durabilidad."
    },
    {
      icon: "🌟",
      title: "Higiene Garantizada",
      description: "Proceso riguroso de desinfección y herramientas individuales para cada clienta."
    }
  ];

  return (
    <section id="sobre-mi" className="py-12 md:py-16 relative overflow-hidden bg-pink-50">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-gradient-to-br from-pink-100/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-gradient-to-bl from-pink-100/40 to-transparent rounded-full blur-3xl" />
      </div>

      <Container>
        {/* Encabezado Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-8 md:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-pink-400 bg-clip-text text-transparent mb-4">
            Rachell Benavides
          </h2>
          <p className="text-base sm:text-lg text-gray-600 font-light">
            Artista de uñas apasionada por crear diseños únicos y experiencias memorables
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-center mb-12">
          {/* Imagen Principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-2xl">
              <Image
                src="/images/RachellSobremi.jpg"
                alt="Rachell Benavides - Nail Artist"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            
            {/* Insignias flotantes */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute -left-6 top-1/4 bg-white rounded-2xl shadow-xl p-4"
            >
              <p className="text-pink-600 font-semibold">✨ Especialista en Acrílicas</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute -right-6 top-2/3 bg-white rounded-2xl shadow-xl p-4"
            >
              <p className="text-pink-600 font-semibold">💅 Diseños Únicos</p>
            </motion.div>
          </motion.div>

          {/* Contenido Principal */}
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Mi Pasión</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Hace un año descubrí mi verdadera pasión en el arte de las uñas. Lo que comenzó como 
                un curso se convirtió en mi sueño emprendedor. Actualmente, estoy formándome como 
                Técnico Profesional, porque creo en la importancia de ofrecer siempre lo mejor a 
                mis clientas.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-pink-50 to-white p-4 sm:p-6 rounded-2xl shadow-xl"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Lo Que Me Hace Única</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-6">
                Me apasiona crear conexiones reales con mis clientas. Cada visita es una oportunidad 
                para escapar de la rutina, conversar y disfrutar de un momento de autocuidado. 
                Ver la transformación y la sonrisa en cada clienta es mi mayor satisfacción.
              </p>
              <div className="flex items-center gap-2 text-pink-600">
                <span className="text-2xl">♥</span>
                <p className="font-medium italic">
                  "Tú eres la razón de ser de este negocio"
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Características Destacadas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-4 sm:p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                {feature.title}
              </h4>
              <p className="text-sm sm:text-base text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mensaje Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mt-8 sm:mt-12 max-w-2xl mx-auto"
        >
          <p className="text-base sm:text-lg text-gray-600 italic">
            "La pasión que siento al crear cada diseño me emociona, porque sé que cada clienta 
            saldrá feliz y satisfecha con el resultado"
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
