"use client"

import { OverviewCards } from "@/components/overview-cards"
import { LifestyleGlance } from "@/components/lifestyle-glance"
import { ChartsSection } from "@/components/charts-section"
import { Activity } from "lucide-react"

interface DashboardViewProps {
  persona: string
}

export function DashboardView({ persona }: DashboardViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Today's Health Snapshot */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-semibold">Today's Health Snapshot</h2>
        </div>
        <OverviewCards />
      </section>

      {/* Lifestyle at a Glance */}
      <LifestyleGlance />

      {/* Deep Dive - Charts */}
      <ChartsSection />
    </div>
  )
}
