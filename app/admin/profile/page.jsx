"use client"

import React, { useEffect } from "react"
import { ProfileForm } from "@/components/profile-form"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"

export default function TeacherProfilePage() {
  const router = useRouter()
  const { isHydrated, isAuthenticated, user, currentRole } = useExamStore()

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (currentRole === "student") {
        router.push("/student")
      }
    }
  }, [isHydrated, isAuthenticated, currentRole, router])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen py-6">
      <ProfileForm backUrl="/admin" />
    </div>
  )
}
