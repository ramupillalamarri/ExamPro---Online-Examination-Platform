"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GraduationCap, ArrowLeft, ChevronRight } from "lucide-react"
import { UserManual } from "@/components/user-manual"

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
        className="sticky top-0 z-50 h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-12 shadow-sm"
      >
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl h-9 w-9">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shrink-0">
              <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <span className="font-extrabold text-sm md:text-lg text-slate-800 tracking-tight truncate max-w-[130px] sm:max-w-none">
              ExamPro Manual
            </span>
          </div>
        </div>
        <Link href="/login">
          <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-md px-3 py-1.5 h-8 md:h-9">
            Get Started
            <ChevronRight className="h-3.5 w-3.5 ml-0.5 md:ml-1" />
          </Button>
        </Link>
      </motion.header>

      <UserManual />
    </div>
  )
}

