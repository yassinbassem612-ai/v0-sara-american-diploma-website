"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import type { WeeklyReport } from "@/lib/types"
import { FileText, TrendingUp, Calendar } from "lucide-react"

interface WeeklyReportsProps {
  parentId: string
  childId: string
}

export function WeeklyReports({ parentId, childId }: WeeklyReportsProps) {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [parentId, childId])

  const fetchReports = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("weekly_reports")
        .select("*")
        .eq("parent_id", parentId)
        .eq("child_id", childId)
        .order("week_start", { ascending: false })

      if (error) throw error

      setReports(data || [])
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Weekly Reports</h2>
        <p className="text-muted-foreground">View your child's weekly progress reports</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No reports available yet</p>
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
                      Week of {new Date(report.week_start).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(report.week_start).toLocaleDateString()} -{" "}
                        {new Date(report.week_end).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {report.average_score}% Avg
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium">Assignments</p>
                    <p className="text-2xl font-bold">
                      {report.total_quizzes_completed}/{report.total_quizzes_assigned}
                    </p>
                    <Progress
                      value={(report.total_quizzes_completed / report.total_quizzes_assigned) * 100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Score</p>
                    <p className="text-2xl font-bold">{report.average_score}%</p>
                    <Progress value={report.average_score} className="mt-1" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sessions Attended</p>
                    <p className="text-2xl font-bold">{report.attendance_sessions}</p>
                  </div>
                </div>

                {report.pending_assignments && report.pending_assignments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Pending Assignments:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.pending_assignments.map((assignment, index) => (
                        <Badge key={index} variant="destructive">
                          {assignment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {report.completed_assignments && report.completed_assignments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Completed Assignments:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.completed_assignments.map((assignment, index) => (
                        <Badge key={index} variant="default">
                          {assignment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
