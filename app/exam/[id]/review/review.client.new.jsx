"use client"

import React, { useEffect, useState, useRef } from "react"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Send } from "lucide-react"
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
        <span key={lineIdx} className="block pl-4 my-1 leading-relaxed text-xs">
          • {content}
        </span>
      )
    }

    return (
      <span key={lineIdx} className="block min-h-[1.25rem] leading-relaxed text-xs">
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
  const chatHistoriesRef = useRef({})
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

  if (loading) return <div className="p-6 text-center">Loading review...</div>

  if (!attempt || questions.length === 0) {
    return <div className="p-6 text-center">No attempts found for this exam.</div>
  }

  const currentQuestion = questions[currentQuestionIdx]
  if (!currentQuestion) {
    return <div className="p-6 text-center">Question not found. Please refresh the page.</div>
  }
  
  const currentAnswer = getAnswerForQuestion(currentQuestion.id)
  const currentStatus = getQuestionStatus(currentQuestion)
  const correctOptionId = currentQuestion.correctOptionId?.toString()
  const selectedOptionId = currentAnswer?.selectedOptionId?.toString()

  const leftColumnContent = (
    <div className="flex-1 overflow-auto bg-gray-50 h-full w-full min-h-0">
      <div className="p-8 max-w-2xl">
        {/* Question Navigation Card */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-100 animate-in fade-in duration-200">
          <p className="text-sm font-semibold text-gray-700 mb-4">Questions</p>
          <div className="flex gap-3 flex-wrap items-center mb-4">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q)
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-10 h-10 rounded-full font-medium transition-all flex items-center justify-center text-sm ${
                    idx === currentQuestionIdx
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span>Incorrect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
              <span>Skipped</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          {/* Question Header */}
          <div className="pb-4 border-b border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Q{currentQuestionIdx + 1}</span>
                <span className="text-sm text-gray-600">{currentQuestion.marks || 2} marks</span>
                {currentQuestion.topic && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                    {currentQuestion.topic}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${
                currentStatus === 'correct' 
                  ? 'text-green-600'
                  : currentStatus === 'incorrect'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}>
                {currentStatus === 'correct' ? '✓ Correct' : currentStatus === 'incorrect' ? '✗ Incorrect' : 'Skipped'}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{currentQuestion.questionText}</h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {(() => {
              let options = currentQuestion.options || []
              if (typeof options === 'string') {
                try {
                  options = JSON.parse(options)
                } catch (e) {
                  console.error('Failed to parse options:', e)
                  return <p className="text-red-500">Error displaying options</p>
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
                    className={`p-4 rounded-lg border transition-all flex items-center gap-3 ${
                      isCorrect
                        ? 'border-green-500 bg-green-50 font-semibold'
                        : isWrongSelection
                        ? 'border-red-500 bg-red-50 font-semibold'
                        : 'border-gray-200 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isCorrect
                        ? 'bg-green-500 text-white'
                        : isWrongSelection
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-300 text-gray-700 border border-gray-400/20'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className={`font-medium flex-1 text-sm ${
                      isCorrect ? 'text-gray-900' : isWrongSelection ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {optText}
                    </span>
                    {isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-auto" />
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
            disabled={currentQuestionIdx === 0}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium disabled:text-gray-300"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            {currentQuestionIdx + 1} / {questions.length}
          </span>
          <button
            onClick={() => setCurrentQuestionIdx(Math.min(questions.length - 1, currentQuestionIdx + 1))}
            disabled={currentQuestionIdx === questions.length - 1}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium disabled:text-gray-300"
          >
            Next →
          </button>
        </div>

        {/* Back Button */}
        <div className="mt-6 flex gap-4">
          <button 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
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
    <div className="w-full border-l border-gray-200 bg-white flex flex-col h-full min-h-0">
      {/* Tutor Header */}
      <div className="p-6 border-b border-gray-200 bg-white flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold text-gray-900">
            <span className="text-blue-600">ExamPro</span> AI Tutor
          </h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">Ask your question about the current review and get a guided explanation.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50">
        {chatMessages.map((msg) => {
          const isInitialMsg = msg.id === 0
          return (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              {msg.from === "bot" && (
                <span className="text-lg mr-2 flex-shrink-0 mt-1">✨</span>
              )}
              <div className={`max-w-xs px-4 py-2.5 rounded-lg text-sm ${
                msg.from === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-900 border border-gray-200 shadow-sm"
              }`}>
                {isInitialMsg ? (
                  <p className="leading-relaxed">
                    Hi! I'm your AI tutor. I can help explain the current question on <strong className="font-semibold text-gray-900">{currentQuestion.topic || "this topic"}</strong>.
                  </p>
                ) : (
                  <div className="space-y-1">{renderMessageText(msg.text)}</div>
                )}
              </div>
            </div>
          )
        })}
        {chatLoading && (
          <div className="flex justify-start gap-2">
            <span className="text-lg flex-shrink-0 mt-1">✨</span>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex gap-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your doubt here..."
            disabled={chatLoading}
            className="flex-1 text-sm border-gray-300 placeholder:text-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || chatLoading}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-4 sticky top-0 z-10 bg-white flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                📚
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-semibold text-gray-900">{exam?.title || 'Exam'}</h1>
                  {attempt && attempt.studentEmail && attempt.userId !== user?.id && (
                    <span className="text-[9.5px] bg-blue-50 border border-blue-200/80 text-blue-600 px-2 py-0.5 rounded font-extrabold">
                      Student: {attempt.studentEmail}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Reviewing Q{currentQuestionIdx + 1} of {questions.length}</p>
              </div>
            </div>
          </div>
          {showTutor && (
            <p className="text-sm text-gray-500">AI Tutor is available beside the question review panel.</p>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {showTutor ? (
          isDesktop ? (
            <PanelGroup direction="horizontal" className="flex-1 w-full gap-0">
              <Panel defaultSize={65} minSize={40} maxSize={80} className="flex flex-col">
                {leftColumnContent}
              </Panel>
              
              <PanelResizeHandle className="w-4 transition-all duration-300 relative flex items-center justify-center cursor-col-resize group px-1.5 select-none z-20">
                <div className="w-[1.5px] h-full bg-gray-200 group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-8 bg-white border border-gray-200 rounded-full group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:scale-110 opacity-70 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-center gap-0.5 items-center shadow-md">
                  <div className="w-0.5 h-0.5 rounded-full bg-gray-400 group-hover:bg-white" />
                  <div className="w-0.5 h-0.5 rounded-full bg-gray-400 group-hover:bg-white" />
                  <div className="w-0.5 h-0.5 rounded-full bg-gray-400 group-hover:bg-white" />
                </div>
              </PanelResizeHandle>
              
              <Panel defaultSize={35} minSize={20} maxSize={60} className="flex flex-col">
                {rightColumnContent}
              </Panel>
            </PanelGroup>
          ) : (
            <>
              {leftColumnContent}
              {rightColumnContent}
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
