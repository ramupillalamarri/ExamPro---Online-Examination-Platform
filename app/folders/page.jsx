"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FoldersRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/folders")
  }, [router])

  return null
}
