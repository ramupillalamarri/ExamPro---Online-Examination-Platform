"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  AlertTriangle,
  Eye,
  Filter,
  TrendingUp,
  Target,
  Search,
  Users,
  Award,
  ArrowRight
} from "lucide-react"
import { format } from "date-fns"

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

// 🎖️ Trophy rank visualizer
const RankBadge = ({ rank }) => {
  if (!rank) return <span className="text-slate-400 font-bold">-</span>
  
  let trophyColor = "text-slate-500 fill-slate-100"
  let rankBg = "bg-slate-50 border-slate-200"
  let rankText = `#${rank}`
  
  if (rank === 1) {
    trophyColor = "text-yellow-500 fill-yellow-100 animate-bounce"
    rankBg = "bg-yellow-50 border-yellow-200"
  } else if (rank === 2) {
    trophyColor = "text-slate-400 fill-slate-100"
    rankBg = "bg-slate-50 border-slate-200"
  } else if (rank === 3) {
    trophyColor = "text-amber-700 fill-amber-50"
    rankBg = "bg-orange-50 border-orange-200"
  }
  
  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold shadow-sm leading-none ${rankBg}`}>
      <Trophy className={`h-3 w-3 ${trophyColor}`} />
      <span className="text-slate-700">{rankText}</span>
    </div>
  )
}

// 📊 Visual inline progress bar for scores
const ScoreProgress = ({ score, totalMarks, isPassing }) => {
  const percentage = Math.round((score / (totalMarks || 1)) * 100)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex justify-between items-center w-24 leading-none">
        <span className={`text-[12.5px] font-extrabold ${isPassing ? "text-emerald-600" : "text-rose-600"}`}>
          {score.toFixed(1)}/{totalMarks}
        </span>
        <span className="text-[10px] text-slate-400 font-bold">{percentage}%</span>
      </div>
      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
        <div 
          style={{ width: `${percentage}%` }}
          className={`h-full rounded-full transition-all duration-500 ${
            isPassing ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-rose-400 to-rose-600"
          }`}
        />
      </div>
    </div>
  )
}

// ⚠️ Warning Counter Pill
const WarningsCell = ({ warnings }) => {
  if (!warnings || warnings === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-sm leading-none">
        0
      </span>
    )
  }
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-red-50 text-red-600 border border-red-100/60 animate-pulse shadow-sm leading-none">
      <AlertTriangle className="h-3 w-3" />
      <span>{warnings}</span>
    </div>
  )
}

export default function AttemptsPage() {
  const router = useRouter()
  const { user, attempts, exams, fetchData, isHydrated, isAuthenticated } = useExamStore()
  const [activeTab, setActiveTab] = useState("attempts") // "attempts" or "leaderboard"
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Leaderboard states
  const [selectedExamId, setSelectedExamId] = useState("")
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState("")

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  useEffect(() => {
    if (isHydrated && user) {
      fetchData()
    }
  }, [isHydrated, user?.id, fetchData])

  // Parse query params for active tab on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab === "leaderboard") {
        setActiveTab("leaderboard")
      }
    }
  }, [])

  // Get user attempts safely
  const userAttempts = useMemo(() => {
    return (attempts || [])
      .filter((a) => a.userId === user?.id)
      .sort((a, b) => new Date(b.startedAt || b.createdAt || 0).getTime() - new Date(a.startedAt || a.createdAt || 0).getTime())
  }, [attempts, user?.id])

  // Exams successfully completed/attempted (graded)
  const attemptedExams = useMemo(() => {
    const gradedAttempts = userAttempts.filter((a) => a.status === "graded")
    const uniqueExamIds = [...new Set(gradedAttempts.map((a) => a.examId))]
    return uniqueExamIds.map((examId) => {
      const exam = (exams || []).find((e) => e.id === examId)
      return {
        id: examId,
        title: exam?.title || "Unknown Exam"
      }
    })
  }, [userAttempts, exams])

  // Set default selected exam once list is loaded
  useEffect(() => {
    if (attemptedExams.length > 0 && !selectedExamId) {
      setSelectedExamId(attemptedExams[0].id)
    }
  }, [attemptedExams, selectedExamId])

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedExamId || !user?.id) return
      setLoadingLeaderboard(true)
      setLeaderboardError("")
      try {
        const res = await fetch(`/api/exams/${selectedExamId}/leaderboard?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setLeaderboardData(data.leaderboard || [])
        } else {
          const data = await res.json()
          setLeaderboardError(data.error || "Failed to load leaderboard.")
        }
      } catch (error) {
        console.error("Leaderboard fetch error:", error)
        setLeaderboardError(error.message)
      } finally {
        setLoadingLeaderboard(false)
      }
    }
    fetchLeaderboard()
  }, [selectedExamId, user?.id])

  const filteredAttempts = useMemo(() => {
    return userAttempts.filter((attempt) => {
      // 1. Status Filter
      let statusMatch = true
      if (statusFilter === "completed") statusMatch = attempt.status === "graded"
      else if (statusFilter === "in_progress") statusMatch = attempt.status === "in_progress"

      // 2. Search Term Filter
      const exam = (exams || []).find((e) => e.id === attempt.examId)
      const title = (attempt.examTitle || exam?.title || "").toLowerCase()
      const searchMatch = title.includes(searchTerm.toLowerCase())

      return statusMatch && searchMatch
    })
  }, [userAttempts, statusFilter, searchTerm, exams])

  const completedCount = useMemo(() => {
    return userAttempts.filter((a) => a.status === "graded").length
  }, [userAttempts])

  const inProgressCount = useMemo(() => {
    return userAttempts.filter((a) => a.status === "in_progress").length
  }, [userAttempts])
  
  const averageScore = useMemo(() => {
    const completed = userAttempts.filter((a) => a.status === "graded")
    return completed.length > 0
      ? completed.reduce((sum, a) => sum + ((a.score || 0) / (a.totalMarks || 1)) * 100, 0) / completed.length
      : 0
  }, [userAttempts])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen bg-[#f8fafc] font-sans antialiased overflow-y-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm shadow-slate-100/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
                {activeTab === "attempts" ? "My Attempts" : "Exam Leaderboards"}
              </h1>
              <p className="text-[11.5px] text-slate-400 font-bold mt-1.5 leading-none">
                {activeTab === "attempts"
                  ? "View your absolute exam history, warnings, and performance reports."
                  : "View standings of students who attempted the same exams as you."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border border-slate-200 text-[10.5px] font-extrabold px-2.5 py-1">
              Student: {user?.fullName || user?.name || "User"}
            </Badge>
          </div>
        </motion.div>

        {/* Toggle Mode Switcher */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/80 shrink-0 w-full sm:w-[360px] relative z-10">
          <button
            onClick={() => setActiveTab("attempts")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "attempts"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/20"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            My Attempts
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "leaderboard"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/20"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Exam Leaderboards
          </button>
        </div>

        {activeTab === "attempts" && (
          <>
            {/* Summary Cards */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {[
                {
                  title: "Total Attempts",
                  value: userAttempts.length,
                  icon: History,
                  color: "text-blue-600",
                  bgColor: "bg-blue-50/50 border-blue-100/60",
                  iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-100",
                },
                {
                  title: "Completed",
                  value: completedCount,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bgColor: "bg-emerald-50/50 border-emerald-100/60",
                  iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-100",
                },
                {
                  title: "In Progress",
                  value: inProgressCount,
                  icon: Clock,
                  color: "text-amber-600",
                  bgColor: "bg-amber-50/50 border-amber-100/60",
                  iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-100",
                },
                {
                  title: "Avg. Score",
                  value: `${averageScore.toFixed(0)}%`,
                  icon: Target,
                  color: "text-purple-600",
                  bgColor: "bg-purple-50/50 border-purple-100/60",
                  iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-100",
                },
              ].map((stat) => (
                <motion.div
                  key={stat.title}
                  variants={fadeInUp}
                  whileHover={{ y: -4, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`border border-slate-200/60 ${stat.bgColor} bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative`}>
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-x-8 -translate-y-8" />
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className={`h-11 w-11 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider leading-none">{stat.title}</p>
                          <p className="text-xl font-black text-slate-800 tracking-tight mt-1.5 leading-none">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Filter and Search Panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm shadow-slate-100/50"
            >
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exam attempts by title..."
                  className="w-full pl-9 pr-4 py-2 text-[12px] bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-xl font-extrabold text-slate-700 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[190px] bg-slate-50 border-slate-200 rounded-xl h-10 px-3.5 font-extrabold text-slate-700 shadow-sm text-xs outline-none focus:border-blue-500">
                  <Filter className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="all" className="font-bold text-xs text-slate-700">All Status</SelectItem>
                  <SelectItem value="completed" className="font-bold text-xs text-slate-700">Completed Only</SelectItem>
                  <SelectItem value="in_progress" className="font-bold text-xs text-slate-700">In Progress Only</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Attempts Table / Mobile Cards */}
            {filteredAttempts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border border-slate-200/60 bg-white rounded-2xl shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 text-blue-500 shadow-inner"
                    >
                      <History className="h-8 w-8 text-blue-500" />
                    </motion.div>
                    <h3 className="text-[16px] font-extrabold text-slate-800 mb-1.5 leading-none">
                      No matching attempts found
                    </h3>
                    <p className="text-[11.5px] text-slate-400 font-bold text-center max-w-sm mb-5 leading-relaxed">
                      We couldn't find any attempts matching your search filter. Try adjusting your search term or attempt a new exam!
                    </p>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button onClick={() => router.push("/student/exams")} className="bg-[#2563eb] hover:bg-[#1d4ed8] font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 border-none text-white h-10 flex items-center gap-1.5">
                        Browse Exams
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-4">
                
                {/* Mobile Grid Layout (Visible on small devices, hidden on >=lg screens) */}
                <div className="block lg:hidden space-y-4">
                  {filteredAttempts.map((attempt, index) => {
                    const exam = (exams || []).find((e) => e.id === attempt.examId)
                    const percentage =
                      attempt.status === "graded"
                        ? ((attempt.score || 0) / (attempt.totalMarks || 1)) * 100
                        : null
                    const isPassing = percentage !== null && percentage >= 60

                    return (
                      <motion.div
                        key={attempt.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col gap-1"
                      >
                        {/* Glowing Status Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          attempt.status !== "graded" ? "bg-amber-500" : isPassing ? "bg-emerald-500" : "bg-rose-500"
                        }`} />

                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <h4 className="font-extrabold text-[13.5px] text-slate-800 leading-snug">
                              {attempt.examTitle || exam?.title || "Unknown Exam"}
                            </h4>
                            {exam?.folderName && (
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {exam.folderName}
                              </p>
                            )}
                          </div>
                          
                          {attempt.status === "graded" ? (
                            <Badge
                              variant="outline"
                              className={`text-[9.5px] font-extrabold shadow-sm px-2 py-0.5 leading-none ${
                                isPassing
                                  ? "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]"
                                  : "bg-[#fff1f2] text-[#be123c] border-[#fecdd3]"
                              }`}
                            >
                              {isPassing ? "Passed" : "Failed"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-600 border-amber-200 text-[9.5px] font-extrabold animate-pulse shadow-sm px-2 py-0.5 leading-none"
                            >
                              In Progress
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-2.5 border-t border-b border-slate-100 my-2">
                          {/* Score column */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Score</p>
                            {attempt.status === "graded" ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[13px] font-black ${isPassing ? "text-emerald-600" : "text-rose-600"}`}>
                                  {attempt.score?.toFixed(1) || 0}/{attempt.totalMarks}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold">({percentage?.toFixed(0)}%)</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 font-bold text-[12px]">-</span>
                            )}
                          </div>
                          
                          {/* Rank column */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rank</p>
                            {attempt.status === "graded" ? (
                              <RankBadge rank={attempt.rank} />
                            ) : (
                              <span className="text-slate-500 font-bold text-[12px]">-</span>
                            )}
                          </div>

                          {/* Attempt Date */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Date</p>
                            <p className="text-[11px] text-slate-600 font-extrabold">
                              {attempt.startedAt ? format(new Date(attempt.startedAt), "MMM d, yyyy") : "-"}
                            </p>
                            <span className="text-[9px] text-slate-400 font-bold leading-none">
                              {attempt.startedAt ? format(new Date(attempt.startedAt), "h:mm a") : ""}
                            </span>
                          </div>

                          {/* Warnings switch */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tab Switches</p>
                            <WarningsCell warnings={attempt.warnings} />
                          </div>
                        </div>

                        <div className="mt-1 flex justify-end">
                          {attempt.status === "graded" ? (
                            <Button 
                              onClick={() => router.push(`/exam/${attempt.examId}/result?attempt=${attempt.id}`)} 
                              variant="outline" 
                              className="w-full text-blue-600 hover:text-blue-700 border-slate-200 bg-white hover:bg-blue-50/20 font-bold text-xs h-9 rounded-xl shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View Report & AI Tutor
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => router.push(`/exam/${attempt.examId}`)} 
                              className="w-full bg-amber-500 hover:bg-amber-600 font-bold text-xs h-9 rounded-xl shadow-sm text-white border-none"
                            >
                              <Clock className="h-3.5 w-3.5 mr-1 text-white" />
                              Resume Attempt
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Desktop Table View (Visible only on large screens >= lg) */}
                <div className="hidden lg:block">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border border-slate-200/60 bg-white rounded-2xl shadow-sm overflow-hidden">
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                              Attempt History Details
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardTitle>
                            <CardDescription className="text-[11.5px] font-bold text-slate-400">
                              Detailed statistics and scores for your {filteredAttempts.length} exam attempt{filteredAttempts.length > 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-2 p-0">
                        <Table>
                          <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                              <TableHead className="font-extrabold text-slate-500 text-xs py-3 px-5">Exam</TableHead>
                              <TableHead className="font-extrabold text-slate-500 text-xs py-3">Started Date</TableHead>
                              <TableHead className="font-extrabold text-slate-500 text-xs py-3">Status</TableHead>
                              <TableHead className="font-extrabold text-slate-500 text-xs py-3 text-center">Score Progress</TableHead>
                              <TableHead className="font-extrabold text-slate-500 text-xs py-3 text-center">Leaderboard Rank</TableHead>
                              <TableHead className="font-extrabold text-slate-500 text-xs py-3 text-center">Cheat Warnings</TableHead>
                              <TableHead className="font-extrabold text-slate-500 text-xs py-3 pr-5 text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          
                          <TableBody>
                            {filteredAttempts.map((attempt, index) => {
                              const exam = (exams || []).find((e) => e.id === attempt.examId)
                              const percentage =
                                attempt.status === "graded"
                                  ? ((attempt.score || 0) / (attempt.totalMarks || 1)) * 100
                                  : null
                              const isPassing = percentage !== null && percentage >= 60

                              return (
                                <TableRow
                                  key={attempt.id}
                                  className="border-slate-100 hover:bg-slate-50/50 transition-colors"
                                >
                                  {/* Exam details */}
                                  <TableCell className="py-3.5 px-5">
                                    <div className="flex items-center gap-3">
                                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                                        attempt.status !== "graded" 
                                          ? "bg-amber-50 border-amber-100 text-amber-500" 
                                          : isPassing 
                                          ? "bg-emerald-50 border-emerald-100 text-emerald-500" 
                                          : "bg-rose-50 border-rose-100 text-rose-500"
                                      }`}>
                                        <History className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <div className="font-extrabold text-[13px] text-slate-800 leading-snug">
                                          {attempt.examTitle || exam?.title || "Unknown Exam"}
                                        </div>
                                        {exam?.folderName && (
                                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                            {exam.folderName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  
                                  {/* Attempt date */}
                                  <TableCell className="py-3.5 font-semibold text-slate-600 text-xs">
                                    <div>{attempt.startedAt ? format(new Date(attempt.startedAt), "MMM d, yyyy") : "-"}</div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                      {attempt.startedAt ? format(new Date(attempt.startedAt), "h:mm a") : ""}
                                    </div>
                                  </TableCell>
                                  
                                  {/* Status badge */}
                                  <TableCell className="py-3.5">
                                    {attempt.status === "graded" ? (
                                      <Badge
                                        variant="outline"
                                        className={`text-[9.5px] font-extrabold shadow-sm ${
                                          isPassing
                                            ? "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]"
                                            : "bg-[#fff1f2] text-[#be123c] border-[#fecdd3]"
                                        }`}
                                      >
                                        {isPassing ? (
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                        ) : (
                                          <XCircle className="h-3 w-3 mr-1" />
                                        )}
                                        {isPassing ? "Passed" : "Failed"}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-600 border-amber-200 text-[9.5px] font-extrabold animate-pulse shadow-sm"
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        In Progress
                                      </Badge>
                                    )}
                                  </TableCell>
                                  
                                  {/* Score progress indicator */}
                                  <TableCell className="py-3.5">
                                    {attempt.status === "graded" ? (
                                      <ScoreProgress 
                                        score={attempt.score || 0} 
                                        totalMarks={attempt.totalMarks} 
                                        isPassing={isPassing} 
                                      />
                                    ) : (
                                      <div className="text-center text-slate-400 font-bold text-xs">-</div>
                                    )}
                                  </TableCell>
                                  
                                  {/* Rank trophy */}
                                  <TableCell className="py-3.5 text-center">
                                    {attempt.status === "graded" ? (
                                      <RankBadge rank={attempt.rank} />
                                    ) : (
                                      <span className="text-slate-400 font-bold text-xs">-</span>
                                    )}
                                  </TableCell>
                                  
                                  {/* Cheat warnings count */}
                                  <TableCell className="py-3.5 text-center">
                                    <WarningsCell warnings={attempt.warnings} />
                                  </TableCell>
                                  
                                  {/* Action Button */}
                                  <TableCell className="py-3.5 pr-5 text-right">
                                    {attempt.status === "graded" ? (
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                                        <Button 
                                          onClick={() => router.push(`/exam/${attempt.examId}/result?attempt=${attempt.id}`)} 
                                          className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 font-extrabold text-[11px] h-8.5 rounded-lg shadow-sm flex items-center gap-1"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                          View Report & AI
                                        </Button>
                                      </motion.div>
                                    ) : (
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                                        <Button 
                                          onClick={() => router.push(`/exam/${attempt.examId}`)} 
                                          className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] h-8.5 rounded-lg shadow-sm border-none"
                                        >
                                          Resume
                                        </Button>
                                      </motion.div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
                
              </div>
            )}
          </>
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-6 relative z-10">
            {/* Selector panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm shadow-slate-100/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-warning" />
                    Select Attempted Exam
                  </h3>
                  <p className="text-[11.5px] text-slate-400 font-bold mt-1">
                    Select an exam you have completed to view the global standings.
                  </p>
                </div>
                
                {attemptedExams.length > 0 ? (
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger className="w-full sm:w-[280px] bg-slate-50 border-slate-200 rounded-xl h-10 px-3.5 font-extrabold text-slate-700 shadow-sm text-xs outline-none focus:border-blue-500">
                      <SelectValue placeholder="Select Exam" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {attemptedExams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id} className="font-bold text-xs text-slate-700">
                          {exam.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            </motion.div>

            {/* Standings table */}
            {attemptedExams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border border-slate-200/60 bg-white rounded-2xl shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 text-warning shadow-inner">
                      <Trophy className="h-8 w-8 text-amber-500 fill-amber-100 animate-pulse" />
                    </div>
                    <h3 className="text-[16px] font-extrabold text-slate-800 mb-1.5 leading-none">
                      No Leaderboards Available
                    </h3>
                    <p className="text-[11.5px] text-slate-400 font-bold text-center max-w-sm mb-5 leading-relaxed">
                      You haven&apos;t successfully completed any exams yet. Leaderboards are locked for security and privacy until you attempt and grade at least one exam!
                    </p>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button onClick={() => router.push("/student/exams")} className="bg-[#2563eb] hover:bg-[#1d4ed8] font-bold text-xs px-5 py-2.5 rounded-xl shadow-md border-none text-white h-10 flex items-center gap-1.5">
                        Start Your First Exam
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : loadingLeaderboard ? (
              <Card className="border border-slate-200/60 bg-white rounded-2xl shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="text-xs text-slate-400 font-bold mt-4 animate-pulse">Loading global standings...</p>
                </CardContent>
              </Card>
            ) : leaderboardError ? (
              <Card className="border border-slate-200/60 bg-white rounded-2xl shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-rose-500">
                  <XCircle className="h-10 w-10 mb-3" />
                  <p className="text-xs font-bold">{leaderboardError}</p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border border-slate-200/60 bg-white rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                          Standings: {(exams || []).find(e => e.id === selectedExamId)?.title || "Selected Exam"}
                          <Award className="h-4 w-4 text-amber-500" />
                        </CardTitle>
                        <CardDescription className="text-[11.5px] font-bold text-slate-400">
                          Rankings computed globally. Private data (email, warnings) has been anonymized.
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 font-extrabold text-[10px] px-2.5 py-0.5">
                        {leaderboardData.length} Contenders
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="font-extrabold text-slate-500 text-xs py-3 px-6 w-32">Rank</TableHead>
                          <TableHead className="font-extrabold text-slate-500 text-xs py-3">Contender Name</TableHead>
                          <TableHead className="font-extrabold text-slate-500 text-xs py-3 text-right pr-6 w-40">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboardData.map((row, index) => {
                          const isCurrentUser = row.userId === user.id
                          return (
                            <TableRow 
                              key={index} 
                              className={`border-slate-100 hover:bg-slate-50/30 transition-colors ${
                                isCurrentUser ? "bg-blue-50/20 font-bold" : ""
                              }`}
                            >
                              <TableCell className="py-3 px-6">
                                <RankBadge rank={row.rank} />
                              </TableCell>
                              <TableCell className="py-3 text-xs text-slate-800 font-extrabold">
                                <div className="flex items-center gap-2">
                                  <span>{row.fullName}</span>
                                  {isCurrentUser && (
                                    <Badge className="bg-blue-500 text-white text-[9px] font-extrabold px-1.5 py-0">You</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 text-right pr-6 text-slate-700 text-xs font-black">
                                {row.score.toFixed(1)} / {row.totalMarks}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
