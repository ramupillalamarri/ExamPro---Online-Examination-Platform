"use client"

import { useState } from "react"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function CodeEntry() {
  const { enterUserCode } = useExamStore()
  const [codeInput, setCodeInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEnterCode = async () => {
    if (!codeInput.trim() || codeInput.length !== 6) {
      toast.error("Please enter a valid 6-digit code")
      return
    }

    setIsLoading(true)
    try {
      const result = await enterUserCode(codeInput)
      if (result.success) {
        toast.success(result.message)
        setCodeInput("")
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 py-4 space-y-3 border-t border-sidebar-border">
      {/* Join Code Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-sidebar-foreground/70 uppercase">Enter Teacher Code</p>
        <p className="text-[10px] text-sidebar-foreground/60 mb-2">Enter a 6-digit code to access a teacher's exams</p>
        <div className="flex gap-1.5">
          <Input
            type="text"
            placeholder="000000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && handleEnterCode()}
            maxLength="6"
            className="h-9 text-sm bg-sidebar-accent/50 border-sidebar-border focus-visible:ring-sidebar-primary/50 text-sidebar-foreground font-mono font-bold"
          />
          <Button
            size="sm"
            className="h-9 px-3"
            onClick={handleEnterCode}
            disabled={isLoading || codeInput.length !== 6}
          >
            {isLoading ? "..." : "Join"}
          </Button>
        </div>
      </div>
    </div>
  )
}
