"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"

export default function FoldersRedirect() {
  const router = useRouter()
  const { user, isHydrated } = useExamStore()

  useEffect(() => {
    if (isHydrated) {
      if (user?.role === "student") {
        router.replace("/student/exams")
      } else {
        router.replace("/admin/exams")
      }
    }
  }, [isHydrated, user, router])

  return null
}
