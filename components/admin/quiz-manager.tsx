"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, Edit, Save, Users, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Quiz, User, Group } from "@/lib/types"

interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  correct_answer: "a" | "b" | "c" | "d"
  created_at: string
}

export function QuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState("")
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const [showStandardQuizForm, setShowStandardQuizForm] = useState(false)
  const [standardQuestionCount, setStandardQuestionCount] = useState(10)
  const [standardQuestions, setStandardQuestions] = useState<
    Array<{
      question: string
      choice_a: string
      choice_b: string
      choice_c: string
      choice_d: string
      correct_answer: "a" | "b" | "c" | "d"
    }>
  >([])

  // Quiz form state
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState<"act" | "sat" | "est">("sat")
  const [newLevel, setNewLevel] = useState<"advanced" | "basics" | "all">("basics")
  const [newType, setNewType] = useState<"quiz" | "homework">("quiz")
  const [newTimeLimit, setNewTimeLimit] = useState(0)
  const [newDeadline, setNewDeadline] = useState("")

  // Question form state
  const [question, setQuestion] = useState("")
  const [choiceA, setChoiceA] = useState("")
  const [choiceB, setChoiceB] = useState("")
  const [choiceC, setChoiceC] = useState("")
  const [choiceD, setChoiceD] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState<"a" | "b" | "c" | "d">("a")

  // User targeting state
  const [targetingMode, setTargetingMode] = useState<"category" | "users" | "groups">("category")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    fetchQuizzes()
    fetchUsers()
    fetchGroups()
  }, [])

  const generateStandardQuestions = () => {
    const questions = []
    for (let i = 1; i <= standardQuestionCount; i++) {
      questions.push({
        question: `Question ${i}`,
        choice_a: "A",
        choice_b: "B",
        choice_c: "C",
        choice_d: "D",
        correct_answer: "a" as "a" | "b" | "c" | "d",
      })
    }
    setStandardQuestions(questions)
  }

  const updateStandardQuestion = (index: number, field: string, value: string) => {
    const updated = [...standardQuestions]
    if (field === "question") {
      updated[index].question = value
    } else if (field === "choice_a") {
      updated[index].choice_a = value
    } else if (field === "choice_b") {
      updated[index].choice_b = value
    } else if (field === "choice_c") {
      updated[index].choice_c = value
    } else if (field === "choice_d") {
      updated[index].choice_d = value
    }
    setStandardQuestions(updated)
  }

  const updateStandardQuestionAnswer = (index: number, answer: "a" | "b" | "c" | "d") => {
    const updated = [...standardQuestions]
    updated[index].correct_answer = answer
    setStandardQuestions(updated)
  }

  const fetchQuestions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching questions:", error)
        return
      }

      setQuestions(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching quizzes:", error)
        return
      }

      setQuizzes(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("username", { ascending: true })

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase.from("groups").select("*").order("name", { ascending: true })

      if (error) {
        console.error("Error fetching groups:", error)
        return
      }

      setGroups(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleCreateQuiz = async () => {
    if (!newTitle) {
      setMessage("Quiz title is required")
      return
    }

    setIsCreating(true)
    setMessage("")

    try {
      console.log("[v0] Raw deadline input value:", newDeadline)

      const deadlineValue = newDeadline ? new Date(newDeadline).toISOString() : null
      console.log("[v0] Formatted deadline for database:", deadlineValue)

      const targetUsers = targetingMode === "users" && selectedUsers.length > 0 ? selectedUsers : null
      const targetGroups = targetingMode === "groups" && selectedGroups.length > 0 ? selectedGroups : null

      const { data, error } = await supabase
        .from("quizzes")
        .insert([
          {
            title: newTitle,
            category: newCategory,
            level: newLevel,
            type: newType,
            time_limit_minutes: newTimeLimit,
            deadline: deadlineValue,
            target_users: targetUsers,
            target_groups: targetGroups,
          },
        ])
        .select()

      if (error) {
        console.error("[v0] Database error:", error)
        setMessage("Error creating quiz: " + error.message)
      } else {
        console.log("[v0] Quiz created successfully with data:", data)
        setMessage("Quiz created successfully!")
        setNewTitle("")
        setNewCategory("sat")
        setNewLevel("basics")
        setNewType("quiz")
        setNewTimeLimit(0)
        setNewDeadline("")
        setTargetingMode("category")
        setSelectedUsers([])
        setSelectedGroups([])
        fetchQuizzes()
        if (data && data[0]) {
          setSelectedQuizId(data[0].id)
          setQuestions([])
          setIsEditMode(false)
          setShowQuestionForm(true)
        }
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("[v0] Error creating quiz:", error)
      setMessage("Error creating quiz")
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddQuestion = async () => {
    if (!question || !choiceA || !choiceB || !choiceC || !choiceD || !selectedQuizId) {
      setMessage("All question fields are required")
      return
    }

    try {
      if (editingQuestionId) {
        // Update existing question
        const { error } = await supabase
          .from("quiz_questions")
          .update({
            question,
            choice_a: choiceA,
            choice_b: choiceB,
            choice_c: choiceC,
            choice_d: choiceD,
            correct_answer: correctAnswer,
          })
          .eq("id", editingQuestionId)

        if (error) {
          setMessage("Error updating question: " + error.message)
        } else {
          setMessage("Question updated successfully!")
          setEditingQuestionId(null)
          fetchQuestions(selectedQuizId)
        }
      } else {
        // Add new question
        const { error } = await supabase.from("quiz_questions").insert([
          {
            quiz_id: selectedQuizId,
            question,
            choice_a: choiceA,
            choice_b: choiceB,
            choice_c: choiceC,
            choice_d: choiceD,
            correct_answer: correctAnswer,
          },
        ])

        if (error) {
          setMessage("Error adding question: " + error.message)
        } else {
          setMessage("Question added successfully!")
          fetchQuestions(selectedQuizId)
        }
      }

      // Reset form
      resetQuestionForm()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error saving question")
    }
  }

  const resetQuestionForm = () => {
    setQuestion("")
    setChoiceA("")
    setChoiceB("")
    setChoiceC("")
    setChoiceD("")
    setCorrectAnswer("a")
    setEditingQuestionId(null)
  }

  const handleEditQuestion = (q: QuizQuestion) => {
    setQuestion(q.question)
    setChoiceA(q.choice_a)
    setChoiceB(q.choice_b)
    setChoiceC(q.choice_c)
    setChoiceD(q.choice_d)
    setCorrectAnswer(q.correct_answer)
    setEditingQuestionId(q.id)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return

    try {
      const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId)

      if (error) {
        setMessage("Error deleting question: " + error.message)
      } else {
        setMessage("Question deleted successfully!")
        fetchQuestions(selectedQuizId)
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error deleting question")
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz and all its questions?")) return

    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId)

      if (error) {
        setMessage("Error deleting quiz: " + error.message)
      } else {
        setMessage("Quiz deleted successfully!")
        fetchQuizzes()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error deleting quiz")
    }
  }

  const handleEditQuiz = async (quiz: Quiz) => {
    setSelectedQuizId(quiz.id)
    setIsEditMode(true)
    setShowQuestionForm(true)
    await fetchQuestions(quiz.id)
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups((prev) => [...prev, groupId])
    } else {
      setSelectedGroups((prev) => prev.filter((id) => id !== groupId))
    }
  }

  const handleCreateStandardQuiz = async () => {
    if (!newTitle) {
      setMessage("Quiz title is required")
      return
    }

    if (standardQuestions.length === 0) {
      setMessage("Please generate questions first")
      return
    }

    // Validate that all questions have content
    const hasEmptyQuestions = standardQuestions.some(
      (q) => !q.question.trim() || !q.choice_a.trim() || !q.choice_b.trim() || !q.choice_c.trim() || !q.choice_d.trim(),
    )

    if (hasEmptyQuestions) {
      setMessage("Please fill in all question fields and choices")
      return
    }

    setIsCreating(true)
    setMessage("")

    try {
      console.log("[v0] Creating standard quiz with title:", newTitle)
      console.log("[v0] Standard questions:", standardQuestions)

      const deadlineValue = newDeadline ? new Date(newDeadline).toISOString() : null
      const targetUsers = targetingMode === "users" && selectedUsers.length > 0 ? selectedUsers : null
      const targetGroups = targetingMode === "groups" && selectedGroups.length > 0 ? selectedGroups : null

      // Create the quiz first
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert([
          {
            title: newTitle,
            category: newCategory,
            level: newLevel,
            type: newType,
            time_limit_minutes: newTimeLimit,
            deadline: deadlineValue,
            target_users: targetUsers,
            target_groups: targetGroups,
          },
        ])
        .select()

      if (quizError) {
        console.error("[v0] Quiz creation error:", quizError)
        setMessage("Error creating quiz: " + quizError.message)
        return
      }

      if (!quizData || quizData.length === 0) {
        setMessage("Error: Quiz was not created properly")
        return
      }

      const quizId = quizData[0].id
      console.log("[v0] Quiz created with ID:", quizId)

      // Now insert all the questions
      const questionsToInsert = standardQuestions.map((q) => ({
        quiz_id: quizId,
        question: q.question,
        choice_a: q.choice_a,
        choice_b: q.choice_b,
        choice_c: q.choice_c,
        choice_d: q.choice_d,
        correct_answer: q.correct_answer,
      }))

      const { error: questionsError } = await supabase.from("quiz_questions").insert(questionsToInsert)

      if (questionsError) {
        console.error("[v0] Questions insertion error:", questionsError)
        setMessage("Quiz created but error adding questions: " + questionsError.message)
        return
      }

      console.log("[v0] Standard quiz created successfully")
      setMessage("Standard quiz created successfully!")

      // Reset form
      setNewTitle("")
      setNewCategory("sat")
      setNewLevel("basics")
      setNewType("quiz")
      setNewTimeLimit(0)
      setNewDeadline("")
      setTargetingMode("category")
      setSelectedUsers([])
      setSelectedGroups([])
      setShowStandardQuizForm(false)
      setStandardQuestions([])
      setStandardQuestionCount(10)

      fetchQuizzes()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error creating standard quiz:", error)
      setMessage("Error creating standard quiz")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Quiz & Homework Management</h2>
        <p className="text-muted-foreground">Create and manage quizzes and homework assignments.</p>
      </div>

      {message && (
        <Alert className={message.includes("Error") ? "border-destructive" : "border-green-500"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Create Quiz Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Quiz/Homework</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <Select value={newCategory} onValueChange={(value: "act" | "sat" | "est") => setNewCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sat">SAT</SelectItem>
                  <SelectItem value="act">ACT</SelectItem>
                  <SelectItem value="est">EST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-foreground mb-2">
                Level
              </label>
              <Select value={newLevel} onValueChange={(value: "advanced" | "basics" | "all") => setNewLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basics">Basics</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="all">All Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
                Type
              </label>
              <Select value={newType} onValueChange={(value: "quiz" | "homework") => setNewType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="homework">Homework</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="time-limit" className="block text-sm font-medium text-foreground mb-2">
                Time Limit (minutes)
              </label>
              <Input
                id="time-limit"
                type="number"
                min="0"
                value={newTimeLimit}
                onChange={(e) => setNewTimeLimit(Number.parseInt(e.target.value) || 0)}
                placeholder="0 = No limit"
              />
              <p className="text-xs text-muted-foreground mt-1">0 means no time limit</p>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-foreground mb-2">
                Deadline (Optional)
              </label>
              <Input
                id="deadline"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">Set both date and time</p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Audience</label>
              <Select
                value={targetingMode}
                onValueChange={(value: "category" | "users" | "groups") => setTargetingMode(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">By Category & Level</SelectItem>
                  <SelectItem value="users">Specific Users</SelectItem>
                  <SelectItem value="groups">By Groups</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetingMode === "users" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Select Users ({selectedUsers.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users found</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                        />
                        <label htmlFor={user.id} className="text-sm flex-1 cursor-pointer">
                          {user.username}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({user.category?.toUpperCase()} - {user.level || "basics"})
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {targetingMode === "groups" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Select Groups ({selectedGroups.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                  {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No groups found</p>
                  ) : (
                    groups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={group.id}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleGroupSelection(group.id, checked as boolean)}
                        />
                        <label htmlFor={group.id} className="text-sm flex-1 cursor-pointer">
                          {group.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({group.description || "No description"})
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleCreateQuiz} disabled={isCreating} className="bg-primary hover:bg-primary/90">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowStandardQuizForm(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Standard Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {showStandardQuizForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Standard Quiz</CardTitle>
            <p className="text-sm text-muted-foreground">
              Generate a quiz with numbered questions and A/B/C/D choices. You only need to select the correct answers.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="question-count" className="block text-sm font-medium text-foreground mb-2">
                Number of Questions (1-500)
              </label>
              <Input
                id="question-count"
                type="number"
                min="1"
                max="500"
                value={standardQuestionCount}
                onChange={(e) =>
                  setStandardQuestionCount(Math.min(500, Math.max(1, Number.parseInt(e.target.value) || 1)))
                }
                placeholder="Enter number of questions"
                className="w-48"
              />
            </div>

            <Button onClick={generateStandardQuestions} variant="outline" className="mb-4 bg-transparent">
              Generate Questions
            </Button>

            {standardQuestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Edit Questions and Set Correct Answers</h3>
                <div className="max-h-96 overflow-y-auto space-y-4 border rounded-md p-4">
                  {standardQuestions.map((q, index) => (
                    <div key={index} className="p-4 bg-muted rounded-md space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Question Title:</label>
                        <Input
                          value={q.question}
                          onChange={(e) => updateStandardQuestion(index, "question", e.target.value)}
                          placeholder={`Question ${index + 1}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Choice A:</label>
                          <Input
                            value={q.choice_a}
                            onChange={(e) => updateStandardQuestion(index, "choice_a", e.target.value)}
                            placeholder="Choice A"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Choice B:</label>
                          <Input
                            value={q.choice_b}
                            onChange={(e) => updateStandardQuestion(index, "choice_b", e.target.value)}
                            placeholder="Choice B"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Choice C:</label>
                          <Input
                            value={q.choice_c}
                            onChange={(e) => updateStandardQuestion(index, "choice_c", e.target.value)}
                            placeholder="Choice C"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Choice D:</label>
                          <Input
                            value={q.choice_d}
                            onChange={(e) => updateStandardQuestion(index, "choice_d", e.target.value)}
                            placeholder="Choice D"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Correct Answer:</span>
                        <Select
                          value={q.correct_answer}
                          onValueChange={(value: "a" | "b" | "c" | "d") => updateStandardQuestionAnswer(index, value)}
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="d">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleCreateStandardQuiz}
                    disabled={isCreating}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Standard Quiz
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStandardQuizForm(false)
                      setStandardQuestions([])
                      setStandardQuestionCount(10)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Questions Form */}
      {showQuestionForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? "Edit Quiz Questions" : "Add Questions"}
              {selectedQuizId && (
                <div className="text-sm text-muted-foreground mt-2">{questions.length} question(s) added</div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-foreground mb-2">
                Question
              </label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="choice-a" className="block text-sm font-medium text-foreground mb-2">
                  Choice A
                </label>
                <Input
                  id="choice-a"
                  value={choiceA}
                  onChange={(e) => setChoiceA(e.target.value)}
                  placeholder="Choice A"
                />
              </div>

              <div>
                <label htmlFor="choice-b" className="block text-sm font-medium text-foreground mb-2">
                  Choice B
                </label>
                <Input
                  id="choice-b"
                  value={choiceB}
                  onChange={(e) => setChoiceB(e.target.value)}
                  placeholder="Choice B"
                />
              </div>

              <div>
                <label htmlFor="choice-c" className="block text-sm font-medium text-foreground mb-2">
                  Choice C
                </label>
                <Input
                  id="choice-c"
                  value={choiceC}
                  onChange={(e) => setChoiceC(e.target.value)}
                  placeholder="Choice C"
                />
              </div>

              <div>
                <label htmlFor="choice-d" className="block text-sm font-medium text-foreground mb-2">
                  Choice D
                </label>
                <Input
                  id="choice-d"
                  value={choiceD}
                  onChange={(e) => setChoiceD(e.target.value)}
                  placeholder="Choice D"
                />
              </div>
            </div>

            <div>
              <label htmlFor="correct" className="block text-sm font-medium text-foreground mb-2">
                Correct Answer
              </label>
              <Select value={correctAnswer} onValueChange={(value: "a" | "b" | "c" | "d") => setCorrectAnswer(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">A</SelectItem>
                  <SelectItem value="b">B</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="d">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddQuestion} className="bg-primary hover:bg-primary/90">
                {editingQuestionId ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Question
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </>
                )}
              </Button>
              {editingQuestionId && (
                <Button variant="outline" onClick={resetQuestionForm}>
                  Cancel Edit
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuestionForm(false)
                  resetQuestionForm()
                  setIsEditMode(false)
                }}
              >
                Done
              </Button>
            </div>

            {questions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Questions Preview</h3>
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <Card key={q.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-foreground text-lg">Question {index + 1}</h4>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditQuestion(q)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-foreground mb-3">{q.question}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div
                            className={`p-2 rounded ${q.correct_answer === "a" ? "bg-green-100 text-green-800" : "bg-gray-100"}`}
                          >
                            A. {q.choice_a}
                          </div>
                          <div
                            className={`p-2 rounded ${q.correct_answer === "b" ? "bg-green-100 text-green-800" : "bg-gray-100"}`}
                          >
                            B. {q.choice_b}
                          </div>
                          <div
                            className={`p-2 rounded ${q.correct_answer === "c" ? "bg-green-100 text-green-800" : "bg-gray-100"}`}
                          >
                            C. {q.choice_c}
                          </div>
                          <div
                            className={`p-2 rounded ${q.correct_answer === "d" ? "bg-green-100 text-green-800" : "bg-gray-100"}`}
                          >
                            D. {q.choice_d}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Correct Answer: {q.correct_answer.toUpperCase()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quizzes List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Quizzes & Homework</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quizzes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No quizzes found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{quiz.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(quiz.created_at).toLocaleDateString()}
                        </p>
                        {quiz.deadline && (
                          <p className="text-sm text-red-600 font-medium">
                            Deadline:{" "}
                            {new Date(quiz.deadline).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="uppercase text-xs">
                          {quiz.category}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-xs">
                          {quiz.level === "all" ? "All Levels" : quiz.level || "basics"}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-xs">
                          {quiz.type}
                        </Badge>
                        {quiz.time_limit_minutes > 0 && (
                          <Badge variant="default" className="text-xs">
                            {quiz.time_limit_minutes} min
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuiz(quiz)}
                          className="flex-1 mr-2"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteQuiz(quiz.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
