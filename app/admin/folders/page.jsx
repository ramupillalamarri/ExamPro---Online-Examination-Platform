"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FloatingShapes, GlowingDots } from "@/components/ui/animated-background"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { FolderOpen, Plus, Pencil, Trash2, FileText, ChevronRight, Sparkles, Folder } from "lucide-react"
import { toast } from "sonner"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const FOLDER_COLORS = [
  { bg: "bg-primary/10", text: "text-primary", border: "group-hover:border-primary/30", glow: "group-hover:shadow-primary/5" },
  { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "group-hover:border-indigo-500/30", glow: "group-hover:shadow-indigo-500/5" },
  { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "group-hover:border-emerald-500/30", glow: "group-hover:shadow-emerald-500/5" },
  { bg: "bg-amber-500/10", text: "text-amber-600", border: "group-hover:border-amber-500/30", glow: "group-hover:shadow-amber-500/5" },
  { bg: "bg-rose-500/10", text: "text-rose-600", border: "group-hover:border-rose-500/30", glow: "group-hover:shadow-rose-500/5" },
]

export default function FoldersPage() {
  const router = useRouter()
  const { folders, exams, addFolder, updateFolder, deleteFolder, isHydrated, isAuthenticated, user } = useExamStore()

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student")
      }
    }
  }, [isHydrated, isAuthenticated, user, router])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState("")

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }
    addFolder(newFolderName.trim())
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

  const handleDeleteFolder = (folder) => {
    deleteFolder(folder.id)
    toast.success("Folder deleted successfully")
  }

  const openEditDialog = (folder) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setIsEditOpen(true)
  }

  const getExamCount = (folderId) => {
    return (exams || []).filter((e) => e.folderId === folderId).length
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
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Folders</h1>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Organize and manage your examinations by category
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/20 hover:opacity-95 font-bold text-xs h-10 px-4 rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Group your exams inside folders for neat subject-wise management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="e.g., Mathematics, Science"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder()
                  }}
                  className="rounded-xl border-border bg-slate-50/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} className="bg-primary hover:bg-primary/95 text-white rounded-xl">
                Create Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Folders Grid */}
      {(!folders || folders.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full"
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No folders yet
              </h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm mb-6 leading-relaxed">
                Create your first folder to start organizing your exams by subject, class level, or term.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white rounded-xl font-bold">
                <Plus className="mr-2 h-4 w-4" />
                Create First Folder
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 relative z-10"
        >
          {(folders || []).map((folder, index) => {
            const examCount = getExamCount(folder.id)
            const color = FOLDER_COLORS[index % FOLDER_COLORS.length]

            return (
              <motion.div
                key={folder.id}
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <Card className={`group border-border/50 bg-card/85 backdrop-blur-md transition-all duration-300 hover:shadow-xl ${color.glow} ${color.border} h-full flex flex-col justify-between overflow-hidden relative`}>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-accent opacity-75" />
                  
                  <CardHeader className="pb-2 pt-5 pl-6 pr-4">
                    <div className="flex items-start justify-between">
                      <div className={`h-11 w-11 rounded-xl ${color.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <Folder className={`h-5 w-5 ${color.text}`} />
                      </div>
                      
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:text-slate-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(folder)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{folder.name}&quot;?
                                Exams in this folder will not be deleted but will become uncategorized.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFolder(folder)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/95 rounded-xl font-bold"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent
                    className="cursor-pointer pt-3 pl-6 pr-6 pb-6 flex-1 flex flex-col justify-end"
                    onClick={() => router.push(`/admin/exams?folderId=${folder.id}`)}
                  >
                    <h3 className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors duration-200 line-clamp-1 mb-2">
                      {folder.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>{examCount} {examCount === 1 ? "exam" : "exams"}</span>
                      </div>
                      <span className="flex items-center text-primary group-hover:translate-x-1 transition-transform duration-200 text-[10px] font-extrabold uppercase tracking-wide">
                        View exams <ChevronRight className="h-3 w-3 ml-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Update the folder name to organize your content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input
                id="edit-folder-name"
                placeholder="e.g., Mathematics, Physics"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateFolder()
                }}
                className="rounded-xl border-border bg-slate-50/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder} className="bg-primary hover:bg-primary/95 text-white rounded-xl">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
