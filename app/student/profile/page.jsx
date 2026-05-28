"use client"

import React from "react"
import { ProfileForm } from "@/components/profile-form"

export default function StudentProfilePage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen py-6">
      <ProfileForm backUrl="/student" />
    </div>
  )
}
