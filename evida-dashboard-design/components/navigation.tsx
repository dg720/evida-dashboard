"use client"

import Link from "next/link"
import { Moon, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

interface NavigationProps {
  selectedPersona: string | null
  onPersonaChange: (persona: string) => void
}

export function Navigation({ selectedPersona, onPersonaChange }: NavigationProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="h-16 bg-primary text-primary-foreground sticky top-0 z-50 border-b border-primary/20 shadow-sm">
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <span className="text-primary-foreground font-bold">E</span>
            </div>
            Evida
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Dashboard
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Chat Coach
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedPersona && (
            <Select value={selectedPersona} onValueChange={onPersonaChange}>
              <SelectTrigger className="w-[180px] bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="john">John - Runner</SelectItem>
                <SelectItem value="sarah">Sarah - Yoga</SelectItem>
                <SelectItem value="mike">Mike - Strength</SelectItem>
                <SelectItem value="emma">Emma - General</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            {mounted && (theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
