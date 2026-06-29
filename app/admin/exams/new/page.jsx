"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function NewExamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const folderIdParam = searchParams.get("folderId")
  const { addExam, user, isHydrated, isAuthenticated, fetchData } = useExamStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student")
      } else {
        fetchData()
      }
    }
  }, [isHydrated, isAuthenticated, user, router, fetchData])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    folderId: "",
    negativeMarking: 0,
    maxAttempts: 1,
    isPublished: false,
  })

  useEffect(() => {
    if (folderIdParam) {
      setFormData(prev => ({ ...prev, folderId: folderIdParam }))
    }
  }, [folderIdParam])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Please enter an exam title")
      return
    }

    if (formData.durationMinutes < 1) {
      toast.error("Duration must be at least 1 minute")
      return
    }

    setIsSubmitting(true)

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const exam = addExam({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      durationMinutes: formData.durationMinutes,
      folderId: formData.folderId && formData.folderId !== "none" ? formData.folderId : null,
      negativeMarking: formData.negativeMarking,
      maxAttempts: formData.maxAttempts,
      isPublished: formData.isPublished,
    })

    toast.success("Exam created successfully")
    router.push(`/admin/exams/${exam.id}/questions`)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push("/admin/exams")} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Exam</h1>
          <p className="text-muted-foreground">
            Set up your exam details and settings
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Basic information about your examination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Algebra Fundamentals"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this exam covers..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>



            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={300}
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMinutes: parseInt(e.target.value) || 60,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                How long students have to complete the exam
              </p>
            </div>

            {/* Max Attempts */}
            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Maximum Attempts *</Label>
              <Input
                id="maxAttempts"
                type="number"
                min={1}
                max={100}
                value={formData.maxAttempts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxAttempts: parseInt(e.target.value) || 1,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                How many times students are allowed to attempt this exam
              </p>
            </div>

            {/* Negative Marking */}
            <div className="space-y-2">
              <Label htmlFor="negative">Negative Marking</Label>
              <Select
                value={formData.negativeMarking.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    negativeMarking: parseFloat(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No negative marking</SelectItem>
                  <SelectItem value="0.25">25% of marks</SelectItem>
                  <SelectItem value="0.33">33% of marks</SelectItem>
                  <SelectItem value="0.5">50% of marks</SelectItem>
                  <SelectItem value="1">100% of marks</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Deduct marks for wrong answers
              </p>
            </div>

            {/* Publish */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="publish" className="text-base">
                  Publish Immediately
                </Label>
                <p className="text-sm text-muted-foreground">
                  Make this exam available to students right away
                </p>
              </div>
              <Switch
                id="publish"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublished: checked })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button onClick={() => router.push("/admin/exams")} type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Exam"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}


