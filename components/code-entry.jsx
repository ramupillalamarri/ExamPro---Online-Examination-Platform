"use client"

import { useState } from "react"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function CodeEntry() {
  const { user, currentUserCode, accessedUsers, enterUserCode, setCurrentUserCode } = useExamStore()
  const [codeInput, setCodeInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleCopyCode = () => {
    if (user?.userCode) {
      navigator.clipboard.writeText(user.userCode)
      setCopied(true)
      toast.success("Code copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="px-4 py-4 space-y-3 border-t border-sidebar-border">
      {/* Your Code Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-sidebar-foreground/70 uppercase">Your Code</p>
        <div className="flex items-center gap-2 bg-sidebar-accent/30 rounded-lg px-3 py-2 border border-sidebar-border">
          <span className="text-lg font-bold text-sidebar-primary">{user?.userCode || "........."}</span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 w-7 p-0"
            onClick={handleCopyCode}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-sidebar-foreground/60">Share this code with others to let them access your exams</p>
      </div>

      {/* Enter Code Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-sidebar-foreground/70 uppercase">Join Others</p>
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

      {/* Accessed Users */}
      {accessedUsers && accessedUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-sidebar-foreground/70 uppercase">Accessing</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {accessedUsers.map((accessed) => (
              <div
                key={accessed.id}
                className="text-[11px] p-2 rounded bg-sidebar-accent/20 border border-sidebar-border/50 cursor-pointer hover:bg-sidebar-accent/40 transition-colors"
                onClick={() => setCurrentUserCode(accessed.userCode)}
              >
                <p className="font-medium text-sidebar-foreground truncate">{accessed.fullName}</p>
                <p className="text-sidebar-foreground/60">{accessed.userCode}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
