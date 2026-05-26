"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Zap,
  Users,
  FolderOpen,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Flame,
  Target,
  Brain,
  Award,
  BarChart3,
} from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export default function DashboardPage() {
  const router = useRouter()
  const { isHydrated, isAuthenticated, user, exams } = useExamStore()

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  const userExams = exams.filter((e) => e.createdBy === user.id)
  const publishedExams = userExams.filter((e) => e.isPublished)
  const totalQuestions = userExams.reduce((sum, e) => sum + (e.questionCount || 0), 0)

  const stats = [
    {
      title: "Created Exams",
      value: userExams.length,
      icon: BookOpen,
      gradient: "from-primary to-glow-1",
      bgGlow: "shadow-primary/20",
    },
    {
      title: "Published",
      value: publishedExams.length,
      icon: CheckCircle2,
      gradient: "from-success to-glow-4",
      bgGlow: "shadow-success/20",
    },
    {
      title: "Total Questions",
      value: totalQuestions,
      icon: TrendingUp,
      gradient: "from-chart-2 to-glow-4",
      bgGlow: "shadow-chart-2/20",
    },
    {
      title: "Your Code",
      value: user.userCode,
      icon: Trophy,
      gradient: "from-warning to-glow-5",
      bgGlow: "shadow-warning/20",
    },
  ]

  const quickActions = [
    { icon: Target, label: "Create Exam", href: "/create-exam", gradient: "from-primary/20 to-glow-1/20", iconColor: "text-primary", hoverBg: "hover:from-primary/30 hover:to-glow-1/30" },
    { icon: Users, label: "Students", href: "/students", gradient: "from-success/20 to-glow-4/20", iconColor: "text-success", hoverBg: "hover:from-success/30 hover:to-glow-4/30" },
    { icon: FolderOpen, label: "Folders", href: "/folders", gradient: "from-accent/20 to-glow-2/20", iconColor: "text-accent", hoverBg: "hover:from-accent/30 hover:to-glow-2/30" },
    { icon: BarChart3, label: "Analytics", href: "/attempts", gradient: "from-destructive/20 to-glow-3/20", iconColor: "text-destructive", hoverBg: "hover:from-destructive/30 hover:to-glow-3/30" },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.h1
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                Welcome back, {user.fullName || "Teacher"}
              </motion.h1>
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                👋
              </motion.span>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground flex items-center gap-2"
            >
              <Zap className="h-4 w-4 text-warning" />
              Manage your exams and engage with your students. Here's your overview.
            </motion.p>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-warning/10 to-accent/10 border border-warning/20 rounded-2xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-warning to-orange-500 text-white">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Admin Mode Active</h3>
              <p className="text-muted-foreground text-sm">You can create and manage exams for your students</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className={`bg-card/50 backdrop-blur border border-border/50 ${stat.bgGlow} shadow-lg`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <motion.div key={idx} whileHover={{ y: -4 }}>
                  <Link href={action.href}>
                    <div className={`p-6 rounded-xl bg-gradient-to-br ${action.gradient} ${action.hoverBg} transition-all cursor-pointer border border-border/30`}>
                      <Icon className={`h-8 w-8 mb-3 ${action.iconColor}`} />
                      <p className="font-semibold text-foreground">{action.label}</p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Your Exams Section */}
        {userExams.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Your Exams</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/create-exam">Create New +</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userExams.slice(0, 6).map((exam) => (
                <motion.div key={exam.id} whileHover={{ y: -4 }}>
                  <Link href={`/admin/exams/${exam.id}`}>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{exam.title}</h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{exam.questionCount || 0} questions</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${exam.isPublished ? 'bg-success/20 text-success' : 'bg-muted'}`}>
                            {exam.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            {userExams.length > 6 && (
              <div className="text-center mt-6">
                <Button variant="outline" asChild>
                  <Link href="/admin/exams">View All Exams</Link>
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {userExams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No exams yet</h3>
            <p className="text-muted-foreground mb-6">Create your first exam to get started</p>
            <Button asChild>
              <Link href="/create-exam">Create Exam</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
