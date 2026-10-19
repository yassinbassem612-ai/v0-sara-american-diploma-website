"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"

interface QuizResultsViewerProps {
  quizId: string
  onBack: () => void
}

interface QuizQuestion {
  id: string
  question: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  choice_e?: string | null
  correct_answer: string
  display_order: number
}

interface QuizSubmission {
  score: number
  total_questions: number
  answers: Record<string, string>
  submitted_at: string
}

export function QuizResultsViewer({ quizId, onBack }: QuizResultsViewerProps) {
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [submission, setSubmission] = useState<QuizSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuizResults()
  }, [quizId])

  const fetchQuizResults = async () => {
    if (!user) return

    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

      if (quizError) {
        console.error("Error fetching quiz:", quizError)
        return
      }

      // Fetch quiz questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("display_order", { ascending: true })

      if (questionsError) {
        console.error("Error fetching questions:", questionsError)
        return
      }

      // Fetch user's submission
      const { data: submissionData, error: submissionError } = await supabase
        .from("quiz_submissions")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("user_id", user.id)
        .single()

      if (submissionError) {
        console.error("Error fetching submission:", submissionError)
        return
      }

      setQuiz(quizData)
      setQuestions(questionsData || [])
      setSubmission(submissionData)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!quiz || !submission) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Unable to load quiz results.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
    )
  }

  const noteMatch = quiz?.title?.match(/^\[(.*?)\]/)
  const quizNote = quiz?.note || (noteMatch ? noteMatch[1].trim() : null)
  const cleanTitle = quiz?.title ? quiz.title.replace(/^\[(.*?)\]\s*/, "") : ""

  const getQuestionChoices = (q: QuizQuestion) => {
    const letters = ["a", "b", "c", "d", "e", "f", "g"]
    const res: { letter: string; text: string; index: number }[] = []
    letters.forEach((l, idx) => {
      const text = (q as any)[`choice_${l}`]
      if (text !== undefined && text !== null && String(text).trim() !== "") {
        res.push({ letter: l, text, index: idx })
      }
    })
    return res.length > 0
      ? res
      : [
          { letter: "a", text: q.choice_a, index: 0 },
          { letter: "b", text: q.choice_b, index: 1 },
          { letter: "c", text: q.choice_c, index: 2 },
          { letter: "d", text: q.choice_d, index: 3 },
        ]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
        <Badge variant="outline" className="capitalize font-semibold">
          {quiz.type}
        </Badge>
      </div>

      {/* Alert Note Banner */}
      {quizNote && (
        <div
          className={`p-3 rounded-lg flex items-center space-x-3 text-xs sm:text-sm font-semibold border ${
            quizNote.toLowerCase().includes("class")
              ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
              : quizNote.toLowerCase().includes("home")
              ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800"
              : "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800"
          }`}
        >
          <span className="text-xl">
            {quizNote.toLowerCase().includes("class") ? "📝" : quizNote.toLowerCase().includes("home") ? "🏠" : "📢"}
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Exam Notice</span>
            <span>{quizNote}</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>{cleanTitle || quiz.title} - Results</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {submission.score}/{submission.total_questions}
              </div>
              <div className="text-sm text-muted-foreground">
                {submission.total_questions ? Math.round((submission.score / submission.total_questions) * 100) : 0}%
              </div>
            </div>
          </CardTitle>
          <p className="text-muted-foreground">
            Completed on: {new Date(submission.submitted_at).toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswerLetter = submission.answers[question.id]?.toLowerCase()
              const correctAnswerLetter = question.correct_answer?.toLowerCase()
              const isCorrect = userAnswerLetter === correctAnswerLetter && !!userAnswerLetter
              const choices = getQuestionChoices(question)

              return (
                <Card key={question.id} className={`border-2 ${isCorrect ? "border-green-200 bg-green-50/20" : "border-red-200 bg-red-50/20"}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-foreground">
                        {index + 1}. {question.question}
                      </h3>
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {choices.map((c) => {
                        const isUserAnswer = userAnswerLetter === c.letter
                        const isCorrectAnswer = correctAnswerLetter === c.letter

                        let bgColor = ""
                        let textColor = ""

                        if (isCorrectAnswer) {
                          bgColor = "bg-green-100 border-green-300 dark:bg-green-950/60 dark:border-green-800"
                          textColor = "text-green-800 dark:text-green-200 font-medium"
                        } else if (isUserAnswer && !isCorrect) {
                          bgColor = "bg-red-100 border-red-300 dark:bg-red-950/60 dark:border-red-800"
                          textColor = "text-red-800 dark:text-red-200 font-medium"
                        }

                        return (
                          <div key={c.letter} className={`p-3 rounded-lg border ${bgColor} ${textColor}`}>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold">{c.letter.toUpperCase()}.</span>
                              <span>{c.text}</span>
                              {isUserAnswer && (
                                <Badge variant="outline" className="ml-auto font-semibold">
                                  Your Answer
                                </Badge>
                              )}
                              {isCorrectAnswer && (
                                <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-300 font-semibold">
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {!userAnswerLetter && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-muted-foreground text-sm">No answer provided</p>
                        <p className="text-sm font-medium mt-1">
                          Correct answer: <strong className="text-green-600">{correctAnswerLetter?.toUpperCase()}</strong>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
