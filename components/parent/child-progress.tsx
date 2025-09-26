"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import type { QuizSubmission, Quiz } from "@/lib/types"
import { BarChart3, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface ChildProgressProps {
  childId: string
}

export function ChildProgress({ childId }: ChildProgressProps) {
  const [submissions, setSubmissions] = useState<(QuizSubmission & { quizzes: Quiz })[]>([])
  const [pendingQuizzes, setPendingQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchProgress()
  }, [childId])

  const fetchProgress = async () => {
    try {
      setLoading(true)

      // Fetch completed submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select(`
          *,
          quizzes (
            id,
            title,
            type,
            category,
            deadline
          )
        `)
        .eq("user_id", childId)
        .order("submitted_at", { ascending: false })

      if (submissionsError) throw submissionsError

      // Fetch pending quizzes (simplified - would need proper filtering logic)
      const { data: quizzesData, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false })

      if (quizzesError) throw quizzesError

      setSubmissions(submissionsData || [])
      setPendingQuizzes(quizzesData || [])
    } catch (error) {
      console.error("Error fetching progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAverageScore = () => {
    if (submissions.length === 0) return 0
    const total = submissions.reduce((sum, sub) => sum + (sub.score / sub.total_questions) * 100, 0)
    return Math.round(total / submissions.length)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading progress...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Progress & Grades</h2>
        <p className="text-muted-foreground">View your child's academic performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAverageScore()}%</div>
            <Progress value={calculateAverageScore()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">Assignments completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingQuizzes.length}</div>
            <p className="text-xs text-muted-foreground">Assignments pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Submissions</h3>
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No submissions yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{submission.quizzes.title}</CardTitle>
                    <CardDescription>
                      Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{submission.quizzes.type}</Badge>
                    <Badge variant="outline">{submission.quizzes.category?.toUpperCase()}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {submission.score}/{submission.total_questions}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((submission.score / submission.total_questions) * 100)}% Score
                    </p>
                  </div>
                  <Progress value={(submission.score / submission.total_questions) * 100} className="w-32" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
