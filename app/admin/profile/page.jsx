"use client"

import React, { useEffect } from "react"
import { ProfileForm } from "@/components/profile-form"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"

export default function TeacherProfilePage() {
  const router = useRouter()
  const { isHydrated, isAuthenticated, user } = useExamStore()

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student")
      }
    }
  }, [isHydrated, isAuthenticated, user, router])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen py-6">
      <ProfileForm backUrl="/admin" />
    </div>
  )
}
