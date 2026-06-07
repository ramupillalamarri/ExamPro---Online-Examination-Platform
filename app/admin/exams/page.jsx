"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  FileText,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  HelpCircle,
  Users,
  ChevronRight,
  Brain,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

export default function ExamsPage() {
  const router = useRouter()
  const { exams, folders, attempts, questions, answers, publishExam, deleteExam, setExams, setQuestions, fetchData, user, isHydrated } = useExamStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [folderFilter, setFolderFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [selectedExamAttempts, setSelectedExamAttempts] = useState(null)

  useEffect(() => {
    if (isHydrated && user) {
      fetchData()
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const folderId = params.get("folderId")
      if (folderId) {
        setFolderFilter(folderId)
      }
    }
  }, [isHydrated, user?.id, fetchData])

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesFolder =
      folderFilter === "all" || exam.folderId === folderFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && exam.isPublished) ||
      (statusFilter === "draft" && !exam.isPublished)
    return matchesSearch && matchesFolder && matchesStatus
  })

  const handleTogglePublish = ( exam) => {
    publishExam(exam.id, !exam.isPublished)
    toast.success(
      exam.isPublished
        ? "Exam unpublished successfully"
        : "Exam published successfully"
    )
  }

  const handleDeleteExam = () => {
    if (!deleteTarget) return
    deleteExam(deleteTarget.id)
    setDeleteTarget(null)
    toast.success("Exam deleted successfully")
  }

  const handleClearAllExams = async () => {
    setIsClearing(true)
    try {
      const res = await fetch(`/api/exams/clear?userId=${user?.id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        
        // Reset local UI state
        setExams([])
        setQuestions([])
        setShowClearAllDialog(false)
        
        alert('✓ All exams cleared successfully!\n\n' + data.message)
      } else {
        const data = await res.json()
        alert('❌ Error: ' + (data.error || 'Failed to clear exams.'))
      }
    } catch (error) {
      console.error('Clear Error:', error)
      alert('❌ Error: ' + error.message)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-muted-foreground">
            Create and manage your examinations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/admin/exams/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Exam
          </Button>
          {exams.length > 0 && (
            <Button
              onClick={() => setShowClearAllDialog(true)}
              variant="destructive"
              size="sm"
              disabled={isClearing}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isClearing ? "Clearing..." : "Delete All"}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Folders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {exams.length === 0 ? "No exams yet" : "No exams found"}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {exams.length === 0
                ? "Create your first exam to start testing your students."
                : "Try adjusting your search or filters."}
            </p>
            {exams.length === 0 && (
              <Button onClick={() => router.push("/admin/exams/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Exam
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => router.push(`/admin/exams/${exam.id}/analysis`)}
                  title="View exam analysis"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">
                          {exam.title}
                        </h3>
                        <Badge
                          variant={exam.isPublished ? "default" : "secondary"}
                          className={
                            exam.isPublished
                              ? "bg-success/10 text-success border-success/20"
                              : ""
                          }
                        >
                          {exam.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {exam.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {exam.folderName && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {exam.folderName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exam.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5" />
                          {exam.questionCount || 0} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {exam.attemptCount || 0} attempts
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/exams/${exam.id}/questions`);
                      }} 
                      variant="outline" 
                      size="sm"
                    >
                      Manage Questions
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/exams/${exam.id}`)
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTogglePublish(exam)
                          }}
                        >
                          {exam.isPublished ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(exam)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This
              action cannot be undone. All questions associated with this exam
              will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog
        open={showClearAllDialog}
        onOpenChange={setShowClearAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Exams</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL exams? This action cannot be undone.
              All exams and their associated questions will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllExams}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? "Deleting..." : "Delete All Exams"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            const examAttempts = attempts
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
            const examQuestions = questions.filter(q => q.examId === selectedExamAttempts?.id);
            const questionAnalysis = examQuestions.map(q => {
              const qAnswers = answers.filter(ans => ans.questionId === q.id);
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

                <div className="grid md:grid-cols-2 gap-6">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExamAttempts(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


