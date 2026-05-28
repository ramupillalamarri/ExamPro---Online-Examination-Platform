"use client"

import React, { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  ArrowRight,
  Compass
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TouristGuide() {
  const pathname = usePathname()
  
  // Exclude guide entirely on standalone active exam testing screen to prevent distraction flags
  const isExamPage = pathname?.startsWith("/exam/") && !pathname?.includes("/review") && !pathname?.includes("/result")
  
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Sizing dimensions state
  const [width, setWidth] = useState(360)
  const [height, setHeight] = useState(500)

  // Floating coordinates states (relative to bottom-right corner in px)
  const [buttonPosition, setButtonPosition] = useState({ right: 24, bottom: 24 })
  const [chatPosition, setChatPosition] = useState({ right: 24, bottom: 100 })
  const [isDraggingButton, setIsDraggingButton] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  
  const chatWindowRef = useRef(null)
  const triggerButtonRef = useRef(null)
  
  const messagesEndRef = useRef(null)
  
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello there, adventurer! 🌟 I'm **Sparky**, your ExamPro Tourist Guide! 🤖🎒\n\nI act as your local navigator here! I can help you understand how this platform works, find specific pages, or clear up any doubts. Try asking me something or click a quick suggestion below!`
    }
  ])

  // Custom resizing drag calculations (standard diagonal corner resizer)
  const handleResizeMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const startWidth = width
    const startHeight = height
    const startX = e.clientX
    const startY = e.clientY

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      
      const newWidth = Math.max(320, Math.min(window.innerWidth - 48, startWidth + dx))
      const newHeight = Math.max(400, Math.min(window.innerHeight - 120, startHeight + dy))
      
      setWidth(newWidth)
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleResizeTouchStart = (e) => {
    e.stopPropagation()
    const touch = e.touches[0]
    const startWidth = width
    const startHeight = height
    const startX = touch.clientX
    const startY = touch.clientY

    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length === 0) return
      const touch = moveEvent.touches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      
      const newWidth = Math.max(320, Math.min(window.innerWidth - 48, startWidth + dx))
      const newHeight = Math.max(400, Math.min(window.innerHeight - 120, startHeight + dy))
      
      setWidth(newWidth)
      setHeight(newHeight)
    }

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }

    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)
  }

  // Multi-directional edge resize handlers
  const handleBorderResizeMouseDown = (e, direction) => {
    e.preventDefault()
    e.stopPropagation()
    const startWidth = width
    const startHeight = height
    const startRight = chatPosition.right
    const startBottom = chatPosition.bottom
    const startX = e.clientX
    const startY = e.clientY

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight
      let newRight = startRight
      let newBottom = startBottom

      if (direction === "left") {
        newWidth = Math.max(320, Math.min(window.innerWidth - 48, startWidth - dx))
      } else if (direction === "right") {
        const possibleWidth = startWidth + dx
        if (possibleWidth >= 320 && (startRight - dx) >= 12) {
          newWidth = possibleWidth
          newRight = startRight - dx
        }
      } else if (direction === "top") {
        newHeight = Math.max(400, Math.min(window.innerHeight - 120, startHeight - dy))
      } else if (direction === "bottom") {
        const possibleHeight = startHeight + dy
        if (possibleHeight >= 400 && (startBottom - dy) >= 12) {
          newHeight = possibleHeight
          newBottom = startBottom - dy
        }
      }

      setWidth(newWidth)
      setHeight(newHeight)
      setChatPosition({ right: newRight, bottom: newBottom })
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleBorderResizeTouchStart = (e, direction) => {
    e.stopPropagation()
    const touch = e.touches[0]
    const startWidth = width
    const startHeight = height
    const startRight = chatPosition.right
    const startBottom = chatPosition.bottom
    const startX = touch.clientX
    const startY = touch.clientY

    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length === 0) return
      const t = moveEvent.touches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight
      let newRight = startRight
      let newBottom = startBottom

      if (direction === "left") {
        newWidth = Math.max(320, Math.min(window.innerWidth - 48, startWidth - dx))
      } else if (direction === "right") {
        const possibleWidth = startWidth + dx
        if (possibleWidth >= 320 && (startRight - dx) >= 12) {
          newWidth = possibleWidth
          newRight = startRight - dx
        }
      } else if (direction === "top") {
        newHeight = Math.max(400, Math.min(window.innerHeight - 120, startHeight - dy))
      } else if (direction === "bottom") {
        const possibleHeight = startHeight + dy
        if (possibleHeight >= 400 && (startBottom - dy) >= 12) {
          newHeight = possibleHeight
          newBottom = startBottom - dy
        }
      }

      setWidth(newWidth)
      setHeight(newHeight)
      setChatPosition({ right: newRight, bottom: newBottom })
    }

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }

    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)
  }

  // Trigger button dragging calculations
  const handleButtonMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    const startRight = buttonPosition.right
    const startBottom = buttonPosition.bottom

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.x
      const dy = moveEvent.clientY - dragStartRef.current.y
      
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setIsDraggingButton(true)
      }

      const newRight = Math.max(12, Math.min(window.innerWidth - 80, startRight - dx))
      const newBottom = Math.max(12, Math.min(window.innerHeight - 80, startBottom - dy))
      
      setButtonPosition({ right: newRight, bottom: newBottom })
      setChatPosition({ right: newRight, bottom: newBottom + 76 })
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      
      setTimeout(() => {
        setIsDraggingButton(false)
      }, 50)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleButtonTouchStart = (e) => {
    e.stopPropagation()
    const touch = e.touches[0]
    dragStartRef.current = { x: touch.clientX, y: touch.clientY }
    const startRight = buttonPosition.right
    const startBottom = buttonPosition.bottom

    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length === 0) return
      const t = moveEvent.touches[0]
      const dx = t.clientX - dragStartRef.current.x
      const dy = t.clientY - dragStartRef.current.y
      
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setIsDraggingButton(true)
      }

      const newRight = Math.max(12, Math.min(window.innerWidth - 80, startRight - dx))
      const newBottom = Math.max(12, Math.min(window.innerHeight - 80, startBottom - dy))
      
      setButtonPosition({ right: newRight, bottom: newBottom })
      setChatPosition({ right: newRight, bottom: newBottom + 76 })
    }

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      
      setTimeout(() => {
        setIsDraggingButton(false)
      }, 50)
    }

    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)
  }

  const handleButtonClick = () => {
    if (isDraggingButton) return
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen) {
      setShowTooltip(false)
    } else {
      setShowTooltip(true)
    }
  }

  // Return null on active exam page early
  if (isExamPage) return null

  // Load saved configurations from localStorage on mount (hydration safety check)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem("sparky_chat_messages")
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages))
        } catch (e) {
          console.error(e)
        }
      }

      const savedBtnPos = localStorage.getItem("sparky_button_position")
      if (savedBtnPos) {
        try {
          setButtonPosition(JSON.parse(savedBtnPos))
        } catch (e) {}
      }

      const savedChatPos = localStorage.getItem("sparky_chat_position")
      if (savedChatPos) {
        try {
          setChatPosition(JSON.parse(savedChatPos))
        } catch (e) {}
      }

      const savedWidth = localStorage.getItem("sparky_chat_width")
      if (savedWidth) setWidth(Number(savedWidth))

      const savedHeight = localStorage.getItem("sparky_chat_height")
      if (savedHeight) setHeight(Number(savedHeight))
    }
  }, [])

  // Sync state changes with localStorage
  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== "welcome")) {
      localStorage.setItem("sparky_chat_messages", JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    localStorage.setItem("sparky_button_position", JSON.stringify(buttonPosition))
  }, [buttonPosition])

  useEffect(() => {
    localStorage.setItem("sparky_chat_position", JSON.stringify(chatPosition))
  }, [chatPosition])

  useEffect(() => {
    localStorage.setItem("sparky_chat_width", String(width))
  }, [width])

  useEffect(() => {
    localStorage.setItem("sparky_chat_height", String(height))
  }, [height])

  // Close chatbot when clicking outside the chat card or floating trigger button
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (
        chatWindowRef.current && 
        !chatWindowRef.current.contains(e.target) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(e.target)
      ) {
        setIsOpen(false)
        setShowTooltip(true)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Triggers welcoming tooltip after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setShowTooltip(false)

    try {
      // Build history for Groq
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          chatHistory: history,
          currentPath: pathname || "/"
        })
      })

      if (res.ok) {
        const data = await res.json()
        const botMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.reply || "I didn't quite get that. Could you try rephrasing?"
        }
        setMessages((prev) => [...prev, botMessage])
      } else {
        throw new Error("API call failed")
      }
    } catch (err) {
      console.error(err)
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Oops! I encountered an error connecting to my database servers. 🔌 Please try again in a few seconds!"
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    { label: "🎒 How to edit my Profile?", text: "How do I edit my profile and details?" },
    { label: "🔑 How do I unlock exams?", text: "How do I unlock available exams using the teacher code?" },
    { label: "🎓 Where are Admin stats?", text: "How do I view the teacher dashboard, analysis screen, and student metrics?" },
    { label: "🤖 What is the AI Tutor?", text: "Tell me about the AI Tutor resizable split panel in review pages." }
  ]

  // Render message text with simple markdown list and bold support
  const renderMessageText = (text) => {
    if (typeof text !== "string") return text

    return text.split("\n").map((line, idx) => {
      let content = line

      // Bold text replacement: **text**
      const boldRegex = /\*\*(.*?)\*\*/g
      let match
      const elements = []
      let lastIndex = 0

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          elements.push(content.substring(lastIndex, match.index))
        }
        elements.push(
          <strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">
            {match[1]}
          </strong>
        )
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < content.length) {
        elements.push(content.substring(lastIndex))
      }

      // Check if line is a list item
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed mt-1">
            {elements.length > 0 ? elements : line.substring(2)}
          </li>
        )
      }

      // Check if line is an ordered list item (e.g. 1. )
      const orderedMatch = line.match(/^(\d+)\.\s(.*)/)
      if (orderedMatch) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs leading-relaxed mt-1">
            {elements.length > 0 ? elements : orderedMatch[2]}
          </li>
        )
      }

      // Check if line is a header (e.g. ### )
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-xs font-black text-slate-800 mt-3 mb-1 uppercase tracking-wider block">
            {line.substring(4)}
          </h4>
        )
      }

      return (
        <p key={idx} className="text-xs leading-relaxed mt-1.5 first:mt-0">
          {elements.length > 0 ? elements : line}
        </p>
      )
    })
  }

  return (
    <>
      {/* Floating round button & tooltip */}
      <div 
        style={{ right: `${buttonPosition.right}px`, bottom: `${buttonPosition.bottom}px` }}
        className="fixed z-50 flex flex-col items-end gap-3 pointer-events-none"
      >
        
        {/* Breathing tooltip */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => { setIsOpen(true); setShowTooltip(false); }}
              className="bg-white text-slate-700 text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto cursor-pointer flex items-center gap-1.5 hover:bg-slate-50 transition-colors shrink-0 max-w-xs relative z-50 animate-bounce-slow"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Need navigation help? Ask Sparky! 🤖</span>
              <X 
                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }} 
                className="h-3 w-3 ml-2 text-slate-400 hover:text-slate-600 cursor-pointer pointer-events-auto" 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot round floating button */}
        <motion.div
          ref={triggerButtonRef}
          onMouseDown={handleButtonMouseDown}
          onTouchStart={handleButtonTouchStart}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            y: isOpen ? 0 : [0, -8, 0] // Gentle continuous spring bobbing when closed!
          }}
          transition={{
            y: {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            },
            type: "spring",
            damping: 15
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="pointer-events-auto cursor-grab active:cursor-grabbing relative"
        >
          {/* Pulsing glow aura ring outside the button */}
          <span className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 opacity-60 blur-md animate-pulse z-0" />
          
          <button
            onClick={handleButtonClick}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-2xl relative overflow-hidden group cursor-grab active:cursor-grabbing focus:outline-none transition-all duration-300 z-10"
            title="Drag me anywhere or Click to Open Sparky! 🤖"
          >
            {/* Animated breathing aura */}
            <span className="absolute inset-0 rounded-full p-px bg-white/20 animate-pulse z-20" />
            
            {isOpen ? (
              <X className="h-6 w-6 animate-spin-once relative z-30" />
            ) : (
              <div className="relative z-30 flex items-center justify-center">
                <Bot className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                <motion.div 
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                </motion.div>
              </div>
            )}
          </button>
        </motion.div>
      </div>

      {/* Resizable Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            style={{ 
              width: `${width}px`, 
              height: `${height}px`,
              right: `${chatPosition.right}px`,
              bottom: `${chatPosition.bottom}px`
            }}
            className="fixed z-50 bg-white/95 backdrop-blur-xl border border-slate-200/70 shadow-2xl rounded-2xl flex flex-col overflow-hidden select-none min-w-[320px] min-h-[400px] max-w-[95vw] max-h-[85vh]"
          >
            {/* 4-Edge Resize Handles */}
            {/* Left Edge Handle */}
            <div 
              onMouseDown={(e) => handleBorderResizeMouseDown(e, "left")}
              onTouchStart={(e) => handleBorderResizeTouchStart(e, "left")}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-w-resize z-50 hover:bg-primary/20 active:bg-primary/30 transition-colors pointer-events-auto"
              title="Drag left to resize width"
            />
            {/* Right Edge Handle */}
            <div 
              onMouseDown={(e) => handleBorderResizeMouseDown(e, "right")}
              onTouchStart={(e) => handleBorderResizeTouchStart(e, "right")}
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-e-resize z-50 hover:bg-primary/20 active:bg-primary/30 transition-colors pointer-events-auto"
              title="Drag right to resize width"
            />
            {/* Top Edge Handle */}
            <div 
              onMouseDown={(e) => handleBorderResizeMouseDown(e, "top")}
              onTouchStart={(e) => handleBorderResizeTouchStart(e, "top")}
              className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize z-50 hover:bg-primary/20 active:bg-primary/30 transition-colors pointer-events-auto"
              title="Drag top to resize height"
            />
            {/* Bottom Edge Handle */}
            <div 
              onMouseDown={(e) => handleBorderResizeMouseDown(e, "bottom")}
              onTouchStart={(e) => handleBorderResizeTouchStart(e, "bottom")}
              className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize z-50 hover:bg-primary/20 active:bg-primary/30 transition-colors pointer-events-auto"
              title="Drag bottom to resize height"
            />

            {/* Window Header */}
            <div className="bg-gradient-to-r from-primary via-indigo-600 to-accent text-white p-3.5 flex items-center justify-between cursor-move shrink-0 select-none">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
                    <Bot className="h-4.5 w-4.5 text-white" />
                  </div>
                  {/* Status pulsing dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black tracking-tight flex items-center gap-1">
                    Sparky (Guide)
                    <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                  </div>
                  <div className="text-[10px] text-white/70 font-semibold">Online Assistant</div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)} 
                className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white focus:outline-none pointer-events-auto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-visible bg-slate-50/50 pointer-events-auto">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex gap-2.5 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  {m.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/20 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <div className={`p-3 rounded-2xl text-xs font-semibold shadow-sm leading-relaxed ${
                      m.role === "user" 
                        ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-tr-none" 
                        : "bg-white border border-slate-200/50 text-slate-700 rounded-tl-none"
                    }`}>
                      {renderMessageText(m.content)}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/20 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-white border border-slate-200/50 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1 h-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              )}
              
              {/* Suggestion pills visible when idle and chat is active */}
              {!loading && messages.length === 1 && (
                <div className="pt-2 space-y-2 select-none">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-primary" />
                    Recommended Manuals:
                  </div>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s.text)}
                        className="text-left text-xs bg-white hover:bg-primary/5 hover:text-primary hover:border-primary/20 text-slate-700 font-semibold px-3 py-2 rounded-xl border border-slate-200/70 shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-between group pointer-events-auto"
                      >
                        <span>{s.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0 select-none pointer-events-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleSendMessage() }}
                placeholder="Ask Sparky about ExamPro..."
                disabled={loading}
                className="h-9 text-xs rounded-xl bg-white border-slate-200 focus:bg-white"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="h-9 w-9 p-0 bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md shrink-0 flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Custom resizing grip indicator in bottom corner */}
            <div 
              onMouseDown={handleResizeMouseDown}
              onTouchStart={handleResizeTouchStart}
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1.5 z-50 group pointer-events-auto"
              title="Drag to resize Sparky! 🤖"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                className="text-slate-400 group-hover:text-primary transition-colors transform group-hover:scale-110"
              >
                <path d="M12 0 L0 12 M12 4 L4 12 M12 8 L8 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
