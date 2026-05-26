"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CreateExamRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/exams")
  }, [router])

  return null
}
