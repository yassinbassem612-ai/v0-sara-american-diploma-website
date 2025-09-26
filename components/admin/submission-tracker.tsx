"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Users, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Quiz, Group } from "@/lib/types"

interface NonSubmission {
  user_id: string
  username: string
  category: string
  level: string
}

export function SubmissionTracker() {
  const [filterType, setFilterType] = useState<"category" | "group">("category")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [selectedQuiz, setSelectedQuiz] = useState<string>("")
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [nonSubmissions, setNonSubmissions] = useState<NonSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Load quizzes and groups on component mount
  useEffect(() => {
    loadQuizzes()
    loadGroups()
  }, [])

  // Load non-submissions when filters and quiz are selected
  useEffect(() => {
    if (filterType === "category" && selectedCategory && selectedLevel && selectedQuiz) {
      loadNonSubmissions()
    } else if (filterType === "group" && selectedGroup && selectedQuiz) {
      loadNonSubmissions()
    }
  }, [filterType, selectedCategory, selectedLevel, selectedGroup, selectedQuiz])

  useEffect(() => {
    setSelectedCategory("")
    setSelectedLevel("")
    setSelectedGroup("")
    setSelectedQuiz("")
    setNonSubmissions([])
  }, [filterType])

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setQuizzes(data || [])
    } catch (error) {
      console.error("Error loading quizzes:", error)
    }
  }

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase.from("groups").select("*").order("name")

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error("Error loading groups:", error)
    }
  }

  const loadNonSubmissions = async () => {
    if (filterType === "category" && (!selectedCategory || !selectedLevel || !selectedQuiz)) return
    if (filterType === "group" && (!selectedGroup || !selectedQuiz)) return

    setLoading(true)
    try {
      let users: any[] = []

      if (filterType === "category") {
        // Get all users in the selected category and level
        const { data: categoryUsers, error: usersError } = await supabase
          .from("users")
          .select("id, username, category, level")
          .eq("category", selectedCategory)
          .eq("level", selectedLevel)
          .eq("role", "student")

        if (usersError) throw usersError
        users = categoryUsers || []
      } else if (filterType === "group") {
        const { data: groupUsers, error: groupUsersError } = await supabase
          .from("group_memberships")
          .select(`
            user_id,
            users!inner (
              id,
              username,
              category,
              level
            )
          `)
          .eq("group_id", selectedGroup)

        if (groupUsersError) throw groupUsersError
        users = groupUsers?.map((membership: any) => membership.users) || []
      }

      // Get users who have submitted this quiz
      const { data: submissions, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select("user_id")
        .eq("quiz_id", selectedQuiz)

      if (submissionsError) throw submissionsError

      // Find users who haven't submitted
      const submittedUserIds = new Set(submissions?.map((s) => s.user_id) || [])
      const nonSubmittedUsers = users?.filter((user) => !submittedUserIds.has(user.id)) || []

      setNonSubmissions(
        nonSubmittedUsers.map((user) => ({
          user_id: user.id,
          username: user.username,
          category: user.category || "N/A",
          level: user.level || "basics",
        })),
      )
    } catch (error) {
      console.error("Error loading non-submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredQuizzes = () => {
    if (filterType === "category" && selectedCategory && selectedLevel) {
      return quizzes.filter(
        (quiz) =>
          (quiz.category === selectedCategory || quiz.category === "all") &&
          (quiz.level === selectedLevel || quiz.level === "all"),
      )
    } else if (filterType === "group" && selectedGroup) {
      // For group filtering, show quizzes that either target this group or are for all groups
      return quizzes.filter((quiz) => {
        if (!quiz.target_groups || quiz.target_groups.length === 0) {
          // If no target groups specified, it's available to all
          return true
        }
        return quiz.target_groups.includes(selectedGroup)
      })
    }
    return quizzes
  }

  const filteredQuizzes = getFilteredQuizzes()
  const selectedQuizData = quizzes.find((q) => q.id === selectedQuiz)

  const canShowResults =
    (filterType === "category" && selectedCategory && selectedLevel && selectedQuiz) ||
    (filterType === "group" && selectedGroup && selectedQuiz)

  const shouldShowSelectionPrompt =
    (filterType === "category" && (!selectedCategory || !selectedLevel)) || (filterType === "group" && !selectedGroup)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Submission Tracker</h2>
        <p className="text-muted-foreground">
          Track which students haven't submitted their quizzes or homework assignments.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filter Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filterType} onValueChange={(value: "category" | "group") => setFilterType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose filter method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">By Category & Level</SelectItem>
              <SelectItem value="group">By Group</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filterType === "category" ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Select Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sat">SAT Students</SelectItem>
                    <SelectItem value="act">ACT Students</SelectItem>
                    <SelectItem value="est">EST Students</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Select Level</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!selectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="basics">Basics</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Select Group</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{group.name}</span>
                          {group.description && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {group.description}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            {/* Empty card to maintain grid layout */}
            <div></div>
          </>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select Quiz/Homework</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedQuiz}
              onValueChange={setSelectedQuiz}
              disabled={
                (filterType === "category" && (!selectedCategory || !selectedLevel)) ||
                (filterType === "group" && !selectedGroup)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose quiz or homework" />
              </SelectTrigger>
              <SelectContent>
                {filteredQuizzes.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{quiz.title}</span>
                      <Badge variant="outline" className="ml-2">
                        {quiz.category === "all" ? "All Categories" : quiz.category.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="ml-1">
                        {quiz.level === "all" ? "All Levels" : quiz.level}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {canShowResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span>Students Who Haven't Submitted</span>
                </CardTitle>
                <CardDescription>
                  {selectedQuizData?.title} -{" "}
                  {filterType === "category"
                    ? `${selectedCategory.toUpperCase()} ${selectedLevel} Students`
                    : `${groups.find((g) => g.id === selectedGroup)?.name} Group`}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{nonSubmissions.length} pending</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : nonSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">All Students Submitted!</h3>
                <p className="text-muted-foreground">
                  Every student in the selected {filterType === "category" ? "category and level" : "group"} has
                  completed this assignment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {nonSubmissions.map((student) => (
                  <div
                    key={student.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.category.toUpperCase()} - {student.level} Student
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Not Submitted
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {shouldShowSelectionPrompt && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {filterType === "category" ? "Select Category, Level and Quiz" : "Select Group and Quiz"}
              </h3>
              <p className="text-muted-foreground">
                {filterType === "category"
                  ? "Choose a student category, level, and quiz/homework to see who hasn't submitted yet."
                  : "Choose a student group and quiz/homework to see who hasn't submitted yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
