"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"

export default function StudentsRedirect() {
  const router = useRouter()
  const { user, isHydrated, currentRole } = useExamStore()

  useEffect(() => {
    if (isHydrated) {
      if (currentRole === "student") {
        router.replace("/student")
      } else {
        router.replace("/admin/students")
      }
    }
  }, [isHydrated, currentRole, router])

  return null
}
