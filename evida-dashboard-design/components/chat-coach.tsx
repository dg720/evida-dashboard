"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  role: "user" | "coach"
  content: string
  timestamp: Date
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "coach",
    content:
      "Hello! I'm your Evida Health Coach. I can help you understand your health metrics and provide personalized insights. What would you like to know?",
    timestamp: new Date(),
  },
]

const recentConversations = [
  { id: "1", title: "Sleep improvement tips", date: "Yesterday" },
  { id: "2", title: "Heart rate zones", date: "2 days ago" },
  { id: "3", title: "Weekly progress review", date: "5 days ago" },
]

export function ChatCoach() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInput("")

    // Simulate coach response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content: `Based on your recent metrics, here's what I can tell you about ${input.toLowerCase()}. Your data shows positive trends, and I'd recommend continuing your current routine.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, response])
    }, 1000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Health Coach</h1>
          <p className="text-muted-foreground">Ask about your metrics…</p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Conversation List */}
          <Card className="p-4 hidden lg:block">
            <h3 className="font-semibold mb-4">Recent Conversations</h3>
            <div className="space-y-2">
              {recentConversations.map((conv) => (
                <div key={conv.id} className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div className="font-medium text-sm">{conv.title}</div>
                  <div className="text-xs text-muted-foreground">{conv.date}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="flex flex-col h-[calc(100vh-16rem)]">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-secondary text-secondary-foreground ml-auto"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your health metrics..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} className="bg-primary hover:bg-primary/90" size="icon">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
