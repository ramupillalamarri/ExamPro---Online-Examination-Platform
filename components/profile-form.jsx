"use client"

import React, { useState, useEffect } from "react"
import { useExamStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Phone, 
  MapPin, 
  School, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Save, 
  ArrowLeft,
  Mail,
  Clock,
  Briefcase
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ProfileForm({ backUrl }) {
  const { user, updateUserProfile, isHydrated, isAuthenticated } = useExamStore()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
  // Local form state
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    phoneNumber: "",
    address: "",
    college: "",
    major: "",
    graduationYear: "",
    bio: ""
  })

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !isAuthenticated || !user) {
    return null
  }

  // Sync state with user data from store
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        age: user.age || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        college: user.college || "",
        major: user.major || "",
        graduationYear: user.graduationYear || "",
        bio: user.bio || ""
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      await updateUserProfile({
        fullName: formData.fullName,
        age: formData.age ? parseInt(formData.age) : null,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        college: formData.college,
        major: formData.major,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        bio: formData.bio
      })
      toast.success("Profile details saved successfully!")
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Failed to save profile details.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header bar */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200/60">
        <Button 
          onClick={() => router.push(backUrl)} 
          variant="ghost" 
          size="icon" 
          className="bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profile Details</h1>
          <p className="text-muted-foreground text-sm mt-1">View and update your academic and personal information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Panel: Profile Overview Summary */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-border/50 bg-white shadow-sm overflow-hidden relative">
              <div className="h-2 bg-gradient-to-r from-primary to-accent" />
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-3xl font-black text-primary border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-md">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>
                
                <h3 className="font-extrabold text-lg text-slate-800 mt-4 leading-tight">
                  {formData.fullName || user?.fullName || "User Profile"}
                </h3>
                <Badge variant="secondary" className="mt-2 bg-slate-100 text-slate-700 hover:bg-slate-100 font-extrabold capitalize border border-slate-200">
                  {user?.role === "admin" ? "Teacher Mode" : "Student Mode"}
                </Badge>
                
                <div className="w-full border-t border-slate-100 my-5 pt-4 space-y-3 text-left">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{user?.email || "No email available"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "recent"}</span>
                  </div>
                  {formData.college && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold">
                      <School className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{formData.college}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Form Fields */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/50 bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2 font-extrabold text-slate-800">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-xs">Provide details about yourself. All fields are completely optional.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-bold text-slate-600">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="e.g. John Doe"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-xs font-bold text-slate-600">Age</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        min="1"
                        max="120"
                        placeholder="e.g. 21"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-600">Email Address (Linked Account)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="pl-9 h-10 text-sm bg-slate-100 border-slate-200 text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs font-bold text-slate-600">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="e.g. +1 (555) 000-0000"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold text-slate-600">Residential Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="e.g. 123 University Ave, Suite 100, California"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="pl-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2 font-extrabold text-slate-800">
                  <School className="h-4 w-4 text-primary" />
                  Academic Profile
                </CardTitle>
                <CardDescription className="text-xs">Specify your educational background and qualifications.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="college" className="text-xs font-bold text-slate-600">College / School</Label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="college"
                        name="college"
                        placeholder="e.g. MIT"
                        value={formData.college}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="major" className="text-xs font-bold text-slate-600">Major / Field</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="major"
                        name="major"
                        placeholder="e.g. Computer Science"
                        value={formData.major}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="graduationYear" className="text-xs font-bold text-slate-600">Graduation Year</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="graduationYear"
                        name="graduationYear"
                        type="number"
                        min="1900"
                        max="2100"
                        placeholder="e.g. 2027"
                        value={formData.graduationYear}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-bold text-slate-600">Short Bio / Description</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="e.g. Passionate about learning algorithms and preparing for my engineering exams."
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="pl-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(backUrl)} 
                className="h-10 px-5 font-bold text-xs shadow-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="h-10 px-6 font-bold text-xs bg-primary hover:bg-primary/95 text-white shadow-md flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                    Saving Details...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Details
                  </>
                )}
              </Button>
            </div>
          </div>
          
        </div>
      </form>
    </div>
  )
}
