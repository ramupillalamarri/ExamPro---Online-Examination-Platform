"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Users,
  Search,
  TrendingUp,
  Brain,
  AlertCircle,
  FileText,
  Clock,
  ChevronRight,
  Filter,
  RotateCcw,
  Phone,
  Mail,
  Calendar,
  MapPin,
  School,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Award,
  Hash,
  User
} from "lucide-react"
import { Skeleton, RowSkeleton } from "@/components/ui/skeleton"

export default function StudentsPage() {
  const router = useRouter()
  const { user, isHydrated, isAuthenticated } = useExamStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState([])
  const [attemptsData, setAttemptsData] = useState([])
  const [aiInsightsData, setAiInsightsData] = useState([])
  const [isClearing, setIsClearing] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auth and redirection guard
  useEffect(() => {
    if (isHydrated && mounted) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student")
      }
    }
  }, [isHydrated, mounted, isAuthenticated, user?.role, router])

  // Dynamic Students Data polling
  useEffect(() => {
    let active = true
    const loadStudentData = async (isInitial = false) => {
      if (!user?.id) return
      if (isInitial) setIsLoading(true)
      try {
        // Also refresh global store data to sync attempts/exams roster class-wide
        await useExamStore.getState().fetchData()

        // Fetch students who are accessing this teacher's 6-digit code
        const res = await fetch(`/api/students?userId=${user.id}&_t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch students data')
        const data = await res.json()
        if (active) {
          setStudents(data.students || [])
          setAttemptsData(data.attempts || [])
          setAiInsightsData(data.aiInsights || [])
        }
      } catch (error) {
        console.error('Failed to load students data:', error)
      } finally {
        if (isInitial && active) setIsLoading(false)
      }
    }

    if (user?.id && mounted) {
      loadStudentData(true)
      const pollInterval = setInterval(() => loadStudentData(false), 5000)
      return () => {
        active = false
        clearInterval(pollInterval)
      }
    }
  }, [user?.id, mounted])



  const studentStats = useMemo(() => {
    return students.map((student) => {
      const formattedLastActive = student.lastActive && !isNaN(new Date(student.lastActive).getTime())
        ? new Date(student.lastActive).toLocaleDateString()
        : student.createdAt && !isNaN(new Date(student.createdAt).getTime())
          ? new Date(student.createdAt).toLocaleDateString()
          : "-"
          
      const formattedJoinedAt = student.createdAt && !isNaN(new Date(student.createdAt).getTime())
        ? new Date(student.createdAt).toLocaleDateString()
        : "-"

      return {
        id: student.id,
        email: student.email,
        fullName: student.fullName,
        age: student.age,
        phoneNumber: student.phoneNumber,
        address: student.address,
        college: student.college,
        major: student.major,
        graduationYear: student.graduationYear,
        bio: student.bio,
        attempts: student.attemptCount,
        avgScore: Number(student.avgScore || 0),
        lastActive: formattedLastActive,
        joinedAt: formattedJoinedAt,
      }
    })
  }, [students])

  const filteredStudents = studentStats.filter(s => s.email.toLowerCase().includes(searchQuery.toLowerCase()))

  const classInsights = useMemo(() => {
    return aiInsightsData.slice(0, 3)
  }, [aiInsightsData])

  const currentStudent = useMemo(() => {
    if (!selectedStudent) return null
    return studentStats.find((s) => s.id === selectedStudent.id) || selectedStudent
  }, [selectedStudent, studentStats])

  const classAvg = useMemo(() => {
    const gradedAttempts = attemptsData.filter(a => a.status === 'graded')
    if (gradedAttempts.length === 0) return 0
    return gradedAttempts.reduce((sum, a) => sum + (a.score * 100 / (a.totalMarks || 1)), 0) / gradedAttempts.length
  }, [attemptsData])


  if (!mounted || !isHydrated || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Students & Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor class performance and AI-driven insights
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Insights */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Class Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm font-medium text-muted-foreground">Total Students</span>
                <span className="font-bold text-foreground text-lg text-right animate-pulse">
                  {isLoading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    studentStats.length
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-sm font-medium text-muted-foreground">Total Submissions</span>
                <span className="font-bold text-primary text-lg text-right animate-pulse">
                  {isLoading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    attemptsData.length
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-success/5 border border-success/10">
                <span className="text-sm font-medium text-muted-foreground">Class Average</span>
                <span className="font-bold text-success text-lg text-right animate-pulse">
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    `${classAvg.toFixed(1)}%`
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-warning" />
                AI Class Insights
              </CardTitle>
              <CardDescription>Common weak areas across all students</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  <p className="text-muted-foreground text-xs font-medium animate-pulse">Loading insights...</p>
                </div>
              ) : classInsights.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No AI data available yet.</p>
              ) : (
                <div className="space-y-3">
                  {classInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-warning/5 border border-warning/10">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{insight.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.count} incorrect attempts tracked class-wide. Consider reviewing this topic.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Student Table */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl h-full">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Student Roster</CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isClearing}
                    onClick={async () => {
                      if (!window.confirm('Clear ALL exam attempt history, rankings, and AI feedback?\n\nThis will reset the database to show only students, teachers, and available exams. This cannot be undone.')) return
                      
                      setIsClearing(true)
                      try {
                        const res = await fetch('/api/db/reset', { method: 'DELETE' })
                        if (res.ok) {
                          const data = await res.json()
                          
                          // Reset local UI state
                          setStudents((prev) => prev.map((student) => ({ ...student, attemptCount: 0, avgScore: 0, lastActive: null })))
                          setAttemptsData([])
                          setAiInsightsData([])
                          
                          // Reload Zustand store to sync with cleared DB
                          await useExamStore.getState().fetchData()
                          
                          alert('✓ Database reset successfully!\n\n' + data.message)
                        } else {
                          const data = await res.json()
                          alert('❌ Error: ' + (data.error || 'Failed to reset database.'))
                        }
                      } catch (error) {
                        console.error('Reset Error:', error)
                        alert('❌ Error: ' + error.message)
                      } finally {
                        setIsClearing(false)
                      }
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    {isClearing ? 'Resetting...' : 'Reset Database'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-foreground font-medium">No students found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Student Email</TableHead>
                        <TableHead className="text-center">Attempts</TableHead>
                        <TableHead className="text-center">Average Score</TableHead>
                        <TableHead className="text-right">Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow 
                          key={student.id} 
                          className="group hover:bg-muted/40 transition-colors cursor-pointer animate-fade-in"
                          onClick={() => setSelectedStudent(student)}
                          title="Click to view student profile and exam attempts"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0 border border-primary/20">
                                {(student.fullName || student.email).charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-foreground group-hover:text-primary group-hover:underline transition-all font-bold">
                                  {student.fullName || student.email}
                                </span>
                                {student.fullName && (
                                  <span className="text-xs text-muted-foreground font-normal">
                                    {student.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-muted">
                              <FileText className="h-3 w-3 mr-1" />
                              {student.attempts}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={student.attempts > 0 ? `font-bold ${student.avgScore >= 70 ? 'text-success' : student.avgScore >= 50 ? 'text-warning' : 'text-destructive'}` : "text-muted-foreground font-semibold"}>
                              {student.attempts > 0 ? `${student.avgScore.toFixed(1)}%` : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {student.lastActive}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) setSelectedStudent(null) }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-border bg-card shadow-2xl rounded-2xl p-6">
          {currentStudent && (
            <>
              <DialogHeader className="pb-4 border-b border-border/60">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 via-indigo-500/10 to-accent/10 flex items-center justify-center text-3xl font-black text-primary border-4 border-slate-50 dark:border-slate-800 shadow-md">
                      {(currentStudent.fullName || currentStudent.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-md animate-pulse">
                      <Award className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <DialogTitle className="text-2xl font-black text-foreground tracking-tight leading-none">
                      {currentStudent.fullName || "Unnamed Student"}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                        <Mail className="h-3 w-3 text-primary" />
                        {currentStudent.email}
                      </span>
                      <span className="hidden sm:inline text-muted-foreground">•</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] py-0.5 px-2 uppercase">
                        Student
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                
                {/* Left Column: Personal, Academic Details & Bio */}
                <div className="space-y-6">
                  
                  {/* Personal & Academic Grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                      <User className="h-4 w-4 text-primary" />
                      Student Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                        <div className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider mb-1">Age</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {currentStudent.age || <span className="text-muted-foreground font-semibold text-xs italic">Not provided</span>}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                        <div className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider mb-1">Phone Number</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {currentStudent.phoneNumber || <span className="text-muted-foreground font-semibold text-xs italic">Not provided</span>}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border bg-muted/30 sm:col-span-2">
                        <div className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider mb-1">Residential Address</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{currentStudent.address || <span className="text-muted-foreground font-semibold text-xs italic">Not provided</span>}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Profile */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                      <School className="h-4 w-4 text-primary" />
                      Academic Profile
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-xl border border-border bg-muted/30 sm:col-span-2">
                        <div className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider mb-1">College / School</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{currentStudent.college || <span className="text-muted-foreground font-semibold text-xs italic">Not provided</span>}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                        <div className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider mb-1">Major / Field</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{currentStudent.major || <span className="text-muted-foreground font-semibold text-xs italic">Not provided</span>}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                        <div className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider mb-1">Graduation Year</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {currentStudent.graduationYear || <span className="text-muted-foreground font-semibold text-xs italic">Not provided</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio / Description */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                      <Briefcase className="h-4 w-4 text-primary" />
                      About Student
                    </h3>
                    <div className="p-4 rounded-xl border border-border bg-muted/30 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold min-h-[80px]">
                      {currentStudent.bio || "No bio description provided by the student."}
                    </div>
                  </div>
                </div>

                {/* Right Column: Performance Summary & Attempts History */}
                <div className="space-y-6 flex flex-col h-full">
                  <div className="space-y-4 shrink-0">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      Performance Metrics
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl border border-border bg-muted/30 text-center">
                        <div className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider mb-0.5">Attempts</div>
                        <div className="text-lg font-black text-foreground">{currentStudent.attempts}</div>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-muted/30 text-center">
                        <div className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider mb-0.5">Average</div>
                        <div className="text-lg font-black text-primary">{currentStudent.avgScore.toFixed(1)}%</div>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-muted/30 text-center">
                        <div className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider mb-0.5">Joined</div>
                        <div className="text-xs font-bold text-foreground pt-1.5 truncate">{currentStudent.joinedAt}</div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Attempt History list */}
                  <div className="space-y-3 flex-1 flex flex-col min-h-[220px]">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                      Exam Attempt History
                    </h3>

                    <div className="flex-1 overflow-y-auto max-h-[300px] border border-border rounded-xl p-3 space-y-3 bg-muted/20 scrollbar-visible">
                      {(() => {
                        const studentAttempts = attemptsData.filter(att => att.userId === currentStudent.id)
                        if (studentAttempts.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                              <FileText className="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                              <p className="text-xs text-muted-foreground font-semibold">No exams attempted yet</p>
                            </div>
                          )
                        }
                        return studentAttempts.map((att) => {
                          const percentage = att.totalMarks > 0 ? (att.score * 100 / att.totalMarks).toFixed(1) : 0
                          return (
                            <div key={att.id} className="p-3 rounded-xl border border-border/80 bg-card hover:bg-muted/10 transition-colors shadow-sm space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-xs text-foreground truncate max-w-[180px] sm:max-w-[220px]" title={att.examTitle}>
                                  {att.examTitle}
                                </span>
                                <Badge 
                                  variant={att.status === "graded" ? "success" : "secondary"}
                                  className={`text-[9px] font-extrabold py-0.5 px-2 capitalize shrink-0 ${
                                    att.status === "graded" 
                                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  }`}
                                >
                                  {att.status === "graded" ? "Graded" : "In Progress"}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  <span>{new Date(att.startedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-foreground">{att.score}/{att.totalMarks} ({percentage}%)</span>
                                </div>
                              </div>

                              {/* Warnings Indicator */}
                              {att.warnings > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-destructive/5 text-destructive text-[10px] font-extrabold border border-destructive/10">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                                  <span>{att.warnings} tab switch warning{att.warnings > 1 ? "s" : ""} recorded!</span>
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
