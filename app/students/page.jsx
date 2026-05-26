"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Code } from "lucide-react"

export default function StudentsPage() {
  const router = useRouter()
  const { isAuthenticated, user, getAccessedByUsers } = useExamStore()
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const fetchStudents = async () => {
      if (user?.id) {
        const result = await getAccessedByUsers()
        setStudents(result)
      }
      setIsLoading(false)
    }

    if (user?.id) {
      fetchStudents()
    }
  }, [user?.id, getAccessedByUsers])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Students</h1>
          <p className="text-muted-foreground">
            Users who joined using your code: <span className="font-mono font-bold text-primary">{user.userCode}</span>
          </p>
        </div>

        {/* Students List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className="border-border/50 hover:border-primary/30 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {student.fullName?.charAt(0).toUpperCase() || "S"}
                      </span>
                    </div>
                    <span className="flex-1 truncate">{student.fullName || "Unknown"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{student.userCode}</Badge>
                  </div>
                  {student.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(student.created_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No students yet</h3>
            <p className="text-muted-foreground">
              Share your code with others so they can access your exams!
            </p>
          </Card>
        )}
        </div>
      </div>
    </DashboardLayout>
  )
}
