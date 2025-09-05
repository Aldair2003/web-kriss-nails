'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/container';

export function About() {
  const features = [
    {
      icon: "✨",
      title: "Diseños Únicos",
      description: "Me especializo en crear diseños únicos y personalizados que superan las expectativas de cada clienta. Cada trabajo es una obra de arte con acabados impecables y la mejor calidad, porque creo que tus uñas merecen ser extraordinarias."
    },
    {
      icon: "💝",
      title: "Experiencia Personal",
      description: "Cada clienta es única y especial para mí. Me encanta crear un ambiente de confianza donde puedas relajarte completamente. Disfruto escuchando tus historias, compartiendo risas y haciendo que cada visita sea un momento de autocuidado y conexión genuina."
    },
    {
      icon: "✨",
      title: "Calidad Premium",
      description: "Solo trabajo con productos de la más alta calidad que cuidan y protegen tus uñas naturales. Cada material está cuidadosamente seleccionado para garantizar durabilidad, belleza y salud. Tu bienestar es mi prioridad, por eso invierto en lo mejor para ti."
    },
    {
      icon: "🌟",
      title: "Higiene Garantizada",
      description: "La seguridad y salud de mis clientas es fundamental. Mantengo un proceso riguroso de desinfección, esterilización y protocolos de higiene estrictos. Cada detalle está pensado para que te sientas completamente segura y protegida durante tu experiencia."
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
              <p className="text-pink-600 font-semibold">🎓 Técnico Profesional</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute -right-6 top-2/3 bg-white rounded-2xl shadow-xl p-4"
            >
              <p className="text-pink-600 font-semibold">💅 Pasión por las Uñas</p>
            </motion.div>
          </motion.div>

          {/* Contenido Principal */}
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-pink-50 via-white to-pink-50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-pink-100 relative overflow-hidden"
            >
              {/* Elementos decorativos de fondo */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-200/30 to-transparent rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-200/20 to-transparent rounded-full blur-lg"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">✨</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
                    Mi Pasión
                  </h3>
                </div>
                
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Mi amor por el arte de las uñas nació hace un año y desde entonces se ha convertido en mi pasión más profunda. 
                  Actualmente soy <span className="text-pink-600 font-semibold bg-pink-50 px-2 py-1 rounded-lg">Técnico Profesional en uñas</span>, 
                  capacitada en la prestigiosa <span className="text-pink-600 font-semibold bg-pink-50 px-2 py-1 rounded-lg">Academia Belleza Negra</span>. 
                  Creo firmemente en la importancia de la formación continua y la excelencia profesional, 
                  porque cada clienta merece recibir siempre lo mejor de mí.
                </p>
              </div>
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
