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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Save,
  Users,
  FileText,
  AlertCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
} from "lucide-react"
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
  choice_e?: string | null
  correct_answer: string
  created_at: string
  display_order: number
}

interface StandardChoice {
  key: string // "a", "b", "c", "d", "e", ...
  label: string // "A", "B", "C", "D", "E", ...
  text: string
}

interface StandardQuestionItem {
  question: string
  choices: StandardChoice[]
  correct_answer: string
}

const LETTER_KEYS = ["a", "b", "c", "d", "e", "f", "g"]
const LETTER_LABELS = ["A", "B", "C", "D", "E", "F", "G"]

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

  // Standard Quiz Form State & Format Selection Modal
  const [showFormatModal, setShowFormatModal] = useState(false)
  const [standardFormat, setStandardFormat] = useState<"sat" | "est">("sat")
  const [showStandardQuizForm, setShowStandardQuizForm] = useState(false)
  const [startQuestionNumber, setStartQuestionNumber] = useState("1")
  const [endQuestionNumber, setEndQuestionNumber] = useState("10")
  const [standardQuestions, setStandardQuestions] = useState<StandardQuestionItem[]>([])

  // Quiz form state
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState<"act" | "sat" | "est">("sat")
  const [newLevel, setNewLevel] = useState<"advanced" | "basics" | "all">("basics")
  const [newType, setNewType] = useState<"quiz" | "homework">("quiz")
  const [newTimeLimit, setNewTimeLimit] = useState(0)
  const [newDeadline, setNewDeadline] = useState("")
  const [newNote, setNewNote] = useState("Classwork") // Exam alert / note e.g. "Classwork", "Homework"

  // Question form state (manual)
  const [question, setQuestion] = useState("")
  const [choiceA, setChoiceA] = useState("")
  const [choiceB, setChoiceB] = useState("")
  const [choiceC, setChoiceC] = useState("")
  const [choiceD, setChoiceD] = useState("")
  const [choiceE, setChoiceE] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState<string>("a")

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

  // Helper to extract note from quiz (either column or [Note] in title)
  const getQuizNote = (quiz: Quiz): string | null => {
    if (quiz.note && quiz.note.trim()) return quiz.note.trim()
    const match = quiz.title.match(/^\[(.*?)\]/)
    return match ? match[1].trim() : null
  }

  const getCleanTitle = (quiz: Quiz): string => {
    return quiz.title.replace(/^\[(.*?)\]\s*/, "")
  }

  // Opens the EST vs SAT selection modal
  const handleOpenStandardQuizFlow = () => {
    setShowFormatModal(true)
  }

  // Selecting EST or SAT from the modal
  const handleSelectFormat = (format: "est" | "sat") => {
    setStandardFormat(format)
    setNewCategory(format)
    setShowFormatModal(false)
    setShowStandardQuizForm(true)

    // Automatically generate default questions if none exist or regenerate with the chosen format
    const start = Number.parseInt(startQuestionNumber) || 1
    const end = Number.parseInt(endQuestionNumber) || 10
    buildQuestions(start, end, format)
  }

  const buildQuestions = (start: number, end: number, format: "est" | "sat") => {
    const choiceCount = format === "est" ? 5 : 4
    const newQuestions: StandardQuestionItem[] = []

    for (let i = start; i <= end; i++) {
      const choices: StandardChoice[] = []
      for (let c = 0; c < choiceCount; c++) {
        choices.push({
          key: LETTER_KEYS[c],
          label: LETTER_LABELS[c],
          text: LETTER_LABELS[c],
        })
      }
      newQuestions.push({
        question: `Question ${i}`,
        choices,
        correct_answer: "a",
      })
    }
    setStandardQuestions(newQuestions)
  }

  const generateStandardQuestions = () => {
    const start = Number.parseInt(startQuestionNumber) || 1
    const end = Number.parseInt(endQuestionNumber) || start

    if (start > end) {
      setMessage("Start question number must be less than or equal to end question number")
      return
    }

    if (start < 1 || end > 500) {
      setMessage("Question numbers must be between 1 and 500")
      return
    }

    buildQuestions(start, end, standardFormat)
  }

  // Update question title
  const updateStandardQuestionTitle = (qIndex: number, text: string) => {
    const updated = [...standardQuestions]
    updated[qIndex].question = text
    setStandardQuestions(updated)
  }

  // Update specific choice text
  const updateStandardChoiceText = (qIndex: number, choiceIndex: number, text: string) => {
    const updated = [...standardQuestions]
    updated[qIndex].choices[choiceIndex].text = text
    setStandardQuestions(updated)
  }

  // Add choice to a question
  const addChoiceToQuestion = (qIndex: number) => {
    const updated = [...standardQuestions]
    const currentChoices = updated[qIndex].choices
    if (currentChoices.length >= LETTER_KEYS.length) {
      setMessage(`Maximum of ${LETTER_KEYS.length} choices reached`)
      return
    }
    const nextIdx = currentChoices.length
    currentChoices.push({
      key: LETTER_KEYS[nextIdx],
      label: LETTER_LABELS[nextIdx],
      text: LETTER_LABELS[nextIdx],
    })
    setStandardQuestions(updated)
  }

  // Remove choice from a question
  const removeChoiceFromQuestion = (qIndex: number, choiceIndex: number) => {
    const updated = [...standardQuestions]
    const currentChoices = updated[qIndex].choices
    if (currentChoices.length <= 2) {
      setMessage("A question must have at least 2 choices")
      return
    }

    const removedKey = currentChoices[choiceIndex].key
    currentChoices.splice(choiceIndex, 1)

    // Re-index remaining choices sequentially (A, B, C...)
    currentChoices.forEach((c, idx) => {
      c.key = LETTER_KEYS[idx]
      c.label = LETTER_LABELS[idx]
    })

    // Reset correct answer if it was deleted or became invalid
    const validKeys = currentChoices.map((c) => c.key)
    if (!validKeys.includes(updated[qIndex].correct_answer)) {
      updated[qIndex].correct_answer = validKeys[0] || "a"
    }

    setStandardQuestions(updated)
  }

  // Update correct answer for standard question
  const updateStandardQuestionAnswer = (qIndex: number, answer: string) => {
    const updated = [...standardQuestions]
    updated[qIndex].correct_answer = answer
    setStandardQuestions(updated)
  }

  const fetchQuestions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("display_order", { ascending: true })

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
    if (!newTitle.trim()) {
      setMessage("Quiz title is required")
      return
    }

    setIsCreating(true)
    setMessage("")

    try {
      const deadlineValue = newDeadline ? new Date(newDeadline).toISOString() : null
      const targetUsers = targetingMode === "users" && selectedUsers.length > 0 ? selectedUsers : null
      const targetGroups = targetingMode === "groups" && selectedGroups.length > 0 ? selectedGroups : null
      const cleanTitleText = newTitle.trim().replace(/^\[.*?\]\s*/, "")
      const noteValue = newNote ? newNote.trim() : null

      // Attempt 1: Insert with note column
      let quizData: any = null
      let quizError: any = null

      const primaryPayload: any = {
        title: cleanTitleText,
        category: newCategory,
        level: newLevel,
        type: newType,
        time_limit_minutes: newTimeLimit,
        deadline: deadlineValue,
        target_users: targetUsers,
        target_groups: targetGroups,
        note: noteValue,
      }

      const res = await supabase.from("quizzes").insert([primaryPayload]).select()
      quizData = res.data
      quizError = res.error

      // If 'note' column doesn't exist yet, fallback to storing note prefix in title [Note] Title
      if (quizError && (quizError.code === "42703" || quizError.message?.toLowerCase().includes("note"))) {
        console.log("[v0] Note column does not exist yet. Fallback to encoding note in title.")
        const titleWithFallback = noteValue ? `[${noteValue}] ${cleanTitleText}` : cleanTitleText
        delete primaryPayload.note
        primaryPayload.title = titleWithFallback

        const fallbackRes = await supabase.from("quizzes").insert([primaryPayload]).select()
        quizData = fallbackRes.data
        quizError = fallbackRes.error
      }

      if (quizError) {
        console.error("[v0] Database error:", quizError)
        setMessage("Error creating quiz: " + quizError.message)
      } else {
        setMessage("Quiz created successfully!")
        setNewTitle("")
        setNewCategory("sat")
        setNewLevel("basics")
        setNewType("quiz")
        setNewTimeLimit(0)
        setNewDeadline("")
        setNewNote("Classwork")
        setTargetingMode("category")
        setSelectedUsers([])
        setSelectedGroups([])
        fetchQuizzes()
        if (quizData && quizData[0]) {
          setSelectedQuizId(quizData[0].id)
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
      setMessage("All question fields (Question and Choices A-D) are required")
      return
    }

    try {
      if (editingQuestionId) {
        const updatePayload: any = {
          question,
          choice_a: choiceA,
          choice_b: choiceB,
          choice_c: choiceC,
          choice_d: choiceD,
          choice_e: choiceE.trim() || null,
          correct_answer: correctAnswer,
        }

        let { error } = await supabase.from("quiz_questions").update(updatePayload).eq("id", editingQuestionId)

        if (error && (error.code === "42703" || error.message?.toLowerCase().includes("choice_e"))) {
          delete updatePayload.choice_e
          const res = await supabase.from("quiz_questions").update(updatePayload).eq("id", editingQuestionId)
          error = res.error
        }

        if (error) {
          setMessage("Error updating question: " + error.message)
        } else {
          setMessage("Question updated successfully!")
          setEditingQuestionId(null)
          fetchQuestions(selectedQuizId)
        }
      } else {
        const { data: existingQuestions } = await supabase
          .from("quiz_questions")
          .select("display_order")
          .eq("quiz_id", selectedQuizId)
          .order("display_order", { ascending: false })
          .limit(1)

        const nextOrder =
          existingQuestions && existingQuestions.length > 0 ? (existingQuestions[0].display_order || 0) + 1 : 1

        const insertPayload: any = {
          quiz_id: selectedQuizId,
          question,
          choice_a: choiceA,
          choice_b: choiceB,
          choice_c: choiceC,
          choice_d: choiceD,
          choice_e: choiceE.trim() || null,
          correct_answer: correctAnswer,
          display_order: nextOrder,
        }

        let { error } = await supabase.from("quiz_questions").insert([insertPayload])

        if (error && (error.code === "42703" || error.message?.toLowerCase().includes("choice_e"))) {
          delete insertPayload.choice_e
          const res = await supabase.from("quiz_questions").insert([insertPayload])
          error = res.error
        }

        if (error) {
          setMessage("Error adding question: " + error.message)
        } else {
          setMessage("Question added successfully!")
          fetchQuestions(selectedQuizId)
        }
      }

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
    setChoiceE("")
    setCorrectAnswer("a")
    setEditingQuestionId(null)
  }

  const handleEditQuestion = (q: QuizQuestion) => {
    setQuestion(q.question)
    setChoiceA(q.choice_a)
    setChoiceB(q.choice_b)
    setChoiceC(q.choice_c)
    setChoiceD(q.choice_d)
    setChoiceE(q.choice_e || "")
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
    const cleanTitle = getCleanTitle(quiz)
    const note = getQuizNote(quiz)
    setNewTitle(cleanTitle)
    setNewNote(note || "Classwork")
    setNewCategory(quiz.category as "act" | "sat" | "est")
    setNewLevel(quiz.level as "advanced" | "basics" | "all")
    setNewType(quiz.type as "quiz" | "homework")
    setNewTimeLimit(quiz.time_limit_minutes || 0)
    setNewDeadline(quiz.deadline ? new Date(quiz.deadline).toISOString().slice(0, 16) : "")
    setShowQuestionForm(true)
    await fetchQuestions(quiz.id)
  }

  const handleSaveQuizChanges = async () => {
    if (!newTitle.trim()) {
      setMessage("Quiz title is required")
      return
    }

    try {
      const deadlineValue = newDeadline ? new Date(newDeadline).toISOString() : null
      const cleanTitleText = newTitle.trim().replace(/^\[.*?\]\s*/, "")
      const noteValue = newNote ? newNote.trim() : null

      const updatePayload: any = {
        title: cleanTitleText,
        category: newCategory,
        level: newLevel,
        type: newType,
        time_limit_minutes: newTimeLimit,
        deadline: deadlineValue,
        note: noteValue,
      }

      let { error } = await supabase.from("quizzes").update(updatePayload).eq("id", selectedQuizId)

      if (error && (error.code === "42703" || error.message?.toLowerCase().includes("note"))) {
        const titleWithFallback = noteValue ? `[${noteValue}] ${cleanTitleText}` : cleanTitleText
        delete updatePayload.note
        updatePayload.title = titleWithFallback
        const fallbackRes = await supabase.from("quizzes").update(updatePayload).eq("id", selectedQuizId)
        error = fallbackRes.error
      }

      if (error) {
        setMessage("Error updating quiz: " + error.message)
      } else {
        setMessage("Quiz updated successfully!")
        fetchQuizzes()
        setIsEditMode(false)
        setShowQuestionForm(false)
        setNewTitle("")
        setNewNote("Classwork")
        setNewCategory("sat")
        setNewLevel("basics")
        setNewType("quiz")
        setNewTimeLimit(0)
        setNewDeadline("")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error updating quiz")
    }
  }

  const handleCreateStandardQuiz = async () => {
    if (!newTitle.trim()) {
      setMessage("Quiz title is required")
      return
    }

    if (standardQuestions.length === 0) {
      setMessage("Please generate questions first")
      return
    }

    // Verify all choices have non-empty text
    const hasEmptyField = standardQuestions.some(
      (q) => !q.question.trim() || q.choices.some((c) => !c.text.trim())
    )

    if (hasEmptyField) {
      setMessage("Please fill in all question fields and choices")
      return
    }

    setIsCreating(true)
    setMessage("")

    try {
      const deadlineValue = newDeadline ? new Date(newDeadline).toISOString() : null
      const targetUsers = targetingMode === "users" && selectedUsers.length > 0 ? selectedUsers : null
      const targetGroups = targetingMode === "groups" && selectedGroups.length > 0 ? selectedGroups : null
      const cleanTitleText = newTitle.trim().replace(/^\[.*?\]\s*/, "")
      const noteValue = newNote ? newNote.trim() : null

      const primaryPayload: any = {
        title: cleanTitleText,
        category: standardFormat, // 'est' or 'sat'
        level: newLevel,
        type: newType,
        time_limit_minutes: newTimeLimit,
        deadline: deadlineValue,
        target_users: targetUsers,
        target_groups: targetGroups,
        note: noteValue,
      }

      let { data: quizData, error: quizError } = await supabase.from("quizzes").insert([primaryPayload]).select()

      if (quizError && (quizError.code === "42703" || quizError.message?.toLowerCase().includes("note"))) {
        const titleWithFallback = noteValue ? `[${noteValue}] ${cleanTitleText}` : cleanTitleText
        delete primaryPayload.note
        primaryPayload.title = titleWithFallback
        const fallbackRes = await supabase.from("quizzes").insert([primaryPayload]).select()
        quizData = fallbackRes.data
        quizError = fallbackRes.error
      }

      if (quizError || !quizData || quizData.length === 0) {
        setMessage("Error creating quiz: " + (quizError?.message || "Unknown error"))
        return
      }

      const quizId = quizData[0].id

      const questionsToInsert = standardQuestions.map((q, index) => {
        const getChoice = (k: string) => {
          const found = q.choices.find((c) => c.key === k)
          return found ? found.text : ""
        }
        return {
          quiz_id: quizId,
          question: q.question,
          choice_a: getChoice("a"),
          choice_b: getChoice("b"),
          choice_c: getChoice("c"),
          choice_d: getChoice("d"),
          choice_e: getChoice("e") || null,
          correct_answer: q.correct_answer.toLowerCase(),
          display_order: index + 1,
        }
      })

      let { error: questionsError } = await supabase.from("quiz_questions").insert(questionsToInsert)

      // Fallback if choice_e column is not in DB yet
      if (questionsError && (questionsError.code === "42703" || questionsError.message?.toLowerCase().includes("choice_e"))) {
        console.log("[v0] Retrying insert without choice_e column...")
        const fallbackQuestions = questionsToInsert.map(({ choice_e, ...rest }) => rest)
        const fallbackRes = await supabase.from("quiz_questions").insert(fallbackQuestions)
        questionsError = fallbackRes.error
      }

      if (questionsError) {
        console.error("[v0] Questions insertion error:", questionsError)
        setMessage("Quiz created but error adding questions: " + questionsError.message)
        return
      }

      setMessage("Standard quiz created successfully!")
      setNewTitle("")
      setNewCategory("sat")
      setNewLevel("basics")
      setNewType("quiz")
      setNewTimeLimit(0)
      setNewDeadline("")
      setNewNote("Classwork")
      setTargetingMode("category")
      setSelectedUsers([])
      setSelectedGroups([])
      setShowStandardQuizForm(false)
      setStandardQuestions([])
      setStartQuestionNumber("1")
      setEndQuestionNumber("10")
      fetchQuizzes()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error creating standard quiz:", error)
      setMessage("Error creating standard quiz")
    } finally {
      setIsCreating(false)
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Quiz & Homework Management</h2>
        <p className="text-muted-foreground">Create and manage quizzes, homework assignments, and standard exam sheets.</p>
      </div>

      {message && (
        <Alert className={message.includes("Error") ? "border-destructive bg-destructive/10" : "border-green-500 bg-green-50 text-green-900"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* EST vs SAT Format Selection Dialog */}
      <Dialog open={showFormatModal} onOpenChange={setShowFormatModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Select Standard Quiz Format</span>
            </DialogTitle>
            <DialogDescription>
              Choose your exam format. EST includes 5 choices (A, B, C, D, E), while SAT includes 4 choices (A, B, C, D). All choices are fully customizable.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* EST Format Option */}
            <button
              type="button"
              onClick={() => handleSelectFormat("est")}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-500 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">EST Exam</Badge>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                  5 Choices
                </span>
              </div>
              <h4 className="font-semibold text-foreground text-base mb-1 group-hover:text-indigo-600 transition-colors">
                EST Format
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Default choices: <strong className="text-foreground">A, B, C, D, E</strong>
              </p>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-auto flex items-center">
                Select EST &rarr;
              </span>
            </button>

            {/* SAT Format Option */}
            <button
              type="button"
              onClick={() => handleSelectFormat("sat")}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 hover:border-blue-500 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold">SAT Exam</Badge>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  4 Choices
                </span>
              </div>
              <h4 className="font-semibold text-foreground text-base mb-1 group-hover:text-blue-600 transition-colors">
                SAT Format
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Default choices: <strong className="text-foreground">A, B, C, D</strong>
              </p>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-auto flex items-center">
                Select SAT &rarr;
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Quiz Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Quiz / Homework</CardTitle>
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
                  <SelectItem value="est">EST</SelectItem>
                  <SelectItem value="act">ACT</SelectItem>
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

          {/* Exam Alert / Note Field (Classwork vs Homework distinguish) */}
          <div className="p-4 bg-muted/40 rounded-lg border space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label htmlFor="exam-note" className="text-sm font-medium text-foreground flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>Exam Alert / Note (Displays prominently for students)</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Quick Select:</span>
                <Button
                  type="button"
                  size="sm"
                  variant={newNote === "Classwork" ? "default" : "outline"}
                  onClick={() => setNewNote("Classwork")}
                  className={`h-7 px-2.5 text-xs ${
                    newNote === "Classwork" ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-blue-700 border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  📝 Classwork
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={newNote === "Homework" ? "default" : "outline"}
                  onClick={() => setNewNote("Homework")}
                  className={`h-7 px-2.5 text-xs ${
                    newNote === "Homework" ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-amber-700 border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  🏠 Homework
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={newNote === "In-Class Quiz" ? "default" : "outline"}
                  onClick={() => setNewNote("In-Class Quiz")}
                  className={`h-7 px-2.5 text-xs ${
                    newNote === "In-Class Quiz" ? "bg-purple-600 hover:bg-purple-700 text-white" : "text-purple-700 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  ⏱️ In-Class Quiz
                </Button>
                {newNote && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setNewNote("")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <Input
              id="exam-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Classwork, Homework, Week 4 Revision..."
            />
            <p className="text-xs text-muted-foreground">
              Students will see this note in a prominent alert banner so they can easily distinguish exams with the same name.
            </p>
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

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={handleCreateQuiz} disabled={isCreating} className="bg-primary hover:bg-primary/90">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz (Manual Questions)
                </>
              )}
            </Button>

            <Button
              onClick={handleOpenStandardQuizFlow}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium"
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Standard Quiz (EST / SAT)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Standard Quiz Form */}
      {showStandardQuizForm && (
        <Card className="border-2 border-primary/20 shadow-md">
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-xl flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Create Standard Quiz</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Standard format for {standardFormat.toUpperCase()} ({standardFormat === "est" ? "5 Choices: A, B, C, D, E" : "4 Choices: A, B, C, D"}). Choices are fully editable and can be added or removed.
                </p>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center space-x-2 bg-background p-1.5 rounded-lg border">
                <span className="text-xs font-medium text-muted-foreground ml-1">Format:</span>
                <Button
                  type="button"
                  size="sm"
                  variant={standardFormat === "est" ? "default" : "ghost"}
                  onClick={() => handleSelectFormat("est")}
                  className={`h-7 px-3 text-xs ${standardFormat === "est" ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold" : ""}`}
                >
                  EST (A-E)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={standardFormat === "sat" ? "default" : "ghost"}
                  onClick={() => handleSelectFormat("sat")}
                  className={`h-7 px-3 text-xs ${standardFormat === "sat" ? "bg-blue-600 hover:bg-blue-700 text-white font-bold" : ""}`}
                >
                  SAT (A-D)
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-question" className="block text-sm font-medium text-foreground mb-2">
                  Start Question Number
                </label>
                <Input
                  id="start-question"
                  type="number"
                  min="1"
                  max="500"
                  value={startQuestionNumber}
                  onChange={(e) => setStartQuestionNumber(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>

              <div>
                <label htmlFor="end-question" className="block text-sm font-medium text-foreground mb-2">
                  End Question Number
                </label>
                <Input
                  id="end-question"
                  type="number"
                  min="1"
                  max="500"
                  value={endQuestionNumber}
                  onChange={(e) => setEndQuestionNumber(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            <Button onClick={generateStandardQuestions} variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Questions ({standardFormat.toUpperCase()})
            </Button>

            {standardQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>Questions ({standardQuestions.length})</span>
                    <Badge variant="secondary" className="uppercase text-xs">
                      {standardFormat} Format
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Edit question titles, choices, or add/remove choices per question.
                  </p>
                </div>

                <div className="max-h-[32rem] overflow-y-auto space-y-4 border rounded-lg p-4 bg-background">
                  {standardQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-muted/50 border rounded-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b">
                        <span className="font-semibold text-sm text-primary">Question #{qIndex + 1}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-foreground">Correct Answer:</span>
                          <Select
                            value={q.correct_answer}
                            onValueChange={(val) => updateStandardQuestionAnswer(qIndex, val)}
                          >
                            <SelectTrigger className="w-20 h-8 font-bold bg-green-50 border-green-300 text-green-800">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {q.choices.map((c) => (
                                <SelectItem key={c.key} value={c.key}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Question Prompt / Title:
                        </label>
                        <Input
                          value={q.question}
                          onChange={(e) => updateStandardQuestionTitle(qIndex, e.target.value)}
                          placeholder={`Question ${qIndex + 1}`}
                          className="bg-background"
                        />
                      </div>

                      {/* Dynamic Editable Choices */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Choices ({q.choices.length}):
                          </label>
                          {q.choices.length < LETTER_KEYS.length && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => addChoiceToQuestion(qIndex)}
                              className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Choice ({LETTER_LABELS[q.choices.length]})
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {q.choices.map((choice, cIndex) => {
                            const isCorrect = q.correct_answer === choice.key
                            return (
                              <div
                                key={choice.key}
                                className={`flex items-center space-x-1.5 p-1.5 rounded-md border bg-background ${
                                  isCorrect ? "border-green-400 ring-1 ring-green-300" : ""
                                }`}
                              >
                                <span
                                  className={`h-6 w-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isCorrect ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {choice.label}
                                </span>
                                <Input
                                  value={choice.text}
                                  onChange={(e) => updateStandardChoiceText(qIndex, cIndex, e.target.value)}
                                  placeholder={`Choice ${choice.label}`}
                                  className="h-7 text-xs flex-1"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeChoiceFromQuestion(qIndex, cIndex)}
                                  disabled={q.choices.length <= 2}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                  title="Remove Choice"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={handleCreateStandardQuiz}
                    disabled={isCreating}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Standard Quiz...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Standard Quiz ({standardFormat.toUpperCase()})
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStandardQuizForm(false)
                      setStandardQuestions([])
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

      {/* Add/Edit Questions Form (Manual Mode) */}
      {showQuestionForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? "Edit Quiz" : "Add Questions"}
              {selectedQuizId && (
                <div className="text-sm text-muted-foreground mt-2">{questions.length} question(s) added</div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode && (
              <div className="space-y-4 border-b pb-4 mb-4">
                <h3 className="text-lg font-semibold">Quiz Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium text-foreground mb-2">
                      Title
                    </label>
                    <Input
                      id="edit-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Enter quiz title"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-foreground mb-2">
                      Category
                    </label>
                    <Select value={newCategory} onValueChange={(value: "act" | "sat" | "est") => setNewCategory(value)}>
                      <SelectTrigger id="edit-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sat">SAT</SelectItem>
                        <SelectItem value="est">EST</SelectItem>
                        <SelectItem value="act">ACT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="edit-level" className="block text-sm font-medium text-foreground mb-2">
                      Level
                    </label>
                    <Select value={newLevel} onValueChange={(value: "advanced" | "basics" | "all") => setNewLevel(value)}>
                      <SelectTrigger id="edit-level">
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
                    <label htmlFor="edit-type" className="block text-sm font-medium text-foreground mb-2">
                      Type
                    </label>
                    <Select value={newType} onValueChange={(value: "quiz" | "homework") => setNewType(value)}>
                      <SelectTrigger id="edit-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Edit Note Field */}
                <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="edit-note" className="text-sm font-medium">Exam Alert / Note (Classwork vs. Homework):</label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={newNote === "Classwork" ? "default" : "outline"}
                        onClick={() => setNewNote("Classwork")}
                        className="h-6 px-2 text-xs"
                      >
                        📝 Classwork
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={newNote === "Homework" ? "default" : "outline"}
                        onClick={() => setNewNote("Homework")}
                        className="h-6 px-2 text-xs"
                      >
                        🏠 Homework
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="edit-note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Classwork, Homework..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSaveQuizChanges} className="bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" />
                    Save Quiz Details
                  </Button>
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-4">{isEditMode ? "Edit Questions" : "Add Questions"}</h3>

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              <div>
                <label htmlFor="choice-e" className="block text-sm font-medium text-foreground mb-2">
                  Choice E (Optional for EST)
                </label>
                <Input
                  id="choice-e"
                  value={choiceE}
                  onChange={(e) => setChoiceE(e.target.value)}
                  placeholder="Choice E (Optional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="correct" className="block text-sm font-medium text-foreground mb-2">
                Correct Answer
              </label>
              <Select value={correctAnswer} onValueChange={(value) => setCorrectAnswer(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">A</SelectItem>
                  <SelectItem value="b">B</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="d">D</SelectItem>
                  <SelectItem value="e">E</SelectItem>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div
                            className={`p-2 rounded ${q.correct_answer === "a" ? "bg-green-100 text-green-800 font-semibold" : "bg-gray-100 dark:bg-gray-800"}`}
                          >
                            A. {q.choice_a}
                          </div>
                          <div
                            className={`p-2 rounded ${q.correct_answer === "b" ? "bg-green-100 text-green-800 font-semibold" : "bg-gray-100 dark:bg-gray-800"}`}
                          >
                            B. {q.choice_b}
                          </div>
                          <div
                            className={`p-2 rounded ${q.correct_answer === "c" ? "bg-green-100 text-green-800 font-semibold" : "bg-gray-100 dark:bg-gray-800"}`}
                          >
                            C. {q.choice_c}
                          </div>
                          <div
                            className={`p-2 rounded ${q.correct_answer === "d" ? "bg-green-100 text-green-800 font-semibold" : "bg-gray-100 dark:bg-gray-800"}`}
                          >
                            D. {q.choice_d}
                          </div>
                          {q.choice_e && (
                            <div
                              className={`p-2 rounded ${q.correct_answer === "e" ? "bg-green-100 text-green-800 font-semibold" : "bg-gray-100 dark:bg-gray-800"}`}
                            >
                              E. {q.choice_e}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Correct Answer: <strong className="text-primary">{q.correct_answer.toUpperCase()}</strong>
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
              {quizzes.map((quiz) => {
                const note = getQuizNote(quiz)
                const cleanTitle = getCleanTitle(quiz)
                return (
                  <Card key={quiz.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          {/* Alert Note Badge for Classwork vs. Homework */}
                          {note && (
                            <div className="mb-1.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs ${
                                  note.toLowerCase().includes("class")
                                    ? "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700"
                                    : note.toLowerCase().includes("home")
                                    ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
                                    : "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700"
                                }`}
                              >
                                {note.toLowerCase().includes("class") ? "📝 " : note.toLowerCase().includes("home") ? "🏠 " : "📢 "}
                                {note}
                              </span>
                            </div>
                          )}

                          <h3 className="font-semibold text-foreground text-lg leading-tight">{cleanTitle}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(quiz.created_at).toLocaleDateString()}
                          </p>
                          {quiz.deadline && (
                            <p className="text-xs text-red-600 font-medium mt-0.5">
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

                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="uppercase text-xs font-semibold">
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

                        <div className="flex justify-between items-center pt-2 border-t">
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
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
