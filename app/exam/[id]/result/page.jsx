"use client"

import { useEffect, use, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GraduationCap,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Target,
  Brain,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
} from "lucide-react"

export default function ResultPage({
  params,
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const attemptId = searchParams.get("attempt")

  const {
    user,
    isAuthenticated,
    exams,
    attempts,
    getExamQuestions,
    getAttemptAnswers,
    aiFeedback,
    fetchData,
    isHydrated,
  } = useExamStore()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (isHydrated) {
        if (!isAuthenticated) {
          router.push("/login")
        } else {
          try {
            await fetchData(id)
          } catch (err) {
            console.error('Failed to load result data:', err)
          } finally {
            setIsLoading(false)
          }
        }
      }
    }
    loadData()
  }, [isHydrated, isAuthenticated, router, fetchData, id])

  const exam = exams.find((e) => e.id === id)
  const attempt = attempts.find((a) => a.id === attemptId)
  const questions = getExamQuestions(id)
  const answers = attempt ? getAttemptAnswers(attempt.id) : []
  const feedback = aiFeedback.find((f) => f.attemptId === attemptId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground text-sm animate-pulse font-semibold">Loading exam results...</p>
      </div>
    )
  }

  if (!exam || !attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Result not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The exam result you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/student">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const percentage = ((attempt.score || 0) / (attempt.totalMarks || 1)) * 100
  const isPassing = percentage >= 60

  const normalizeOptionId = (value) => {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
  }

  const normalizeOptionSet = (value) => {
    return new Set(
      (typeof value === 'string' ? value : '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  }

  const isAnswerCorrect = (answer) => {
    const question = questions.find((item) => item.id === answer.questionId)
    if (!question || question.questionType === 'text') return false
    if (question.questionType === 'msq') {
      const correctSet = normalizeOptionSet(question.correctOptionId)
      const selectedSet = normalizeOptionSet(answer.selectedOptionId)
      if (correctSet.size !== selectedSet.size) return false
      for (const optionId of correctSet) {
        if (!selectedSet.has(optionId)) return false
      }
      return true
    }
    return normalizeOptionId(answer.selectedOptionId) === normalizeOptionId(question.correctOptionId)
  }

  const correctCount = answers.filter((a) => a.isCorrect === true || isAnswerCorrect(a)).length
  const incorrectCount = answers.filter((a) => {
    const q = questions.find((item) => item.id === a.questionId)
    if (q?.questionType === 'text') {
      return false
    }
    return a.selectedOptionId && !isAnswerCorrect(a)
  }).length
  const answeredCount = answers.filter((a) => {
    const q = questions.find((item) => item.id === a.questionId)
    if (q?.questionType === 'text') {
      return !!a.descriptiveAnswer?.trim()
    }
    return !!a.selectedOptionId
  }).length
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/student">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">{exam.title}</h1>
                <p className="text-xs text-muted-foreground">Exam Results</p>
              </div>
            </div>
          </div>
          <Link href={`/exam/${id}/review?attempt=${attemptId}`}>
            <Button variant="outline">
              Review Answers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Score Card */}
          <Card
            className={`border-2 ${
              isPassing ? "border-success/50" : "border-destructive/50"
            }`}
          >
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Score Circle */}
                <div className="relative">
                  <div
                    className={`h-40 w-40 rounded-full flex items-center justify-center ${
                      isPassing ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    <div className="text-center">
                      <p
                        className={`text-5xl font-bold ${
                          isPassing ? "text-success" : "text-destructive"
                        }`}
                      >
                        {percentage.toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {attempt.score}/{attempt.totalMarks} marks
                      </p>
                    </div>
                  </div>
                  <div
                    className={`absolute -top-2 -right-2 h-12 w-12 rounded-full flex items-center justify-center ${
                      isPassing ? "bg-success" : "bg-destructive"
                    }`}
                  >
                    {isPassing ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : (
                      <XCircle className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 grid sm:grid-cols-3 gap-4 w-full">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-warning" />
                      <span className="text-2xl font-bold text-foreground">
                        #{attempt.rank}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-2xl font-bold text-foreground">
                        {correctCount}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-2xl font-bold text-foreground">
                        {incorrectCount}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                  </div>
                </div>
              </div>

              {/* Progress breakdown */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">
                    Correct
                  </span>
                  <Progress
                    value={(correctCount / questions.length) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {correctCount}/{questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">
                    Incorrect
                  </span>
                  <Progress
                    value={(incorrectCount / questions.length) * 100}
                    className="flex-1 h-2 [&>div]:bg-destructive"
                  />
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {incorrectCount}/{questions.length}
                  </span>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-24">
                      Unanswered
                    </span>
                    <Progress
                      value={(unansweredCount / questions.length) * 100}
                      className="flex-1 h-2 [&>div]:bg-muted-foreground"
                    />
                    <span className="text-sm font-medium text-foreground w-12 text-right">
                      {unansweredCount}/{questions.length}
                    </span>
                  </div>
                )}
              </div>

              {attempt.warnings > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                  <p className="text-sm text-warning">
                    {attempt.warnings} warning{attempt.warnings > 1 ? "s" : ""}{" "}
                    recorded during the exam (tab switches detected)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">
                <Brain className="h-4 w-4 mr-2" />
                AI Analysis
              </TabsTrigger>
              <TabsTrigger value="weak-topics">
                <Target className="h-4 w-4 mr-2" />
                Weak Topics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-warning" />
                    Mistake Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-powered explanations for your incorrect answers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedback?.mistakeAnalysis && feedback.mistakeAnalysis.length > 0 ? (
                    <div className="space-y-4">
                      {feedback.mistakeAnalysis.map((mistake, index) => {
                        const question = questions.find(
                          (q) => q.id === mistake.questionId
                        )
                        return (
                          <div
                            key={index}
                            className="p-4 rounded-lg border border-border"
                          >
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="shrink-0">
                                Q{questions.findIndex((q) => q.id === mistake.questionId) + 1}
                              </Badge>
                              <div>
                                <p className="font-medium text-foreground mb-2">
                                  {question?.questionText}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {mistake.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        Great job! All your answers were correct.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weak-topics" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Topics to Improve
                  </CardTitle>
                  <CardDescription>
                    Focus areas based on your performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedback?.weakTopics && feedback.weakTopics.length > 0 ? (
                    <div className="space-y-4">
                      {feedback.weakTopics.map((topic, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">
                                {topic.topic}
                              </span>
                            </div>
                            <Badge variant="secondary">{topic.subject}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {topic.questionCount} question
                            {topic.questionCount > 1 ? "s" : ""} missed in this
                            topic
                          </p>
                          {topic.recommendation && (
                            <p className="text-sm text-primary">
                              {topic.recommendation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-warning mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        Excellent! No significant weak areas detected.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/exam/${id}/review?attempt=${attemptId}`}>
              <Button variant="outline" className="w-full sm:w-auto">
                <BookOpen className="mr-2 h-4 w-4" />
                Review All Answers
              </Button>
            </Link>
            <Link href="/student/exams">
              <Button className="w-full sm:w-auto">
                Take Another Exam
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}