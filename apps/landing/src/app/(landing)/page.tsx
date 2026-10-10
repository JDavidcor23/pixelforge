import { Navbar } from './components/Navbar/Navbar'
import { HeroSection } from './components/HeroSection/HeroSection'
import { FeaturesSection } from './components/FeaturesSection/FeaturesSection'
import { PipelineSection } from './components/PipelineSection/PipelineSection'
import { CtaSection } from './components/CtaSection/CtaSection'
import { Footer } from './components/Footer/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PipelineSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
