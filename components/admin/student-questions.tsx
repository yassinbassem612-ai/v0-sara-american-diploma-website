"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface StudentQuestionData {
  id: string
  user_id: string
  username: string
  category: string
  level: string
  question: string
  answer?: string
  answered_at?: string
  created_at: string
}

export function StudentQuestions() {
  const [questions, setQuestions] = useState<StudentQuestionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnswering, setIsAnswering] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("student_questions")
        .select(`
          id,
          user_id,
          question,
          answer,
          answered_at,
          created_at,
          users!inner(username, category, level)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching questions:", error)
        return
      }

      const formattedData =
        data?.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          username: item.users.username,
          category: item.users.category,
          level: item.users.level || "basics",
          question: item.question,
          answer: item.answer,
          answered_at: item.answered_at,
          created_at: item.created_at,
        })) || []

      setQuestions(formattedData)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerQuestion = async (questionId: string) => {
    const answer = answers[questionId]
    if (!answer) {
      setMessage("Please enter an answer")
      return
    }

    setIsAnswering(questionId)
    setMessage("")

    try {
      const { error } = await supabase
        .from("student_questions")
        .update({
          answer,
          answered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionId)

      if (error) {
        setMessage("Error saving answer: " + error.message)
      } else {
        setMessage("Answer saved successfully!")
        setAnswers((prev) => ({ ...prev, [questionId]: "" }))
        fetchQuestions()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error saving answer")
    } finally {
      setIsAnswering(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Student Questions</h2>
        <p className="text-muted-foreground">View and respond to student questions.</p>
      </div>

      {message && (
        <Alert className={message.includes("Error") ? "border-destructive" : "border-green-500"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Questions from Students</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : questions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No questions found.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                <div key={question.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{question.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Asked: {new Date(question.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="uppercase">
                        {question.category}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {question.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">Question:</h4>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-md">{question.question}</p>
                  </div>

                  {question.answer ? (
                    <div className="mb-4">
                      <h4 className="font-medium text-foreground mb-2">Your Answer:</h4>
                      <p className="text-muted-foreground bg-primary/5 p-3 rounded-md border-l-4 border-primary">
                        {question.answer}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Answered: {question.answered_at ? new Date(question.answered_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Your Answer:</h4>
                      <Textarea
                        value={answers[question.id] || ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder="Type your answer here..."
                        rows={3}
                      />
                      <Button
                        onClick={() => handleAnswerQuestion(question.id)}
                        disabled={isAnswering === question.id}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isAnswering === question.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Answer
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
