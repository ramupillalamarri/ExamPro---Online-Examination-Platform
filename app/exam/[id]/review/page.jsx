"use client"

import { useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Minus,
  Brain
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function ReviewPage({
  params,
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const attemptId = searchParams.get("attempt")

  const {
    isAuthenticated,
    exams,
    attempts,
    getExamQuestions,
    getAttemptAnswers,
    aiFeedback,
  } = useExamStore()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isScrollable, setIsScrollable] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const exam = exams.find((e) => e.id === id)
  const attempt = attempts.find((a) => a.id === attemptId)
  const questions = getExamQuestions(id)
  const answers = attempt ? getAttemptAnswers(attempt.id) : []
  const feedback = aiFeedback.find((f) => f.attemptId === attemptId)

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)
  const mistakeAnalysis = feedback?.mistakeAnalysis.find(
    (m) => m.questionId === currentQuestion?.id
  )

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentQuestion) return

    const userMessage = { role: "user", content: chatInput }
    const updatedMessages = [...chatMessages, userMessage]
    
    setChatMessages(updatedMessages)
    setChatInput("")
    setIsAiTyping(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          question: currentQuestion,
          chatHistory: updatedMessages // send previous history so AI remembers context
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      const assistantContent = data.explanation || data.response || "Sorry, no answer was returned."
      setChatMessages([...updatedMessages, {
        role: "assistant",
        content: assistantContent
      }])
    } catch (error) {
      console.error("AI Chat Error:", error)
      toast.error("Failed to connect to AI Tutor. Please try again.")
      // Remove the user's message if it failed or keep it so they can read it, typically keeping it is fine but let's add a generic fail message
      setChatMessages([...updatedMessages, {
        role: "assistant",
        content: "Sorry, I am having trouble connecting right now. Please try asking again later."
      }])
    } finally {
      setIsAiTyping(false)
    }
  }

  // Reset chat when changing questions
  useEffect(() => {
    setChatMessages([])
  }, [currentQuestionIndex])

  // Check if question card is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      const scrollArea = document.getElementById('question-scroll-area')
      if (scrollArea) {
        setIsScrollable(scrollArea.scrollHeight > scrollArea.clientHeight)
      }
    }
    
    checkScrollable()
    window.addEventListener('resize', checkScrollable)
    return () => window.removeEventListener('resize', checkScrollable)
  }, [currentQuestionIndex])

  if (!exam || !attempt || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50 shadow-2xl relative overflow-hidden bg-card/90 backdrop-blur-xl">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardContent className="pt-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Review not available
            </h3>
            <p className="text-sm text-muted-foreground">
              The exam review you're looking for doesn't exist or is loading.
            </p>
            <Link href="/student" className="block mt-4">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCorrect = currentAnswer?.isCorrect
  const wasAnswered = !!currentAnswer?.selectedOptionId

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/85 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <Link href={`/exam/${id}/result?attempt=${attemptId}`}>
              <Button variant="ghost" size="icon" className="shrink-0 hover:bg-muted/50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2.5 truncate">
              <div className="hidden sm:flex h-9 w-9 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="truncate">
                <h1 className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-md">{exam.title}</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  Reviewing Q{currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            AI Tutor is available beside the question review panel.
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-3 sm:py-4 overflow-hidden max-h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 h-full overflow-hidden">
          <div className="flex flex-col h-full space-y-3 overflow-y-auto scrollbar-visible pr-2">
            <div className="space-y-2">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-1.5">
                  <h3 className="font-semibold text-xs text-foreground mb-1">Questions</h3>
                  <div className="grid grid-cols-5 gap-1 max-h-[80px] overflow-y-auto pr-1">
                    {questions.map((question, index) => {
                      const answer = answers.find((a) => a.questionId === question.id)
                      const correct = answer?.isCorrect
                      const answered = !!answer?.selectedOptionId
                      const isCurrent = index === currentQuestionIndex

                      return (
                        <button
                          key={question.id}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`h-7 w-7 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center ${
                            isCurrent ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                          } ${
                            correct
                              ? "bg-success/15 text-success border border-success/30 hover:bg-success/25"
                              : answered
                              ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-border/50 text-[9px] font-medium">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded bg-success/20 border border-success/30" />
                      <span className="text-muted-foreground">Correct</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded bg-destructive/20 border border-destructive/30" />
                      <span className="text-muted-foreground">Incorrect</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded bg-muted border border-border" />
                      <span className="text-muted-foreground">Skipped</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="flex-1 overflow-hidden">
              <Card
                className={`border-2 shadow-sm ${
                  isCorrect
                    ? "border-success/40 bg-success/5"
                    : wasAnswered
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border/50"
                } h-full overflow-hidden`}
              >
                <CardContent className="p-2 sm:p-3 h-full flex flex-col">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <Badge variant="outline" className="bg-background text-xs">Q{currentQuestionIndex + 1}</Badge>
                    <Badge variant="secondary" className="bg-background text-xs">{currentQuestion.marks} marks</Badge>
                    {currentQuestion.topic && (
                      <Badge variant="outline" className="text-[10px] bg-background">
                        {currentQuestion.topic}
                      </Badge>
                    )}
                    {isCorrect ? (
                      <Badge className="bg-success text-white border-success ml-auto shadow-sm text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" />
                        Correct
                      </Badge>
                    ) : wasAnswered ? (
                      <Badge className="bg-destructive text-white border-destructive ml-auto shadow-sm text-[10px]">
                        <XCircle className="h-3 w-3 mr-0.5" />
                        Incorrect
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto bg-muted text-[10px]">
                        <Minus className="h-3 w-3 mr-0.5" />
                        Skipped
                      </Badge>
                    )}
                  </div>

                  <div id="question-scroll-area" className="flex-1 flex flex-col gap-0.5">
                    <p className="text-sm sm:text-lg font-semibold leading-5 sm:leading-6 text-foreground">
                      {currentQuestion.questionText}
                    </p>

                    <div className="space-y-1">
                      {currentQuestion.options.map((option) => {
                        const isSelected = currentAnswer?.selectedOptionId === option.id
                        const isCorrectOption = option.id === currentQuestion.correctOptionId

                        return (
                          <div
                            key={option.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                              isCorrectOption
                                ? "border-success bg-success/10 shadow-sm"
                                : isSelected
                                ? "border-destructive bg-destructive/10 shadow-sm"
                                : "border-border/50 bg-background/50"
                            }`}
                          >
                            <span
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                                isCorrectOption
                                  ? "bg-success text-white shadow-md shadow-success/20"
                                  : isSelected
                                  ? "bg-destructive text-white shadow-md shadow-destructive/20"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {option.id}
                            </span>
                            <span className={`flex-1 text-xs sm:text-sm leading-tight ${isCorrectOption ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                              {option.text}
                            </span>
                            {isCorrectOption && (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            )}
                            {isSelected && !isCorrectOption && (
                              <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {mistakeAnalysis && (
                      <Card className="border-accent/20 bg-accent/5 shadow-sm mt-0">
                        <CardHeader className="pb-1 pt-1.5">
                          <CardTitle className="text-[10px] flex items-center gap-1 text-accent">
                            <Sparkles className="h-2.5 w-2.5" />
                            Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0.5 pb-1">
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {mistakeAnalysis.explanation}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {isScrollable && (
                    <div className="flex justify-center pt-1">
                      <div className="animate-bounce">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                disabled={currentQuestionIndex === 0}
                className="px-3 sm:px-4 h-10 text-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-3 sm:px-4 h-10 text-sm"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div>
              <Link href={`/exam/${id}/result?attempt=${attemptId}`}>
                <Button variant="outline" className="w-full border-dashed hover:border-primary/50 text-[10px] h-8">
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back to Results Summary
                </Button>
              </Link>
            </div>
          </div>

          <aside className="flex flex-col h-full min-h-0 overflow-hidden">
            <Card className="border-border/50 shadow-sm h-full min-h-0 flex flex-col overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <CardTitle className="text-sm">ExamPro AI Tutor</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask your question about the current review and get a guided explanation.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col p-4 h-full min-h-0 overflow-hidden">
                <ScrollArea className="flex-1 pr-4 -mr-4 min-h-0 scrollbar-visible w-full">
                  <div className="space-y-4 pr-4">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-tl-sm p-3.5 text-sm shadow-sm">
                        <p className="leading-relaxed">
                          Hi! I'm your AI tutor. I can help explain the current question on <strong>{currentQuestion.topic || 'this topic'}</strong>.
                        </p>
                      </div>
                    </div>

                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                            message.role === "user"
                              ? "bg-foreground text-background"
                              : "bg-gradient-to-br from-primary to-accent"
                          }`}
                        >
                          {message.role === "user" ? (
                            <span className="text-xs font-bold uppercase">You</span>
                          ) : (
                            <Sparkles className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`rounded-2xl p-3.5 text-sm max-w-[85%] shadow-sm ${
                            message.role === "user"
                              ? "bg-foreground text-background rounded-tr-sm"
                              : "bg-muted/80 border border-border/50 rounded-tl-sm"
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                        </div>
                      </div>
                    ))}

                    {isAiTyping && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-tl-sm p-3.5 shadow-sm">
                          <div className="flex gap-1.5 py-1">
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.15s]" />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.3s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                  <Input
                    placeholder="Type your doubt here..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage()
                    }}
                    disabled={isAiTyping}
                    className="bg-muted/50 border-border focus-visible:ring-primary/50 rounded-full px-4"
                  />
                  <Button size="icon" onClick={handleSendMessage} disabled={isAiTyping} className="rounded-full shrink-0 shadow-md">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
 
