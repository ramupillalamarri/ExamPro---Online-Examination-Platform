"use client"

import React, { useEffect, useState, useRef } from "react"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Send, GraduationCap, Sparkles, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

const renderMessageText = (text) => {
  if (!text) return null
  const lines = text.split("\n")
  return lines.map((line, lineIdx) => {
    let isListItem = false
    let cleanLine = line
    if (line.trim().startsWith("- ")) {
      isListItem = true
      cleanLine = line.trim().substring(2)
    } else if (line.trim().startsWith("* ")) {
      isListItem = true
      cleanLine = line.trim().substring(2)
    }

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g)
    const content = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-slate-800">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })

    if (isListItem) {
      return (
        <span key={lineIdx} className="block pl-4 my-1 leading-relaxed text-[12.5px]">
          • {content}
        </span>
      )
    }

    return (
      <span key={lineIdx} className="block min-h-[1.25rem] leading-relaxed text-[12.5px]">
        {content}
      </span>
    )
  })
}

export default function ReviewClient({ examId }) {
  const { user } = useExamStore()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  
  // AI Tutor states
  const [chatMessages, setChatMessages] = useState([
    { id: 0, from: "bot", text: "Hi! I'm your AI Tutor. Ask your question about the current review and I'll help you understand it better." }
  ])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const chatHistoriesRef = useRef({})
  const leftColumnRef = useRef(null)
  const [leftHeight, setLeftHeight] = useState(550)
  const [isDesktop, setIsDesktop] = useState(false)
  const showTutor = !(user?.role === 'teacher' || user?.role === 'admin')

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, chatLoading])

  // Restore or initialize AI Tutor chat when question changes
  useEffect(() => {
    if (questions && questions[currentQuestionIdx]) {
      const activeQuestion = questions[currentQuestionIdx]
      const questionId = activeQuestion.id
      const histories = chatHistoriesRef.current
      
      if (histories[questionId]) {
        setChatMessages(histories[questionId])
      } else {
        const initialMsgs = [
          { 
            id: Date.now(), 
            from: "bot", 
            text: `Hi! I'm your AI Tutor. Ask me any doubts about this question on **${activeQuestion.topic || 'General'}** and I'll help you understand it step by step!` 
          }
        ]
        setChatMessages(initialMsgs)
        histories[questionId] = initialMsgs
      }
      setChatInput("")
      setChatLoading(false)
    }
  }, [currentQuestionIdx, questions])

  useEffect(() => {
    if (!leftColumnRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setLeftHeight(entry.target.offsetHeight)
      }
    })
    resizeObserver.observe(leftColumnRef.current)
    return () => resizeObserver.disconnect()
  }, [questions, currentQuestionIdx, loading])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const userId = user?.id
        if (!userId) {
          console.warn('No user ID available')
          setLoading(false)
          return
        }
        const res = await fetch(`/api/data?userId=${encodeURIComponent(userId)}`)
        
        if (!res.ok) {
          throw new Error(`Failed to load review data: ${res.statusText}`)
        }
        
        const json = await res.json()
        const foundExam = (json.exams || []).find((e) => e.id === examId)
        setExam(foundExam || null)
        const qs = (json.questions || []).filter((q) => q.examId === examId)
        setQuestions(qs)
        const urlParams = new URLSearchParams(window.location.search)
        const queryAttemptId = urlParams.get("attempt")
        let activeAttempt = null
        if (queryAttemptId) {
          activeAttempt = (json.attempts || []).find((a) => a.id === queryAttemptId)
        }
        if (!activeAttempt) {
          const matchingAttempts = (json.attempts || []).filter((a) => a.examId === examId && a.userId === userId)
          activeAttempt = matchingAttempts.sort((a,b) => new Date(b.startedAt) - new Date(a.startedAt))[0]
        }
        setAttempt(activeAttempt || null)
        const ans = (json.answers || []).filter((a) => a.attemptId === (activeAttempt?.id))
        setAnswers(ans)
      } catch (err) {
        console.error('Review load error', err)
        setExam(null)
        setQuestions([])
        setAttempt(null)
        setAnswers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examId, user])

  const getAnswerForQuestion = (qId) => answers.find((a) => a.questionId === qId)

  const getQuestionStatus = (q) => {
    const ans = getAnswerForQuestion(q.id)
    if (!ans) return 'skipped'
    if (ans.selectedOptionId?.toString() === q.correctOptionId?.toString()) return 'correct'
    return 'incorrect'
  }

  // AI Tutor Chat Handler
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    
    const currentQuestion = questions[currentQuestionIdx]
    if (!currentQuestion) return

    const userMsg = { id: Date.now(), from: "user", text: chatInput }
    const updatedMessagesWithUser = [...(chatHistoriesRef.current[currentQuestion.id] || []), userMsg]
    chatHistoriesRef.current[currentQuestion.id] = updatedMessagesWithUser
    
    setChatMessages(updatedMessagesWithUser)
    const currentInput = chatInput
    setChatInput("")
    setChatLoading(true)

    try {
      // Parse options if they're JSON strings
      let options = currentQuestion.options || []
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options)
        } catch (e) {
          console.error('Failed to parse options:', e)
          options = []
        }
      }

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          examId,
          attemptId: attempt?.id,
          question: {
            id: currentQuestion.id,
            questionText: currentQuestion.questionText,
            options: options,
            correctOptionId: currentQuestion.correctOptionId,
            topic: currentQuestion.topic || "General",
            subject: currentQuestion.subject || "General"
          },
          chatHistory: updatedMessagesWithUser.map(msg => ({
            role: msg.from === "user" ? "user" : "assistant",
            content: msg.text
          }))
        })
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`)
      }

      const json = await res.json()
      const botReply = json.response || json.explanation || "I couldn't process that. Please try again."
      
      const botMsg = {
        id: Date.now() + 1,
        from: "bot",
        text: botReply
      }
      const updatedMessagesWithBot = [...(chatHistoriesRef.current[currentQuestion.id] || []), botMsg]
      chatHistoriesRef.current[currentQuestion.id] = updatedMessagesWithBot
      if (questions[currentQuestionIdx]?.id === currentQuestion.id) {
        setChatMessages(updatedMessagesWithBot)
      }
    } catch (err) {
      console.error('Chat error:', err)
      const errMsg = {
        id: Date.now() + 2,
        from: "bot",
        text: "Sorry, I encountered an error. Please try again."
      }
      const updatedMessagesWithError = [...(chatHistoriesRef.current[currentQuestion.id] || []), errMsg]
      chatHistoriesRef.current[currentQuestion.id] = updatedMessagesWithError
      if (questions[currentQuestionIdx]?.id === currentQuestion.id) {
        setChatMessages(updatedMessagesWithError)
      }
    } finally {
      if (questions[currentQuestionIdx]?.id === currentQuestion.id) {
        setChatLoading(false)
      }
    }
  }

  if (loading) return <div className="p-6 text-center text-sm font-semibold text-slate-500">Loading review...</div>

  if (!attempt || questions.length === 0) {
    return <div className="p-6 text-center text-sm font-semibold text-slate-500">No attempts found for this exam.</div>
  }

  const currentQuestion = questions[currentQuestionIdx]
  if (!currentQuestion) {
    return <div className="p-6 text-center text-sm font-semibold text-slate-500">Question not found. Please refresh the page.</div>
  }
  
  const currentAnswer = getAnswerForQuestion(currentQuestion.id)
  const currentStatus = getQuestionStatus(currentQuestion)
  const correctOptionId = currentQuestion.correctOptionId?.toString()
  const selectedOptionId = currentAnswer?.selectedOptionId?.toString()

  const leftColumnContent = (
    <div ref={leftColumnRef} className="flex-1 flex flex-col gap-4 w-full h-full min-h-0">
      {/* Questions Navigation Box */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm shadow-slate-100/50 flex-shrink-0">
        <p className="text-[12.5px] font-extrabold text-slate-800 tracking-tight mb-3">Questions</p>
        <div className="flex gap-2 flex-wrap items-center mb-3.5">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q)
            const isActive = idx === currentQuestionIdx
            
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`w-8.5 h-8.5 rounded-full font-extrabold text-xs transition-all duration-150 flex items-center justify-center ${
                  isActive
                    ? 'border-2 border-[#2563eb] bg-blue-50/50 text-[#2563eb] ring-4 ring-blue-500/5 shadow-sm'
                    : 'bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-bold'
                }`}
                title={`Question ${idx + 1} - ${status}`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
        
        {/* Navigation Legend */}
        <div className="flex gap-4 text-[11px] text-slate-500 font-extrabold border-t border-slate-100/80 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
            <span>Correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div>
            <span>Incorrect</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#94a3b8]"></div>
            <span>Skipped</span>
          </div>
        </div>
      </div>

      {/* Question Details Box */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm shadow-slate-100/50 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Question Badges Line */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="bg-slate-100 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide">
              Q{currentQuestionIdx + 1}
            </span>
            <span className="bg-slate-100 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide">
              {currentQuestion.marks || 2} marks
            </span>
            {currentQuestion.topic && (
              <span className="bg-slate-100 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide">
                {currentQuestion.topic}
              </span>
            )}
          </div>
          
          {/* Question Attempt Status Badge */}
          <div className="ml-auto">
            {currentStatus === 'correct' ? (
              <span className="bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]/80 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1 shadow-sm">
                <span className="text-[9px]">✓</span> Correct
              </span>
            ) : currentStatus === 'incorrect' ? (
              <span className="bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]/80 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1 shadow-sm">
                <span className="text-[9px]">✗</span> Incorrect
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 border border-slate-200/80 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1 shadow-sm">
                <span className="text-[12px] leading-none">-</span> Skipped
              </span>
            )}
          </div>
        </div>

        {/* Question Text */}
        <h2 className="text-[16.5px] font-extrabold text-slate-800 leading-snug mb-4 flex-shrink-0">
          {currentQuestion.questionText}
        </h2>

        {/* Options List - Independently Scrollable inside details if it overflows */}
        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
          {(() => {
            let options = currentQuestion.options || []
            if (typeof options === 'string') {
              try {
                options = JSON.parse(options)
              } catch (e) {
                console.error('Failed to parse options:', e)
                return <p className="text-red-500 text-xs font-semibold">Error displaying options</p>
              }
            }
            
            return options.map((optItem, optIdx) => {
              const optText = typeof optItem === 'string' ? optItem : (optItem?.text || optItem?.label || '')
              const optionId = typeof optItem === 'string' ? optIdx.toString() : (optItem?.id || optIdx.toString())
              const isCorrect = optionId === correctOptionId
              const isSelected = optionId === selectedOptionId
              const isWrongSelection = isSelected && !isCorrect

              return (
                <div
                  key={optIdx}
                  className={`py-2.5 px-4 rounded-xl border transition-all duration-150 flex items-center gap-3.5 shadow-sm ${
                    isCorrect
                      ? 'border-[#10b981] bg-[#ecfdf5]/30 border-2'
                      : isWrongSelection
                      ? 'border-[#f43f5e] bg-[#fff1f2]/30 border-2'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  {/* Circle Letter Badge */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 transition-colors ${
                    isCorrect
                      ? 'bg-[#10b981] text-white shadow-sm'
                      : isWrongSelection
                      ? 'bg-[#f43f5e] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  
                  {/* Text */}
                  <span className={`text-[13px] leading-relaxed flex-1 ${
                    isCorrect 
                      ? 'text-slate-800 font-extrabold' 
                      : isWrongSelection 
                      ? 'text-slate-800 font-extrabold' 
                      : 'text-slate-600 font-bold'
                  }`}>
                    {optText}
                  </span>
                  
                  {/* Check/X Icon */}
                  {isCorrect && (
                    <div className="text-[#10b981] flex-shrink-0 ml-auto bg-[#ecfdf5] rounded-full p-0.5 border border-[#a7f3d0]">
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                    </div>
                  )}
                  {isWrongSelection && (
                    <div className="text-[#f43f5e] flex-shrink-0 ml-auto bg-[#fff1f2] rounded-full p-0.5 border border-[#fecdd3]">
                      <XCircle className="w-3.5 h-3.5 fill-[#f43f5e] text-white" />
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>

        {/* Bottom Question Controls */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
            disabled={currentQuestionIdx === 0}
            className="border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 h-9 text-xs shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </Button>
          <span className="text-xs text-slate-500 font-extrabold tracking-wide">
            {currentQuestionIdx + 1} / {questions.length}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIdx(Math.min(questions.length - 1, currentQuestionIdx + 1))}
            disabled={currentQuestionIdx === questions.length - 1}
            className="border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 h-9 text-xs shadow-sm"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="mt-4 flex justify-center flex-shrink-0">
          <button 
            className="text-slate-500 hover:text-slate-800 text-[11px] font-extrabold flex items-center gap-1 mt-1 transition-colors"
            onClick={() => {
              if (user?.role === 'teacher' || user?.role === 'admin') {
                window.location.href = '/admin/exams';
              } else {
                window.location.href = '/student/exams';
              }
            }}
          >
            ← Back to Exams
          </button>
        </div>
      </div>
    </div>
  )

  const rightColumnContent = (
    <div 
      style={{ height: leftHeight ? `${leftHeight}px` : 'auto' }}
      className="flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/30 overflow-hidden w-full h-full min-h-0"
    >
      {/* AI Tutor Card Header */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7.5 h-7.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-100/30 animate-pulse" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-xs tracking-tight flex items-center">
            <span className="text-blue-600">ExamPro</span>&nbsp;AI Tutor
          </h3>
        </div>
        <p className="text-[10.5px] text-slate-500 font-bold leading-relaxed">
          Ask your question about the current review and get a guided explanation.
        </p>
      </div>

      {/* Chat History Panel - INDEPENDENT SCROLL BAR */}
      <div className="flex-1 overflow-y-auto scrollbar-visible p-4 space-y-4 bg-slate-50/20">
        {chatMessages.map((msg, idx) => {
          const isBot = msg.from === "bot"
          const isInitialMsg = msg.id === 0
          
          return (
            <div key={msg.id} className={`flex items-start ${isBot ? 'justify-start gap-2.5' : 'justify-end'}`}>
              {isBot && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-100 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white fill-white/20" />
                </div>
              )}
              <div className={`px-3.5 py-3 rounded-2xl text-[12.5px] leading-relaxed shadow-sm ${
                isBot
                  ? "bg-[#f5f3ff]/70 border border-purple-100/50 text-slate-600 font-bold rounded-tl-none max-w-[84%]"
                  : "bg-blue-600 text-white font-bold rounded-tr-none max-w-[84%] shadow-blue-100/50 shadow-md"
              }`}>
                {isInitialMsg ? (
                  <span>
                    Hi! I'm your AI tutor. I can help explain the current question on <strong className="font-extrabold text-slate-800 underline decoration-blue-500/30 decoration-2 underline-offset-2">{currentQuestion.topic || "this topic"}</strong>.
                  </span>
                ) : (
                  <div className="space-y-1">{renderMessageText(msg.text)}</div>
                )}
              </div>
            </div>
          )
        })}
        
        {chatLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-100 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white fill-white/20" />
            </div>
            <div className="bg-[#f5f3ff]/70 border border-purple-100/50 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Panel - Sticky inside tutor box */}
      <div className="p-3.5 border-t border-slate-100 bg-white flex-shrink-0">
        <div className="flex gap-2 items-center">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your doubt here..."
            disabled={chatLoading}
            className="flex-1 text-[11px] border-slate-200 bg-slate-50 hover:bg-slate-50/50 focus-visible:ring-[#2563eb]/20 focus-visible:border-[#2563eb] rounded-xl h-10 px-3.5 font-bold text-slate-700 placeholder:text-slate-400 shadow-inner"
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || chatLoading}
            className="w-10 h-10 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:scale-100 text-white flex items-center justify-center transition-all shadow-md shadow-blue-200/60 flex-shrink-0"
          >
            <Send className="w-4 h-4 fill-white text-white translate-x-[-1px] translate-y-[1px]" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased">
      {/* Header */}
      <div className="bg-white border-b border-slate-100/80 px-6 py-3.5 sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex-shrink-0">
        <div className="flex justify-between items-center max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="text-slate-400 hover:text-slate-700 text-xl font-semibold transition-colors pr-1"
            >
              ←
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100/10">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[14.5px] font-extrabold text-slate-800 tracking-tight leading-none">{exam?.title || 'Exam'}</h1>
                  {attempt && attempt.studentEmail && attempt.userId !== user?.id && (
                    <span className="text-[9.5px] bg-blue-50 border border-blue-200/80 text-blue-600 px-2 py-0.5 rounded font-extrabold">
                      Student: {attempt.studentEmail}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 font-bold mt-1.5 leading-none">Reviewing Q{currentQuestionIdx + 1} of {questions.length}</p>
              </div>
            </div>
          </div>
          {showTutor && (
            <p className="text-[11px] text-slate-400 font-bold tracking-wide hidden sm:block">
              AI Tutor is available beside the question review panel.
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-5 flex flex-col gap-5 items-stretch min-h-0">
        {showTutor ? (
          isDesktop ? (
            <PanelGroup direction="horizontal" className="flex-1 w-full gap-0">
              <Panel defaultSize={65} minSize={40} maxSize={80} className="flex flex-col pr-3">
                {leftColumnContent}
              </Panel>
              
              <PanelResizeHandle className="w-4 transition-all duration-300 relative flex items-center justify-center cursor-col-resize group px-1.5 select-none z-20">
                {/* Resizer central visual line */}
                <div className="w-[1.5px] h-full bg-slate-200 group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors duration-200" />
                {/* Draggable pull handle icon */}
                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-8 bg-slate-50 border border-slate-200 rounded-full group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:scale-110 opacity-70 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-center gap-0.5 items-center shadow-md">
                  <div className="w-0.5 h-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
                  <div className="w-0.5 h-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
                  <div className="w-0.5 h-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
                </div>
              </PanelResizeHandle>
              
              <Panel defaultSize={35} minSize={20} maxSize={60} className="flex flex-col pl-3">
                <div className="w-full h-full flex flex-col">
                  {rightColumnContent}
                </div>
              </Panel>
            </PanelGroup>
          ) : (
            <>
              {leftColumnContent}
              <div className="w-full flex flex-col">
                {rightColumnContent}
              </div>
            </>
          )
        ) : (
          <div className="w-full h-full flex flex-col">
            {leftColumnContent}
          </div>
        )}
      </div>
    </div>
  )
}
