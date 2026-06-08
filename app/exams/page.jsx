"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useExamStore } from "@/lib/store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Users, Search, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function ExamsPage() {
  const router = useRouter()
  const { isAuthenticated, isHydrated, user, exams, currentUserCode, fetchExamsByUserCode } = useExamStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredExams, setFilteredExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student/exams")
      } else if (user?.role === "teacher" || user?.role === "admin") {
        router.push("/admin/exams")
      }
    }
  }, [isHydrated, isAuthenticated, user, router])

  // Fetch exams when currentUserCode changes
  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true)
      if (currentUserCode) {
        await fetchExamsByUserCode(currentUserCode)
      }
      setIsLoading(false)
    }

    fetchExams()
  }, [currentUserCode, fetchExamsByUserCode])

  useEffect(() => {
    const filtered = (exams || []).filter((exam) =>
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.folderName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredExams(filtered)
  }, [searchTerm, exams])

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Available Exams</h1>
          <p className="text-muted-foreground">
            Showing exams from code: <span className="font-mono font-bold text-primary">{currentUserCode}</span>
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exams by title, description, or folder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                  </div>
                  <div className="h-10 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <Card
                key={exam.id}
                className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/exam/${exam.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {exam.title}
                      </CardTitle>
                      {exam.folderName && (
                        <Badge variant="secondary" className="mt-2 w-fit">
                          {exam.folderName}
                        </Badge>
                      )}
                    </div>
                    <Zap className="h-5 w-5 text-accent shrink-0" />
                  </div>
                  <CardDescription className="line-clamp-2 text-sm">
                    {exam.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{exam.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{exam.questionCount} Q</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{exam.attemptCount} attempts</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/exam/${exam.id}`)
                    }}
                  >
                    Start Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No exams found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No exams are available yet. Ask someone to share their code to access their exams!'}
            </p>
            <Link href="/student">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  )
}
