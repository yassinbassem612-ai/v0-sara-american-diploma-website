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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { Quiz, QuizSubmission, User, Certificate } from "@/lib/types"
import { Award, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function CertificateManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [submissions, setSubmissions] = useState<(QuizSubmission & { users: User })[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false })

      if (quizzesError) throw quizzesError

      // Fetch existing certificates
      const { data: certificatesData, error: certificatesError } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false })

      if (certificatesError) throw certificatesError

      setQuizzes(quizzesData || [])
      setCertificates(certificatesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from("quiz_submissions")
        .select(`
          *,
          users (
            id,
            username,
            category,
            level
          )
        `)
        .eq("quiz_id", quizId)
        .order("score", { ascending: false })

      if (error) throw error

      setSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast.error("Failed to load submissions")
    }
  }

  const openCreateDialog = async (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setSelectedStudents([])
    await fetchSubmissions(quiz.id)
    setIsCreateDialogOpen(true)
  }

  const createCertificates = async () => {
    try {
      if (!selectedQuiz || selectedStudents.length === 0) {
        toast.error("Please select students for certificates")
        return
      }

      setCreating(true)

      const certificatesToCreate = selectedStudents
        .map((studentId) => {
          const submission = submissions.find((sub) => sub.user_id === studentId)
          if (!submission) return null

          return {
            quiz_id: selectedQuiz.id,
            student_id: studentId,
            student_name: submission.users.username,
            quiz_title: selectedQuiz.title,
            category: submission.users.category || "N/A",
            score: submission.score,
            total_questions: submission.total_questions,
            instructor_name: "Sara Abdelwahab",
            is_visible_to_student: true,
          }
        })
        .filter(Boolean)

      const { error } = await supabase.from("certificates").insert(certificatesToCreate)

      if (error) throw error

      toast.success(`${certificatesToCreate.length} certificates created successfully`)
      setIsCreateDialogOpen(false)
      setSelectedQuiz(null)
      setSelectedStudents([])
      fetchData()
    } catch (error) {
      console.error("Error creating certificates:", error)
      toast.error("Failed to create certificates")
    } finally {
      setCreating(false)
    }
  }

  const deleteCertificate = async (certificateId: string) => {
    try {
      const { error } = await supabase.from("certificates").delete().eq("id", certificateId)

      if (error) throw error

      toast.success("Certificate deleted successfully")
      fetchData()
    } catch (error) {
      console.error("Error deleting certificate:", error)
      toast.error("Failed to delete certificate")
    }
  }

  const toggleVisibility = async (certificateId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from("certificates")
        .update({ is_visible_to_student: isVisible })
        .eq("id", certificateId)

      if (error) throw error

      toast.success(`Certificate ${isVisible ? "shown to" : "hidden from"} student`)
      fetchData()
    } catch (error) {
      console.error("Error updating certificate visibility:", error)
      toast.error("Failed to update certificate visibility")
    }
  }

  const getScorePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Certificate Management</h2>
          <p className="text-muted-foreground">Create and manage certificates for top-performing students</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Certificates</TabsTrigger>
          <TabsTrigger value="manage">Manage Certificates ({certificates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <div className="flex space-x-2">
                      <Badge variant="secondary">{quiz.type}</Badge>
                      <Badge variant="outline">{quiz.category?.toUpperCase()}</Badge>
                    </div>
                  </div>
                  <CardDescription>Created on {new Date(quiz.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => openCreateDialog(quiz)} className="w-full">
                    <Award className="h-4 w-4 mr-2" />
                    Create Certificates
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No certificates created yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {certificates.map((certificate) => (
                <Card key={certificate.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{certificate.student_name}</CardTitle>
                        <CardDescription>{certificate.quiz_title}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{certificate.category.toUpperCase()}</Badge>
                        <Badge variant="outline">
                          {certificate.score}/{certificate.total_questions} (
                          {getScorePercentage(certificate.score, certificate.total_questions)}%)
                        </Badge>
                        {certificate.is_visible_to_student ? (
                          <Badge variant="default">Visible</Badge>
                        ) : (
                          <Badge variant="destructive">Hidden</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>Instructor: {certificate.instructor_name}</p>
                        <p>Created: {new Date(certificate.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVisibility(certificate.id, !certificate.is_visible_to_student)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {certificate.is_visible_to_student ? "Hide" : "Show"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteCertificate(certificate.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Certificates Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Certificates</DialogTitle>
            <DialogDescription>Select students to receive certificates for "{selectedQuiz?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions found for this assignment</p>
            ) : (
              submissions.map((submission) => (
                <div key={submission.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={submission.user_id}
                    checked={selectedStudents.includes(submission.user_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStudents([...selectedStudents, submission.user_id])
                      } else {
                        setSelectedStudents(selectedStudents.filter((id) => id !== submission.user_id))
                      }
                    }}
                  />
                  <Label htmlFor={submission.user_id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{submission.users.username}</p>
                        <div className="flex space-x-2">
                          <Badge variant="secondary">{submission.users.category?.toUpperCase()}</Badge>
                          <Badge variant="outline">{submission.users.level}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {submission.score}/{submission.total_questions}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getScorePercentage(submission.score, submission.total_questions)}%
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createCertificates} disabled={creating || selectedStudents.length === 0}>
              <Award className="h-4 w-4 mr-2" />
              {creating ? "Creating..." : `Create ${selectedStudents.length} Certificate(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
