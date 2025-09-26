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
  correct_answer: string
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
        .order("created_at", { ascending: true })

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

  const getChoiceLabel = (index: number): string => {
    return ["A", "B", "C", "D"][index] || ""
  }

  const getChoiceText = (question: QuizQuestion, choiceIndex: number): string => {
    const choices = [question.choice_a, question.choice_b, question.choice_c, question.choice_d]
    return choices[choiceIndex] || ""
  }

  const getAnswerIndex = (answer: string): number => {
    const letterToIndex: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 }
    return letterToIndex[answer?.toLowerCase()] ?? -1
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
        <Badge variant="outline" className="capitalize">
          {quiz.type}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{quiz.title} - Results</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {submission.score}/{submission.total_questions}
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round((submission.score / submission.total_questions) * 100)}%
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
              const userAnswerLetter = submission.answers[question.id]
              const userAnswerIndex = getAnswerIndex(userAnswerLetter)
              const correctAnswerIndex = getAnswerIndex(question.correct_answer)
              const isCorrect = userAnswerIndex === correctAnswerIndex && userAnswerIndex !== -1
              const choices = [question.choice_a, question.choice_b, question.choice_c, question.choice_d]

              return (
                <Card key={question.id} className={`border-2 ${isCorrect ? "border-green-200" : "border-red-200"}`}>
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
                      {choices.map((choice, choiceIndex) => {
                        const isUserAnswer = userAnswerIndex === choiceIndex
                        const isCorrectAnswer = correctAnswerIndex === choiceIndex

                        let bgColor = ""
                        let textColor = ""

                        if (isCorrectAnswer) {
                          bgColor = "bg-green-100"
                          textColor = "text-green-800"
                        } else if (isUserAnswer && !isCorrect) {
                          bgColor = "bg-red-100"
                          textColor = "text-red-800"
                        }

                        return (
                          <div key={choiceIndex} className={`p-3 rounded-lg border ${bgColor} ${textColor}`}>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{getChoiceLabel(choiceIndex)}.</span>
                              <span>{choice}</span>
                              {isUserAnswer && (
                                <Badge variant="outline" className="ml-auto">
                                  Your Answer
                                </Badge>
                              )}
                              {isCorrectAnswer && (
                                <Badge variant="outline" className="ml-auto bg-green-100 text-green-800">
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {userAnswerIndex === -1 && (
                      <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                        <p className="text-gray-600 text-sm">No answer provided</p>
                        <p className="text-sm">
                          <span className="font-medium">Correct answer: </span>
                          {getChoiceLabel(correctAnswerIndex)}. {getChoiceText(question, correctAnswerIndex)}
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
