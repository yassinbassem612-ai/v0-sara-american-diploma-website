import { Suspense } from "react"
import { HomeHeader } from "@/components/home-header"
import { HeroSection } from "@/components/hero-section"
import { ApplyNowSection } from "@/components/apply-now-section"
import { StudentAchievements } from "@/components/student-achievements"
import { BookSessionSection } from "@/components/book-session-section"
import { AboutSection } from "@/components/about-section"
import { ContactSection } from "@/components/contact-section"
import { HomeFooter } from "@/components/home-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      <main>
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
          <HeroSection />
          <ApplyNowSection />
          <StudentAchievements />
          <BookSessionSection />
          <AboutSection />
          <ContactSection />
        </Suspense>
      </main>
      <HomeFooter />
    </div>
  )
}
