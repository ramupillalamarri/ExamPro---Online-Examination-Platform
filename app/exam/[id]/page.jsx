"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  GraduationCap,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  Save,
  Play,
  Info,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"

export default function ExamPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    exams,
    getExamQuestions,
    startAttempt,
    getCurrentAttempt,
    saveAnswer,
    getAttemptAnswers,
    submitAttempt,
    updateAttemptWarnings,
  } = useExamStore()

  const [isStarted, setIsStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [showTerminationDialog, setShowTerminationDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const exam = exams.find((e) => e.id === id)
  const questions = getExamQuestions(id)
  const attempt = getCurrentAttempt(id)
  const answers = attempt ? getAttemptAnswers(attempt.id) : []

  // Check auth and exam publication status
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (!exam || !exam.isPublished) {
      router.push("/student")
      return
    }
  }, [exam, isAuthenticated, router])

  // Fetch exam data from API on mount if questions empty
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const res = await fetch(`/api/data?userId=${encodeURIComponent(user.id)}&examId=${encodeURIComponent(id)}`)
          if (res.ok) {
            const data = await res.json()
            if (data.exams || data.questions) {
              useExamStore.setState({ 
                exams: data.exams || [], 
                questions: data.questions || [] 
              })
            }
          }
        } catch (err) {
          console.error('Failed to load exam data:', err)
        }
      }
    }
    // Load data if questions are empty
    if (questions.length === 0 && isAuthenticated) {
      loadData()
    }
  }, [user?.id, isAuthenticated, questions.length, id])

  // Timer logic
  useEffect(() => {
    if (!isStarted || timeRemaining === null || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isStarted, timeRemaining])

  // Anti-cheat visibility change listener
  useEffect(() => {
    if (!isStarted || !attempt) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          // Await the warning update to get the actual warning count from server
          const updatedAttempt = await updateAttemptWarnings(attempt.id)
          const currentWarnings = updatedAttempt?.warnings || (attempt.warnings + 1)
          
          if (currentWarnings >= 4) {
            exitFullscreen()
            setIsSubmitting(true)
            toast.error("Exam terminated: Tab switched more than 3 times!")
            // Automatically submit exam
            await submitAttempt(attempt.id)
            setShowTerminationDialog(true)
          } else {
            setShowWarningDialog(true)
          }
        } catch (err) {
          console.error('Error handling visibility change:', err)
          toast.error('Error recording tab switch. Please retry.')
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isStarted, attempt, updateAttemptWarnings, submitAttempt])

  // Fullscreen Helpers
  const enterFullscreen = async () => {
    try {
      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ((element).webkitRequestFullscreen) {
        await (element).webkitRequestFullscreen()
      } else if ((element).msRequestFullscreen) {
        await (element).msRequestFullscreen()
      }
    } catch (err) {
      console.warn("Fullscreen request rejected:", err)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document).webkitExitFullscreen) {
          await (document).webkitExitFullscreen()
        } else if ((document).msExitFullscreen) {
          await (document).msExitFullscreen()
        }
      }
    } catch (err) {
      console.warn("Failed to exit fullscreen:", err)
    }
  }

  const handleStartExam = async () => {
    try {
      const currentAttempt = await startAttempt(id)
      if (!currentAttempt) {
        toast.error('Unable to start exam. Please try again.')
        return
      }
      if (currentAttempt.timeRemainingSeconds) {
        setTimeRemaining(currentAttempt.timeRemainingSeconds)
      } else {
        setTimeRemaining(exam ? exam.durationMinutes * 60 : 3600)
      }
      await enterFullscreen()
      setIsStarted(true)
      toast.success("Exam started! Fullscreen mode enabled.")
    } catch (err) {
      console.error('Start attempt failed:', err)
      toast.error(err?.message || 'Cannot start exam: attempt limit reached.')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)

  const handleSelectOption = useCallback(
    async (optionId) => {
      if (!attempt || !currentQuestion) return

      setIsSaving(true)
      // Save answer to store and PostgreSQL
      await saveAnswer(attempt.id, currentQuestion.id, optionId)
      setIsSaving(false)
    },
    [attempt, currentQuestion, saveAnswer]
  )

  const handleSubmit = async () => {
    if (!attempt) return

    setIsSubmitting(true)
    await exitFullscreen()
    await submitAttempt(attempt.id)
    toast.success("Exam submitted successfully!")
    router.push(`/exam/${id}/result?attempt=${attempt.id}`)
  }

  const getQuestionStatus = (questionId) => {
    const answer = answers.find((a) => a.questionId === questionId)
    return answer?.selectedOptionId ? "answered" : "unanswered"
  }

  const answeredCount = questions.filter(
    (q) => getQuestionStatus(q.id) === "answered"
  ).length

  if (!exam || !currentQuestion) {
    if (!exam) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-border/50">
            <CardHeader>
              <CardTitle className="text-destructive">Exam Not Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">The exam you're looking for doesn't exist or isn't published.</p>
              <Button onClick={() => router.push("/student/exams")} className="w-full">
                Back to Exams
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam questions...</p>
        </div>
      </div>
    )
  }

  // Pre-start dashboard overlay
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50 shadow-2xl relative overflow-hidden bg-card/90 backdrop-blur-xl">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{exam.title}</CardTitle>
            <CardDescription>{exam.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="p-4 rounded-lg bg-muted space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Duration:</span>
                <span className="font-semibold text-foreground">{exam.durationMinutes} Minutes</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-success" /> Questions:</span>
                <span className="font-semibold text-foreground">{questions.length} Items</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Info className="h-4 w-4 text-warning" /> Penalty:</span>
                <span className="font-semibold text-foreground">
                  {questions.some((q) => q.negativeMarking > 0)
                    ? 'Varies per question (GATE style)'
                    : (exam.negativeMarking ? `${Math.round(exam.negativeMarking * 100)}% of question marks` : 'No negative marking')}
                </span>
              </div>
            </div>

            <div className="border-l-4 border-warning bg-warning/10 p-3.5 rounded text-xs space-y-1.5">
              <p className="font-semibold text-warning flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Important Anti-Cheat Policies:
              </p>
              <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                <li>Starting the exam will toggle <strong>Fullscreen mode</strong>.</li>
                <li>Exiting fullscreen or switching windows is strictly monitored.</li>
                <li><strong>Maximum 3 warnings</strong> are allowed. On the 4th tab-switch, your exam is terminated and auto-submitted.</li>
              </ul>
            </div>

            <Button onClick={handleStartExam} className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/20">
              <Play className="h-4 w-4 mr-2" /> Start Exam & Fullscreen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timePercentage = timeRemaining !== null 
    ? (timeRemaining / (exam.durationMinutes * 60)) * 100 
    : 100
  const isLowTime = timeRemaining !== null && timeRemaining < 300 // 5 minutes

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/85 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 truncate">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="truncate">
                <h1 className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-md">
                  {exam.title}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                  isLowTime
                    ? "bg-destructive/10 text-destructive animate-pulse"
                    : "bg-muted text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono">
                  {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
                </span>
              </div>

              {/* Warnings */}
              {attempt && attempt.warnings > 0 && (
                <Badge variant="outline" className="text-warning border-warning/20 bg-warning/5 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  {attempt.warnings} {attempt.warnings === 1 ? 'warning' : 'warnings'}
                </Badge>
              )}

              {/* Save indicator */}
              {isSaving && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Save className="h-3.5 w-3.5 animate-pulse" />
                  Saving...
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="pb-1">
            <Progress value={timePercentage} className="h-1" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-2 sm:py-3 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col space-y-3">
          <div className="space-y-2">
            {/* Question Navigator */}
            <div className="w-full">
              <Card className="border-border/50">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <h3 className="font-semibold text-foreground">Questions</h3>
                    <span className="text-muted-foreground font-medium">
                      {answeredCount}/{questions.length} answered
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 max-h-[140px] overflow-y-auto pr-1">
                    {questions.map((question, index) => {
                      const status = getQuestionStatus(question.id)
                      const isCurrent = index === currentQuestionIndex

                      return (
                        <button
                          key={question.id}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`h-7 w-7 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center ${
                            isCurrent
                              ? "bg-primary text-primary-foreground shadow"
                              : status === "answered"
                              ? "bg-success/10 text-success border border-success/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded bg-success/10 border border-success/20" />
                      <span className="text-muted-foreground">Answered</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded bg-muted" />
                      <span className="text-muted-foreground">Unanswered</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-2 border-dashed hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 text-[10px] h-7"
                    onClick={() => setShowSubmitDialog(true)}
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    Submit Exam
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Card className="border-border/50 shadow-md h-full overflow-hidden">
              <CardContent className="p-3 sm:p-4 h-full flex flex-col">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">Q{currentQuestionIndex + 1}</Badge>
                  <Badge variant="secondary" className="text-xs">{currentQuestion.marks} marks</Badge>
                  {currentQuestion.negativeMarking > 0 && (
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0">
                      -{Math.round(currentQuestion.negativeMarking * 100)}% negative
                    </Badge>
                  )}
                  {currentQuestion.topic && (
                    <Badge variant="outline" className="text-[10px]">
                      {currentQuestion.topic}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  <p className="text-base sm:text-xl font-semibold leading-8 text-foreground">
                    {currentQuestion.questionText}
                  </p>

                  <RadioGroup
                    value={currentAnswer?.selectedOptionId || ""}
                    onValueChange={handleSelectOption}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.id}
                        htmlFor={option.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          currentAnswer?.selectedOptionId === option.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={option.id} id={option.id} className="shrink-0" />
                        <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold uppercase shrink-0">
                          {option.id}
                        </span>
                        <span className="flex-1 text-sm sm:text-base text-foreground leading-relaxed">
                          {option.text}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3 mt-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                disabled={currentQuestionIndex === 0}
                className="px-3 sm:px-4 h-10 text-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={() => setShowSubmitDialog(true)} className="bg-gradient-to-r from-success to-emerald-600 text-white h-10 text-sm px-4">
                  <Flag className="h-4 w-4 mr-1" />
                  Submit Exam
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-3 sm:px-4 h-10 text-sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Are you sure you want to submit your exam?</p>
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Answered</span>
                    <span className="font-semibold text-foreground">
                      {answeredCount} / {questions.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Unanswered</span>
                    <span className="font-semibold text-foreground">
                      {questions.length - answeredCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Time Remaining</span>
                    <span className="font-semibold text-foreground">
                      {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
                    </span>
                  </div>
                </div>
                {questions.length - answeredCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-warning font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    You have unanswered questions
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
              Warning: Tab Switch Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  You switched away from the exam tab. This has been recorded
                  warning. If you switch tabs more than 3 times, your exam will be terminated immediately.
                </p>
                <div className="p-3.5 rounded-lg bg-warning/10 text-warning font-semibold text-sm">
                  Warnings given: {attempt?.warnings || 0} / 3
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowWarningDialog(false)
              enterFullscreen()
            }} className="bg-warning text-warning-foreground hover:bg-warning/90">
              Return to Exam (Enter Fullscreen)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminated Dialog */}
      <AlertDialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Exam Terminated
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your exam has been automatically terminated and submitted because you exceeded the tab switching limit (maximum of 3 warnings allowed).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push(`/exam/${id}/result?attempt=${attempt.id}`)} className="bg-destructive text-white">
              View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
