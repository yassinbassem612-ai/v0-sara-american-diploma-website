"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, User, CheckCircle, XCircle, Eye, Edit2 } from 'lucide-react'
import { supabase } from "@/lib/supabase/client"

interface StudentProgressData {
  user_id: string
  username: string
  category: string
  level: string
  quiz_title: string
  quiz_type: string
  score: number
  total_questions: number
  submitted_at: string
  quiz_id: string
}

interface QuestionAnswer {
  question: string
  options: string[]
  correct_answer: number
  user_answer: number | null
  is_correct: boolean
}

interface QuizOption {
  id: string
  title: string
  type: string
}

export function StudentProgress() {
  const [progressData, setProgressData] = useState<StudentProgressData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<"all" | "act" | "sat" | "est">("all")
  const [selectedLevel, setSelectedLevel] = useState<"all" | "advanced" | "basics">("all")
  const [viewMode, setViewMode] = useState<"all" | "specific">("all")
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizOption[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all")
  const [filterType, setFilterType] = useState<"category" | "group">("category")
  const [availableGroups, setAvailableGroups] = useState<{ id: string; name: string }[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [selectedSubmission, setSelectedSubmission] = useState<StudentProgressData | null>(null)
  const [detailedAnswers, setDetailedAnswers] = useState<QuestionAnswer[]>([])
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false)
  const [editingScore, setEditingScore] = useState<string>("")
  const [editingSubmission, setEditingSubmission] = useState<StudentProgressData | null>(null)
  const [isSavingScore, setIsSavingScore] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchProgressData()
    fetchAvailableQuizzes()
    fetchAvailableGroups()
  }, [])

  const fetchAvailableGroups = async () => {
    try {
      const { data, error } = await supabase.from("groups").select("id, name").order("name")

      if (error) {
        console.error("Error fetching groups:", error)
        return
      }

      setAvailableGroups(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchAvailableQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, type")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching quizzes:", error)
        return
      }

      setAvailableQuizzes(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchProgressData = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_submissions")
        .select(`
          user_id,
          quiz_id,
          score,
          total_questions,
          submitted_at,
          users!inner(username, category, level),
          quizzes!inner(title, type)
        `)
        .order("submitted_at", { ascending: false })

      if (error) {
        console.error("Error fetching progress data:", error)
        return
      }

      const formattedData =
        data?.map((item: any) => ({
          user_id: item.user_id,
          quiz_id: item.quiz_id,
          username: item.users.username,
          category: item.users.category,
          level: item.users.level || "basics",
          quiz_title: item.quizzes.title,
          quiz_type: item.quizzes.type,
          score: item.score,
          total_questions: item.total_questions,
          submitted_at: item.submitted_at,
        })) || []

      setProgressData(formattedData)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDetailedAnswers = async (userId: string, quizId: string) => {
    setIsLoadingAnswers(true)
    try {
      console.log("[v0] Fetching detailed answers for user:", userId, "quiz:", quizId)

      const { data: submission, error: submissionError } = await supabase
        .from("quiz_submissions")
        .select("answers")
        .eq("user_id", userId)
        .eq("quiz_id", quizId)
        .single()

      if (submissionError) {
        console.error("[v0] Error fetching submission:", submissionError)
        throw new Error(`Failed to fetch submission: ${submissionError.message}`)
      }

      if (!submission) {
        console.error("[v0] No submission found")
        throw new Error("No submission found for this user and quiz")
      }

      console.log("[v0] Submission data:", submission)

      const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at")

      if (questionsError) {
        console.error("[v0] Error fetching questions:", questionsError)
        throw new Error(`Failed to fetch questions: ${questionsError.message}`)
      }

      if (!questions || questions.length === 0) {
        console.error("[v0] No questions found")
        throw new Error("No questions found for this quiz")
      }

      console.log("[v0] Questions data:", questions)

      const userAnswers = submission?.answers || {}
      console.log("[v0] User answers:", userAnswers)

      const detailedData: QuestionAnswer[] = questions.map((question) => {
        const userAnswer = userAnswers[question.id] // Use question ID instead of index
        const choices = [question.choice_a, question.choice_b, question.choice_c, question.choice_d].filter(Boolean)

        // Convert letter choice to index for comparison
        const userAnswerIndex = userAnswer ? ["a", "b", "c", "d"].indexOf(userAnswer) : null
        const correctAnswerIndex = ["a", "b", "c", "d"].indexOf(question.correct_answer)

        const isCorrect = userAnswer === question.correct_answer

        return {
          question: question.question || "",
          options: choices,
          correct_answer: correctAnswerIndex,
          user_answer: userAnswerIndex,
          is_correct: isCorrect,
        }
      })

      console.log("[v0] Detailed data processed:", detailedData)
      setDetailedAnswers(detailedData)
    } catch (error) {
      console.error("[v0] Error fetching detailed answers:", error)
      setDetailedAnswers([])
      alert(`Error loading detailed answers: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoadingAnswers(false)
    }
  }

  const handleViewAnswers = (submission: StudentProgressData) => {
    setSelectedSubmission(submission)
    fetchDetailedAnswers(submission.user_id, submission.quiz_id)
  }

  const handleEditMark = (submission: StudentProgressData) => {
    setEditingSubmission(submission)
    setEditingScore(submission.score.toString())
    setEditDialogOpen(true)
  }

  const handleSaveMark = async () => {
    if (!editingSubmission || editingScore === "") return

    const newScore = parseInt(editingScore)
    if (isNaN(newScore) || newScore < 0 || newScore > editingSubmission.total_questions) {
      alert(`Please enter a valid score between 0 and ${editingSubmission.total_questions}`)
      return
    }

    setIsSavingScore(true)
    try {
      const { error } = await supabase
        .from("quiz_submissions")
        .update({ score: newScore })
        .eq("user_id", editingSubmission.user_id)
        .eq("quiz_id", editingSubmission.quiz_id)

      if (error) {
        console.error("Error updating score:", error)
        alert("Error updating score. Please try again.")
        return
      }

      // Update the progress data with the new score
      setProgressData(
        progressData.map((item) =>
          item.user_id === editingSubmission.user_id && item.quiz_id === editingSubmission.quiz_id
            ? { ...item, score: newScore }
            : item
        )
      )

      setEditDialogOpen(false)
      alert("Mark updated successfully!")
    } catch (error) {
      console.error("Error:", error)
      alert("Error updating mark. Please try again.")
    } finally {
      setIsSavingScore(false)
    }
  }

  const filteredData = progressData.filter((item) => {
    const quizMatch = viewMode === "all" || selectedQuiz === "all" || item.quiz_id === selectedQuiz

    if (filterType === "category") {
      const categoryMatch = selectedCategory === "all" || item.category === selectedCategory
      const levelMatch = selectedLevel === "all" || item.level === selectedLevel
      return categoryMatch && levelMatch && quizMatch
    } else {
      // Group filtering
      if (selectedGroup === "all") return quizMatch

      // Check if user is in selected group (this would need group membership data)
      // For now, we'll need to fetch this data or modify the query
      return quizMatch
    }
  })

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return "bg-green-100 text-green-800"
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Student Progress Dashboard</h2>
          <p className="text-muted-foreground">Monitor student quiz and homework submissions.</p>
        </div>

        <div className="flex space-x-4">
          <Select
            value={viewMode}
            onValueChange={(value: "all" | "specific") => {
              setViewMode(value)
              if (value === "all") {
                setSelectedQuiz("all")
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="specific">By Specific Quiz/HW</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === "specific" && (
            <>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Quiz/Homework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes/Homework</SelectItem>
                  {availableQuizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title} ({quiz.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterType}
                onValueChange={(value: "category" | "group") => {
                  setFilterType(value)
                  setSelectedCategory("all")
                  setSelectedLevel("all")
                  setSelectedGroup("all")
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">By Category & Level</SelectItem>
                  <SelectItem value="group">By Group</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {(viewMode === "all" || (viewMode === "specific" && filterType === "category")) && (
            <>
              <Select
                value={selectedCategory}
                onValueChange={(value: "all" | "act" | "sat" | "est") => setSelectedCategory(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="sat">SAT Students</SelectItem>
                  <SelectItem value="act">ACT Students</SelectItem>
                  <SelectItem value="est">EST Students</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedLevel}
                onValueChange={(value: "all" | "advanced" | "basics") => setSelectedLevel(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="basics">Basics</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {viewMode === "specific" && filterType === "group" && (
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {availableGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === "specific" && selectedQuiz !== "all"
              ? `Marks for: ${availableQuizzes.find((q) => q.id === selectedQuiz)?.title || "Selected Quiz"}`
              : "Recent Submissions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {viewMode === "specific" && selectedQuiz !== "all"
                ? "No submissions found for the selected quiz/homework."
                : "No submissions found."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{item.username}</p>
                      <p className="text-sm text-muted-foreground">{item.quiz_title}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(item.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                      <Badge variant="secondary" className="uppercase">
                        {item.category}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {item.level || "basics"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {item.quiz_type}
                      </Badge>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(item.score, item.total_questions)}`}>
                        {item.score}/{item.total_questions}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${getScoreBadge(item.score, item.total_questions)}`}
                      >
                        {Math.round((item.score / item.total_questions) * 100)}%
                      </div>
                    </div>

                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMark(item)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Mark
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Mark for {editingSubmission?.username}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              New Score (out of {editingSubmission?.total_questions})
                            </label>
                            <Input
                              type="number"
                              value={editingScore}
                              onChange={(e) => setEditingScore(e.target.value)}
                              min="0"
                              max={editingSubmission?.total_questions}
                              placeholder="Enter new score"
                            />
                          </div>
                          <div className="flex space-x-3 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setEditDialogOpen(false)}
                              disabled={isSavingScore}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSaveMark} disabled={isSavingScore} className="gap-2">
                              {isSavingScore && <Loader2 className="h-4 w-4 animate-spin" />}
                              Save Mark
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleViewAnswers(item)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Answers
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedSubmission?.username}'s Answers - {selectedSubmission?.quiz_title}
                          </DialogTitle>
                        </DialogHeader>

                        {isLoadingAnswers ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {Array.isArray(detailedAnswers) &&
                              detailedAnswers.map((qa, qIndex) => (
                                <div key={qIndex} className="border rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-medium text-foreground">Question {qIndex + 1}</h3>
                                    <Badge
                                      variant={qa.is_correct ? "default" : "destructive"}
                                      className={
                                        qa.is_correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                      }
                                    >
                                      {qa.is_correct ? "Correct" : "Wrong"}
                                    </Badge>
                                  </div>

                                  <p className="text-foreground mb-4">{qa.question}</p>

                                  <div className="space-y-2">
                                    {Array.isArray(qa.options) &&
                                      qa.options.map((option, optIndex) => (
                                        <div
                                          key={optIndex}
                                          className={`p-3 rounded-lg border ${
                                            optIndex === qa.correct_answer
                                              ? "bg-green-50 border-green-200 text-green-800"
                                              : optIndex === qa.user_answer && !qa.is_correct
                                                ? "bg-red-50 border-red-200 text-red-800"
                                                : optIndex === qa.user_answer
                                                  ? "bg-green-50 border-green-200 text-green-800"
                                                  : "bg-gray-50 border-gray-200"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>{option}</span>
                                            <div className="flex space-x-2">
                                              {optIndex === qa.user_answer && (
                                                <Badge variant="outline" className="text-xs">
                                                  Student's Answer
                                                </Badge>
                                              )}
                                              {optIndex === qa.correct_answer && (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs bg-green-100 text-green-800"
                                                >
                                                  Correct Answer
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    {qa.user_answer === null && (
                                      <div className="p-3 rounded-lg border border-gray-300 bg-gray-100">
                                        <span className="text-gray-600 italic">No answer provided</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {item.score / item.total_questions >= 0.8 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
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
