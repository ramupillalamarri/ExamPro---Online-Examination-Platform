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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FloatingShapes, GlowingDots } from "@/components/ui/animated-background"
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
  AlertDialogTrigger,
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
  Folder,
  FolderOpen,
  X,
  Sparkles,
  LayoutGrid,
  Filter
} from "lucide-react"
import { toast } from "sonner"

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
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

export default function ExamsPage() {
  const router = useRouter()
  const { 
    exams, 
    folders, 
    attempts, 
    questions, 
    answers, 
    publishExam, 
    deleteExam, 
    addFolder, 
    updateFolder, 
    deleteFolder, 
    setExams, 
    setQuestions, 
    fetchData, 
    user, 
    isHydrated, 
    isAuthenticated 
  } = useExamStore()

  const [viewMode, setViewMode] = useState("explorer") // "explorer" or "list"
  const [currentFolderId, setCurrentFolderId] = useState(null)
  
  // Folder CRUD state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null)
  const [deleteExamsInFolder, setDeleteExamsInFolder] = useState(false)

  // Exam list state
  const [searchQuery, setSearchQuery] = useState("")
  const [folderFilter, setFolderFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const folderId = params.get("folderId")
      if (folderId) {
        setCurrentFolderId(folderId)
        setViewMode("explorer")
      }
    }
    return () => {
      active = false
    }
  }, [isHydrated, mounted, isAuthenticated, user, router, fetchData])

  useEffect(() => {
    if (!deleteFolderTarget) {
      setDeleteExamsInFolder(false)
    }
  }, [deleteFolderTarget])

  if (!mounted || !isHydrated || !isAuthenticated || !user || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading exams & subjects...</p>
      </div>
    )
  }

  // Folder helper calculations
  const getExamCountRecursive = (folderId) => {
    let count = (exams || []).filter((e) => e.folderId === folderId).length
    const subfolders = (folders || []).filter(f => f.parentId === folderId)
    subfolders.forEach(sub => {
      count += getExamCountRecursive(sub.id)
    })
    return count
  }

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

  const currentFolders = useMemo(() => {
    return (folders || []).filter(f => {
      if (currentFolderId === null) {
        return !f.parentId
      }
      return f.parentId === currentFolderId
    })
  }, [currentFolderId, folders])

  const explorerExams = useMemo(() => {
    return (exams || []).filter(e => {
      if (currentFolderId === null) {
        return !e.folderId
      }
      return e.folderId === currentFolderId
    })
  }, [currentFolderId, exams])

  // Flat filtering for "All Exams" list
  const filteredExams = useMemo(() => {
    return (exams || []).filter((exam) => {
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
  }, [exams, searchQuery, folderFilter, statusFilter])

  // Global search override in explorer mode
  const searchResultsExams = useMemo(() => {
    if (searchQuery.trim() === "") return []
    return (exams || []).filter((exam) => {
      const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && exam.isPublished) ||
        (statusFilter === "draft" && !exam.isPublished)
      return matchesSearch && matchesStatus
    })
  }, [exams, searchQuery, statusFilter])

  const isSearchingInExplorer = viewMode === "explorer" && searchQuery.trim() !== ""

  // Folder CRUD handlers
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }
    addFolder(newFolderName.trim(), currentFolderId)
    setNewFolderName("")
    setIsCreateOpen(false)
    toast.success("Folder created successfully")
  }

  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }
    updateFolder(editingFolder.id, newFolderName.trim())
    setNewFolderName("")
    setEditingFolder(null)
    setIsEditOpen(false)
    toast.success("Folder updated successfully")
  }

  const handleDeleteFolder = () => {
    if (!deleteFolderTarget) return
    deleteFolder(deleteFolderTarget.id, deleteExamsInFolder)
    toast.success("Folder deleted successfully")
    if (currentFolderId === deleteFolderTarget.id) {
      setCurrentFolderId(deleteFolderTarget.parentId || null)
    }
    setDeleteFolderTarget(null)
  }

  const openEditDialog = (folder) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setIsEditOpen(true)
  }

  // Exam handlers
  const handleTogglePublish = (exam) => {
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
        setExams([])
        setQuestions([])
        setShowClearAllDialog(false)
        toast.success("All exams deleted successfully!")
      } else {
        const data = await res.json()
        toast.error("Error: " + (data.error || "Failed to clear exams."))
      }
    } catch (error) {
      console.error('Clear Error:', error)
      toast.error("Error: " + error.message)
    } finally {
      setIsClearing(false)
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {viewMode === "explorer" ? "Subject Explorer" : "Exams"}
            </h1>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            {viewMode === "explorer" 
              ? "Organize examinations, nested subject folders, and categories" 
              : "Search, filter, and review details of all examinations"
            }
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button 
            onClick={() => {
              const newExamUrl = (viewMode === "explorer" && currentFolderId) 
                ? `/admin/exams/new?folderId=${currentFolderId}` 
                : "/admin/exams/new"
              router.push(newExamUrl)
            }}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/20 hover:opacity-95 font-bold text-xs h-10 px-4 rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Exam
          </Button>

          {viewMode === "list" && exams.length > 0 && (
            <Button
              onClick={() => setShowClearAllDialog(true)}
              variant="destructive"
              className="font-bold text-xs h-10 px-4 rounded-xl shadow-md"
              disabled={isClearing}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete All
            </Button>
          )}
        </div>
      </motion.div>

      {/* Switcher & Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
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

        {/* List View Extra Filters */}
        {viewMode === "list" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-11 bg-background/50 border-border/50 rounded-xl">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {(folders || []).map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-11 bg-background/50 border-border/50 rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Explorer view status filter (optional override) */}
        {viewMode === "explorer" && isSearchingInExplorer && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-11 bg-background/50 border-border/50 rounded-xl shrink-0">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
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
          {isSearchingInExplorer ? (
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
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }} 
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
                      We couldn&apos;t find any exams matching &quot;{searchQuery}&quot;. Try adjusting your keywords or status filter.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {searchResultsExams.map((exam) => (
                    <ExamListItem 
                      key={exam.id} 
                      exam={exam} 
                      router={router} 
                      originFolderId={currentFolderId || exam.folderId}
                      handleTogglePublish={handleTogglePublish} 
                      setDeleteTarget={setDeleteTarget} 
                      setSelectedExamAttempts={setSelectedExamAttempts} 
                    />
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
              {/* Folders/Subfolders Sub-Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {currentFolderId === null ? "Subjects" : "Subfolders"}
                  </h3>
                  
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/5 font-bold text-xs"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {currentFolderId === null ? "Add Subject" : "Add Subfolder"}
                  </Button>
                </div>

                {currentFolders.length === 0 ? (
                  currentFolderId === null ? (
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <h3 className="text-base font-bold text-foreground mb-1">No subjects created yet</h3>
                        <p className="text-muted-foreground text-xs max-w-xs leading-relaxed mb-4">
                          Create folders to group exams by subject or topic.
                        </p>
                        <Button 
                          onClick={() => setIsCreateOpen(true)}
                          size="sm"
                          className="bg-primary hover:opacity-90 font-bold text-xs rounded-xl"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Create First Subject
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null
                ) : (
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
                            
                            <CardHeader className="pb-2 pt-5 pl-6 pr-4 flex flex-row items-start justify-between">
                              <div className={`h-11 w-11 rounded-xl ${color.bg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                                <Folder className={`h-5 w-5 ${color.text}`} />
                              </div>

                              {/* Folder Options Overlay */}
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditDialog(folder)
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteFolderTarget(folder)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-2 pl-6 pr-6 pb-6">
                              <CardTitle className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors line-clamp-1 mb-2">
                                {folder.name}
                              </CardTitle>
                              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                  <span>{examCount} {examCount === 1 ? "exam" : "exams"} inside</span>
                                </div>
                                <span className="flex items-center text-primary group-hover:translate-x-1 transition-transform duration-200 text-[10px] font-extrabold uppercase tracking-wide">
                                  Open <ChevronRight className="h-3 w-3 ml-0.5" />
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Folder Exams Sub-Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                  {currentFolderId === null ? "General Exams (No Subject)" : "Exams in this Folder"}
                </h3>

                {explorerExams.length === 0 ? (
                  currentFolders.length > 0 ? (
                    // Subfolders exist, don't show large empty card
                    null
                  ) : (
                    // Complete empty folder state
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-1">No exams in this category</h3>
                        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                          There are no exams created here yet. Click below to add an exam to this Subject Group.
                        </p>
                        <Button 
                          onClick={() => {
                            const newExamUrl = currentFolderId 
                              ? `/admin/exams/new?folderId=${currentFolderId}` 
                              : "/admin/exams/new"
                            router.push(newExamUrl)
                          }}
                          className="bg-primary hover:opacity-90 font-bold text-xs rounded-xl"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Create Exam
                        </Button>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <div className="space-y-4">
                    {explorerExams.map((exam) => (
                      <ExamListItem 
                        key={exam.id} 
                        exam={exam} 
                        router={router} 
                        originFolderId={currentFolderId || exam.folderId}
                        handleTogglePublish={handleTogglePublish} 
                        setDeleteTarget={setDeleteTarget} 
                        setSelectedExamAttempts={setSelectedExamAttempts} 
                      />
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
              className="space-y-4"
            >
              {filteredExams.length === 0 ? (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-1">No exams found</h3>
                    <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                      We couldn&apos;t find any exams matching your active filters. Try adjusting search queries.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredExams.map((exam) => (
                    <ExamListItem 
                      key={exam.id} 
                      exam={exam} 
                      router={router} 
                      handleTogglePublish={handleTogglePublish} 
                      setDeleteTarget={setDeleteTarget} 
                      setSelectedExamAttempts={setSelectedExamAttempts} 
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Exam Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-800">Delete Exam</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This
              action cannot be undone. All questions associated with this exam
              will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-2 rounded-xl text-xs font-bold px-4">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold px-4"
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
        <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-800">Delete All Exams</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete ALL exams? This action cannot be undone.
              All exams and their associated questions will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-2 rounded-xl text-xs font-bold px-4">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllExams}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold px-4"
            >
              {isClearing ? "Deleting..." : "Delete All Exams"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder CRUD: Create Folder Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">
              {currentFolderId === null ? "Create New Subject Folder" : "Create New Subfolder"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {currentFolderId === null 
                ? "Group your exams inside subject folders for neat management." 
                : `Create a subfolder inside active subject group`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="e.g., CSE, Mathematics, Physics"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-10 bg-background/50 border-border/50 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-2 rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} className="bg-gradient-to-r from-primary to-accent rounded-xl text-xs font-bold">
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder CRUD: Edit Folder Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Rename Folder</DialogTitle>
            <DialogDescription className="text-sm">
              Provide a new name for your subject folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input
                id="edit-folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-10 bg-background/50 border-border/50 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-2 rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder} className="bg-gradient-to-r from-primary to-accent rounded-xl text-xs font-bold">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder CRUD: Delete Folder Confirmation */}
      <AlertDialog open={!!deleteFolderTarget} onOpenChange={() => setDeleteFolderTarget(null)}>
        <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-800">Delete Subject Folder</AlertDialogTitle>
            <AlertDialogDescription asChild className="text-muted-foreground text-sm space-y-3">
              <div>
                <div>
                  Are you sure you want to delete &quot;{deleteFolderTarget?.name}&quot;?
                </div>
                <div className="text-destructive font-semibold mt-1">
                  ⚠ All nested subfolders will be permanently deleted.
                </div>
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200/60 p-3 rounded-xl mt-3">
                  <Checkbox
                    id="delete-exams-checkbox"
                    checked={deleteExamsInFolder}
                    onCheckedChange={(checked) => setDeleteExamsInFolder(!!checked)}
                    className="mt-0.5 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <label htmlFor="delete-exams-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Delete all exams inside this folder
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">
                      If unchecked, exams will be preserved and become uncategorized.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-2 rounded-xl text-xs font-bold px-4">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold px-4">
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exam Performance Analysis Modal */}
      <Dialog
        open={!!selectedExamAttempts}
        onOpenChange={() => setSelectedExamAttempts(null)}
      >
        <DialogContent className="max-w-4xl border-border/50 bg-card/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 font-black text-slate-800">
              <Brain className="h-6 w-6 text-primary animate-pulse" />
              Analysis for {selectedExamAttempts?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
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
                  <p className="text-lg font-bold text-slate-800">No completed attempts recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Once students complete this exam, in-depth analytical reports will appear here.</p>
                </div>
              );
            }

            const maxPossibleMarks = selectedExamAttempts?.questionCount * 2 || examAttempts[0]?.totalMarks || 10;
            const avgScore = examAttempts.reduce((sum, a) => sum + (a.score / (a.totalMarks || maxPossibleMarks)) * 100, 0) / totalAttemptsCount;
            const highestScore = Math.max(...examAttempts.map(a => a.score));
            const lowestScore = Math.min(...examAttempts.map(a => a.score));
            const passedAttempts = examAttempts.filter(a => (a.score / (a.totalMarks || maxPossibleMarks)) >= 0.5);
            const passRate = (passedAttempts.length / totalAttemptsCount) * 100;
            const avgWarnings = examAttempts.reduce((sum, a) => sum + (a.warnings || 0), 0) / totalAttemptsCount;

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Attempts</span>
                    <span className="text-2xl font-black text-primary mt-1 block">{totalAttemptsCount}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Completed attempts</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-success/5 border border-success/10 shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Class Average</span>
                    <span className="text-2xl font-black text-success mt-1 block">{avgScore.toFixed(1)}%</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Mean score rate</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Score Range</span>
                    <span className="text-2xl font-black text-accent mt-1 block">{highestScore}/{lowestScore}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Highest / Lowest marks</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-warning/5 border border-warning/10 shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Passing Rate</span>
                    <span className="text-2xl font-black text-warning mt-1 block">{passRate.toFixed(1)}%</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Scored &ge; 50%</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-border/50 pb-2">
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

                    {avgWarnings > 1 && (
                      <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 flex items-start gap-2.5 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-destructive">Proctoring Alert</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            This exam tracks an average of <strong>{avgWarnings.toFixed(1)} proctoring warnings</strong> (such as tab switches) per student. Ensure students maintain focus.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-border/50 pb-2">
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
                              <TableCell className="font-semibold text-slate-700 py-2 max-w-[150px] truncate">
                                {attempt.studentEmail || attempt.userId}
                              </TableCell>
                              <TableCell className="text-center font-black text-success py-2">
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
            <Button variant="outline" onClick={() => setSelectedExamAttempts(null)} className="border-2 rounded-xl text-xs font-bold px-4 h-9">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Reusable Teacher Exam List Row Item Component
function ExamListItem({ exam, router, originFolderId, handleTogglePublish, setDeleteTarget, setSelectedExamAttempts }) {
  const questionsUrl = originFolderId
    ? `/admin/exams/${exam.id}/questions?folderId=${originFolderId}`
    : `/admin/exams/${exam.id}/questions`

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 rounded-2xl">
        <CardContent className="p-0">
          <div 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 cursor-pointer"
            onClick={() => router.push(`/admin/exams/${exam.id}/analysis`)}
            title="View exam analysis"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-slate-800 text-base truncate group-hover:text-primary transition-colors">
                    {exam.title}
                  </h3>
                  <Badge
                    variant={exam.isPublished ? "default" : "secondary"}
                    className={
                      exam.isPublished
                        ? "bg-success/10 text-success border-success/20 text-[10px] font-bold uppercase rounded-lg px-2"
                        : "text-[10px] font-bold uppercase rounded-lg px-2"
                    }
                  >
                    {exam.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                  {exam.description || "No description"}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-semibold">
                  {exam.folderName && (
                    <Badge variant="outline" className="text-[10px] font-bold rounded-lg bg-slate-50 text-slate-500 border-slate-200/50 py-0.5 px-2">
                      {exam.folderName}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {exam.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    {exam.questionCount || 0} Qs
                  </span>
                  <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {exam.attemptCount || 0} attempts
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:ml-4" onClick={(e) => e.stopPropagation()}>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(questionsUrl);
                }} 
                variant="outline" 
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs h-9 rounded-xl shadow-sm bg-background"
              >
                Questions
              </Button>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedExamAttempts(exam);
                }} 
                variant="outline" 
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 rounded-xl shadow-sm bg-background"
              >
                Analysis
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => router.push(`/admin/exams/${exam.id}`)} className="text-xs font-bold">
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTogglePublish(exam)} className="text-xs font-bold">
                    {exam.isPublished ? (
                      <>
                        <EyeOff className="mr-2 h-3.5 w-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        Publish
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive text-xs font-bold"
                    onClick={() => setDeleteTarget(exam)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
