"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"

interface Question {
  id: string
  question: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  correct_answer: string
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
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const submitQuiz = async () => {
    console.log("[v0] Starting quiz submission process")
    if (!user || questions.length === 0) {
      console.log("[v0] Cannot submit - missing user or questions")
      return
    }

    try {
      let correctAnswers = 0
      questions.forEach((question) => {
        if (answers[question.id] === question.correct_answer) {
          correctAnswers++
        }
      })

      console.log("[v0] Calculated score:", correctAnswers, "out of", questions.length)

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

      console.log("[v0] Quiz submitted to database successfully")

      setScore(correctAnswers)
      setIsSubmitting(false)
      setShowResults(true)

      console.log("[v0] State updated - should show results now")
    } catch (error) {
      console.error("[v0] Error during quiz submission:", error)
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    console.log("[v0] Final submit button clicked")
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    setIsSubmitting(true)
    setShowReview(false) // Hide review screen immediately

    try {
      await submitQuiz()
      console.log("[v0] Quiz submitted successfully, results should be showing")
    } catch (error) {
      console.error("[v0] Error during submission:", error)
      setIsSubmitting(false)
      setShowReview(true) // Show review again if there was an error
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
  const allQuestionsAnswered = questions.every((q) => answers[q.id])

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
                <Card key={question.id} className={!isAnswered ? "border-yellow-500 bg-yellow-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2 mb-3">
                      <span className="font-medium text-foreground">Q{index + 1}:</span>
                      <p className="text-foreground">{question.question}</p>
                    </div>
                    <div className="ml-6">
                      {isAnswered ? (
                        <p className="text-sm">
                          <span className="font-medium">Your answer:</span>{" "}
                          <span className="text-blue-600">
                            {userAnswer.toUpperCase()}) {question[`choice_${userAnswer}` as keyof Question]}
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
              <Alert className="border-yellow-500">
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
            const isCorrect = userAnswer === question.correct_answer
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
                      <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                        {userAnswer
                          ? `${userAnswer?.toUpperCase()}) ${question[`choice_${userAnswer}` as keyof Question]}`
                          : "No answer provided"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm">
                        <span className="font-medium">Correct answer:</span>{" "}
                        <span className="text-green-600">
                          {question.correct_answer.toUpperCase()}){" "}
                          {question[`choice_${question.correct_answer}` as keyof Question]}
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

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <Badge variant="secondary" className="capitalize self-start">
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
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">{quiz?.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {currentQuestion && (
            <>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-4 leading-relaxed">
                  Q{currentQuestionIndex + 1}: {currentQuestion.question}
                </h3>
              </div>

              <div className="space-y-3">
                {["a", "b", "c", "d"].map((choice) => (
                  <label
                    key={choice}
                    className={`flex items-start space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      answers[currentQuestion.id] === choice ? "border-primary bg-primary/5" : ""
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
                      <span className="font-medium mr-2">{choice.toUpperCase()})</span>
                      <span className="text-sm sm:text-base">
                        {currentQuestion[`choice_${choice}` as keyof Question]}
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
