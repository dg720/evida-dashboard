"use client"

import { Navigation } from "@/components/navigation"
import { ChatCoach } from "@/components/chat-coach"
import { Footer } from "@/components/footer"

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation selectedPersona="active" onUploadClick={() => {}} />

      <main className="flex-1">
        <ChatCoach />
      </main>

      <Footer />
    </div>
  )
}
