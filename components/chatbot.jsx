"use client"

import React, { useState } from "react"

export default function ChatBot({ examId, attemptId, question }) {
  const [messages, setMessages] = useState([
    { id: 0, from: "bot", text: "Hi — ask me about this exam or review and I'll help." },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState(null)

  const send = async () => {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), from: "user", text: input }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setLoading(true)
    try {
      const body = { message: input, examId, attemptId };
      // include question data or attached image
      if (question) body.question = question;
      else if (imageDataUrl) body.question = { questionText: '', questionImage: imageDataUrl };
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      const botText = json?.response || json?.explanation || json?.reply || json?.message || "Sorry, no reply."
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: botText }])
    } catch (err) {
      setMessages((m) => [...m, { id: Date.now() + 2, from: "bot", text: "Error contacting chat service." }])
    } finally {
      setLoading(false)
    }
  }

  const handleImageFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setImageDataUrl(e.target.result)
    reader.readAsDataURL(file)
  }

  const removeImage = () => setImageDataUrl(null)

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
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-secondary text-white rounded-md cursor-pointer">
            Attach Image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e.target.files?.[0])} />
          </label>
          <button onClick={send} disabled={loading} className="px-3 py-2 bg-primary text-white rounded-md">
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
      {imageDataUrl && (
        <div className="mt-2 flex items-start gap-2">
          <img src={imageDataUrl} alt="attached" className="w-24 h-24 object-contain rounded" />
          <div className="flex flex-col">
            <div className="text-xs text-muted-foreground">Attached image</div>
            <button onClick={removeImage} className="text-xs text-red-500 mt-2">Remove</button>
          </div>
        </div>
      )}
    </div>
  )
}
