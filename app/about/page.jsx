"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Brain, 
  Shield, 
  BarChart3, 
  Settings, 
  Sparkles, 
  HelpCircle, 
  Trophy, 
  ClipboardList, 
  CheckCircle2, 
  Zap,
  FolderOpen,
  UserCheck,
  Award,
  ChevronRight
} from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-20">
      
      {/* Decorative gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Premium Sticky Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">ExamPro Manual</span>
          </div>
        </div>
        <Link href="/login">
          <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-md">
            Get Started
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </motion.header>

      {/* Hero Banner Section */}
      <main className="relative pt-12 px-6 md:px-12 max-w-6xl mx-auto space-y-16">
        
        {/* Title Block */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center space-y-4 max-w-3xl mx-auto"
        >
          <motion.div variants={fadeInUp}>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 font-bold px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-primary animate-pulse" />
              Complete User Guide
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none"
          >
            How <span className="gradient-text bg-gradient-to-r from-primary to-accent">ExamPro</span> Works
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
          >
            Welcome to the ultimate ExamPro Manual. Whether you are a student preparing for tests or a teacher organizing coursework, discover how to utilize our premium educational tools.
          </motion.p>
        </motion.div>

        {/* Section 1: Quick Start Guide */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-6"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
            <ClipboardList className="h-6 w-6 text-primary shrink-0" />
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Quick Start Guide</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Sign In", desc: "Log in using your Google account to automatically create and synchronize your private profile.", icon: UserCheck },
              { step: "02", title: "Select Role", desc: "Toggle between Student and Teacher modes instantly via the Account Menu in the sidebar.", icon: Users },
              { step: "03", title: "Unlock Classroom", desc: "Enter a teacher's 6-digit access code (e.g. 455770) in the sidebar to sync available exams.", icon: Zap },
              { step: "04", title: "Excel & Review", desc: "Complete testing with real-time feedback, detailed analysis dashboards, and AI assistance.", icon: Award }
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="border-border/50 bg-white shadow-sm hover:shadow-md transition-shadow h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-4xl font-black text-slate-100 select-none group-hover:text-primary/5 transition-colors">
                    {item.step}
                  </div>
                  <CardContent className="pt-6 space-y-3 relative z-10">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-base">{item.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section 2: Role-Based User Manual */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-6"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
            <Users className="h-6 w-6 text-primary shrink-0" />
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Role-Based Manuals</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Student Mode Manual Card */}
            <motion.div variants={fadeInUp}>
              <Card className="border-border/50 bg-gradient-to-br from-white to-primary/5 shadow-md h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <BookOpen className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-extrabold text-slate-800">Student Guide</CardTitle>
                      <CardDescription className="text-xs">Practice, improve, and earn high rankings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Student mode is designed to maximize academic potential. It provides tools to attempt assignments, receive immediate feedback, and analyze results.
                  </p>
                  <ul className="space-y-3 text-xs font-semibold text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Available Exams:</strong> Browse assignments posted by your teacher, check durations, attempt limits, and review your status.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>AI Tutor Split Panel:</strong> Chat with your AI assistant during exam review. The tutor knows the exact question topic and provides customized feedback. History is isolated per question!</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Anti-Cheat Shield:</strong> Focus on integrity. Swapping tabs during exams records warning events that sync with the leaderboard catalog.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Ranks & Leaderboards:</strong> Track your score relative to classmates with dynamically computed rankings and gold, silver, or bronze badges.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Teacher Mode Manual Card */}
            <motion.div variants={fadeInUp}>
              <Card className="border-border/50 bg-gradient-to-br from-white to-accent/5 shadow-md h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <UserCheck className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-extrabold text-slate-800">Teacher Guide</CardTitle>
                      <CardDescription className="text-xs">Publish assignments and inspect classroom metrics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Teacher mode empowers educators to publish customized assignments, organize curricula, and track real-time classroom statistics and weak concepts.
                  </p>
                  <ul className="space-y-3 text-xs font-semibold text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Curriculum Folders:</strong> Group your assignments by specific courses or subjects (e.g. Calculus, Physics) for neat categorization.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Exam Performance Dashboard:</strong> Access a full-screen dynamic view of each exam. Stats show total attempts, class average percentages, passing rates, and mark ranges.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Topic analytics breakdown:</strong> View class performance categorized by topic (sorted from hardest to easiest) with green, amber, and red difficulty progress bars.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Individual Student Reviews:</strong> Review exact answers, scores, and warning logs. The student's review interface automatically expands to full-width and hides the AI tutor for focused teacher analysis.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </motion.section>

        {/* Section 3: Premium Features Showcase */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-6"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
            <Sparkles className="h-6 w-6 text-primary shrink-0" />
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Feature Manual Checklist</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FolderOpen,
                title: "Curriculum Folders",
                desc: "Teachers can create custom subject folders. Clicking a folder instantly filters the assignments view so only exams of that folder are shown."
              },
              {
                icon: Brain,
                title: "AI tutor Split Panel",
                desc: "An advanced, resizable and draggable split pane housing your AI tutor. It reads the current question context to explain mistakes. History resets per question."
              },
              {
                icon: Shield,
                title: "Academic Integrity Warnings",
                desc: "Tracks students switching browser tabs during active testing, triggering gentle warnings and logging proctor metrics for teacher analysis."
              },
              {
                icon: BarChart3,
                title: "Topic Performance Progress",
                desc: "Dynamic progress bars mapping the class's success rates per question topic, highlighting exactly which concepts need additional classroom reviews."
              },
              {
                icon: Trophy,
                title: "Interactive Leaderboards",
                desc: "Dynamic class leaderboards automatically synchronizing ranking badges (#1 gold, #2 silver, #3 bronze) as classmates complete attempts."
              },
              {
                icon: Settings,
                title: "Dynamic Profile Forms",
                desc: "A unified settings profile dashboard allowing both students and teachers to optionalize personal, residential, and academic details."
              }
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="border-slate-100 bg-white hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col group">
                  <CardContent className="pt-6 flex-1 space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <item.icon className="h-5.5 w-5.5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-base leading-tight">{item.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section 4: General FAQ & Information */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="p-6 md:p-10 bg-white rounded-2xl border border-slate-200/60 shadow-sm space-y-6"
        >
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <HelpCircle className="h-8 w-8 text-primary mx-auto" />
            <h3 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">Frequently Asked Questions</h3>
            <p className="text-muted-foreground text-xs">Essential information about data persistence and classroom management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs leading-relaxed font-semibold text-slate-700">
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-800 text-sm">Is my profile information visible to other students?</h4>
              <p className="text-muted-foreground font-medium">No. Your personal profile details (age, address, phone number, etc.) are private and are only accessible by you when visiting your profile manager page.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-800 text-sm">How does the 6-digit teacher code work?</h4>
              <p className="text-muted-foreground font-medium">Each teacher account generates a unique 6-digit classroom code (e.g. 455770). When students enter this code in their sidebar, their exam view reloads to list that specific teacher's catalog.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-800 text-sm">Can I attempt an exam multiple times?</h4>
              <p className="text-muted-foreground font-medium">Exam attempt limits are configured on the database by your teacher. When the attempt limit (e.g. 1 attempt) is reached, the "Start Exam" button dynamically disables to protect results integrity.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-800 text-sm">Are the profile fields mandatory?</h4>
              <p className="text-muted-foreground font-medium">No. All profile fields in the details form (except for the connected Google account email) are completely optional and can be left blank or filled at your convenience.</p>
            </div>
          </div>
        </motion.section>

      </main>
    </div>
  )
}
