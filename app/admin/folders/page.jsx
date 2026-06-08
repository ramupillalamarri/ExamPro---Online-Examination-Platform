"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminFoldersRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/exams")
  }, [router])

  return null
}
