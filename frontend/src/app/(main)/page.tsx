import { Hero } from '@/components/landing/Hero'
import { About } from '@/components/landing/About'
import { Services } from '@/components/landing/Services'
import { Gallery } from '@/components/landing/Gallery'
import { Reviews } from '@/components/landing/Reviews'
import { Contact } from '@/components/landing/Contact'

export default function Home() {
  return (
    <main className="pt-16">
      <Hero />
      <About />
      <Services />
      <Gallery />
      <Reviews />
      <Contact />
    </main>
  )
} 