'use client';
import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';

interface SuccessAnimationProps {
  isVisible: boolean;
  onClose: () => void;
  clientName: string;
}

export function SuccessAnimation({ isVisible, onClose, clientName }: SuccessAnimationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    console.log('🔍 DEBUG Animation - useEffect triggered, isVisible:', isVisible);
    if (isVisible) {
      console.log('🔍 DEBUG Animation - Mostrando animación para:', clientName);
      setShowContent(true);
      // Auto cerrar después de 3 segundos
      const timer = setTimeout(() => {
        console.log('🔍 DEBUG Animation - Auto cerrando animación');
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, clientName]);

  console.log('🔍 DEBUG Animation - Renderizando, isVisible:', isVisible, 'clientName:', clientName);

  return (
    <Transition.Root show={isVisible} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-center shadow-xl transition-all">
                {/* Icono de uñas animado */}
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-white text-3xl"
                  >
                    💅
                  </motion.div>
                </motion.div>

                {/* Confeti animado */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        y: -20,
                        x: Math.random() * 400 - 200,
                        opacity: 0,
                        rotate: 0
                      }}
                      animate={{
                        y: 400,
                        opacity: [0, 1, 0],
                        rotate: 360
                      }}
                      transition={{
                        delay: i * 0.1,
                        duration: 2,
                        ease: "easeOut"
                      }}
                      className="absolute w-2 h-2 bg-pink-400 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>

                {/* Título */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  ¡Cita Reservada!
                </motion.h2>

                {/* Mensaje */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mb-6"
                >
                  ¡Cita reservada exitosamente! Te contactaremos pronto para confirmar tu cita.
                </motion.p>

                {/* Iconos de servicios */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center space-x-4 mb-6"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-2xl"
                  >
                    💅
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -5, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-2xl"
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.6,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-2xl"
                  >
                    💅
                  </motion.div>
                </motion.div>

                {/* Botón de cerrar */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => {
                    console.log('🔍 DEBUG Animation - Botón cerrar clickeado');
                    onClose();
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 font-medium"
                >
                  ¡Perfecto!
                </motion.button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
