'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF4F7]">
      {/* Contenedor principal con efecto de cristal */}
      <div className="w-full max-w-md mx-4 p-8 bg-white/80 backdrop-blur-lg rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo con efecto de brillo */}
          <div className="relative w-32 h-32 group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 animate-gradient-x opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-inner">
              <Image
                src="/images/logooriginal.webp"
                alt="Logo Kris Beauty Nails"
                fill
                sizes="(max-width: 768px) 128px, 128px"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Títulos con tipografía elegante */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-light text-gray-800 tracking-tight">
              Panel Administrativo
            </h2>
            <p className="text-sm text-gray-500 font-light tracking-wide">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {/* Formulario con efectos suaves */}
          <form onSubmit={handleSubmit} className="w-full space-y-6 mt-8">
            <div className="space-y-4">
              {/* Input de email con diseño minimalista */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-light text-gray-600 tracking-wide">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-100 rounded-xl text-gray-800 text-sm
                             focus:outline-none focus:border-pink-200 focus:ring-2 focus:ring-pink-100
                             transition-all duration-300 ease-in-out placeholder:text-gray-300 placeholder:font-light"
                    placeholder="ejemplo@correo.com"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
                </div>
              </div>

              {/* Input de contraseña con diseño minimalista */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-light text-gray-600 tracking-wide">
                  Contraseña
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-100 rounded-xl text-gray-800 text-sm
                             focus:outline-none focus:border-pink-200 focus:ring-2 focus:ring-pink-100
                             transition-all duration-300 ease-in-out placeholder:text-gray-300 placeholder:font-light pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                             hover:bg-pink-50 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
                </div>
              </div>
            </div>

            {/* Mensaje de error con diseño suave */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                <p className="text-sm text-red-500 font-light text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Botón con diseño elegante y efectos */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium tracking-wider text-white rounded-full group"
              >
                <span className="absolute w-full h-full bg-gradient-to-br from-pink-500 via-pink-400 to-pink-500"></span>
                <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 opacity-30 group-hover:rotate-90 ease"></span>
                <span className="relative flex items-center justify-center gap-2 text-sm">
                  {loading && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 