"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Crown, Moon, Flame, Heart } from "lucide-react"

const overviewData = [
  {
    label: "READINESS",
    value: 87,
    status: "Optimal",
    total: 100,
    icon: Crown,
    color: "#008080",
    bgColor: "bg-teal-50 dark:bg-teal-950",
    iconColor: "text-teal-600 dark:text-teal-400",
    message: "Bring it on — today is a good day for high-focus tasks.",
  },
  {
    label: "SLEEP",
    value: 84,
    status: "Good",
    total: 100,
    displayValue: "6h 56m",
    displayLabel: "Total",
    icon: Moon,
    color: "#008080",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    message: "Quality sleep supports recovery",
  },
  {
    label: "ACTIVITY",
    value: 65,
    status: "%",
    total: 100,
    displayValue: "6,574",
    displayLabel: "of 10,000",
    icon: Flame,
    color: "#E34234",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
    message: "Keep moving to reach your goal",
  },
  {
    label: "RECOVERY",
    value: 58,
    status: "Resilient",
    total: 70,
    displayValue: "58 ms",
    displayLabel: "of 70 ms baseline",
    icon: Heart,
    color: "#E34234",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    statusDot: true,
    message: "HRV-based recovery indicator",
  },
]

export function OverviewCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {overviewData.map((item) => {
        const Icon = item.icon
        const percentage = (item.value / item.total) * 100
        const circumference = 2 * Math.PI * 70
        const strokeDashoffset = circumference - (percentage / 100) * circumference

        return (
          <Card key={item.label} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">{item.label}</p>
                  <div className="flex items-center gap-2">
                    {item.statusDot && <div className="w-2 h-2 rounded-full bg-green-500" />}
                    <p className="text-lg font-semibold text-foreground">{item.status}</p>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
              </div>

              {/* Circular Progress */}
              <div className="flex items-center justify-center my-6">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted/20"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{item.displayValue || item.value}</span>
                    {item.displayLabel && <span className="text-xs text-muted-foreground">{item.displayLabel}</span>}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">{item.message}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
