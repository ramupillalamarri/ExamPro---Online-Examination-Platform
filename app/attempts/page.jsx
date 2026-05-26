"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useExamStore } from "@/lib/store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, CheckCircle2, XCircle, Clock } from "lucide-react"

export default function AttemptsPage() {
  const router = useRouter()
  const { isAuthenticated, user, attempts, exams, getExamQuestions } = useExamStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  // Get only this user's attempts
  const userAttempts = attempts.filter((a) => a.userId === user.id)

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Attempts</h1>
          <p className="text-muted-foreground">Review all your exam attempts and scores</p>
        </div>

        {/* Attempts List */}
        {userAttempts.length > 0 ? (
          <div className="space-y-4">
            {userAttempts.map((attempt) => {
              const exam = exams.find((e) => e.id === attempt.examId)
              const scorePercentage = attempt.totalMarks > 0
                ? ((attempt.score / attempt.totalMarks) * 100).toFixed(1)
                : 0

              return (
                <Card
                  key={attempt.id}
                  className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className="hidden sm:flex">
                        {attempt.status === "graded" ? (
                          scorePercentage >= 50 ? (
                            <CheckCircle2 className="h-8 w-8 text-success" />
                          ) : (
                            <XCircle className="h-8 w-8 text-destructive" />
                          )
                        ) : (
                          <Clock className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Exam Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {exam?.title || "Unknown Exam"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {attempt.startedAt
                            ? new Date(attempt.startedAt).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not started"}
                        </p>
                      </div>

                      {/* Score */}
                      {attempt.status === "graded" && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {scorePercentage}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {attempt.score?.toFixed(1) || 0} / {attempt.totalMarks}
                          </p>
                        </div>
                      )}

                      {/* Status Badge */}
                      <Badge
                        variant={
                          attempt.status === "graded"
                            ? scorePercentage >= 50
                              ? "default"
                              : "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {attempt.status === "graded"
                          ? scorePercentage >= 50
                            ? "Passed"
                            : "Failed"
                          : "In Progress"}
                      </Badge>

                      {/* Review Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/exam/${attempt.examId}/result?attempt=${attempt.id}`)
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-border/50 p-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No attempts yet</h3>
            <p className="text-muted-foreground mb-6">You haven't attempted any exams yet. Start by taking an exam!</p>
            <Link href="/exams">
              <Button>Browse Exams</Button>
            </Link>
          </Card>
        )}
        </div>
      </div>
    </DashboardLayout>
  )
}
