"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExamStore } from "@/lib/store"
import { AnimatedBackground, FloatingShapes, GlowingDots, ParticleField, WaveBackground, Sparkles } from "@/components/ui/animated-background"
import {
  GraduationCap,
  Brain,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Users,
  Award,
  Play,
  Star,
  Rocket,
  Target,
  BookOpen,
  TrendingUp,
  Globe,
  Cpu,
  LineChart,
  MessageSquare,
} from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
}

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])
  
  return <span>{count.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const { isAuthenticated, user, currentUserCode, exams, folders } = useExamStore()
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])

  const accessCode = currentUserCode || '455770'
  const [landingExamCount, setLandingExamCount] = useState(0)
  const [landingFolderCount, setLandingFolderCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'student') {
        router.push('/student')
      } else {
        router.push('/admin')
      }
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated) return

    const controller = new AbortController()
    const fetchCounts = async () => {
      try {
        const summaryRes = await fetch('/api/summary', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (summaryRes.ok) {
          const data = await summaryRes.json()
          setLandingExamCount(typeof data.totalExams === 'number' ? data.totalExams : 0)
          setLandingFolderCount(typeof data.totalFolders === 'number' ? data.totalFolders : 0)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load landing summary counts:', err)
        }
      }
    }

    fetchCounts()
    return () => controller.abort()
  }, [isAuthenticated])

  const examCount = landingExamCount
  const folderCount = landingFolderCount

  const features = [
    {
      icon: GraduationCap,
      title: "Isolated Teacher Workspaces",
      description: "Teachers get a completely isolated personal dashboard. Create and manage private folders and exams secure from other users.",
      gradient: "from-primary to-glow-1",
    },
    {
      icon: Brain,
      title: "AI-Powered Tutor & Chat",
      description: "Ask questions and chat with your custom AI tutor directly on the exam review screen to clarify concepts step-by-step.",
      gradient: "from-accent to-glow-3",
    },
    {
      icon: Shield,
      title: "Proctored Anti-Cheat Mode",
      description: "Monitors window focus and tab switching. Automatically alerts the student and auto-submits on the 4th tab infraction.",
      gradient: "from-destructive to-glow-2",
    },
    {
      icon: Target,
      title: "Weak Topics & Mistakes Analyzer",
      description: "Instantly grades exams and provides detailed AI analysis of incorrect answers and tailored improvement guides.",
      gradient: "from-chart-2 to-glow-4",
    },
    {
      icon: Users,
      title: "Secure Code Sharing",
      description: "Share exams with students securely using unique 6-digit access codes. Keep teacher materials completely separated.",
      gradient: "from-success to-glow-4",
    },
    {
      icon: CheckCircle2,
      title: "Auto-Save Progress & Results",
      description: "Active answer saving protects attempts from connection drops. Instant grading with score dashboards and leaderboards.",
      gradient: "from-warning to-glow-5",
    },
  ]

  const stats = [
    { value: 10000, label: "Active Students", icon: Users, suffix: "+" },
    { value: 1200, label: "Exams Conducted", icon: BookOpen, suffix: "+" },
    { value: 99, label: "Integrity Score", icon: Shield, suffix: "%" },
    { value: 100, label: "AI Guidance", icon: Brain, suffix: "%" },
  ]

  const testimonials = [
    { name: "Sarah J.", role: "Student", text: "ExamPro helped me improve my scores by 40%!", avatar: "S" },
    { name: "Prof. Mike", role: "Teacher", text: "The best exam platform I have ever used.", avatar: "M" },
    { name: "Emily R.", role: "Student", text: "AI feedback is incredibly helpful!", avatar: "E" },
  ]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Floating Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      >
        <div className="container mx-auto">
          <motion.div
            className="flex items-center justify-between px-6 py-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/50 shadow-xl shadow-primary/5"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(var(--primary), 0.15)" }}
          >
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.09 }}
              transition={{ type: "spring", stiffness: 400}}
            >
              <motion.div
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-glow-1 flex items-center justify-center shadow-lg shadow-primary/30"
                animate={{ rotate: [0, 8, 0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <span className="font-bold text-xl gradient-text animate-text-gradient bg-gradient-to-r from-primary via-accent to-primary">ExamPro</span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-6">
              {["Features", "Pricing"].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                  whileHover={{ y: -2 }}
                >
                  {item}
                  <motion.span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
              <Link href="/about">
                <motion.span
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  About
                  <motion.span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"
                  />
                </motion.span>
              </Link>
            </div>
            
            <Link href="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-glow-1 hover:opacity-90">
                  Get Started
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <AnimatedBackground variant="hero">
        <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative min-h-screen flex items-center">
          <FloatingShapes />
          <GlowingDots />
          <Sparkles count={30} />
          <ParticleField />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Animated badge */}
              <motion.div variants={fadeInUp}>
                <motion.div
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-sm font-medium mb-8"
                  animate={{ 
                    boxShadow: ["0 0 20px rgba(var(--primary), 0.2)", "0 0 40px rgba(var(--primary), 0.4)", "0 0 20px rgba(var(--primary), 0.2)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.span>
                  <span className="gradient-text">AI-Powered Examination Platform</span>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0">New</Badge>
                </motion.div>
              </motion.div>
              
              {/* Main headline with gradient animation */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance mb-8"
              >
                Transform Your{" "}
                <span className="relative inline-block">
                  <span className="gradient-text animate-text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]">
                    Online Examinations
                  </span>
                  <motion.svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                  >
                    <motion.path
                      d="M0 6 Q75 0, 150 6 T300 6"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="50%" stopColor="var(--accent)" />
                        <stop offset="100%" stopColor="var(--primary)" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </span>
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-muted-foreground mb-10 text-pretty max-w-2xl mx-auto leading-relaxed"
              >
                Create isolated teacher workspaces, proctor exams with focus monitoring,
                and leverage AI tutors for instant student reviews in a beautifully unified platform.
              </motion.p>
              
              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              >
                <Link href="/login">
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" className="w-full sm:w-auto shadow-2xl shadow-primary/30 px-8 h-14 text-lg bg-gradient-to-r from-primary via-glow-1 to-primary bg-[length:200%_auto] animate-gradient hover:opacity-90">
                      <Rocket className="mr-2 h-5 w-5" />
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-14 text-lg border-2 group" onClick={() => window.location.hash = '#features'}>
                    <motion.span
                      className="mr-2 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="h-4 w-4 text-primary ml-0.5" />
                    </motion.span>
                    Explore Features
                  </Button>
                </motion.div>
              </motion.div>

              {/* Floating cards preview */}
              <motion.div
                variants={fadeInUp}
                className="relative h-[300px] md:h-[400px] max-w-3xl mx-auto"
              >
                {/* Main card */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] md:w-[400px]"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/10 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary via-accent to-glow-2" />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground">Teacher Access Code</p>
                          <p className="text-xs text-muted-foreground">Unlocks isolated classrooms</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-sm font-mono text-left text-muted-foreground flex items-center">
                            {accessCode}
                          </div>
                          <Badge className="bg-success text-success-foreground hover:bg-success border-0 flex items-center gap-1 text-[10px]">
                            ✓ Verified
                          </Badge>
                        </div>
                        <p className="text-xs text-left text-success font-semibold">{examCount} Exams & {folderCount} Folders Unlocked</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Left floating card */}
                <motion.div
                  className="absolute left-0 top-1/4 w-[200px] hidden md:block"
                  animate={{ y: [0, -15, 0], rotate: [-5, -3, -5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Card className="bg-card/85 backdrop-blur-xl border-border/50 shadow-xl">
                    <CardContent className="p-4 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">AI Tutor Sidekick</span>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          "Excellent! To find the derivative of <strong>x²</strong>, we apply the power rule to get <strong>2x</strong>."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Right floating card */}
                <motion.div
                  className="absolute right-0 top-1/3 w-[180px] hidden md:block"
                  animate={{ y: [0, -12, 0], rotate: [5, 3, 5] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <Card className="bg-card/85 backdrop-blur-xl border-border/50 shadow-xl">
                    <CardContent className="p-4 text-left">
                      <div className="flex items-center gap-2 mb-2 text-destructive">
                        <Shield className="h-4 w-4 text-destructive" />
                        <span className="text-xs font-semibold">Anti-Cheat Monitor</span>
                      </div>
                      <div className="bg-destructive/5 rounded-lg p-2.5 border border-destructive/10">
                        <p className="text-xs font-bold text-destructive">⚠️ Tab switch warning (1 / 3)</p>
                        <p className="text-[9.5px] text-muted-foreground mt-1 leading-normal">Focus loss will trigger auto-submit.</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Bottom floating badge */}
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Attempt Saved & Graded Instantly</span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-20 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={scaleIn}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-4 md:p-6 text-center relative">
                      <motion.div
                        className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-3"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        <stat.icon className="h-6 w-6 text-primary" />
                      </motion.div>
                      <div className="text-2xl md:text-3xl font-bold gradient-text">
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          <WaveBackground />
        </section>
      </AnimatedBackground>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ x: [0, -100] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="flex gap-8 items-center whitespace-nowrap">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground/30">
                <Globe className="h-6 w-6" />
                <span className="text-lg font-medium">TrustCorp</span>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="container mx-auto px-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground"
          >
            Trusted by <span className="font-semibold text-foreground">500+</span> educational institutions worldwide
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Cpu className="h-3 w-3 mr-1" />
                Features
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              Everything You Need to{" "}
              <span className="gradient-text">Succeed</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Powerful features designed to make online examinations efficient, secure, and insightful.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <CardContent className="p-6 relative">
                    <motion.div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:gradient-text transition-all">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    
                    <motion.div
                      className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      Learn more
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
            <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                <Target className="h-3 w-3 mr-1" />
                How It Works
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-4">
              Simple Steps to <span className="gradient-text">Success</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our intuitive platform
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            {[
              { step: "01", title: "Access with 6-Digit Code", desc: "Unlock a teacher's isolated exams and study folders instantly.", icon: Users },
              { step: "02", title: "Take AI-Proctored Exam", desc: "Answer questions under tab-switch monitoring and auto-save protection.", icon: BookOpen },
              { step: "03", title: "Learn with AI Tutor", desc: "Receive immediate scores, mistake analysis, and concept chat support.", icon: LineChart },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative inline-block mb-6"
                >
                  <motion.div
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30"
                    animate={{ 
                      boxShadow: ["0 20px 40px rgba(var(--primary), 0.2)", "0 30px 60px rgba(var(--primary), 0.3)", "0 20px 40px rgba(var(--primary), 0.2)"]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <item.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                    {item.step}
                  </div>
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <FloatingShapes />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-success/10 text-success border-success/20">
                <MessageSquare className="h-3 w-3 mr-1" />
                Testimonials
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-4">
              Loved by <span className="gradient-text">Students</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-primary via-glow-1 to-accent text-primary-foreground border-0 overflow-hidden relative">
              <div className="absolute inset-0">
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                      "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                      "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    ],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                <Sparkles count={15} />
              </div>
              <CardContent className="p-10 md:p-16 text-center relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="inline-block mb-6"
                  >
                    <Rocket className="h-12 w-12" />
                  </motion.div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    Ready to Get Started?
                  </h2>
                  <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
                    Join thousands of educators using ExamPro to create better examination experiences.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/login">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="lg"
                          className="bg-background text-foreground hover:bg-background/90 shadow-2xl px-8 h-14 text-lg"
                        >
                          Create Your Account
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/30 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </motion.div>
              <span className="font-bold text-xl gradient-text">ExamPro</span>
            </motion.div>
            <div className="flex items-center gap-8">
              {["Privacy", "Terms", "Contact"].map((item) => (
                <motion.a
                  key={item}
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ y: -2 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Next.js and AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}



