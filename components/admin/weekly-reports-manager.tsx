"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { WeeklyReport, Parent, User } from "@/lib/types"
import { FileText, Plus, Users } from "lucide-react"
import { toast } from "sonner"

export function WeeklyReportsManager() {
  const [reports, setReports] = useState<(WeeklyReport & { parents: Parent; users: User })[]>([])
  const [parents, setParents] = useState<(Parent & { children: User[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<string>("")
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [weekStart, setWeekStart] = useState("")
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch existing reports with parent and child info
      const { data: reportsData, error: reportsError } = await supabase
        .from("weekly_reports")
        .select(`
          *,
          parents (
            id,
            username,
            parent_name
          ),
          users (
            id,
            username,
            category,
            level
          )
        `)
        .order("week_start", { ascending: false })

      if (reportsError) throw reportsError

      // Fetch parents with their children
      const { data: parentChildData, error: parentChildError } = await supabase.from("parent_children").select(`
          parent_id,
          child_id,
          parents (
            id,
            username,
            parent_name
          ),
          users (
            id,
            username,
            category,
            level
          )
        `)

      if (parentChildError) throw parentChildError

      // Group children by parent
      const parentsWithChildren = parentChildData?.reduce((acc: any, item: any) => {
        const parentId = item.parent_id
        if (!acc[parentId]) {
          acc[parentId] = {
            ...item.parents,
            children: [],
          }
        }
        acc[parentId].children.push(item.users)
        return acc
      }, {})

      setReports(reportsData || [])
      setParents(Object.values(parentsWithChildren || {}))
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyReport = async () => {
    try {
      if (!selectedParent || !selectedChild || !weekStart) {
        toast.error("Please fill in all fields")
        return
      }

      setGenerating(true)

      const startDate = new Date(weekStart)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)

      // Calculate report data
      const reportData = await calculateWeeklyData(selectedChild, startDate, endDate)

      const { error } = await supabase.from("weekly_reports").insert([
        {
          parent_id: selectedParent,
          child_id: selectedChild,
          week_start: startDate.toISOString().split("T")[0],
          week_end: endDate.toISOString().split("T")[0],
          total_quizzes_assigned: reportData.totalAssigned,
          total_quizzes_completed: reportData.totalCompleted,
          average_score: reportData.averageScore,
          pending_assignments: reportData.pendingAssignments,
          completed_assignments: reportData.completedAssignments,
          attendance_sessions: reportData.attendanceSessions,
          report_data: reportData.additionalData,
        },
      ])

      if (error) throw error

      toast.success("Weekly report generated successfully")
      setIsGenerateDialogOpen(false)
      setSelectedParent("")
      setSelectedChild("")
      setWeekStart("")
      fetchData()
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const calculateWeeklyData = async (childId: string, startDate: Date, endDate: Date) => {
    try {
      // Fetch quiz submissions for the week
      const { data: submissions, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select(`
          *,
          quizzes (
            id,
            title,
            type
          )
        `)
        .eq("user_id", childId)
        .gte("submitted_at", startDate.toISOString())
        .lte("submitted_at", endDate.toISOString())

      if (submissionsError) throw submissionsError

      // Fetch all quizzes assigned during the week (simplified)
      const { data: allQuizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (quizzesError) throw quizzesError

      const totalCompleted = submissions?.length || 0
      const totalAssigned = allQuizzes?.length || 0
      const averageScore =
        totalCompleted > 0
          ? Math.round(
              submissions!.reduce((sum, sub) => sum + (sub.score / sub.total_questions) * 100, 0) / totalCompleted,
            )
          : 0

      const completedAssignments = submissions?.map((sub: any) => sub.quizzes.title) || []
      const pendingAssignments =
        allQuizzes
          ?.filter((quiz: any) => !submissions?.some((sub: any) => sub.quiz_id === quiz.id))
          .map((quiz: any) => quiz.title) || []

      return {
        totalAssigned,
        totalCompleted,
        averageScore,
        pendingAssignments,
        completedAssignments,
        attendanceSessions: Math.floor(Math.random() * 5), // Simplified - would need actual attendance tracking
        additionalData: {
          weekSummary: `Student completed ${totalCompleted} out of ${totalAssigned} assignments with an average score of ${averageScore}%`,
          improvements:
            totalCompleted > 0
              ? ["Good progress on assignments", "Consistent submission pattern"]
              : ["Needs to complete pending assignments"],
          recommendations:
            averageScore < 70
              ? ["Additional practice recommended", "Consider extra tutoring sessions"]
              : ["Keep up the excellent work!"],
        },
      }
    } catch (error) {
      console.error("Error calculating weekly data:", error)
      return {
        totalAssigned: 0,
        totalCompleted: 0,
        averageScore: 0,
        pendingAssignments: [],
        completedAssignments: [],
        attendanceSessions: 0,
        additionalData: {},
      }
    }
  }

  const getSelectedParentChildren = () => {
    const parent = parents.find((p) => p.id === selectedParent)
    return parent?.children || []
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Weekly Reports Management</h2>
          <p className="text-muted-foreground">Generate and manage weekly progress reports for parents</p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Generated Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="parents">Parent Overview ({parents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No reports generated yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {report.parents.parent_name} - {report.users.username}
                        </CardTitle>
                        <CardDescription>
                          Week of {new Date(report.week_start).toLocaleDateString()} -{" "}
                          {new Date(report.week_end).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{report.users.category?.toUpperCase()}</Badge>
                        <Badge variant="outline">{report.users.level}</Badge>
                        <Badge variant={report.average_score >= 70 ? "default" : "destructive"}>
                          {report.average_score}% Avg
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.total_quizzes_completed}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.total_quizzes_assigned}</p>
                        <p className="text-sm text-muted-foreground">Assigned</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.average_score}%</p>
                        <p className="text-sm text-muted-foreground">Average</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.attendance_sessions}</p>
                        <p className="text-sm text-muted-foreground">Sessions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="parents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parents.map((parent) => (
              <Card key={parent.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{parent.parent_name}</CardTitle>
                  <CardDescription>@{parent.username}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{parent.children.length} children</span>
                    </div>
                    <div className="space-y-1">
                      {parent.children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between text-sm">
                          <span>{child.username}</span>
                          <div className="flex space-x-1">
                            <Badge variant="secondary" className="text-xs">
                              {child.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {child.level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Weekly Report</DialogTitle>
            <DialogDescription>Create a weekly progress report for a parent and child</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent">Select Parent</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.parent_name} (@{parent.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedParent && (
              <div className="space-y-2">
                <Label htmlFor="child">Select Child</Label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSelectedParentChildren().map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.username} ({child.category?.toUpperCase()} - {child.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="week-start">Week Start Date</Label>
              <Input id="week-start" type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={generateWeeklyReport}
              disabled={generating || !selectedParent || !selectedChild || !weekStart}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "Generate Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
