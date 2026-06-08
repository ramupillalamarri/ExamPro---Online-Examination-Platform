"use client"

import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, FileText, Sparkles, ChevronRight, Folder } from "lucide-react"
import { motion } from "framer-motion"
import { FloatingShapes, GlowingDots } from "@/components/ui/animated-background"

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

import { useEffect } from "react"

export default function StudentFoldersPage() {
  const router = useRouter()
  const { folders, exams, isHydrated, isAuthenticated } = useExamStore()

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !isAuthenticated) {
    return null
  }

  const getExamCount = (folderId) => {
    // For students, only count published exams
    return (exams || []).filter((e) => e.folderId === folderId && e.isPublished).length
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
        className="flex items-center gap-2 mb-2 relative z-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Folders / Subjects</h1>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Browse exams categorized by subject or topic folders
          </p>
        </div>
      </motion.div>

      {/* Folders Grid */}
      {(!folders || folders.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full"
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No folders available
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                There are no exam folders created by your teacher yet.
              </p>
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
                <Card 
                  className={`group cursor-pointer border-border/50 bg-card/85 backdrop-blur-md hover:shadow-xl ${color.glow} ${color.border} transition-all duration-300 h-full flex flex-col justify-between overflow-hidden relative`}
                  onClick={() => router.push(`/student/exams?folderId=${folder.id}`)}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-accent opacity-75" />
                  
                  <CardHeader className="pb-2 pt-5 pl-6 pr-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`h-11 w-11 rounded-xl ${color.bg} flex items-center justify-center shrink-0 transition-transform duration-300`}
                    >
                      <Folder className={`h-5 w-5 ${color.text}`} />
                    </motion.div>
                  </CardHeader>
                  
                  <CardContent className="pt-2 pl-6 pr-6 pb-6">
                    <CardTitle className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors line-clamp-1 mb-2">
                      {folder.name}
                    </CardTitle>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>{examCount} {examCount === 1 ? "exam" : "exams"} available</span>
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
        </motion.div>
      )}
    </div>
  )
}
