"use client"

import React, { useState } from "react"

export default function ChatBot({ examId, attemptId }) {
  const [messages, setMessages] = useState([
    { id: 0, from: "bot", text: "Hi — ask me about this exam or review and I'll help." },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), from: "user", text: input }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          examId,
          attemptId,
        }),
      })
      const json = await res.json()
      const botText = json?.reply || json?.message || "Sorry, no reply."
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: botText }])
    } catch (err) {
      setMessages((m) => [...m, { id: Date.now() + 2, from: "bot", text: "Error contacting chat service." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh] border border-border rounded-md p-3 bg-card">
      <div className="text-sm font-medium mb-2">Review Assistant</div>
      <div className="flex-1 overflow-auto mb-3 space-y-2">
        {Array.isArray(messages) && messages.map((m) => (
          <div key={m.id} className={m.from === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block p-2 rounded-md max-w-xs ${m.from === "user" ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground"}`}>
              {typeof m.text === 'string' ? m.text : JSON.stringify(m.text)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Ask about a question or your performance..."
          className="flex-1 rounded-md border px-3 py-2 bg-background"
        />
        <button onClick={send} disabled={loading} className="px-3 py-2 bg-primary text-white rounded-md">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  )
}
