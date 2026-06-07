"use client"

import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, FileText, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { FloatingShapes, GlowingDots } from "@/components/ui/animated-background"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export default function StudentFoldersPage() {
  const router = useRouter()
  const { folders, exams } = useExamStore()

  const getExamCount = (folderId) => {
    // For students, only count published exams
    return exams.filter((e) => e.folderId === folderId && e.isPublished).length
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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Folders / Subjects</h1>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Browse exams categorized by subject or topic folders
          </p>
        </div>
      </motion.div>

      {/* Folders Grid */}
      {folders.length === 0 ? (
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
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No folders available
              </h3>
              <p className="text-muted-foreground text-center max-w-sm">
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
          {folders.map((folder, index) => {
            const examCount = getExamCount(folder.id)
            return (
              <motion.div
                key={folder.id}
                variants={fadeInUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card 
                  className="group cursor-pointer border-border/50 bg-card/80 backdrop-blur-xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 h-full flex flex-col justify-between"
                  onClick={() => router.push(`/student/exams?folderId=${folder.id}`)}
                >
                  <CardHeader className="pb-3">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                    >
                      <FolderOpen className="h-6 w-6 text-primary" />
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{folder.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{examCount} {examCount === 1 ? "exam" : "exams"} available</span>
                    </CardDescription>
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
