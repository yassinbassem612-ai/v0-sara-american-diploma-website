"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"
import { StudentQRCode } from "@/components/student/student-qr-code"

interface QuizResult {
  quiz_id: string
  quiz_title: string
  quiz_type: string
  score: number
  total_questions: number
  submitted_at: string
}

interface PendingQuiz {
  id: string
  title: string
  type: string
}

export function StudentOverview() {
  const { user } = useAuth()
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [pendingQuizzes, setPendingQuizzes] = useState<PendingQuiz[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStudentData()
    }
  }, [user])

  const fetchStudentData = async () => {
    if (!user) return

    try {
      // Fetch completed quiz results
      const { data: submissions, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select(`
          quiz_id,
          score,
          total_questions,
          submitted_at,
          quizzes!inner(title, type)
        `)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })

      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError)
      } else {
        const formattedResults =
          submissions?.map((item: any) => ({
            quiz_id: item.quiz_id,
            quiz_title: item.quizzes.title,
            quiz_type: item.quizzes.type,
            score: item.score,
            total_questions: item.total_questions,
            submitted_at: item.submitted_at,
          })) || []
        setQuizResults(formattedResults)
      }

      const { data: allQuizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("id, title, type")
        .eq("category", user.category)
        .eq("level", user.level || "basics")

      if (quizzesError) {
        console.error("Error fetching quizzes:", quizzesError)
      } else {
        const completedQuizIds = submissions?.map((s: any) => s.quiz_id) || []
        const pending = allQuizzes?.filter((quiz) => !completedQuizIds.includes(quiz.id)) || []
        setPendingQuizzes(pending)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getAverageScore = () => {
    if (quizResults.length === 0) return 0
    const totalPercentage = quizResults.reduce((sum, result) => {
      return sum + (result.score / result.total_questions) * 100
    }, 0)
    return Math.round(totalPercentage / quizResults.length)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {user?.username}!</h2>
        <p className="text-muted-foreground">Here's your academic progress overview.</p>
      </div>

      {/* Pending Assignments Alert */}
      {pendingQuizzes.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You have {pendingQuizzes.length} pending assignment{pendingQuizzes.length > 1 ? "s" : ""} to complete. Check
            the "Quizzes & Homework" tab to get started!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* QR Code Card - Spans 2 columns on large screens */}
        <div className="lg:col-span-1 lg:row-span-3">
          <StudentQRCode />
        </div>

        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizResults.length}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingQuizzes.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageScore()}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          {quizResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No quiz results yet. Start taking quizzes!</p>
          ) : (
            <div className="space-y-4">
              {quizResults.slice(0, 5).map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{result.quiz_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed: {new Date(result.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="capitalize">
                      {result.quiz_type}
                    </Badge>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(result.score, result.total_questions)}`}>
                        {result.score}/{result.total_questions}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((result.score / result.total_questions) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Assignments */}
      {pendingQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                  <div>
                    <p className="font-medium text-foreground">{quiz.title}</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {quiz.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
