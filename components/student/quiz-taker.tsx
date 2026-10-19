"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"

interface Question {
  id: string
  question: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  choice_e?: string | null
  choice_f?: string | null
  correct_answer: string
  display_order: number
}

interface QuizTakerProps {
  quizId: string
  onComplete: () => void
  onCancel: () => void
}

export function QuizTaker({ quizId, onComplete, onCancel }: QuizTakerProps) {
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchQuizData()
  }, [quizId])

  useEffect(() => {
    if (quiz?.time_limit_minutes > 0 && timeLeft > 0 && !showResults && !showReview) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      setTimerInterval(interval)
      return () => clearInterval(interval)
    }
  }, [quiz, timeLeft, showResults, showReview])

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  const fetchQuizData = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

      if (quizError) {
        console.error("Error fetching quiz:", quizError)
        return
      }

      setQuiz(quizData)
      if (quizData.time_limit_minutes > 0) {
        setTimeLeft(quizData.time_limit_minutes * 60)
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("display_order", { ascending: true })

      if (questionsError) {
        console.error("Error fetching questions:", questionsError)
        return
      }

      setQuestions(questionsData || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer.toLowerCase() }))
  }

  const submitQuiz = async () => {
    if (!user || questions.length === 0) return

    try {
      let correctAnswers = 0
      questions.forEach((question) => {
        if (answers[question.id]?.toLowerCase() === question.correct_answer.toLowerCase()) {
          correctAnswers++
        }
      })

      const { error } = await supabase.from("quiz_submissions").insert([
        {
          user_id: user.id,
          quiz_id: quizId,
          score: correctAnswers,
          total_questions: questions.length,
          answers: answers,
        },
      ])

      if (error) {
        console.error("[v0] Database error submitting quiz:", error)
        return
      }

      setScore(correctAnswers)
      setIsSubmitting(false)
      setShowResults(true)
    } catch (error) {
      console.error("[v0] Error during quiz submission:", error)
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    setIsSubmitting(true)
    setShowReview(false)

    try {
      await submitQuiz()
    } catch (error) {
      console.error("[v0] Error during submission:", error)
      setIsSubmitting(false)
      setShowReview(true)
    }
  }

  const handleAutoSubmit = async () => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    await submitQuiz()
  }

  const handleShowReview = () => {
    setShowReview(true)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Extract quiz note and clean title
  const noteMatch = quiz?.title?.match(/^\[(.*?)\]/)
  const quizNote = quiz?.note || (noteMatch ? noteMatch[1].trim() : null)
  const cleanTitle = quiz?.title ? quiz.title.replace(/^\[(.*?)\]\s*/, "") : ""

  // Compute available choices dynamically (supports EST 5th choice 'e', etc.)
  const getQuestionChoices = (q: Question) => {
    const keys = ["a", "b", "c", "d", "e", "f", "g"].filter(
      (k) => (q as any)[`choice_${k}`] !== undefined && (q as any)[`choice_${k}`] !== null && String((q as any)[`choice_${k}`]).trim() !== ""
    )
    return keys.length >= 2 ? keys : ["a", "b", "c", "d"]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (showReview) {
    const unansweredQuestions = questions.filter((q) => !answers[q.id])

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowReview(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quiz
          </Button>
          {quiz?.time_limit_minutes > 0 && timeLeft > 0 && (
            <div className={`text-lg font-semibold ${timeLeft < 300 ? "text-red-600" : "text-foreground"}`}>
              Time Left: {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Notice Banner */}
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
            <CardTitle>Review Your Answers</CardTitle>
            <p className="text-muted-foreground">
              Review all questions before final submission. Unanswered questions will be marked as blank.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isAnswered = !!userAnswer

              return (
                <Card key={question.id} className={!isAnswered ? "border-yellow-500 bg-yellow-50/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2 mb-3">
                      <span className="font-medium text-foreground">Q{index + 1}:</span>
                      <p className="text-foreground">{question.question}</p>
                    </div>
                    <div className="ml-6">
                      {isAnswered ? (
                        <p className="text-sm">
                          <span className="font-medium">Your answer:</span>{" "}
                          <span className="text-blue-600 font-semibold">
                            {userAnswer.toUpperCase()}) {question[`choice_${userAnswer}` as keyof Question] || ""}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-600 font-medium">Not answered</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {unansweredQuestions.length > 0 && (
              <Alert className="border-yellow-500 bg-yellow-50 text-yellow-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have {unansweredQuestions.length} unanswered question(s). These will be marked as blank if you
                  submit now.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center space-x-4 pt-4">
              <Button variant="outline" onClick={() => setShowReview(false)}>
                Continue Editing
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Final Submit"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Completed!</h2>
          <p className="text-muted-foreground">Here are your results:</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Your Score</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {score}/{questions.length}
            </div>
            <div className="text-lg text-muted-foreground mb-4">{Math.round((score / questions.length) * 100)}%</div>
            <Badge variant="secondary" className="capitalize">
              {quiz?.type}
            </Badge>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Review Answers:</h3>
          {questions.map((question, index) => {
            const userAnswer = answers[question.id]
            const isCorrect = userAnswer?.toLowerCase() === question.correct_answer.toLowerCase()
            return (
              <Card key={question.id} className={isCorrect ? "border-green-500" : "border-red-500"}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <span className="font-medium text-foreground">Q{index + 1}:</span>
                    <p className="text-foreground">{question.question}</p>
                  </div>
                  <div className="space-y-2 ml-6">
                    <p className="text-sm">
                      <span className="font-medium">Your answer:</span>{" "}
                      <span className={isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {userAnswer
                          ? `${userAnswer?.toUpperCase()}) ${question[`choice_${userAnswer}` as keyof Question] || ""}`
                          : "No answer provided"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm">
                        <span className="font-medium">Correct answer:</span>{" "}
                        <span className="text-green-600 font-semibold">
                          {question.correct_answer.toUpperCase()}){" "}
                          {question[`choice_${question.correct_answer.toLowerCase()}` as keyof Question] || ""}
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button onClick={onComplete} className="bg-primary hover:bg-primary/90">
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  const currentChoices = currentQuestion ? getQuestionChoices(currentQuestion) : ["a", "b", "c", "d"]

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Alert Banner for Classwork vs. Homework */}
      {quizNote && (
        <div
          className={`p-3 rounded-lg flex items-center space-x-3 text-xs sm:text-sm font-semibold border ${
            quizNote.toLowerCase().includes("class")
              ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800"
              : quizNote.toLowerCase().includes("home")
              ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800"
              : "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800"
          }`}
        >
          <span className="text-xl">
            {quizNote.toLowerCase().includes("class") ? "📝" : quizNote.toLowerCase().includes("home") ? "🏠" : "📢"}
          </span>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Exam Notice</span>
            <span>{quizNote}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <Badge variant="secondary" className="capitalize self-start font-semibold">
            {quiz?.type}
          </Badge>
          {quiz?.time_limit_minutes > 0 && timeLeft > 0 && (
            <div
              className={`text-base sm:text-lg font-semibold ${timeLeft < 300 ? "text-red-600" : "text-foreground"}`}
            >
              Time Left: {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">{cleanTitle || quiz?.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {currentQuestion && (
            <>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-4 leading-relaxed">
                  Q{currentQuestionIndex + 1}: {currentQuestion.question}
                </h3>
              </div>

              {/* Dynamic choices: Supports A-D (SAT) or A-E (EST) and custom choices */}
              <div className="space-y-3">
                {currentChoices.map((choice) => (
                  <label
                    key={choice}
                    className={`flex items-start space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      answers[currentQuestion.id] === choice ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={choice}
                      checked={answers[currentQuestion.id] === choice}
                      onChange={() => handleAnswerSelect(currentQuestion.id, choice)}
                      className="text-primary mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-bold mr-2 text-primary">{choice.toUpperCase()})</span>
                      <span className="text-sm sm:text-base">
                        {currentQuestion[`choice_${choice}` as keyof Question] || ""}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 space-y-3 sm:space-y-0">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button onClick={handleShowReview} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                Review & Submit
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="w-full sm:w-auto"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              {quiz?.time_limit_minutes > 0 && timeLeft < 300 && timeLeft > 0 && (
                <span className="text-red-600 font-semibold">Warning: Less than 5 minutes remaining! </span>
              )}
              Navigate through questions using Previous/Next buttons. Click "Review & Submit" when ready.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
