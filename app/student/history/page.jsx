"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StudentHistoryRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/attempts")
  }, [router])

  return null
}
