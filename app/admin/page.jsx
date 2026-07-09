"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Plus,
  Sparkles,
  FolderOpen,
  BarChart3,
  Edit2,
  ChevronRight,
  Brain,
  AlertCircle,
} from "lucide-react"
import { Skeleton, RowSkeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  LabelList,
} from "recharts"

const BarChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border px-3.5 py-2.5 rounded-2xl shadow-2xl text-xs space-y-1">
        <p className="font-extrabold text-foreground">{data.fullName || data.name}</p>
        <p className="text-muted-foreground flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
          Total Attempts: <span className="font-black text-foreground">{data.attempts}</span>
        </p>
      </div>
    )
  }
  return null
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

export default function AdminDashboard() {
  const router = useRouter()
  const { exams, attempts, folders, user, questions, answers, fetchData, isHydrated, isAuthenticated } = useExamStore()
  const [selectedExamAttempts, setSelectedExamAttempts] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let active = true
    if (isHydrated && mounted) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student")
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
  }, [isHydrated, mounted, isAuthenticated, user, router, fetchData])

  if (!mounted || !isHydrated || !isAuthenticated || !user) {
    return null
  }

  const publishedExams = (exams || []).filter((e) => e.isPublished)
  const totalAttempts = (attempts || []).length
  const gradedAttempts = (attempts || []).filter((a) => a.status === "graded")
  const averageScore =
    gradedAttempts.length > 0
      ? gradedAttempts.reduce((sum, a) => sum + ((a.score || 0) / (a.totalMarks || 1)) * 100, 0) /
        gradedAttempts.length
      : 0

  const stats = [
    {
      title: "Total Exams",
      value: (exams || []).length,
      description: `${publishedExams.length} published`,
      icon: FileText,
      trend: "+12%",
      trendUp: true,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Total Attempts",
      value: totalAttempts,
      description: `${gradedAttempts.length} completed`,
      icon: ClipboardList,
      trend: "+8%",
      trendUp: true,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    {
      title: "Folders",
      value: (folders || []).length,
      description: "Organizing exams",
      icon: FolderOpen,
      trend: null,
      trendUp: null,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      borderColor: "border-chart-3/20",
    },
    {
      title: "Avg. Score",
      value: `${averageScore.toFixed(1)}%`,
      description: "Across all exams",
      icon: TrendingUp,
      trend: averageScore > 60 ? "+5%" : "-3%",
      trendUp: averageScore > 60,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
    },
  ]

  // Chart data - Attempts per Exam (Top 5)
  const examAttemptData = (exams || [])
    .filter((e) => e.isPublished)
    .map((exam) => ({
      name: exam.title.length > 15 ? exam.title.substring(0, 15) + "..." : exam.title,
      fullName: exam.title,
      attempts: Number(exam.attemptCount || 0),
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 5)

  // Graded attempts score distribution buckets
  const buckets = {
    range0_40: 0,
    range40_60: 0,
    range60_80: 0,
    range80_100: 0,
  }

  gradedAttempts.forEach((a) => {
    const total = a.totalMarks || 1
    const pct = ((a.score || 0) / total) * 100
    if (pct < 40) {
      buckets.range0_40++
    } else if (pct < 60) {
      buckets.range40_60++
    } else if (pct < 80) {
      buckets.range60_80++
    } else {
      buckets.range80_100++
    }
  })

  const scoreDistribution = [
    { name: "0-40%", value: buckets.range0_40, color: "#ef4444" },
    { name: "40-60%", value: buckets.range40_60, color: "#f59e0b" },
    { name: "60-80%", value: buckets.range60_80, color: "#3b82f6" },
    { name: "80-100%", value: buckets.range80_100, color: "#10b981" },
  ]

  // Weekly activity metrics
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayStats = {
    Mon: { count: 0, sumScorePct: 0, gradedCount: 0 },
    Tue: { count: 0, sumScorePct: 0, gradedCount: 0 },
    Wed: { count: 0, sumScorePct: 0, gradedCount: 0 },
    Thu: { count: 0, sumScorePct: 0, gradedCount: 0 },
    Fri: { count: 0, sumScorePct: 0, gradedCount: 0 },
    Sat: { count: 0, sumScorePct: 0, gradedCount: 0 },
    Sun: { count: 0, sumScorePct: 0, gradedCount: 0 },
  }

  const allAttempts = attempts || []
  allAttempts.forEach((a) => {
    const dateStr = a.startedAt || a.submittedAt || a.createdAt
    if (!dateStr) return
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return
    const dayName = daysOfWeek[date.getDay()]
    if (dayStats[dayName]) {
      dayStats[dayName].count++
      if (a.status === "graded") {
        const pct = ((a.score || 0) / (a.totalMarks || 1)) * 100
        dayStats[dayName].sumScorePct += pct
        dayStats[dayName].gradedCount++
      }
    }
  })

  const weeklyData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
    const stats = dayStats[day]
    const avgScore = stats.gradedCount > 0 ? Math.round(stats.sumScorePct / stats.gradedCount) : 0
    return {
      day,
      attempts: stats.count,
      score: avgScore,
    }
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <BarChart3 className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
          <p className="text-muted-foreground">
            Overview of your examination platform
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={() => router.push('/admin/exams/new')} className="shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent">
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { icon: FileText, label: "Manage Exams", href: "/admin/exams", color: "bg-primary/10 text-primary hover:bg-primary/20" },
          { icon: FolderOpen, label: "Folders", href: "/admin/exams", color: "bg-accent/10 text-accent hover:bg-accent/20" },
          { icon: Users, label: "Students", href: "/admin/students", color: "bg-chart-3/10 text-chart-3 hover:bg-chart-3/20" },
          { icon: Sparkles, label: "AI Insights", href: "/admin/students", color: "bg-success/10 text-success hover:bg-success/20" },
        ].map((action) => (
          <motion.div
            key={action.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href={action.href}>
              <Card className={`${action.color} border-0 cursor-pointer transition-colors shadow-sm`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <action.icon className="h-5 w-5" />
                  {action.label === "AI Insights" ? (
                    <span className="font-semibold text-sm">{user?.userCode || action.label}</span>
                  ) : (
                    <span className="font-semibold text-sm">{action.label}</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={scaleIn}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className={`border-2 ${stat.borderColor} bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer`} onClick={() => {
              if (stat.title === "Folders") router.push('/admin/exams')
              else if (stat.title === "Total Exams") router.push('/admin/exams')
              else if (stat.title === "Total Attempts" || stat.title === "Avg. Score") router.push('/admin/students')
            }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className={`h-9 w-9 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {isLoading ? (
                      <Skeleton className="h-3.5 w-24" />
                    ) : (
                      stat.description
                    )}
                  </span>
                  {!isLoading && stat.trend && (
                    <span
                      className={`text-xs font-medium flex items-center ${
                        stat.trendUp ? "text-success" : "text-destructive"
                      }`}
                    >
                      {stat.trendUp ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {stat.trend}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attempts by Exam */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Attempts by Exam</CardTitle>
              <CardDescription>Number of attempts per published exam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    <p className="text-muted-foreground text-sm">Loading chart data...</p>
                  </div>
                ) : examAttemptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examAttemptData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
                      <XAxis type="number" className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        className="text-xs fill-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<BarChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                      <Bar dataKey="attempts" fill="#6366f1" radius={[0, 8, 8, 0]}>
                        <LabelList dataKey="attempts" position="insideRight" offset={12} fill="#ffffff" className="text-[10px] font-black" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 mx-auto"
                      >
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </motion.div>
                      <p className="text-muted-foreground">No exam data yet</p>
                      <p className="text-sm text-muted-foreground/70">Publish exams to see analytics</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Score Distribution</CardTitle>
              <CardDescription>Distribution of student scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center justify-center w-full">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    <p className="text-muted-foreground text-sm">Loading chart data...</p>
                  </div>
                ) : gradedAttempts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) =>
                          value > 0 ? `${name} (${value})` : null
                        }
                        labelLine={false}
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 mx-auto"
                      >
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      </motion.div>
                      <p className="text-muted-foreground">No graded attempts yet</p>
                      <p className="text-sm text-muted-foreground/70">Grade student attempts to see score trends</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {scoreDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Weekly Activity</CardTitle>
                  <CardDescription>Number of exam attempts and average scores</CardDescription>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Attempts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-muted-foreground">Avg Score</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    <p className="text-muted-foreground text-sm">Loading chart data...</p>
                  </div>
                ) : attempts && attempts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="day" className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                      <YAxis className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="attempts"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorAttempts)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--accent))"
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 mx-auto"
                      >
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                      </motion.div>
                      <p className="text-muted-foreground">No attempts recorded this week</p>
                      <p className="text-sm text-muted-foreground/70">Student attempt activity will be plotted here</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Exams */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Exams</CardTitle>
                <CardDescription>Latest exams created in the platform</CardDescription>
              </div>
              <Link href="/admin/exams">
                <Button variant="ghost" size="sm" className="text-primary font-semibold">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </div>
            ) : (!exams || exams.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4"
                >
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </motion.div>
                <p className="text-muted-foreground mb-1">No exams created yet</p>
                <p className="text-sm text-muted-foreground/70">Create your first exam to get started</p>
                <Button size="sm" className="mt-4" onClick={() => router.push('/admin/exams/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Button>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {(exams || []).slice(0, 5).map((exam) => (
                  <motion.div
                    key={exam.id}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className="flex flex-wrap sm:flex-nowrap items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background transition-colors shadow-sm gap-4 cursor-pointer"
                    onClick={() => router.push(`/admin/exams/${exam.id}/analysis`)}
                    title="View exam analysis"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-glow-1/10 flex items-center justify-center shrink-0 border border-primary/10"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                      </motion.div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
                          {exam.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exam.folderName || "No folder"} • {exam.questionCount || 0} questions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-foreground mb-1">
                          {exam.attemptCount || 0} attempts
                        </p>
                        <Badge
                          variant="outline"
                          className={exam.isPublished 
                            ? "bg-success/10 text-success border-success/20 text-[10px]" 
                            : "bg-muted text-muted-foreground text-[10px]"
                          }
                        >
                          {exam.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExamAttempts(exam);
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 border-dashed hover:border-primary/50 text-primary hover:bg-primary/5"
                      >
                        <BarChart3 className="h-3 w-3" />
                        Quick Analyze
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/exams/${exam.id}`);
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 border-dashed hover:border-primary/50"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Exam Performance Analysis Modal */}
      <Dialog
        open={!!selectedExamAttempts}
        onOpenChange={() => setSelectedExamAttempts(null)}
      >
        <DialogContent className="max-w-4xl border-border/50 bg-card/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 font-bold">
              <Brain className="h-6 w-6 text-primary animate-pulse" />
              Analysis for {selectedExamAttempts?.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Comprehensive analytics, student performance statistics, and key insights for this exam.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const examAttempts = (attempts || [])
              .filter((a) => a.examId === selectedExamAttempts?.id && a.status === 'graded')
              .sort((a, b) => b.score - a.score);

            const totalAttemptsCount = examAttempts.length;

            if (totalAttemptsCount === 0) {
              return (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium text-foreground">No completed attempts recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Once students complete this exam, in-depth analytical reports will appear here.</p>
                </div>
              );
            }

            // Calculations
            const maxPossibleMarks = selectedExamAttempts?.questionCount * 2 || examAttempts[0]?.totalMarks || 10;
            const avgScore = examAttempts.reduce((sum, a) => sum + (a.score / (a.totalMarks || maxPossibleMarks)) * 100, 0) / totalAttemptsCount;
            const highestScore = Math.max(...examAttempts.map(a => a.score));
            const lowestScore = Math.min(...examAttempts.map(a => a.score));
            const passedAttempts = examAttempts.filter(a => (a.score / (a.totalMarks || maxPossibleMarks)) >= 0.5);
            const passRate = (passedAttempts.length / totalAttemptsCount) * 100;
            const avgWarnings = examAttempts.reduce((sum, a) => sum + (a.warnings || 0), 0) / totalAttemptsCount;

            // Topic Performance Analysis
            const examQuestions = (questions || []).filter(q => q.examId === selectedExamAttempts?.id);
            const questionAnalysis = examQuestions.map(q => {
              const qAnswers = (answers || []).filter(ans => ans.questionId === q.id);
              const correctCount = qAnswers.filter(ans => ans.isCorrect === true || ans.selectedOptionId?.toString() === q.correctOptionId?.toString()).length;
              const totalAnswers = qAnswers.length;
              const successRate = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : null;
              return {
                id: q.id,
                text: q.questionText,
                topic: q.topic || 'General',
                correctCount,
                totalAnswers,
                successRate
              };
            });

            const topicAnalysisMap = {};
            questionAnalysis.forEach(qa => {
              if (!topicAnalysisMap[qa.topic]) {
                topicAnalysisMap[qa.topic] = { total: 0, correct: 0 };
              }
              if (qa.successRate !== null) {
                topicAnalysisMap[qa.topic].total += qa.totalAnswers;
                topicAnalysisMap[qa.topic].correct += qa.correctCount;
              }
            });
            const topicAnalysis = Object.entries(topicAnalysisMap)
              .map(([topic, data]) => {
                const rate = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                return { topic, rate, total: data.total };
              })
              .filter(t => t.total > 0)
              .sort((a, b) => a.rate - b.rate);

            return (
              <div className="space-y-6 py-4">
                {/* Stats Dashboard Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total Attempts</span>
                    <span className="text-2xl font-black text-primary mt-1 block">{totalAttemptsCount}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Completed attempts</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-success/5 border border-success/10 shadow-sm">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Class Average</span>
                    <span className="text-2xl font-black text-success mt-1 block">{avgScore.toFixed(1)}%</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Mean score rate</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 shadow-sm">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Score Range</span>
                    <span className="text-2xl font-black text-accent mt-1 block">{highestScore}/{lowestScore}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Highest / Lowest marks</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-warning/5 border border-warning/10 shadow-sm">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Passing Rate</span>
                    <span className="text-2xl font-black text-warning mt-1 block">{passRate.toFixed(1)}%</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Scored &ge; 50%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Box: Topic Performance & Warning */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border/50 pb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Topic Breakdown (Hardest First)
                    </h4>
                    {topicAnalysis.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No topic-specific response analytics available.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        {topicAnalysis.map((ta, idx) => {
                          const isHard = ta.rate < 50;
                          const isModerate = ta.rate >= 50 && ta.rate < 75;
                          const colorClass = isHard ? 'bg-destructive' : isModerate ? 'bg-warning' : 'bg-success';
                          const textColorClass = isHard ? 'text-destructive' : isModerate ? 'text-warning' : 'text-success';
                          
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700">{ta.topic}</span>
                                <span className={`font-black ${textColorClass}`}>{ta.rate.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                                <div 
                                  className={`h-full rounded-full ${colorClass}`} 
                                  style={{ width: `${ta.rate}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Proctoring Info warning */}
                    {avgWarnings > 1 && (
                      <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 flex items-start gap-2.5 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-destructive">Proctoring Alert</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            This exam tracks an average of <strong>{avgWarnings.toFixed(1)} proctoring warnings</strong> (such as tab switches) per student. Ensure students maintain focus and follow academic integrity.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Box: Student Roster Leaderboard */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border/50 pb-2">
                      <Users className="h-4 w-4 text-primary" />
                      Leaderboard Roster
                    </h4>
                    <div className="max-h-[220px] overflow-y-auto border border-border/50 rounded-xl shadow-sm">
                      <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                          <TableRow className="text-xs">
                            <TableHead className="py-2.5">Email</TableHead>
                            <TableHead className="text-center py-2.5">Score</TableHead>
                            <TableHead className="text-right py-2.5">Review</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {examAttempts.map((attempt) => (
                            <TableRow key={attempt.id} className="hover:bg-muted/20 text-xs">
                              <TableCell className="font-semibold text-foreground py-2 max-w-[150px] truncate">
                                {attempt.studentEmail || attempt.userId}
                              </TableCell>
                              <TableCell className="text-center font-bold text-success py-2">
                                {attempt.score}/{attempt.totalMarks}
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <Button
                                  onClick={() => {
                                    setSelectedExamAttempts(null);
                                    router.push(`/exam/${selectedExamAttempts.id}/review?attempt=${attempt.id}`);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:bg-primary/10 font-bold text-[10px] px-2 h-7"
                                >
                                  Review
                                  <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="border-t border-border/30 pt-4">
            <Button variant="outline" onClick={() => setSelectedExamAttempts(null)} className="font-bold text-xs">
              Close Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


