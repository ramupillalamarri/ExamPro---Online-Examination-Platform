"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useExamStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CodeEntry } from "@/components/code-entry"
import { MyExams } from "@/components/my-exams"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  GraduationCap,
  LayoutDashboard,
  FolderOpen,
  FileText,
  History,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Crown,
  Zap,
  Settings,
  Bell,
  Search,
  Check,
  Users,
  Home,
  User,
  HelpCircle
} from "lucide-react"


export function DashboardLayout({ children }) {
  const { isHydrated, isAuthenticated, user, logout, currentRole, setCurrentRole } = useExamStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState("")
  const [isLargeScreen, setIsLargeScreen] = useState(true)

  // Handle responsive sidebar - MUST be defined before early returns
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Handle Command+K for search
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Check auth and role access after all hooks
  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else {
        // Enforce role-based path restrictions
        if (pathname.startsWith("/admin") && user?.role === "student") {
          router.push("/student")
        } else if ((pathname.startsWith("/student") || pathname.startsWith("/attempts")) && (user?.role === "teacher" || user?.role === "admin")) {
          router.push("/admin")
        }
      }
    }
  }, [isHydrated, isAuthenticated, user, pathname, router])

  // Return early only AFTER all hooks are defined
  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSwitchRole = () => {
    const nextRole = inferredRole === "student" ? "teacher" : "student"
    setCurrentRole(nextRole)
    if (nextRole === "student") {
      router.push("/student")
    } else {
      router.push("/admin")
    }
  }

  // Infer role from pathname with currentRole as fallback
  const inferredRole = 
    (pathname.startsWith("/admin") ? "teacher" : 
     pathname.startsWith("/student") || pathname.startsWith("/exams") || pathname.startsWith("/attempts") || pathname.startsWith("/dashboard")
     ? "student" : 
     currentRole)

  // Role-based navigation
  const studentNavItems = [
    { href: "/student", label: "Home", icon: Home },
    { href: "/student/exams", label: "Available Exams", icon: BookOpen },
    { href: "/student/folders", label: "Folders", icon: FolderOpen },
    { href: "/attempts", label: "My Attempts", icon: History },
    { href: "/student/usermanual", label: "User Manual", icon: HelpCircle },
  ]

  const teacherNavItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/exams", label: "My Exams", icon: FileText },
    { href: "/admin/folders", label: "Folders", icon: FolderOpen },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/usermanual", label: "User Manual", icon: HelpCircle },
  ]

  const navItems = inferredRole === "student" ? studentNavItems : teacherNavItems

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Mobile Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="lg:hidden sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 shrink-0"
      >
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-primary/10"
          >
            <AnimatePresence mode="wait">
              {sidebarOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
        
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-glow-1 flex items-center justify-center shadow-lg shadow-primary/30"
            animate={{ rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <GraduationCap className="h-5 w-5 text-white" />
          </motion.div>
          <span className="font-bold gradient-text">ExamPro</span>
        </motion.div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
          </Button>
        </div>
      </motion.header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)] lg:h-screen">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : isLargeScreen ? 0 : -280,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-sidebar border-r border-sidebar-border lg:translate-x-0",
            !isLargeScreen && "top-16"
          )}
        >
          <div className="flex flex-col h-full relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-0 right-0 w-64 h-64 bg-sidebar-primary/10 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-48 h-48 bg-glow-2/10 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </div>

            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border relative">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-glow-1 flex items-center justify-center shadow-lg shadow-sidebar-primary/30"
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <span className="font-bold text-lg text-sidebar-foreground">
                  ExamPro
                </span>
                <Badge variant="outline" className="ml-2 text-[10px] border-sidebar-primary/30 text-sidebar-primary">
                  Beta
                </Badge>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-sidebar-border relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/60" />
                <input
                  type="text"
                  placeholder="Search sections..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-sidebar-accent/50 text-sidebar-foreground text-sm rounded-xl py-2 pl-9 pr-3 outline-none focus:bg-sidebar-accent transition-colors placeholder:text-sidebar-foreground/60 border-none"
                />
              </div>
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              flex: 1,
              minHeight: '200px',
              flexDirection: 'column',
              padding: '12px 8px',
              position: 'relative',
              overflowY: 'auto',
            }}>
              <nav style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                paddingRight: '12px',
              }}>
                {
                navItems.filter(item => item.label.toLowerCase().includes(sidebarSearch.toLowerCase())).map((item, index) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && item.href !== "/student" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="w-full block"
                      style={{ display: 'block' }}
                    >
                    <div
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: isActive ? '14px' : '12px',
                        fontWeight: '500',
                        height: '36px',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                        border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : 'none',
                        transition: 'all 200ms ease',
                      }}
                      className="group hover:bg-sidebar-accent/50"
                    >
                    <div
                      style={{
                        height: '24px',
                        width: '24px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 10,
                        backgroundColor: isActive ? 'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(249, 115, 22))' : 'rgba(255,255,255,0.1)',
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                    <item.icon style={{ height: '14px', width: '14px' }} />
                    </div>
                    <span style={{ 
                      flex: 1, 
                      textAlign: 'left',
                      zIndex: 10,
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div style={{ marginLeft: '4px', flexShrink: 0, zIndex: 10 }}>
                        <ChevronRight style={{ height: '14px', width: '14px', color: 'rgb(59, 130, 246)' }} />
                      </div>
                    )}

                        </div>
                      </Link>
                  )
                })
                }
              </nav>
            </div>

            {/* Code Entry Section - only show for student role */}
            {inferredRole === "student" && <CodeEntry />}

            {/* User Menu */}
            <div className="p-4 border-t border-sidebar-border relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 px-3 py-3 h-auto text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="relative"
                      >
                        <Avatar className="h-10 w-10 border-2 border-sidebar-primary/30 shadow-lg shadow-sidebar-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-glow-1 text-white font-semibold">
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <motion.span
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-sidebar"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-semibold truncate max-w-[140px]">
                          {user?.fullName || 'User'}
                        </span>
                        <span className="text-xs text-sidebar-foreground/60 capitalize flex items-center gap-1">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            inferredRole === "teacher" ? "bg-warning" : "bg-success"
                          )} />
                          {inferredRole ? inferredRole.charAt(0).toUpperCase() + inferredRole.slice(1) : 'Student'}
                        </span>
                      </div>
                      <Settings className="h-4 w-4 ml-auto text-sidebar-foreground/40" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-muted-foreground">
                    {user?.email || 'N/A'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs text-muted-foreground capitalize">
                    Current Role: {inferredRole ? inferredRole.charAt(0).toUpperCase() + inferredRole.slice(1) : 'Not selected'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(inferredRole === "teacher" ? "/admin/profile" : "/student/profile")} className="text-foreground focus:text-foreground cursor-pointer font-medium">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSwitchRole} className="text-primary focus:text-primary">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Switch Role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.aside>

        {/* Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl"
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 12, repeat: Infinity }}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 border-border/50 bg-card/95 backdrop-blur-xl gap-0">
          <div className="flex items-center px-4 py-3 border-b border-border/50">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm" 
              placeholder="Search exams, folders, students..."
            />
            <Badge variant="outline" className="text-[10px] ml-2 font-mono">ESC</Badge>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Links</p>
            <div className="space-y-1">
              {navItems.map((item) => (
                <div 
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm"
                  onClick={() => {
                    router.push(item.href)
                    setSearchOpen(false)
                  }}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Search by title, subject, or student email</span>
              <Sparkles className="h-3 w-3 text-primary opacity-50" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}



