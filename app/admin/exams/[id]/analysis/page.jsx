"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Users,
  Brain,
  TrendingUp,
  AlertCircle,
  Clock,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Award,
  Sparkles,
  BarChart3,
  Search
} from "lucide-react"

export default function ExamAnalysisPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { exams, attempts, questions, answers, fetchData, user, isHydrated, isAuthenticated } = useExamStore()
  const [rosterSearch, setRosterSearch] = useState("")

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student")
      } else {
        fetchData()
      }
    }
  }, [isHydrated, isAuthenticated, user, router, fetchData])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  const exam = (exams || []).find((e) => e.id === id)

  if (!exam) {
    return (
      <div className="p-6 lg:p-8 min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-foreground mb-2">Exam not found</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              The exam you are trying to view analysis for does not exist.
            </p>
            <Button onClick={() => router.push("/admin/exams")}>Back to Exams</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const examAttempts = (attempts || [])
    .filter((a) => a.examId === id && a.status === 'graded')
    .filter((a) => (a.studentEmail || a.userId || '').toLowerCase().includes(rosterSearch.toLowerCase()))
    .sort((a, b) => b.score - a.score)

  const totalAttemptsCount = examAttempts.length

  // Calculations
  const maxPossibleMarks = exam.questionCount * 2 || (examAttempts[0]?.totalMarks) || 10
  const avgScore = totalAttemptsCount > 0 
    ? examAttempts.reduce((sum, a) => sum + (a.score / (a.totalMarks || maxPossibleMarks)) * 100, 0) / totalAttemptsCount 
    : 0
  const highestScore = totalAttemptsCount > 0 ? Math.max(...examAttempts.map(a => a.score)) : 0
  const lowestScore = totalAttemptsCount > 0 ? Math.min(...examAttempts.map(a => a.score)) : 0
  const passedAttempts = examAttempts.filter(a => (a.score / (a.totalMarks || maxPossibleMarks)) >= 0.5)
  const passRate = totalAttemptsCount > 0 ? (passedAttempts.length / totalAttemptsCount) * 100 : 0
  const avgWarnings = totalAttemptsCount > 0 
    ? examAttempts.reduce((sum, a) => sum + (a.warnings || 0), 0) / totalAttemptsCount 
    : 0

  // Topic Performance Analysis
  const examQuestions = (questions || []).filter(q => q.examId === id)
  const questionAnalysis = examQuestions.map(q => {
    const qAnswers = (answers || []).filter(ans => ans.questionId === q.id)
    const correctCount = qAnswers.filter(ans => ans.isCorrect === true || ans.selectedOptionId?.toString() === q.correctOptionId?.toString()).length
    const totalAnswers = qAnswers.length
    const successRate = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : null
    return {
      id: q.id,
      text: q.questionText,
      topic: q.topic || 'General',
      correctCount,
      totalAnswers,
      successRate
    }
  })

  const topicAnalysisMap = {}
  questionAnalysis.forEach(qa => {
    if (!topicAnalysisMap[qa.topic]) {
      topicAnalysisMap[qa.topic] = { total: 0, correct: 0 }
    }
    if (qa.successRate !== null) {
      topicAnalysisMap[qa.topic].total += qa.totalAnswers
      topicAnalysisMap[qa.topic].correct += qa.correctCount
    }
  })
  const topicAnalysis = Object.entries(topicAnalysisMap)
    .map(([topic, data]) => {
      const rate = data.total > 0 ? (data.correct / data.total) * 100 : 0
      return { topic, rate, total: data.total }
    })
    .filter(t => t.total > 0)
    .sort((a, b) => a.rate - b.rate)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen bg-[#f8fafc]">
      {/* Header breadcrumb bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/admin/exams")} variant="ghost" size="icon" className="bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">{exam.title}</h1>
              <Badge variant={exam.isPublished ? "success" : "secondary"} className={exam.isPublished ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
                {exam.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">Detailed performance analysis and student roster</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-white border border-slate-200/50 rounded-xl px-4 py-2 shadow-sm shrink-0">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {exam.durationMinutes} min
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            {exam.questionCount || 0} questions
          </span>
        </div>
      </div>

      {totalAttemptsCount === 0 ? (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-40 animate-pulse" />
            <h3 className="text-xl font-bold text-foreground mb-2">No completed attempts recorded yet</h3>
            <p className="text-muted-foreground mb-6 text-sm max-w-sm">
              Once students enter your teacher code and complete this exam, in-depth analytical reports and statistical breakdowns will appear here.
            </p>
            <Button onClick={() => router.push("/admin/exams")}>Return to Exams List</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats Dashboard Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-gradient-to-br from-white to-primary/5 hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider block">Total Attempts</span>
                    <span className="text-3xl font-black text-primary mt-2 block">{totalAttemptsCount}</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-3 font-semibold">Completed student submissions</div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-white to-emerald-50/20 hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider block">Class Average</span>
                    <span className="text-3xl font-black text-emerald-600 mt-2 block">{avgScore.toFixed(1)}%</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-3 font-semibold">Mean score secured by class</div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-white to-violet-50/20 hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider block">Score Range</span>
                    <span className="text-3xl font-black text-violet-600 mt-2 block">{highestScore}/{lowestScore}</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-3 font-semibold">Highest / Lowest marks achieved</div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-white to-amber-50/20 hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider block">Passing Rate</span>
                    <span className="text-3xl font-black text-amber-500 mt-2 block">{passRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-3 font-semibold">Percentage scoring &ge; 50%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Topic difficulty breakdown & Proctor warnings */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-border/50 bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base flex items-center gap-2 font-extrabold text-slate-800">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Topic Performance
                  </CardTitle>
                  <CardDescription className="text-xs">Hardest topics sorted by lowest correct rates</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  {topicAnalysis.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">No topic-specific response analytics available.</p>
                  ) : (
                    <div className="space-y-4">
                      {topicAnalysis.map((ta, idx) => {
                        const isHard = ta.rate < 50
                        const isModerate = ta.rate >= 50 && ta.rate < 75
                        const colorClass = isHard ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                        const textColorClass = isHard ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'
                        const bgLightClass = isHard ? 'bg-rose-50' : isModerate ? 'bg-amber-50' : 'bg-emerald-50'
                        
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700">{ta.topic}</span>
                              <span className={`font-black px-2 py-0.5 rounded-md ${bgLightClass} ${textColorClass}`}>{ta.rate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full ${colorClass}`} 
                                style={{ width: `${ta.rate}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Proctoring Warnings and academic integrity info */}
              <Card className="border-border/50 bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base flex items-center gap-2 font-extrabold text-slate-800">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    Proctoring Analytics
                  </CardTitle>
                  <CardDescription className="text-xs">Tab switches & proctor warnings logs</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Avg. Warnings Per Attempt</span>
                    <Badge variant={avgWarnings > 1 ? "destructive" : "secondary"} className="font-extrabold">
                      {avgWarnings.toFixed(1)} warnings
                    </Badge>
                  </div>
                  {avgWarnings > 1 ? (
                    <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2.5 mt-4 shadow-sm">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-rose-600">Integrity Alert</p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                          Students have experienced an average of <strong>{avgWarnings.toFixed(1)} warnings</strong> during this exam. Consider adjusting exam settings or reminding students to disable browser notifications.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-2.5 mt-4 shadow-sm">
                      <AlertCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-600">Good Proctoring Health</p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                          Integrity metrics look healthy with close to zero proctoring warnings recorded class-wide.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Student Leaderboard table */}
            <div className="lg:col-span-2">
              <Card className="border-border/50 bg-white shadow-sm flex flex-col h-[500px]">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 font-extrabold text-slate-800">
                      <Users className="h-4 w-4 text-primary" />
                      Student Roster & Leaderboard
                    </CardTitle>
                    <CardDescription className="text-xs">Roster ordered by student score (Ranks calculated from live leaderboards)</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search student email..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg bg-slate-50 border-slate-200"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[420px] scrollbar-visible">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="font-extrabold">Student Email</TableHead>
                          <TableHead className="text-center font-extrabold">Score</TableHead>
                          <TableHead className="text-center font-extrabold">Rank</TableHead>
                          <TableHead className="text-center font-extrabold">Warnings</TableHead>
                          <TableHead className="text-right font-extrabold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examAttempts.map((attempt) => (
                          <TableRow key={attempt.id} className="group hover:bg-slate-50/50">
                            <TableCell className="font-semibold text-foreground py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-sm">
                                  {(attempt.studentEmail || attempt.userId).charAt(0)}
                                </div>
                                {attempt.studentEmail || attempt.userId}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-black text-emerald-600 py-3.5">
                              {attempt.score}/{attempt.totalMarks}
                            </TableCell>
                            <TableCell className="text-center font-extrabold text-slate-700 py-3.5">
                              <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 font-extrabold border border-slate-200">
                                #{attempt.rank || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-3.5">
                              <span className={`font-bold text-xs ${attempt.warnings > 1 ? 'text-rose-500 font-black' : 'text-slate-500'}`}>
                                {attempt.warnings || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-3.5">
                              <Button
                                onClick={() => router.push(`/exam/${exam.id}/review?attempt=${attempt.id}`)}
                                variant="outline"
                                size="sm"
                                className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs shadow-sm h-8"
                              >
                                Review answers
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
