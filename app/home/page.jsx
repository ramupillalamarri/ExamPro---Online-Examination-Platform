"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"

export default function HomePage() {
  const { isAuthenticated, isHydrated } = useExamStore()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated) {
      if (isAuthenticated) {
        router.replace("/student")
      } else {
        router.replace("/login")
      }
    }
  }, [isHydrated, isAuthenticated, router])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 font-medium text-sm">Redirecting...</p>
      </div>
    </div>
  )
}
