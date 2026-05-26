"use client"

import { useEffect, useState } from "react"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Zap, BookOpen } from "lucide-react"
import Link from "next/link"

export function MyExams() {
  const { user, exams } = useExamStore()
  const [userExams, setUserExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      // Filter exams created by this user
      const createdExams = exams.filter((exam) => exam.createdBy === user.id)
      setUserExams(createdExams)
    }
    setIsLoading(false)
  }, [user?.id, exams])

  if (!userExams || userExams.length === 0) {
    return null
  }

  return (
    <div className="px-4 py-4 space-y-3 border-t border-sidebar-border">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-sidebar-foreground/70 uppercase">My Exams</p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-sidebar-accent/30 rounded-lg px-2.5 py-2 border border-sidebar-border">
            <p className="text-[10px] text-sidebar-foreground/60">Created</p>
            <p className="text-lg font-bold text-sidebar-primary">{userExams.length}</p>
          </div>
          <div className="bg-sidebar-accent/30 rounded-lg px-2.5 py-2 border border-sidebar-border">
            <p className="text-[10px] text-sidebar-foreground/60">Attempts</p>
            <p className="text-lg font-bold text-sidebar-primary">
              {userExams.reduce((sum, exam) => sum + (exam.attemptCount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Exams List */}
        {isLoading ? (
          <p className="text-[10px] text-sidebar-foreground/60">Loading...</p>
        ) : userExams.length > 0 ? (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {userExams.slice(0, 3).map((exam) => (
              <Link
                key={exam.id}
                href={`/admin/exams/${exam.id}`}
                className="block"
              >
                <div className="text-[11px] p-2 rounded bg-sidebar-accent/20 border border-sidebar-border/50 hover:bg-sidebar-accent/40 transition-colors cursor-pointer group">
                  <p className="font-medium text-sidebar-foreground truncate group-hover:text-sidebar-primary">
                    {exam.title}
                  </p>
                  <p className="text-sidebar-foreground/60 text-[9px]">
                    {exam.questionCount || 0} questions • {exam.attemptCount || 0} attempts
                  </p>
                </div>
              </Link>
            ))}
            {userExams.length > 3 && (
              <p className="text-[10px] text-sidebar-foreground/60 px-2 py-1">
                +{userExams.length - 3} more
              </p>
            )}
          </div>
        ) : null}

        {/* Create Button */}
        <Link href="/create-exam" className="block">
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            variant="outline"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Exam
          </Button>
        </Link>
      </div>
    </div>
  )
}
