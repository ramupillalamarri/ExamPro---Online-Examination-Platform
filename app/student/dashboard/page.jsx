"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  BookOpen,
  Clock,
  HelpCircle,
  Search,
  AlertTriangle,
  CheckCircle2,
  Play,
  Sparkles,
  Filter,
  LayoutDashboard
} from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const { user, exams, folders, attempts, getAttemptStats } = useExamStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [folderFilter, setFolderFilter] = useState("all")
  const [selectedExam, setSelectedExam] = useState(null)

  const publishedExams = exams.filter((e) => e.isPublished)

  // Filter exams that are visible to all students (created by admin or system level accounts)
  const publicExams = publishedExams.filter(
    (exam) => exam.createdBy === "admin-1" || exam.createdBy === "admin"
  )

  const filteredExams = publicExams.filter((exam) => {
    const matchesSearch = exam.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesFolder =
      folderFilter === "all" || exam.folderId === folderFilter
    return matchesSearch && matchesFolder
  })

  const getAttemptStatus = (examId) => {
    const stats = getAttemptStats(examId, user?.id || 'student-1')
    return {
      inProgress: stats.inProgress > 0,
      completed: Array.from({ length: stats.completed }),
      attemptCount: stats.completed,
      remaining: stats.remaining,
      canAttempt: stats.canAttempt,
      maxAllowed: stats.maxAllowed,
      bestScore: stats.bestScore,
    }
  }

  const handleStartExam = (exam) => {
    const { inProgress, canAttempt } = getAttemptStatus(exam.id)
    if (inProgress) {
      window.location.href = `/exam/${exam.id}`
    } else if (canAttempt) {
      setSelectedExam(exam)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Exams visible to all students. No access code required!
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 self-start md:self-auto">
          {publicExams.length} Public Exams
        </Badge>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dashboard exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 bg-background/50 border-border/50">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Exams Grid */}
      <AnimatePresence mode="wait">
        {filteredExams.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-6"
                >
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {publicExams.length === 0 ? "No public exams available" : "No exams found"}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  {publicExams.length === 0
                    ? "Check back later for new public exams."
                    : "Try adjusting your search or filters."}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredExams.map((exam) => {
              const stats = getAttemptStatus(exam.id)
              const inProgress = stats.inProgress
              const attemptCount = stats.attemptCount
              const bestScore = stats.bestScore
              const canAttempt = stats.canAttempt

              return (
                <motion.div
                  key={exam.id}
                  variants={fadeInUp}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card 
                    onClick={() => {
                      if (attemptCount > 0) {
                        const completedAttempts = attempts.filter((a) => a.examId === exam.id && a.userId === user?.id && a.status === 'graded');
                        if (completedAttempts.length > 0) {
                          completedAttempts.sort((a, b) => new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt));
                          router.push(`/exam/${exam.id}/review?attempt=${completedAttempts[0].id}`);
                        }
                      }
                    }}
                    className={`flex flex-col h-full border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 ${attemptCount > 0 ? "cursor-pointer" : ""}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <motion.div
                          whileHover={{ rotate: 5, scale: 1.1 }}
                          className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                        >
                          <BookOpen className="h-5 w-5 text-primary" />
                        </motion.div>
                        {inProgress && (
                          <Badge
                            variant="outline"
                            className="bg-warning/10 text-warning border-warning/20 animate-pulse"
                          >
                            In Progress
                          </Badge>
                        )}
                        {!inProgress && attemptCount > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              const completedAttempts = attempts.filter((a) => a.examId === exam.id && a.userId === user?.id && a.status === 'graded');
                              if (completedAttempts.length > 0) {
                                completedAttempts.sort((a, b) => new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt));
                                router.push(`/exam/${exam.id}/review?attempt=${completedAttempts[0].id}`);
                              }
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed (Review)
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mt-3 line-clamp-1">{exam.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {exam.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                          <Clock className="h-3.5 w-3.5" />
                          {exam.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                          <HelpCircle className="h-3.5 w-3.5" />
                          {exam.questionCount || 0} Qs
                        </span>
                        {exam.folderName && (
                          <Badge variant="secondary" className="text-xs">
                            {exam.folderName}
                          </Badge>
                        )}
                      </div>

                      {attemptCount > 0 && (
                        <div className="mb-4 p-3 rounded-xl bg-success/5 border border-success/10 text-sm">
                          <p className="text-muted-foreground">
                            Attempted {attemptCount} time{attemptCount > 1 ? "s" : ""}
                            {bestScore !== null && (
                              <span className="text-success font-medium ml-1">
                                - Best: {bestScore}/{exam.questionCount ? exam.questionCount * 2 : 0}
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {exam.negativeMarking > 0 && (
                        <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg mb-4">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Negative marking: {Math.round(exam.negativeMarking * 100)}%
                        </div>
                      )}

                      <div className="mt-auto">
                        <motion.div 
                          whileHover={(!canAttempt && !inProgress) ? {} : { scale: 1.02 }} 
                          whileTap={(!canAttempt && !inProgress) ? {} : { scale: 0.98 }}
                        >
                          <Button
                            className="w-full shadow-md shadow-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canAttempt && attemptCount > 0) {
                                const completedAttempts = attempts.filter((a) => a.examId === exam.id && a.userId === user?.id && a.status === 'graded');
                                if (completedAttempts.length > 0) {
                                  completedAttempts.sort((a, b) => new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt));
                                  router.push(`/exam/${exam.id}/review?attempt=${completedAttempts[0].id}`);
                                }
                              } else {
                                handleStartExam(exam);
                              }
                            }}
                            disabled={!canAttempt && !inProgress && attemptCount === 0}
                          >
                            {inProgress ? (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Resume Exam
                              </>
                            ) : !canAttempt ? (
                              attemptCount > 0 ? (
                                <>Review Attempt</>
                              ) : (
                                <>No attempts left</>
                              )
                            ) : attemptCount > 0 ? (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Retake Exam
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Start Exam
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Exam Confirmation */}
      <AlertDialog
        open={!!selectedExam}
        onOpenChange={() => setSelectedExam(null)}
      >
        <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Start Exam</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to start <strong className="text-foreground">{selectedExam?.title}</strong>.
                  Please review the exam details:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium text-foreground">{selectedExam?.durationMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Questions</p>
                      <p className="font-medium text-foreground">{selectedExam?.questionCount || 0}</p>
                    </div>
                  </div>
                </div>
                {selectedExam?.negativeMarking ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">Negative marking: {Math.round(selectedExam.negativeMarking * 100)}%</span>
                  </div>
                ) : null}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="font-medium text-foreground mb-2">Important:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                    <li>Your answers are auto-saved</li>
                    <li>Switching tabs will trigger a warning</li>
                    <li>You cannot pause the timer once started</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-2">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(`/exam/${selectedExam?.id}`)} className="shadow-lg shadow-primary/20">
              <Play className="mr-2 h-4 w-4" />
              Start Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
