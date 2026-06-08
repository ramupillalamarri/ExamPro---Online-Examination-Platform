"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, isHydrated } = useExamStore()

  useEffect(() => {
    if (isHydrated) {
      if (user?.role === "student") {
        router.replace("/student")
      } else {
        router.replace("/admin")
      }
    }
  }, [isHydrated, user, router])

  return null
}
