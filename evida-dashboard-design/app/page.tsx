"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { DashboardView } from "@/components/dashboard-view"
import { Footer } from "@/components/footer"

export default function Home() {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation selectedPersona={selectedPersona} onPersonaChange={setSelectedPersona} />

      <main className="flex-1">
        {!selectedPersona ? (
          <HeroSection onSelectPersona={setSelectedPersona} />
        ) : (
          <DashboardView persona={selectedPersona} />
        )}
      </main>

      <Footer />
    </div>
  )
}
