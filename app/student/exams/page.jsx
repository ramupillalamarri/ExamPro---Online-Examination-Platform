"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
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
  Home,
  Folder,
  FolderOpen,
  ChevronRight,
  History,
  X,
  LayoutGrid
} from "lucide-react"
import { FloatingShapes, GlowingDots } from "@/components/ui/animated-background"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const FOLDER_COLORS = [
  { bg: "bg-primary/10", text: "text-primary", border: "group-hover:border-primary/30", glow: "group-hover:shadow-primary/5" },
  { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "group-hover:border-indigo-500/30", glow: "group-hover:shadow-indigo-500/5" },
  { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "group-hover:border-emerald-500/30", glow: "group-hover:shadow-emerald-500/5" },
  { bg: "bg-amber-500/10", text: "text-amber-600", border: "group-hover:border-amber-500/30", glow: "group-hover:shadow-amber-500/5" },
  { bg: "bg-rose-500/10", text: "text-rose-600", border: "group-hover:border-rose-500/30", glow: "group-hover:shadow-rose-500/5" },
]

export default function StudentExamsPage() {
  const router = useRouter()
  const { user, exams, folders, attempts, getAttemptStats, currentUserCode, fetchData, setCurrentUserCode, isHydrated } = useExamStore()
  
  const [viewMode, setViewMode] = useState("explorer") // "explorer" or "list"
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [folderFilter, setFolderFilter] = useState("all")
  const [selectedExam, setSelectedExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch student data when the user context is ready
  useEffect(() => {
    const loadStudentData = async () => {
      setIsLoading(true)
      if (isHydrated && user?.id) {
        await fetchData()
      }
      setIsLoading(false)
    }
    loadStudentData()
  }, [currentUserCode, fetchData, isHydrated, user?.id])

  const publishedExams = useMemo(() => {
    return (exams || []).filter((e) => e.isPublished)
  }, [exams])

  // Recursive count of published exams in a folder and all its subfolders
  const getExamCountRecursive = (folderId) => {
    let count = publishedExams.filter((e) => e.folderId === folderId).length
    const subfolders = (folders || []).filter(f => f.parentId === folderId)
    subfolders.forEach(sub => {
      count += getExamCountRecursive(sub.id)
    })
    return count
  }

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (!currentFolderId) return []
    const trail = []
    let current = (folders || []).find(f => f.id === currentFolderId)
    const visited = new Set()
    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      trail.unshift(current)
      current = current.parentId ? (folders || []).find(f => f.id === current.parentId) : null
    }
    return trail
  }, [currentFolderId, folders])

  // Folders at the current active level
  const currentFolders = useMemo(() => {
    return (folders || []).filter(f => {
      if (currentFolderId === null) {
        return !f.parentId
      }
      return f.parentId === currentFolderId
    })
  }, [currentFolderId, folders])

  // Exams at the current active level
  const currentExams = useMemo(() => {
    return publishedExams.filter(e => {
      if (currentFolderId === null) {
        return !e.folderId
      }
      return e.folderId === currentFolderId
    })
  }, [currentFolderId, publishedExams])

  // Flat filtering for "All Exams" list
  const filteredExams = useMemo(() => {
    return publishedExams.filter((exam) => {
      const matchesSearch = exam.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesFolder =
        folderFilter === "all" || exam.folderId === folderFilter
      return matchesSearch && matchesFolder
    })
  }, [publishedExams, searchQuery, folderFilter])

  // Search Results for the Explorer-Mode Search (ignores currentFolderId and filters all exams)
  const searchResultsExams = useMemo(() => {
    if (searchQuery.trim() === "") return []
    return publishedExams.filter((exam) => 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [publishedExams, searchQuery])

  // Determine if active search mode is overriding explorer
  const isSearchingInExplorer = viewMode === "explorer" && searchQuery.trim() !== ""

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
      totalMarks: stats.totalMarks,
    }
  }

  const handleStartExam = (exam) => {
    const { inProgress, canAttempt } = getAttemptStatus(exam.id)
    if (inProgress) {
      router.push(`/exam/${exam.id}`)
    } else if (canAttempt) {
      setSelectedExam(exam)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <FloatingShapes />
        <GlowingDots />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {viewMode === "explorer" ? "Subject Explorer" : "Available Exams"}
            </h1>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            {viewMode === "explorer" 
              ? "Browse nested subjects, folders, and exams hierarchically" 
              : "Search and filter a complete list of all active examinations"
            }
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {currentUserCode !== '455770' && (
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

          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 h-10 px-4 flex items-center font-bold text-xs rounded-xl">
            {publishedExams.length} Exams Available
          </Badge>
        </div>
      </motion.div>

      {/* Sliding View Switcher & Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10 w-full"
      >
        {/* Toggle Mode Segment */}
        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50 shrink-0 w-full sm:w-[280px]">
          <button
            onClick={() => setViewMode("explorer")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              viewMode === "explorer"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Subject Explorer
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            All Exams
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              viewMode === "explorer"
                ? "Search exams globally..."
                : "Search exams..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Flat list subject filter */}
        {viewMode === "list" && (
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 bg-background/50 border-border/50 rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {(folders || []).filter(f => f && f.id).map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Explorer Mode Breadcrumbs */}
      {viewMode === "explorer" && !isSearchingInExplorer && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-1.5 text-xs font-semibold bg-muted/30 border border-border/40 p-2.5 rounded-xl backdrop-blur-sm relative z-10"
        >
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              currentFolderId === null 
                ? "bg-primary/10 text-primary font-bold" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Root Subjects</span>
          </button>
          
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            return (
              <div key={crumb.id} className="flex items-center gap-1.5 text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  disabled={isLast}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    isLast 
                      ? "text-foreground font-black cursor-default" 
                      : "hover:bg-muted hover:text-foreground font-bold"
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Main Grid Content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div key="loader" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-border/50 bg-card/50 rounded-2xl h-[240px]" />
              ))}
            </div>
          ) : isSearchingInExplorer ? (
            /* Global Explorer Search View Override */
            <motion.div
              key="explorer-search"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                  Search Results ({searchResultsExams.length})
                </h3>
                <Button 
                  onClick={() => setSearchQuery("")} 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary text-xs hover:bg-primary/5 font-bold"
                >
                  Clear Search
                </Button>
              </div>

              {searchResultsExams.length === 0 ? (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="h-10 w-10 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-1">No matches found</h3>
                    <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                      We couldn&apos;t find any exams matching &quot;{searchQuery}&quot;. Try adjusting your keywords.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResultsExams.map((exam) => (
                    <ExamGridItem key={exam.id} exam={exam} getAttemptStatus={getAttemptStatus} attempts={attempts} user={user} router={router} handleStartExam={handleStartExam} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : viewMode === "explorer" ? (
            /* Explorer Directory View */
            <motion.div
              key="explorer-directory"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Subfolders Sub-Section */}
              {currentFolders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                    {currentFolderId === null ? "Subjects" : "Subfolders"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {currentFolders.map((folder, index) => {
                      const examCount = getExamCountRecursive(folder.id)
                      const color = FOLDER_COLORS[index % FOLDER_COLORS.length]

                      return (
                        <motion.div
                          key={folder.id}
                          variants={fadeInUp}
                          whileHover={{ y: -4, scale: 1.015 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        >
                          <Card 
                            className={`group cursor-pointer border-border/50 bg-card/85 backdrop-blur-md hover:shadow-xl ${color.glow} ${color.border} transition-all duration-300 h-full flex flex-col justify-between overflow-hidden relative rounded-2xl`}
                            onClick={() => {
                              setCurrentFolderId(folder.id)
                              window.scrollTo({ top: 0, behavior: "smooth" })
                            }}
                          >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-accent opacity-75" />
                            
                            <CardHeader className="pb-2 pt-5 pl-6 pr-4">
                              <div className={`h-11 w-11 rounded-xl ${color.bg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                                <Folder className={`h-5 w-5 ${color.text}`} />
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-2 pl-6 pr-6 pb-6">
                              <CardTitle className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors line-clamp-1 mb-2">
                                {folder.name}
                              </CardTitle>
                              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className="h-4 w-4 text-slate-400" />
                                  <span>{examCount} {examCount === 1 ? "exam" : "exams"} inside</span>
                                </div>
                                <span className="flex items-center text-primary group-hover:translate-x-1 transition-transform duration-200 text-[10px] font-extrabold uppercase tracking-wide">
                                  Browse <ChevronRight className="h-3 w-3 ml-0.5" />
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Folder Exams Sub-Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                  {currentFolderId === null ? "General Exams (No Subject)" : "Exams in this Folder"}
                </h3>

                {currentExams.length === 0 ? (
                  currentFolders.length > 0 ? (
                    // Nested but currently no direct exams (folders exist above)
                    null
                  ) : (
                    // Complete folder empty state
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-1">This subject folder is empty</h3>
                        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                          There are no exams or subfolders available under this subject group yet.
                        </p>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {currentExams.map((exam) => (
                      <ExamGridItem key={exam.id} exam={exam} getAttemptStatus={getAttemptStatus} attempts={attempts} user={user} router={router} handleStartExam={handleStartExam} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Flat List view */
            <motion.div
              key="list-view"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {filteredExams.length === 0 ? (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-1">No exams found</h3>
                    <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                      We couldn&apos;t find any active exams matching your active filters. Try resetting search parameters.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredExams.map((exam) => (
                    <ExamGridItem key={exam.id} exam={exam} getAttemptStatus={getAttemptStatus} attempts={attempts} user={user} router={router} handleStartExam={handleStartExam} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Start Exam Confirmation Dialog */}
      <AlertDialog
        open={!!selectedExam}
        onOpenChange={() => setSelectedExam(null)}
      >
        <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-800">Start Exam</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="text-muted-foreground text-sm">
                  You are about to start <strong className="text-slate-800">{selectedExam?.title}</strong>.
                  Please review the exam specifications:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Duration</p>
                      <p className="font-bold text-slate-800 text-sm">{selectedExam?.durationMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Questions</p>
                      <p className="font-bold text-slate-800 text-sm">{selectedExam?.questionCount || 0} Qs</p>
                    </div>
                  </div>
                </div>
                {selectedExam?.negativeMarking ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning text-xs font-semibold border border-warning/20">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Negative marking: {Math.round(selectedExam.negativeMarking * 100)}% per incorrect answer</span>
                  </div>
                ) : null}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-1.5">
                  <p className="font-black text-xs text-primary uppercase tracking-wider">Exam Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
                    <li>Your progress is saved automatically.</li>
                    <li>Leaving the tab or switching windows will trigger cheating warnings.</li>
                    <li>The exam timer cannot be paused or reset.</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="border-2 rounded-xl text-xs font-bold px-4">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(`/exam/${selectedExam?.id}`)} className="shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent rounded-xl text-xs font-bold px-4">
              <Play className="mr-1.5 h-4 w-4" />
              Start Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Reusable Exam Grid Item Component
function ExamGridItem({ exam, getAttemptStatus, attempts, user, router, handleStartExam }) {
  const { inProgress, attemptCount, bestScore, canAttempt } = getAttemptStatus(exam.id)

  const handleReviewClick = (e) => {
    e.stopPropagation()
    const completedAttempts = (attempts || []).filter(
      (a) => a.examId === exam.id && a.userId === user?.id && a.status === 'graded'
    )
    if (completedAttempts.length > 0) {
      // Prefer highest score; tie-breaker: earliest submitted
      completedAttempts.sort((a, b) => {
        const scoreA = a.score || 0
        const scoreB = b.score || 0
        if (scoreB !== scoreA) return scoreB - scoreA
        const submittedA = new Date(a.submittedAt || a.startedAt || 0).getTime()
        const submittedB = new Date(b.submittedAt || b.startedAt || 0).getTime()
        return submittedA - submittedB
      })
      router.push(`/exam/${exam.id}/review?attempt=${completedAttempts[0].id}`)
    }
  }

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card 
        onClick={() => {
          if (attemptCount > 0) {
            const completedAttempts = (attempts || []).filter(
              (a) => a.examId === exam.id && a.userId === user?.id && a.status === 'graded'
            )
            if (completedAttempts.length > 0) {
              completedAttempts.sort(
                (a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.startedAt || a.startedAt).getTime()
              )
              router.push(`/exam/${exam.id}/review?attempt=${completedAttempts[0].id}`)
            }
          }
        }}
        className={`flex flex-col h-full border-border/50 bg-card/85 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden relative group ${attemptCount > 0 ? "cursor-pointer" : ""}`}
      >
        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-start justify-between gap-2">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            
            {inProgress && (
              <Badge
                variant="outline"
                className="bg-warning/10 text-warning border-warning/20 animate-pulse text-[10px] font-bold uppercase rounded-lg px-2 py-0.5"
              >
                In Progress
              </Badge>
            )}
            
            {!inProgress && attemptCount > 0 && (
              <Badge
                variant="outline"
                className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 text-[10px] font-bold uppercase rounded-lg px-2 py-0.5 flex items-center gap-1"
                onClick={handleReviewClick}
              >
                <CheckCircle2 className="h-3 w-3" />
                Review Attempt
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg mt-3 font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
            {exam.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-slate-500 text-xs leading-relaxed mt-1">
            {exam.description || "No description available"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col px-6 pb-6 pt-0">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-semibold mb-4 mt-2">
            <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {exam.durationMinutes} min
            </span>
            <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-lg">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              {exam.questionCount || 0} Qs
            </span>
            {exam.folderName && (
              <Badge variant="secondary" className="text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 max-w-[120px] truncate">
                {exam.folderName}
              </Badge>
            )}
          </div>

          {attemptCount > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-success/5 border border-success/10 text-xs font-semibold">
              <p className="text-slate-600">
                Attempted {attemptCount} time{attemptCount > 1 ? "s" : ""}
                {bestScore !== null && (
                  <span className="text-success font-bold ml-1">
                    - Best: {bestScore}/{exam.totalMarks || (exam.questionCount ? exam.questionCount * 2 : 0)}
                  </span>
                )}
              </p>
            </div>
          )}

          {exam.negativeMarking > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-warning bg-warning/5 border border-warning/10 px-3 py-2 rounded-xl mb-4 font-bold uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Negative marking: {Math.round(exam.negativeMarking * 100)}%
            </div>
          )}

          <div className="mt-auto pt-2">
            <motion.div 
              whileHover={(!canAttempt && !inProgress && attemptCount === 0) ? {} : { scale: 1.02 }} 
              whileTap={(!canAttempt && !inProgress && attemptCount === 0) ? {} : { scale: 0.98 }}
            >
              <Button
                className="w-full shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-accent font-bold text-xs rounded-xl h-10"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!canAttempt && attemptCount > 0) {
                    handleReviewClick(e)
                  } else {
                    handleStartExam(exam)
                  }
                }}
                disabled={!canAttempt && !inProgress && attemptCount === 0}
              >
                {inProgress ? (
                  <>
                    <Play className="mr-1.5 h-4 w-4" />
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
                    <Play className="mr-1.5 h-4 w-4" />
                    Retake Exam
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-4 w-4" />
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
}
