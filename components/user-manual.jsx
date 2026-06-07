"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
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
  Award
} from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export function UserManual({ isDashboard = false }) {
  const Container = isDashboard ? "div" : "main"

  return (
    <Container className={`relative max-w-6xl mx-auto space-y-10 md:space-y-16 pb-12 md:pb-20 ${
      isDashboard ? "p-4 md:p-6 lg:p-8" : "pt-6 md:pt-12 px-4 md:px-12"
    }`}>
      
      {/* Title Block */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="text-center space-y-4 max-w-3xl mx-auto"
      >
        <motion.div variants={fadeInUp}>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 font-bold px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-primary animate-pulse" />
            Complete User Guide
          </Badge>
        </motion.div>
        
        <motion.h1 
          variants={fadeInUp}
          className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight md:leading-none"
        >
          How <span className="gradient-text bg-gradient-to-r from-primary to-accent">ExamPro</span> Works
        </motion.h1>
        
        <motion.p 
          variants={fadeInUp}
          className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto leading-relaxed"
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { step: "01", title: "Sign In", desc: "Log in securely using your Google account to automatically create and synchronize your private dashboard profile.", icon: UserCheck },
            { step: "02", title: "Select Role", desc: "Toggle between Student and Teacher modes instantly via the Account Menu dropdown in the sidebar.", icon: Users },
            { step: "03", title: "Connect Classroom", desc: "Students enter a teacher's unique 6-digit code (default '455770') in the sidebar to load that teacher's exams.", icon: Zap },
            { step: "04", title: "Excel & Review", desc: "Complete testing with real-time saving, detailed performance analytics, and custom AI tutoring.", icon: Award }
          ].map((item, idx) => (
            <motion.div key={idx} variants={fadeInUp}>
              <Card className="border-border/50 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 text-4xl font-black text-slate-100/70 select-none group-hover:text-primary/10 transition-colors">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Student Mode Manual Card */}
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50 bg-gradient-to-br from-white to-primary/5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
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
                    <span><strong>Classroom Access Code:</strong> Enter a teacher's unique 6-digit access code in the sidebar (or use default code `455770`). Once unlocked, only that teacher's folders and exams will be accessible.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>AI Tutor Split Panel:</strong> Chat with your AI assistant during exam reviews. The tutor knows the exact question context and options to provide targeted help. History is preserved per question!</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Anti-Cheat Shield:</strong> Focus on integrity. Switching tabs or window focus records a warning infraction. On the <strong>4th infraction</strong>, the exam is automatically submitted with warning flags.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Ranks & Leaderboards:</strong> Compare your scores with classmates with dynamically computed rankings and achievement badges (Flame, Star, Trophy) visible to you.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Teacher Mode Manual Card */}
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50 bg-gradient-to-br from-white to-accent/5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
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
                    <span><strong>Isolated Workspace Sandbox:</strong> Your folders, exams, and database tables are entirely private. Other teachers cannot view, edit, or access your content, ensuring data integrity.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                    <span><strong>Unique 6-Digit Share Code:</strong> Your profile generates a unique, permanent 6-digit code. Share this code with students so they can view and attempt your folders and exams.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                    <span><strong>Curriculum Folders:</strong> Group your assignments by specific courses or subjects (e.g. Calculus, Physics) for neat categorization.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                    <span><strong>Detailed Class Analytics:</strong> Inspect exam attempts, average marks, passing rates, topic difficulty progress bars, and individual student proctor logs (including cheating infraction counts).</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              desc: "Tracks students switching browser tabs during active testing, triggering gentle warnings and auto-submitting the exam on the 4th infraction."
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
              <Card className="border-border/50 bg-white hover:border-primary/20 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col group">
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
        className="p-4 sm:p-6 md:p-10 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 space-y-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <HelpCircle className="h-8 w-8 text-primary mx-auto" />
          <h3 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">Frequently Asked Questions</h3>
          <p className="text-muted-foreground text-xs">Essential information about data persistence and classroom management.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 text-xs leading-relaxed font-semibold text-slate-700">
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-800 text-sm">Is my profile information visible to other students?</h4>
            <p className="text-muted-foreground font-medium">No. Your personal profile details (age, address, phone number, etc.) are private and are only accessible by you when visiting your profile manager page.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-800 text-sm">How does the 6-digit teacher code work?</h4>
            <p className="text-muted-foreground font-medium">Each teacher account generates a unique 6-digit classroom code (e.g. 455770). When students enter this code in their sidebar, their exam view reloads to list that specific teacher's catalog.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-800 text-sm">What happens if I switch tabs during an exam?</h4>
            <p className="text-muted-foreground font-medium">The system tracks window focus. You will receive an alert warning on each tab-switch. On the 4th infraction, your exam is auto-submitted instantly to maintain academic integrity.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-800 text-sm">Are teacher workspaces isolated?</h4>
            <p className="text-muted-foreground font-medium">Yes. All teachers have completely isolated database workspaces. Other teachers cannot see, edit, or clear your folders and exams, providing absolute privacy.</p>
          </div>
        </div>
      </motion.section>

    </Container>
  )
}
