"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FloatingShapes, GlowingDots, Sparkles } from "@/components/ui/animated-background"
import {
  BookOpen,
  Clock,
  Trophy,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Target,
  Flame,
  Zap,
  Star,
  Brain,
  Calendar,
  Award,
  BarChart3,
  Rocket,
  Gift,
  Bell,
  AlertCircle,
  GraduationCap
} from "lucide-react"
import { Skeleton, RowSkeleton } from "@/components/ui/skeleton"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200 } },
}

export default function StudentDashboard() {
  const router = useRouter()
  const { isHydrated, isAuthenticated, user, exams, folders, attempts, answers, aiFeedback, fetchData, currentRole, activeTeacher, currentUserCode, setCurrentUserCode } = useExamStore()

  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Define useEffect to handle auth redirect & fetch fresh attempts/rankings
  useEffect(() => {
    let active = true
    if (isHydrated && mounted) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (currentRole === "teacher" || currentRole === "admin") {
        router.push("/admin")
      } else {
        setIsLoading(true)
        fetchData().finally(() => {
          if (active) setIsLoading(false)
        })
      }
    }
    return () => {
      active = false
    }
  }, [isHydrated, mounted, isAuthenticated, currentRole, router, fetchData])

  // Return null to prevent rendering while loading/unauthenticated
  if (!mounted || !isHydrated || !isAuthenticated || !user) {
    return null
  }

  // All calculations below only run if authenticated
  const publishedExams = (exams || []).filter((e) => e.isPublished)
  const userAttempts = (attempts || []).filter((a) => a.userId === user.id)
  const completedAttempts = userAttempts.filter((a) => a.status === "graded")

  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce(
          (sum, a) => sum + ((a.score || 0) / (a.totalMarks || 1)) * 100,
          0
        ) / completedAttempts.length
      : 0

  const recentAttempts = userAttempts
    .filter((a) => a.status === "graded")
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
    .slice(0, 5)

  const normalizeDateKey = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized.toISOString()
  }

  const activityDays = Array.from(
    new Set(
      completedAttempts
        .map((a) => normalizeDateKey(a.submittedAt || a.startedAt))
        .filter(Boolean)
    )
  )
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const todayKey = normalizeDateKey(new Date())
  let currentStreak = 0
  if (todayKey) {
    const activitySet = new Set(activityDays)
    let cursor = new Date(todayKey)
    while (activitySet.has(cursor.toISOString())) {
      currentStreak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
  }



  // -- Detailed Performance Breakdown --
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnanswered = 0;
  
  completedAttempts.forEach(attempt => {
    const attemptAnswers = answers.filter(a => a.attemptId === attempt.id);
    const examQuestionsCount = exams.find(e => e.id === attempt.examId)?.questionCount || attemptAnswers.length;
    
    const correctInAttempt = attemptAnswers.filter(a => a.isCorrect).length;
    const answeredInAttempt = attemptAnswers.filter(a => a.selectedOptionId).length;
    
    totalCorrect += correctInAttempt;
    totalIncorrect += (answeredInAttempt - correctInAttempt);
    totalUnanswered += Math.max(0, examQuestionsCount - answeredInAttempt);
  });

  const totalQuestionsEncountered = totalCorrect + totalIncorrect + totalUnanswered;

  const stats = [
    {
      title: "Available Exams",
      value: publishedExams.length,
      icon: BookOpen,
      gradient: "from-primary to-glow-1",
      bgGlow: "shadow-primary/20",
    },
    {
      title: "Completed",
      value: completedAttempts.length,
      icon: CheckCircle2,
      gradient: "from-success to-glow-4",
      bgGlow: "shadow-success/20",
    },
    {
      title: "Average Score",
      value: `${averageScore.toFixed(0)}%`,
      icon: TrendingUp,
      gradient: "from-chart-2 to-glow-4",
      bgGlow: "shadow-chart-2/20",
    },
    {
      title: "Best Rank",
      value: completedAttempts.length > 0 ? `#${Math.min(...completedAttempts.map((a) => a.rank || 999))}` : "-",
      icon: Trophy,
      gradient: "from-warning to-glow-5",
      bgGlow: "shadow-warning/20",
    },
  ]

  const quickActions = [
    { icon: Target, label: "Practice Mode", href: "/student/exams", gradient: "from-primary/20 to-glow-1/20", iconColor: "text-primary", hoverBg: "hover:from-primary/30 hover:to-glow-1/30" },
    { icon: Flame, label: "Daily Challenge", href: "/student/exams", gradient: "from-destructive/20 to-glow-3/20", iconColor: "text-destructive", hoverBg: "hover:from-destructive/30 hover:to-glow-3/30" },
    { icon: Trophy, label: "Leaderboard", href: "/attempts?tab=leaderboard", gradient: "from-warning/20 to-glow-5/20", iconColor: "text-warning", hoverBg: "hover:from-warning/30 hover:to-glow-5/30" },
    { icon: Brain, label: "AI Tutor", href: "/student/exams", gradient: "from-accent/20 to-glow-2/20", iconColor: "text-accent", hoverBg: "hover:from-accent/30 hover:to-glow-2/30" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <FloatingShapes />
        <GlowingDots />
      </div>

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 relative z-10"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Welcome back, <span className="gradient-text">{user?.fullName}</span>
            </motion.h1>
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            >
              &#128075;
            </motion.span>
          </div>
          {activeTeacher ? (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-medium text-muted-foreground">Classroom context:</span>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-full pl-2.5 pr-3.5 py-1 text-xs shadow-sm hover:border-primary/25 transition-colors">
                <GraduationCap className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="font-semibold text-foreground">{activeTeacher.fullName}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                <span className="font-bold font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-md text-[10px]">
                  {activeTeacher.userCode}
                </span>
              </div>
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground flex items-center gap-2"
            >
              <Zap className="h-4 w-4 text-warning" />
              Ready to test your knowledge? Here&apos;s your progress.
            </motion.p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {currentUserCode && currentUserCode !== '455770' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentUserCode('455770')}
              className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 flex items-center gap-2 font-bold rounded-xl h-10 px-3.5"
              title="Return to default teacher exams"
            >
              <Home className="h-4 w-4" />
              Default Exams
            </Button>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => router.push("/student/exams")} className="shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-glow-1">
              Browse Exams
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Streak Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-warning/10 via-accent/10 to-primary/10 border-warning/20 overflow-hidden relative">
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles count={10} />
          </div>
          <CardContent className="p-4 md:p-6 flex items-center justify-between relative flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="h-14 w-14 rounded-2xl bg-gradient-to-br from-warning to-accent flex items-center justify-center shadow-lg shadow-warning/30 shrink-0"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Flame className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <p className="font-bold text-lg text-foreground">
                  {currentStreak >= 7
                    ? "7 Day Streak!"
                    : currentStreak > 0
                    ? `${currentStreak} Day Streak`
                    : "Start your streak today"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentStreak >= 7
                    ? "You have maintained a full week of learning!"
                    : currentStreak > 0
                    ? `Keep going for ${7 - currentStreak} more day${7 - currentStreak === 1 ? "" : "s"} to reach 7 days.`
                    : "Complete an exam today to begin your streak."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <motion.div
                  key={day}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: day * 0.1 }}
                  className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                    day <= Math.min(currentStreak, 7) ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-10"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={scaleIn}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className={`border-border/50 bg-card/80 backdrop-blur-xl hover:shadow-xl ${stat.bgGlow} transition-all duration-300 overflow-hidden group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg shrink-0`}
                  >
                    <stat.icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <div className="truncate">
                    <motion.p
                      className="text-3xl font-bold gradient-text"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      {isLoading ? (
                        <Skeleton className="h-9 w-16" />
                      ) : (
                        stat.value
                      )}
                    </motion.p>
                    <p className="text-sm text-muted-foreground truncate">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              variants={fadeInUp}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={action.href}>
                <Card className={`bg-gradient-to-br ${action.gradient} ${action.hoverBg} border-0 cursor-pointer transition-all duration-300 overflow-hidden group h-full`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      className={`h-10 w-10 shrink-0 rounded-xl bg-card/50 flex items-center justify-center`}
                    >
                      <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                    </motion.div>
                    <span className="font-semibold text-sm text-foreground">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2 relative z-10">
        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-glow-1/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Results</CardTitle>
                    <CardDescription>Your latest exam attempts</CardDescription>
                  </div>
                </div>
                {recentAttempts.length > 0 && (
                  <Button onClick={() => router.push("/attempts")} variant="ghost" size="sm" className="text-primary">
                    View All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </div>
              ) : recentAttempts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4"
                  >
                    <HelpCircle className="h-10 w-10 text-muted-foreground" />
                  </motion.div>
                  <p className="text-foreground font-medium mb-1">No completed exams yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Start your first exam to see results here</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => router.push("/student/exams")} className="shadow-lg shadow-primary/20">
                      <Zap className="mr-2 h-4 w-4" />
                      Take your first exam
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3 max-h-[350px] overflow-y-auto pr-1.5 scrollbar-thin"
                >
                  {recentAttempts.map((attempt, index) => {
                    const percentage = ((attempt.score || 0) / (attempt.totalMarks || 1)) * 100
                    const isPassing = percentage >= 60

                    return (
                      <motion.div
                        key={attempt.id}
                        variants={fadeInUp}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background hover:shadow-lg transition-all group"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center shadow-lg ${
                            isPassing
                              ? "bg-gradient-to-br from-success to-glow-4 shadow-success/20"
                              : "bg-gradient-to-br from-destructive to-glow-3 shadow-destructive/20"
                          }`}
                        >
                          {isPassing ? (
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          ) : (
                            <XCircle className="h-6 w-6 text-white" />
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-[200px]">
                          <p className="font-semibold text-foreground truncate group-hover:gradient-text transition-all">
                            {attempt.examTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${isPassing ? "bg-gradient-to-r from-success to-glow-4" : "bg-gradient-to-r from-destructive to-glow-3"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: index * 0.1, duration: 0.8 }}
                              />
                            </div>
                            <span className={`text-sm font-bold w-12 text-right ${isPassing ? "text-success" : "text-destructive"}`}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto mt-2 sm:mt-0">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                            <Button onClick={() => router.push(`/exam/${attempt.examId}/result?attempt=${attempt.id}`)} variant="ghost" size="sm" className="w-full sm:w-auto text-primary hover:bg-primary/10">
                              View
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-6"
        >
          {(isLoading || completedAttempts.length > 0) && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-chart-2/20 to-glow-4/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-chart-2" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Detailed Performance</CardTitle>
                    <CardDescription>Analytics of your test history</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Skeleton className="h-14 rounded-lg animate-pulse" />
                      <Skeleton className="h-14 rounded-lg animate-pulse" />
                      <Skeleton className="h-14 rounded-lg animate-pulse" />
                    </div>
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                ) : (
                  <>
                    {/* Breakdown Progress Bars */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-xl font-bold text-success">{totalCorrect}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Correct</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xl font-bold text-destructive">{totalIncorrect}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Incorrect</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted border border-border">
                        <p className="text-xl font-bold text-muted-foreground">{totalUnanswered}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Skipped</p>
                      </div>
                    </div>
                  </>
                )}

                {/* AI Insights & Weaknesses */}
                {aiFeedback.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                      <Brain className="h-4 w-4" /> AI Insights & Weaknesses
                    </h4>
                    <div className="space-y-3">
                      {/* Aggregate top 2 weak topics from the last few feedbacks */}
                      {(() => {
                        const allWeakTopics = {};
                        aiFeedback.forEach(fb => {
                          if (Array.isArray(fb.weakTopics)) {
                            fb.weakTopics.forEach((wt) => {
                              if (!allWeakTopics[wt.topic]) {
                                allWeakTopics[wt.topic] = { subject: wt.subject, count: 0 };
                              }
                              allWeakTopics[wt.topic].count += wt.questionCount || 1;
                            });
                          }
                        });
                        const sortedTopics = Object.entries(allWeakTopics)
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 2);

                        if (sortedTopics.length === 0) {
                          return <p className="text-xs text-muted-foreground">Keep practicing! AI needs more data to analyze your weak areas.</p>;
                        }

                        return sortedTopics.map(([topic, data], idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{topic} <span className="text-xs text-muted-foreground font-normal">({data.subject})</span></p>
                              <p className="text-xs text-muted-foreground mt-0.5">Struggled with {data.count} questions. Review recommended.</p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Subject Bars */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-5 mt-6"
                >
                  {Array.from(new Set(folders.map((f) => f.name))).map((subject, index) => {
                    const subjectAttempts = completedAttempts.filter((a) => {
                      const exam = exams.find((e) => e.id === a.examId)
                      return exam?.folderName === subject
                    })

                    if (subjectAttempts.length === 0) return null

                    const avgScore = subjectAttempts.reduce((sum, a) => sum + ((a.score || 0) / (a.totalMarks || 1)) * 100, 0) / subjectAttempts.length

                    const gradients = [
                      "from-primary to-glow-1",
                      "from-accent to-glow-2",
                      "from-chart-3 to-glow-5",
                    ]
                    const gradient = gradients[index % gradients.length]

                    return (
                      <motion.div key={subject} variants={fadeInUp} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${gradient}`} />
                            {subject}
                          </span>
                          <span className={`font-bold ${avgScore >= 70 ? "text-success" : avgScore >= 50 ? "text-warning" : "text-destructive"}`}>
                            {avgScore.toFixed(0)}%
                            <span className="text-muted-foreground font-normal ml-1">({subjectAttempts.length} exams)</span>
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${avgScore}%` }}
                            transition={{ delay: index * 0.2, duration: 1 }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Exams */}
          <Card className="flex-1 border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent/20 to-glow-2/20 flex items-center justify-center shrink-0"
                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Zap className="h-4 w-4 text-accent" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Recommended for You
                    </CardTitle>
                    <CardDescription>Exams you haven&apos;t attempted yet</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const unattemptedExams = publishedExams.filter(
                  (exam) => !userAttempts.some((a) => a.examId === exam.id)
                )

                if (unattemptedExams.length === 0) {
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-20 w-20 rounded-3xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-4"
                      >
                        <CheckCircle2 className="h-10 w-10 text-success" />
                      </motion.div>
                      <p className="text-foreground font-semibold mb-1">All Caught Up!</p>
                      <p className="text-sm text-muted-foreground">You have attempted all available exams. Outstanding job!</p>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 max-h-[350px] overflow-y-auto pr-1.5 scrollbar-thin"
                  >
                    {unattemptedExams.map((exam, index) => {
                      return (
                        <motion.div
                          key={exam.id}
                          variants={fadeInUp}
                          whileHover={{ scale: 1.01, x: 4 }}
                          className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background hover:shadow-lg transition-all group"
                        >
                          <motion.div
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-glow-1/20 flex items-center justify-center shrink-0"
                          >
                            <BookOpen className="h-6 w-6 text-primary" />
                          </motion.div>
                          <div className="flex-1 min-w-[200px]">
                            <p className="font-semibold text-foreground truncate group-hover:gradient-text transition-all">
                              {exam.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {exam.durationMinutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {exam.questionCount || 0} questions
                              </span>
                            </div>
                          </div>
                          <div className="w-full sm:w-auto mt-2 sm:mt-0">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={() => router.push(`/exam/${exam.id}`)}
                                variant="default"
                                size="sm"
                                className="w-full sm:w-auto"
                              >
                                Start
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )
              })()}
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </div>
  )
}
