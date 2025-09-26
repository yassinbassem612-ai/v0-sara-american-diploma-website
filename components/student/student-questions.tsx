"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, MessageSquare, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"

interface StudentQuestionData {
  id: string
  question: string
  answer?: string
  answered_at?: string
  created_at: string
}

export function StudentQuestions() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<StudentQuestionData[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (user) {
      fetchQuestions()
    }
  }, [user])

  const fetchQuestions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("student_questions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching questions:", error)
        return
      }

      setQuestions(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || !user) {
      setMessage("Please enter a question")
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const { error } = await supabase.from("student_questions").insert([
        {
          user_id: user.id,
          question: newQuestion.trim(),
        },
      ])

      if (error) {
        setMessage("Error submitting question: " + error.message)
      } else {
        setMessage("Question submitted successfully!")
        setNewQuestion("")
        fetchQuestions()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error submitting question")
    } finally {
      setIsSubmitting(false)
    }
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Ask Questions</h2>
        <p className="text-muted-foreground">Get help from your instructor by asking questions.</p>
      </div>

      {message && (
        <Alert className={message.includes("Error") ? "border-destructive" : "border-green-500"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ask a New Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type your question here..."
            rows={4}
          />

          <Button
            onClick={handleSubmitQuestion}
            disabled={isSubmitting || !newQuestion.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Question
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No questions asked yet.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                <div key={question.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Asked: {new Date(question.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant={question.answer ? "default" : "secondary"}>
                      {question.answer ? "Answered" : "Pending"}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">Your Question:</h4>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-md">{question.question}</p>
                  </div>

                  {question.answer ? (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <h4 className="font-medium text-foreground">Instructor's Answer:</h4>
                      </div>
                      <p className="text-muted-foreground bg-primary/5 p-3 rounded-md border-l-4 border-primary">
                        {question.answer}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Answered: {question.answered_at ? new Date(question.answered_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <p className="text-sm text-yellow-800">
                        Your question is pending. You'll receive an answer from your instructor soon.
                      </p>
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
