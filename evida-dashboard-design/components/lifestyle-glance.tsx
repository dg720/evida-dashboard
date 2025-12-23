"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Moon, Activity, Heart, Flag as Flask, Pause as Pulse } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

const lifestyleMetrics = [
  {
    icon: Moon,
    label: "Sleep",
    value: "6:56",
    unit: "h",
    status: "OK",
    statusColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Activity,
    label: "Activity",
    value: "12k",
    unit: "steps",
    status: "Target",
    statusColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    iconBg: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    icon: Heart,
    label: "Resting HR",
    value: "52",
    unit: "bpm",
    status: "OK",
    statusColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    iconBg: "bg-red-50 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    icon: Flask,
    label: "Iron",
    value: "55",
    unit: "µg/dL",
    status: "High",
    statusColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    iconBg: "bg-amber-50 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Pulse,
    label: "AST",
    value: "45",
    unit: "U/L",
    status: "OK",
    statusColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    iconBg: "bg-teal-50 dark:bg-teal-950",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
]

export function LifestyleGlance() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
            <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-semibold">Lifestyle at a Glance</h2>
        </div>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
          Read more
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {lifestyleMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${metric.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${metric.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{metric.value}</span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
                <Badge variant="secondary" className={`${metric.statusColor} text-xs font-medium`}>
                  {metric.status}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
