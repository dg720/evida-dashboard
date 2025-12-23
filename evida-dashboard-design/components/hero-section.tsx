"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Activity, Briefcase, Heart, Zap } from "lucide-react"

interface HeroSectionProps {
  onSelectPersona: (persona: string) => void
}

const dummyPersonas = [
  {
    id: "athlete",
    name: "Active Athlete",
    description: "High activity, balanced sleep",
    details: "Marathon runner with consistent training schedule and recovery focus",
    icon: Activity,
    color: "from-teal-500 to-teal-600",
    borderColor: "border-t-teal-500",
    iconBg: "bg-teal-50 dark:bg-teal-950",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "busy",
    name: "Busy Professional",
    description: "Moderate activity, irregular sleep",
    details: "Corporate executive balancing work demands with health goals",
    icon: Briefcase,
    color: "from-orange-500 to-red-500",
    borderColor: "border-t-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "wellness",
    name: "Wellness Enthusiast",
    description: "Consistent routine, good recovery",
    details: "Holistic health practitioner prioritizing balanced lifestyle",
    icon: Heart,
    color: "from-emerald-500 to-green-600",
    borderColor: "border-t-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "john",
    name: "John",
    description: "Tech enthusiast with fitness goals",
    details: "Software developer working on improving cardio and strength",
    icon: Zap,
    color: "from-blue-500 to-indigo-600",
    borderColor: "border-t-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
]

export function HeroSection({ onSelectPersona }: HeroSectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-background">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
          <h1 className="text-6xl md:text-7xl font-bold text-balance tracking-tight">Welcome to Evida</h1>
          <p className="text-xl md:text-2xl text-muted-foreground text-balance leading-relaxed max-w-3xl mx-auto">
            Your intelligent health companion that transforms wearable data into actionable insights. Visualize your
            wellness journey with comprehensive analytics and receive personalized coaching tailored to your unique
            health profile and lifestyle goals.
          </p>
        </div>

        <div className="mt-20">
          <h2 className="text-4xl font-bold text-center mb-16 tracking-tight">Explore Dummy Personas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {dummyPersonas.map((persona) => {
              const Icon = persona.icon
              return (
                <Card
                  key={persona.id}
                  className={`p-6 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-2 border-t-4 ${persona.borderColor} relative overflow-hidden group`}
                  onClick={() => onSelectPersona(persona.id)}
                >
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl ${persona.iconBg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-7 w-7 ${persona.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{persona.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 font-medium">{persona.description}</p>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed mb-4">{persona.details}</p>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 group-hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectPersona(persona.id)
                      }}
                    >
                      View Dashboard
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
