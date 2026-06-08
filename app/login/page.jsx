"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExamStore } from "@/lib/store"
import { AnimatedBackground, GlowingDots, FloatingShapes, Sparkles } from "@/components/ui/animated-background"
import { GraduationCap, ArrowLeft, Shield, BookOpen, Zap, CheckCircle2, Trophy, Brain } from "lucide-react"
import { toast } from "sonner"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

// Native JWT Decoder
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("JWT decoding failed:", error)
    return null
  }
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false)
  const { login, setCurrentRole } = useExamStore()
  const router = useRouter()
  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const isDevelopment = process.env.NODE_ENV === "development"

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined") {
      return
    }

    const scriptId = "google-identity-service-script"
    if (window.__examproGoogleInitialized) {
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      try {
        if (window.google && !window.__examproGoogleInitialized) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleLogin,
          })
          window.__examproGoogleInitialized = true
          setIsGoogleEnabled(true)
        }
      } catch (err) {
        console.error("Failed to initialize Google login:", err)
        setIsGoogleEnabled(false)
      }
    }

    script.onerror = () => {
      console.error("Google identity script failed to load")
      setIsGoogleEnabled(false)
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [GOOGLE_CLIENT_ID])

  // Render Google button after DOM is ready
  useEffect(() => {
    if (isGoogleEnabled && window.google && typeof window !== "undefined") {
      const btn = document.getElementById("google-login-btn")
      if (btn && btn.innerHTML === "") {
        window.google.accounts.id.renderButton(btn, {
          theme: "filled_blue",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "signin_with",
          logo_alignment: "left",
          width: 320,
        })
      }
    }
  }, [isGoogleEnabled])

  const handleGoogleLogin = async (response) => {
    setIsLoading(true)
    try {
      const payload = decodeJwt(response.credential)
      if (!payload || !payload.email) {
        toast.error("Google authentication failed to retrieve user email.")
        setIsLoading(false)
        return
      }

      const email = payload.email.toLowerCase()
      const fullName = payload.name
      const avatarUrl = payload.picture
      
      const role = email === "ramupillalamarri66@gmail.com" ? "admin" : "student"
      await login(email, role, fullName, avatarUrl)

      if (role === "admin") {
        await setCurrentRole("teacher")
        toast.success(`Welcome back Teacher!`)
        router.push("/admin")
      } else {
        await setCurrentRole("student")
        toast.success(`Welcome ${fullName}!`)
        router.push("/student")
      }
    } catch (err) {
      console.error(err)
      toast.error("Google Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { icon: BookOpen, text: "Access 500+ practice exams", color: "text-primary" },
    { icon: Shield, text: "Secure testing environment", color: "text-success" },
    { icon: Brain, text: "AI-powered feedback", color: "text-accent" },
    { icon: Trophy, text: "Track your progress", color: "text-warning" },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Animated Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </motion.div>
          </Link>
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-glow-1 flex items-center justify-center shadow-lg shadow-primary/25"
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </motion.div>
            <span className="font-bold text-foreground gradient-text">ExamPro</span>
          </motion.div>
        </div>
      </motion.header>

      {/* Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        <AnimatedBackground variant="vibrant">
          <GlowingDots />
          <FloatingShapes />
          <Sparkles count={25} />
          
          <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 min-h-[calc(100vh-4rem)]">
            {/* Left side - Info */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 max-w-lg text-center lg:text-left hidden lg:block"
            >
              <motion.div variants={fadeInUp}>
                <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                  </motion.span>
                  Welcome Back
                </Badge>
              </motion.div>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance"
              >
                Your journey to{" "}
                <span className="gradient-text animate-text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]">
                  success
                </span>{" "}
                starts here
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-muted-foreground mb-10"
              >
                Access your exams, track your progress, and get AI-powered insights to improve your learning.
              </motion.p>
              
              <motion.div variants={staggerContainer} className="space-y-4">
                {features.map((item) => (
                  <motion.div
                    key={item.text}
                    variants={fadeInUp}
                    whileHover={{ x: 10, scale: 1.02 }}
                    className="flex items-center gap-4 text-muted-foreground group"
                  >
                    <motion.div
                      className="h-12 w-12 rounded-xl bg-card border border-border/50 flex items-center justify-center shrink-0 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all"
                      whileHover={{ rotate: 5 }}
                    >
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </motion.div>
                    <span className="font-medium group-hover:text-foreground transition-colors">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right side - Login Card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="w-full max-w-md"
            >
              <Card className="border-border/50 shadow-2xl shadow-primary/10 bg-card/90 backdrop-blur-xl overflow-hidden relative">
                {/* Animated gradient border */}
                <motion.div
                  className="absolute inset-0 rounded-xl p-px bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]"
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  style={{ WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }}
                />
                
                <CardHeader className="text-center pb-2 relative">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                    className="mx-auto relative"
                  >
                    <motion.div
                      className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30"
                      animate={{ 
                        boxShadow: ["0 20px 40px rgba(var(--primary), 0.2)", "0 30px 60px rgba(var(--primary), 0.4)", "0 20px 40px rgba(var(--primary), 0.2)"]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <GraduationCap className="h-8 w-8 text-white" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-success flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </motion.div>
                  </motion.div>
                  <CardTitle className="text-2xl mt-4 gradient-text">Welcome to ExamPro</CardTitle>
                  <CardDescription>
                    Sign in using your Google account
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative flex flex-col items-center pt-6 space-y-6">
                  {/* Google GSI Sign In Button Container */}
                  <div className="w-full flex justify-center py-4">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                        />
                        <span className="text-sm text-muted-foreground animate-pulse">Logging in...</span>
                      </div>
                    ) : (
                      <div id="google-login-btn"></div>
                    )}
                  </div>

                  <p className="text-center text-xs text-muted-foreground mt-4">
                    By signing in, you agree to our{" "}
                    <Link href="#" className="text-primary hover:underline font-medium">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </Link>
                  </p>
                </CardContent>
              </Card>

              {/* Floating decoration cards */}
              <motion.div
                className="absolute -bottom-4 -left-4 hidden lg:block"
                animate={{ y: [0, -10, 0], rotate: [-5, -3, -5] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-xl p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-xs font-medium">Secure Login</span>
                  </div>
                </Card>
              </motion.div>
              
              <motion.div
                className="absolute -top-4 -right-4 hidden lg:block"
                animate={{ y: [0, -8, 0], rotate: [5, 3, 5] }}
                transition={{ duration: 3.5, repeat: Infinity }}
              >
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-xl p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">AI Powered</span>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedBackground>
      </main>
    </div>
  )
}


