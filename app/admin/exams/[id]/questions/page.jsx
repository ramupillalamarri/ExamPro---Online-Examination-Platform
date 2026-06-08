"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

const defaultOptions = [
  { id: "a", text: "" },
  { id: "b", text: "" },
  { id: "c", text: "" },
  { id: "d", text: "" },
]

export default function QuestionsPage({
  params,  
}) {

  const { id } = use(params)
  const router = useRouter()
  const { exams, getExamQuestions, addQuestion, updateQuestion, deleteQuestion, user, isHydrated, isAuthenticated, fetchData } =
    useExamStore()

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

  const exam = (exams || []).find((e) => e.id === id)
  const questions = getExamQuestions(id)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [formData, setFormData] = useState({
    questionText: "",
    options: defaultOptions.map((o) => ({ ...o })),
    correctOptionId: "a",
    subject: "",
    topic: "",
    marks: 2,
    negativeMarking: 0,
  })

  const resetForm = () => {
    setFormData({
      questionText: "",
      options: defaultOptions.map((o) => ({ ...o, text: "" })),
      correctOptionId: "a",
      subject: "",
      topic: "",
      marks: 2,
      negativeMarking: 0,
    })
    setEditingQuestion(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = ( question) => {
    setEditingQuestion(question)
    setFormData({
      questionText: question.questionText,
      options: question.options.map((o) => ({ ...o })),
      correctOptionId: question.correctOptionId,
      subject: question.subject || "",
      topic: question.topic || "",
      marks: question.marks,
      negativeMarking: question.negativeMarking || 0,
    })
    setIsDialogOpen(true)
  }

  const updateOption = (id, text) => {
    setFormData({
      ...formData,
      options: formData.options.map((o) => (o.id === id ? { ...o, text } : o)),
    })
  }

  const handleSubmit = () => {
    if (!formData.questionText.trim()) {
      toast.error("Please enter a question")
      return
    }

    const hasEmptyOptions = formData.options.some((o) => !o.text.trim())
    if (hasEmptyOptions) {
      toast.error("Please fill in all options")
      return
    }

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, {
        questionText: formData.questionText.trim(),
        options: formData.options,
        correctOptionId: formData.correctOptionId,
        subject: formData.subject.trim() || undefined,
        topic: formData.topic.trim() || undefined,
        marks: formData.marks,
        negativeMarking: formData.negativeMarking,
      })
      toast.success("Question updated successfully")
    } else {
      addQuestion({
        examId: id,
        questionText: formData.questionText.trim(),
        options: formData.options,
        correctOptionId: formData.correctOptionId,
        subject: formData.subject.trim() || undefined,
        topic: formData.topic.trim() || undefined,
        marks: formData.marks,
        negativeMarking: formData.negativeMarking,
        orderIndex: questions.length,
      })
      toast.success("Question added successfully")
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteQuestion(deleteTarget.id)
    setDeleteTarget(null)
    toast.success("Question deleted successfully")
  }

  if (!exam) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Exam not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The exam you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/admin/exams")}>Back to Exams</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/admin/exams")} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
            <p className="text-muted-foreground">
              Manage questions for this exam
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={exam.isPublished ? "default" : "secondary"}
            className={
              exam.isPublished ? "bg-success/10 text-success border-success/20" : ""
            }
          >
            {exam.isPublished ? "Published" : "Draft"}
          </Badge>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No questions yet
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Add your first question to start building this exam.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="group">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex items-center text-muted-foreground">
                    <GripVertical className="h-5 w-5 opacity-0 group-hover:opacity-100 cursor-grab" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Badge variant="secondary">{question.marks} marks</Badge>
                          {question.negativeMarking > 0 && (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                              -{Math.round(question.negativeMarking * 100)}% negative
                            </Badge>
                          )}
                          {question.topic && (
                            <Badge variant="outline" className="text-xs">
                              {question.topic}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-foreground">
                          {question.questionText}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(question)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 mt-4">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 p-2 rounded-md border ${
                            option.id === question.correctOptionId
                              ? "border-success bg-success/5"
                              : "border-border"
                          }`}
                        >
                          <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium uppercase">
                            {option.id}
                          </span>
                          <span className="flex-1 text-sm">{option.text}</span>
                          {option.id === question.correctOptionId && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exam Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {questions.length}
              </p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {questions.reduce((sum, q) => sum + q.marks, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Marks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {exam.durationMinutes}
              </p>
              <p className="text-sm text-muted-foreground">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground truncate max-w-[130px] mx-auto">
                {questions.some((q) => q.negativeMarking > 0)
                  ? "Varies"
                  : exam.negativeMarking > 0
                  ? `${Math.round(exam.negativeMarking * 100)}%`
                  : "None"}
              </p>
              <p className="text-sm text-muted-foreground">Negative Marking</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Update the question details"
                : "Create a new multiple choice question"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                placeholder="Enter your question..."
                value={formData.questionText}
                onChange={(e) =>
                  setFormData({ ...formData, questionText: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label>Options *</Label>
              <RadioGroup
                value={formData.correctOptionId}
                onValueChange={(value) =>
                  setFormData({ ...formData, correctOptionId: value })
                }
              >
                {formData.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium uppercase">
                      {option.id}
                    </span>
                    <Input
                      placeholder={`Option ${option.id.toUpperCase()}`}
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Select the radio button to mark the correct answer
              </p>
            </div>

            {/* Metadata */}
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Algebra"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  min={1}
                  value={formData.marks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      marks: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="negativeMarking">Negative Marks Fraction</Label>
                <Input
                  id="negativeMarking"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  placeholder="e.g., 0.33"
                  value={formData.negativeMarking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      negativeMarking: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingQuestion ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
