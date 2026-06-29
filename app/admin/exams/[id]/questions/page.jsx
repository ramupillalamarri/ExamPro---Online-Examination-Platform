"use client"

import { useState, useEffect, use, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const defaultOptions = [
  { id: "a", text: "" },
  { id: "b", text: "" },
  { id: "c", text: "" },
  { id: "d", text: "" },
]

const renderRichText = (text) => {
  if (!text) return null;
  
  const regex = /!\[.*?\]\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const imageUrl = match[1];
    
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, matchIndex)
      });
    }
    
    parts.push({
      type: 'image',
      content: imageUrl
    });
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return (
    <div className="space-y-2 mt-2">
      {parts.map((part, idx) => {
        if (part.type === 'image') {
          return (
            <div key={idx} className="my-2 max-w-full rounded-lg overflow-hidden border border-border bg-muted/10 p-1 flex items-center justify-center">
              <img
                key={part.content}
                src={part.content}
                alt="Embedded Visual"
                className="max-h-[200px] w-auto object-contain rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          );
        } else {
          return (
            <p key={idx} className="text-sm font-medium text-foreground whitespace-pre-wrap">
              {part.content}
            </p>
          );
        }
      })}
    </div>
  );
};

const markdownToHtml = (markdown) => {
  if (!markdown) return "";
  const imgRegex = /!\[.*?\]\((.*?)\)/g;
  let html = markdown.replace(imgRegex, (match, url) => {
    return `<img src="${url}" class="max-h-[200px] w-auto my-2 rounded-lg object-contain border border-border bg-muted/10 inline-block align-middle" alt="Embedded Image" />`;
  });
  html = html.replace(/\n/g, "<br>");
  return html;
};

const htmlToMarkdown = (html) => {
  if (!html) return "";
  
  // Replace <img> tags with ![image](src)
  const imgRegex = /<img\s+[^>]*src="([^"]*)"[^>]*>/gi;
  let markdown = html.replace(imgRegex, (match, src) => {
    return `![image](${src})`;
  });
  
  // Replace block element tags with newlines
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
  markdown = markdown.replace(/<\/p><p>/gi, "\n");
  markdown = markdown.replace(/<\/div><div>/gi, "\n");
  markdown = markdown.replace(/<div>/gi, "\n");
  markdown = markdown.replace(/<\/div>/gi, "");
  markdown = markdown.replace(/<p>/gi, "");
  markdown = markdown.replace(/<\/p>/gi, "");
  
  // Strip all other HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "");
  
  // Decode HTML entities
  if (typeof window !== "undefined") {
    const doc = new DOMParser().parseFromString(markdown, 'text/html');
    markdown = doc.documentElement.textContent || markdown;
  }
  
  return markdown;
};

const RichEditor = ({ initialValue, onChange, placeholder, className, dialogKey }) => {
  const editorRef = useRef(null);

  // Re-initialize editor contents only on dialog mount/reset
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialValue || "";
    }
  }, [dialogKey]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target.result;
            const imgHtml = `<img src="${base64Data}" class="max-h-[200px] w-auto my-2 rounded-lg object-contain border border-border bg-muted/10 inline-block align-middle" alt="Embedded Image" />`;
            
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
              const range = sel.getRangeAt(0);
              range.deleteContents();
              
              const el = document.createElement("div");
              el.innerHTML = imgHtml;
              const frag = document.createDocumentFragment();
              let node, lastNode;
              while ((node = el.firstChild)) {
                lastNode = frag.appendChild(node);
              }
              range.insertNode(frag);
              
              if (lastNode) {
                const newRange = range.cloneRange();
                newRange.setStartAfter(lastNode);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
              }
            }
            
            if (editorRef.current) {
              onChange(editorRef.current.innerHTML);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  return (
    <div className="relative w-full">
      <style>{`
        .rich-editor-box:empty::before {
          content: attr(placeholder);
          color: #a1a1aa;
          pointer-events: none;
          position: absolute;
        }
      `}</style>
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onPaste={handlePaste}
        className={`${className} rich-editor-box`}
        placeholder={placeholder}
        style={{ outline: 'none' }}
      />
    </div>
  );
};

export default function QuestionsPage({
  params,  
}) {

  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const folderId = searchParams.get("folderId")
  const { exams, getExamQuestions, addQuestion, updateQuestion, deleteQuestion, user, isHydrated, isAuthenticated, fetchData } =
    useExamStore()
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "student") {
        router.push("/student")
      } else {
        setIsQuestionsLoading(true)
        fetchData(id).finally(() => {
          if (isMounted) {
            setIsQuestionsLoading(false)
          }
        })
      }
    }

    return () => {
      isMounted = false
    }
  }, [isHydrated, isAuthenticated, user, router, fetchData, id])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  const exam = (exams || []).find((e) => e.id === id)
  const questions = getExamQuestions(id)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [dialogKey, setDialogKey] = useState(0)

  const [formData, setFormData] = useState({
    questionText: "",
    questionImage: "",
    questionType: "mcq",
    options: defaultOptions.map((o) => ({ ...o, text: "", imageUrl: "" })),
    correctOptionId: "a",
    subject: "",
    topic: "",
    marks: 2,
    negativeMarking: 0,
  })

  const resetForm = () => {
    setFormData({
      questionText: "",
      questionImage: "",
      questionType: "mcq",
      options: defaultOptions.map((o) => ({ ...o, text: "", imageUrl: "" })),
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
    setDialogKey((prev) => prev + 1)
    setIsDialogOpen(true)
  }

  const openEditDialog = (question) => {
    setEditingQuestion(question)
    setDialogKey((prev) => prev + 1)
    
    // Unify question separate image into questionText for backward compatibility
    let rawQuestionText = question.questionText || ""
    if (question.questionImage) {
      if (!rawQuestionText.includes(question.questionImage)) {
        rawQuestionText += `\n![image](${question.questionImage})`
      }
    }
    
    // Unify option separate image into option text for backward compatibility
    const cleanOptions = (question.options || defaultOptions).map((o) => {
      let rawText = o.text || ""
      if (o.imageUrl) {
        if (!rawText.includes(o.imageUrl)) {
          rawText += `\n![image](${o.imageUrl})`
        }
      }
      return {
        id: o.id,
        text: rawText,
        imageUrl: ""
      }
    })
    
    setFormData({
      questionText: rawQuestionText,
      questionImage: "",
      questionType: question.questionType || "mcq",
      options: cleanOptions,
      correctOptionId: question.correctOptionId,
      subject: question.subject || "",
      topic: question.topic || "",
      marks: question.marks,
      negativeMarking: question.negativeMarking || 0,
    })
    setIsDialogOpen(true)
  }

  const updateOptionText = (optionId, text) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
    }))
  }

  const updateOptionImage = (optionId, imageUrl) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === optionId ? { ...o, imageUrl } : o)),
    }))
  }

  const toggleMsqCorrect = (optionId, checked) => {
    setFormData((prev) => {
      const currentCorrects = (prev.correctOptionId || '').split(',').filter(Boolean)
      let newCorrects
      if (checked) {
        if (!currentCorrects.includes(optionId)) {
          newCorrects = [...currentCorrects, optionId]
        } else {
          newCorrects = currentCorrects
        }
      } else {
        newCorrects = currentCorrects.filter(id => id !== optionId)
      }
      return { ...prev, correctOptionId: newCorrects.join(',') }
    })
  }



  const handleSubmit = () => {
    const finalQuestionText = formData.questionText.trim()

    if (!finalQuestionText) {
      toast.error("Please enter a question description or paste an image")
      return
    }

    let finalOptions = []
    let finalCorrectOptionId = "none"

    if (formData.questionType !== "text") {
      const parsedOptions = formData.options.map(o => ({
        id: o.id,
        text: o.text.trim(),
        imageUrl: null
      }))

      const hasEmptyOptions = parsedOptions.some((o) => !o.text)
      if (hasEmptyOptions) {
        toast.error("Please fill in all options (each option must have text or an image)")
        return
      }
      
      const corrects = (formData.correctOptionId || '').split(',').filter(Boolean)
      if (corrects.length === 0 || formData.correctOptionId === "none") {
        toast.error("Please select at least one correct answer")
        return
      }
      
      finalOptions = parsedOptions
      finalCorrectOptionId = formData.correctOptionId
    }

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, {
        questionText: finalQuestionText,
        questionImage: null,
        questionType: formData.questionType,
        options: finalOptions,
        correctOptionId: finalCorrectOptionId,
        subject: formData.subject.trim() || undefined,
        topic: formData.topic.trim() || undefined,
        marks: formData.marks,
        negativeMarking: formData.negativeMarking,
      })
      toast.success("Question updated successfully")
    } else {
      addQuestion({
        examId: id,
        questionText: finalQuestionText,
        questionImage: null,
        questionType: formData.questionType,
        options: finalOptions,
        correctOptionId: finalCorrectOptionId,
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

  if (isQuestionsLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Loading questions...
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Fetching question data for this exam. Please wait while we load the latest exam questions from the database.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
            <Button onClick={() => router.push(folderId ? `/admin/exams?folderId=${folderId}` : "/admin/exams")}>Back to Exams</Button>
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
          <Button onClick={() => router.push(folderId ? `/admin/exams?folderId=${folderId}` : "/admin/exams")} variant="ghost" size="icon">
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
      {isQuestionsLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Loading questions...
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Loading the question list for this exam. This may take a moment.
            </p>
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
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
                          <Badge variant="secondary" className="capitalize text-xs">
                            {question.questionType === "msq" 
                              ? "Multiple Select (MSQ)" 
                              : question.questionType === "text" 
                              ? "Descriptive" 
                              : "Multiple Choice (MCQ)"}
                          </Badge>
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
                        {renderRichText(question.questionText)}
                        {question.questionImage && !question.questionText?.includes(question.questionImage) && (
                          <div className="mt-2 mb-3">
                            <img 
                              key={question.questionImage}
                              src={question.questionImage} 
                              alt="Question Illustration" 
                              className="max-h-40 w-auto rounded-lg object-contain border border-border/60 bg-muted/10"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
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
                    
                    {question.questionType !== "text" && question.options && (
                      <div className="grid sm:grid-cols-2 gap-2 mt-4">
                        {question.options.map((option) => {
                          const isCorrect = (question.correctOptionId || '').split(',').includes(option.id);
                          return (
                            <div
                              key={option.id}
                              className={`flex flex-col gap-2 p-2 rounded-md border ${
                                isCorrect
                                  ? "border-success bg-success/5 shadow-sm"
                                  : "border-border"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium uppercase">
                                  {option.id}
                                </span>
                                <div className="flex-1 text-sm">{renderRichText(option.text)}</div>
                                {isCorrect && (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                )}
                              </div>
                              {option.imageUrl && (
                                <div className="pl-8">
                                  <img 
                                    key={option.imageUrl}
                                    src={option.imageUrl} 
                                    alt={`Option ${option.id}`} 
                                    className="max-h-16 w-auto rounded object-contain border border-border/40"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {question.questionType === "text" && (
                      <div className="mt-3 p-3 rounded-xl border border-dashed border-border bg-muted/5 text-xs text-muted-foreground font-semibold flex items-center gap-2">
                        <span>📝 Descriptive / Essay Question: Students will type a free-text response.</span>
                      </div>
                    )}
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
            {/* Question Type */}
            <div className="space-y-2">
              <Label htmlFor="question-type">Question Type</Label>
              <Select
                value={formData.questionType || "mcq"}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    questionType: value,
                    correctOptionId: value === "text" ? "none" : formData.correctOptionId === "none" ? "a" : formData.correctOptionId
                  })
                }
              >
                <SelectTrigger id="question-type" className="rounded-xl">
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="mcq">Multiple Choice (MCQ - Single Answer)</SelectItem>
                  <SelectItem value="msq">Multiple Selection (MSQ - Multiple Answers)</SelectItem>
                  <SelectItem value="text">Descriptive / Essay (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question">Question Text {formData.questionType === "text" ? "*" : "(Optional if Image is provided)"}</Label>
              <RichEditor
                dialogKey={`${dialogKey}-question`}
                initialValue={markdownToHtml(formData.questionText)}
                onChange={(html) => setFormData(prev => ({ ...prev, questionText: htmlToMarkdown(html) }))}
                placeholder="Enter your question text or description... (To insert an image, copy it and press Ctrl+V directly inside this box)"
                className="w-full min-h-[120px] p-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-y-auto max-h-[300px]"
              />
            </div>

            {/* Options */}
            {formData.questionType !== "text" && (
              <div className="space-y-3">
                <Label>Options & Answers *</Label>
                <div className="space-y-3">
                  {formData.options.map((option) => {
                    const isCorrect = (formData.correctOptionId || '').split(',').includes(option.id);
                    return (
                      <div
                        key={option.id}
                        className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-card/40 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          {formData.questionType === "msq" ? (
                            <Checkbox
                              id={`correct-${option.id}`}
                              checked={isCorrect}
                              onCheckedChange={(checked) => toggleMsqCorrect(option.id, !!checked)}
                              className="data-[state=checked]:bg-success data-[state=checked]:border-success rounded-md"
                            />
                          ) : (
                            <RadioGroup
                              value={formData.correctOptionId}
                              onValueChange={(value) =>
                                setFormData({ ...formData, correctOptionId: value })
                              }
                              className="flex items-center"
                            >
                              <RadioGroupItem value={option.id} id={`correct-${option.id}`} />
                            </RadioGroup>
                          )}
                          <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold uppercase shrink-0">
                            {option.id}
                          </span>
                          <RichEditor
                            dialogKey={`${dialogKey}-option-${option.id}`}
                            initialValue={markdownToHtml(option.text)}
                            onChange={(html) => {
                              const mdText = htmlToMarkdown(html);
                              setFormData(prev => ({
                                ...prev,
                                options: prev.options.map(o => o.id === option.id ? { ...o, text: mdText } : o)
                              }));
                            }}
                            placeholder={`Option ${option.id.toUpperCase()} text... (Ctrl+V to paste image)`}
                            className="flex-1 w-full min-h-[60px] p-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-y-auto max-h-[150px]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  {formData.questionType === "msq"
                    ? "Select one or more checkboxes to mark the correct answers"
                    : "Select the radio button to mark the single correct answer"}
                </p>
              </div>
            )}

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
