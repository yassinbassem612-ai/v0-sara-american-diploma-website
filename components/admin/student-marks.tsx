'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface StudentUser {
  id: string
  username: string
  category: string
  level: string
  is_active: boolean
}

interface QuizData {
  id: string
  title: string
  type: string
  category: string
  level: string
}

interface StudentMarksData {
  quiz_id: string
  quiz_title: string
  quiz_type: string
  score: number
  total_questions: number
  status: 'submitted' | 'pending'
}

export function StudentMarks() {
  const [students, setStudents] = useState<StudentUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null)
  const [studentMarks, setStudentMarks] = useState<StudentMarksData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMarks, setIsLoadingMarks] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('username', { ascending: true })

      if (error) {
        console.error('Error fetching students:', error)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudentMarks = async (studentId: string, category: string, level: string) => {
    setIsLoadingMarks(true)
    try {
      // Fetch all quizzes and homework for this student's category and level
      const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('category', category)
        .eq('level', level)
        .order('created_at', { ascending: false })

      if (quizError) {
        console.error('Error fetching quizzes:', quizError)
        return
      }

      // Fetch all submissions for this student
      const { data: submissions, error: submissionError } = await supabase
        .from('quiz_submissions')
        .select('quiz_id, score, total_questions, submitted_at')
        .eq('user_id', studentId)

      if (submissionError) {
        console.error('Error fetching submissions:', submissionError)
        return
      }

      // Create a map of submissions for quick lookup
      const submissionMap = new Map(submissions?.map((s) => [s.quiz_id, s]) || [])

      // Combine quizzes with submissions, showing 0 for pending ones
      const marksData: StudentMarksData[] = (quizzes || []).map((quiz) => {
        const submission = submissionMap.get(quiz.id)
        return {
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          quiz_type: quiz.type,
          score: submission?.score || 0,
          total_questions: submission?.total_questions || 0,
          status: submission ? 'submitted' : 'pending',
        }
      })

      setStudentMarks(marksData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoadingMarks(false)
    }
  }

  const handleSelectStudent = (student: StudentUser) => {
    setSelectedStudent(student)
    fetchStudentMarks(student.id, student.category, student.level)
  }

  const filteredStudents = students.filter((student) =>
    student.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Student Marks</h2>
        <p className="text-muted-foreground">Search for a student to view their quiz and homework marks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Panel */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Search Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {students.length === 0 ? 'No students found' : 'No matching students'}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudent?.id === student.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-foreground">{student.username}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs uppercase">
                        {student.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {student.level}
                      </Badge>
                      <Badge variant={student.is_active ? 'default' : 'destructive'} className="text-xs">
                        {student.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marks Display Panel */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {selectedStudent ? `${selectedStudent.username}'s Marks` : 'Select a Student'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Select a student from the list to view their marks</p>
              </div>
            ) : isLoadingMarks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : studentMarks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No quizzes or homework assigned for this student's level and category.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studentMarks.map((mark) => {
                    const percentage =
                      mark.status === 'submitted' ? Math.round((mark.score / mark.total_questions) * 100) : 0
                    const scoreColor =
                      mark.status === 'pending'
                        ? 'text-gray-500'
                        : percentage >= 80
                          ? 'text-green-600'
                          : percentage >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'

                    return (
                      <div key={mark.quiz_id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-foreground">{mark.quiz_title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{mark.quiz_type}</p>
                          </div>
                          <Badge variant={mark.status === 'submitted' ? 'default' : 'secondary'}>
                            {mark.status === 'submitted' ? 'Submitted' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-2xl font-bold ${scoreColor}`}>
                            {mark.score}/{mark.total_questions}
                          </div>
                          {mark.status === 'submitted' && (
                            <div className={`text-sm font-semibold ${scoreColor}`}>{percentage}%</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
