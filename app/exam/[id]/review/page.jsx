"use client"

import React, { use } from "react"
import ReviewClient from "./review.client"

export default function Page({ params }) {
  const { id } = use(params)
  return <ReviewClient examId={id} />
}
