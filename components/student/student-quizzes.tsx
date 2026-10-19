"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"
import { QuizTaker } from "@/components/student/quiz-taker"
import { QuizResultsViewer } from "@/components/student/quiz-results-viewer"

interface QuizData {
  id: string
  title: string
  cleanTitle: string
  note?: string | null
  type: string
  created_at: string
  deadline?: string
  isCompleted: boolean
  score?: number
  totalQuestions?: number
  submittedAt?: string
  questionCount?: number
}

export function StudentQuizzes() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<QuizData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [viewingResults, setViewingResults] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (user) {
      checkUserStatus()
      fetchQuizzes()
    }
  }, [user])

  const checkUserStatus = async () => {
    if (!user) return

    const { data, error } = await supabase.from("users").select("is_active").eq("id", user.id).single()

    if (error) {
      console.error("Error checking user status:", error)
      return
    }

    setIsActive(data?.is_active ?? true)
  }

  const fetchQuizzes = async () => {
    if (!user) return

    try {
      // First, get user's group memberships
      const { data: userGroups, error: groupsError } = await supabase
        .from("group_memberships")
        .select("group_id")
        .eq("user_id", user.id)

      if (groupsError) {
        console.error("Error fetching user groups:", groupsError)
        return
      }

      const userGroupIds = userGroups?.map((g) => g.group_id) || []

      // Fetch all quizzes for user's category, level, specific targeting, and groups
      const query = supabase.from("quizzes").select("*")

      // Build the complex OR condition for targeting
      const conditions = [
        // Category and level targeting (no specific users/groups)
        `and(category.eq.${user.category},level.eq.${user.level || "basics"},target_users.is.null,target_groups.is.null)`,
        `and(category.eq.${user.category},level.eq.all,target_users.is.null,target_groups.is.null)`,
        `and(category.eq.all,level.eq.${user.level || "basics"},target_users.is.null,target_groups.is.null)`,
        `and(category.eq.all,level.eq.all,target_users.is.null,target_groups.is.null)`,
        // User-specific targeting
        `target_users.cs.{${user.id}}`,
      ]

      // Add group targeting conditions
      if (userGroupIds.length > 0) {
        userGroupIds.forEach((groupId) => {
          conditions.push(`target_groups.cs.{${groupId}}`)
        })
      }

      const { data: allQuizzes, error: quizzesError } = await query
        .or(conditions.join(","))
        .order("created_at", { ascending: false })

      if (quizzesError) {
        console.error("Error fetching quizzes:", quizzesError)
        return
      }

      // Fetch question counts for each quiz
      const quizIds = allQuizzes?.map((q) => q.id) || []
      const { data: questionCounts, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("quiz_id")
        .in("quiz_id", quizIds)

      if (questionsError) {
        console.error("Error fetching question counts:", questionsError)
      }

      // Count questions per quiz
      const questionCountMap =
        questionCounts?.reduce(
          (acc, q) => {
            acc[q.quiz_id] = (acc[q.quiz_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ) || {}

      // Fetch user's submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select("quiz_id, score, total_questions, submitted_at")
        .eq("user_id", user.id)

      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError)
        return
      }

      // Combine data & parse notes
      const quizzesWithStatus: QuizData[] =
        allQuizzes?.map((quiz) => {
          const submission = submissions?.find((s) => s.quiz_id === quiz.id)
          const match = quiz.title.match(/^\[(.*?)\]/)
          const extractedNote = quiz.note || (match ? match[1].trim() : null)
          const cleanTitle = quiz.title.replace(/^\[(.*?)\]\s*/, "")

          return {
            id: quiz.id,
            title: cleanTitle,
            cleanTitle,
            note: extractedNote,
            type: quiz.type,
            created_at: quiz.created_at,
            deadline: quiz.deadline,
            isCompleted: !!submission,
            score: submission?.score,
            totalQuestions: submission?.total_questions,
            submittedAt: submission?.submitted_at,
            questionCount: questionCountMap[quiz.id] || 0,
          }
        }) || []

      setQuizzes(quizzesWithStatus)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuizComplete = () => {
    setSelectedQuiz(null)
    fetchQuizzes() // Refresh the list
  }

  if (!isActive) {
    return (
      <div className="flex items-center justify-center p-8">
        <Alert className="max-w-md">
          <AlertDescription>
            Your account has been temporarily deactivated. Please contact your administrator for more information.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (selectedQuiz) {
    return <QuizTaker quizId={selectedQuiz} onComplete={handleQuizComplete} onCancel={() => setSelectedQuiz(null)} />
  }

  if (viewingResults) {
    return <QuizResultsViewer quizId={viewingResults} onBack={() => setViewingResults(null)} />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const now = new Date()
  const pendingQuizzes = quizzes.filter((q) => {
    if (q.isCompleted) return false
    if (q.deadline && new Date(q.deadline) < now) return false
    return true
  })
  const completedQuizzes = quizzes.filter((q) => q.isCompleted)
  const expiredQuizzes = quizzes.filter((q) => !q.isCompleted && q.deadline && new Date(q.deadline) < now)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Quizzes & Homework</h2>
        <p className="text-muted-foreground">Complete your assignments and track your progress.</p>
      </div>

      {expiredQuizzes.length > 0 && (
        <Alert className="border-red-500 bg-red-50 text-red-900">
          <Clock className="h-4 w-4 text-red-600" />
          <AlertDescription>
            You have {expiredQuizzes.length} expired assignment{expiredQuizzes.length > 1 ? "s" : ""} that can no longer
            be submitted.
          </AlertDescription>
        </Alert>
      )}

      {pendingQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {pendingQuizzes.map((quiz) => (
                <div key={quiz.id} className="border rounded-lg p-4 bg-muted/20 hover:border-primary/50 transition-colors">
                  {/* Prominent Alert Banner for Classwork vs. Homework */}
                  {quiz.note && (
                    <div
                      className={`p-3 rounded-lg mb-3 flex items-start space-x-3 text-xs sm:text-sm font-semibold border ${
                        quiz.note.toLowerCase().includes("class")
                          ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800"
                          : quiz.note.toLowerCase().includes("home")
                          ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800"
                          : "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800"
                      }`}
                    >
                      <span className="text-xl leading-none mt-0.5">
                        {quiz.note.toLowerCase().includes("class") ? "📝" : quiz.note.toLowerCase().includes("home") ? "🏠" : "📢"}
                      </span>
                      <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">
                          Assignment Notice
                        </div>
                        <div className="text-sm font-bold mt-0.5">{quiz.note}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{quiz.cleanTitle}</h3>
                      {quiz.deadline ? (
                        <p className="text-sm text-red-600 font-medium">
                          Deadline: {new Date(quiz.deadline).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No deadline set</p>
                      )}
                      <p className="text-sm text-blue-600 font-medium">
                        {quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize self-start font-semibold">
                      {quiz.type}
                    </Badge>
                  </div>
                  <Button onClick={() => setSelectedQuiz(quiz.id)} className="w-full bg-primary hover:bg-primary/90">
                    <FileText className="h-4 w-4 mr-2" />
                    Start {quiz.type}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {expiredQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expired Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-red-50/60 dark:bg-red-950/30 space-y-2 sm:space-y-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {quiz.note && (
                        <Badge
                          variant="outline"
                          className={
                            quiz.note.toLowerCase().includes("class")
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }
                        >
                          {quiz.note}
                        </Badge>
                      )}
                      <p className="font-medium text-foreground">{quiz.cleanTitle}</p>
                    </div>
                    <p className="text-sm text-red-600 font-medium mt-1">
                      Expired: {new Date(quiz.deadline!).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {quiz.type}
                    </Badge>
                    <Badge variant="destructive">Expired</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Completed Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {completedQuizzes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No completed assignments yet.</p>
          ) : (
            <div className="space-y-4">
              {completedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        {quiz.note && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              quiz.note.toLowerCase().includes("class")
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : quiz.note.toLowerCase().includes("home")
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-purple-100 text-purple-800 border border-purple-200"
                            }`}
                          >
                            {quiz.note.toLowerCase().includes("class") ? "📝 " : quiz.note.toLowerCase().includes("home") ? "🏠 " : "📢 "}
                            {quiz.note}
                          </span>
                        )}
                        <p className="font-medium text-foreground">{quiz.cleanTitle}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Completed: {quiz.submittedAt ? new Date(quiz.submittedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <Badge variant="outline" className="capitalize">
                      {quiz.type}
                    </Badge>
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-bold text-green-600">
                        {quiz.score}/{quiz.totalQuestions}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {quiz.score !== undefined && quiz.totalQuestions
                          ? Math.round((quiz.score / quiz.totalQuestions) * 100)
                          : 0}
                        %
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingResults(quiz.id)}
                      className="w-full sm:w-auto"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Results
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
