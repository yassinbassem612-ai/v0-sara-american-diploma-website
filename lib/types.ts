export interface User {
  id: string
  username: string
  role: "admin" | "student" | "parent"
  category?: "act" | "sat" | "est"
  level?: "advanced" | "basics"
  parent_name?: string // For parent accounts
  email?: string // For parent accounts
  phone?: string // For parent accounts
}

export interface HomeContent {
  id: string
  phone_number?: string
  center_location?: string
  free_session_link?: string
  about_text?: string
  video_title?: string
}

export interface RecordedSession {
  id: string
  title: string
  video_url: string
  category: "act" | "sat" | "est" | "all"
  target_groups?: string[] // Added target_groups for group targeting
  created_at: string
}

export interface Quiz {
  id: string
  title: string
  category: "act" | "sat" | "est"
  type: "quiz" | "homework"
  time_limit_minutes: number
  deadline?: string
  target_users?: string[]
  target_groups?: string[] // Added target_groups for group targeting
  level?: "advanced" | "basics"
  created_at: string
  question_count?: number // Added question_count for displaying number of questions
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  correct_answer: "a" | "b" | "c" | "d"
}

export interface QuizSubmission {
  id: string
  user_id: string
  quiz_id: string
  score: number
  total_questions: number
  answers: Record<string, string>
  submitted_at: string
}

export interface StudentQuestion {
  id: string
  user_id: string
  question: string
  answer?: string
  answered_at?: string
  created_at: string
}

export interface Session {
  id: string
  title: string
  session_date: string
  start_time: string
  category: "act" | "sat" | "est" | "all"
  level: "advanced" | "basics" | "all"
  target_groups?: string[] // Added target_groups for group targeting
  created_at: string
}

export interface StudyMaterial {
  id: string
  title: string
  file_url: string
  file_type: string
  category: "act" | "sat" | "est" | "all"
  level: "advanced" | "basics" | "all"
  created_at: string
}

export interface Group {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface GroupMembership {
  id: string
  group_id: string
  user_id: string
  created_at: string
}

export interface Parent {
  id: string
  username: string
  password_hash: string
  parent_name: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface ParentChild {
  id: string
  parent_id: string
  child_id: string
  created_at: string
}

export interface ParentMessage {
  id: string
  parent_id: string
  message: string
  admin_response?: string
  is_read_by_admin: boolean
  is_read_by_parent: boolean
  created_at: string
  responded_at?: string
}

export interface Certificate {
  id: string
  quiz_id: string
  student_id: string
  student_name: string
  quiz_title: string
  category: string
  score: number
  total_questions: number
  instructor_name: string
  created_at: string
  is_visible_to_student: boolean
}

export interface WeeklyReport {
  id: string
  parent_id: string
  child_id: string
  week_start: string
  week_end: string
  total_quizzes_assigned: number
  total_quizzes_completed: number
  average_score: number
  pending_assignments: string[]
  completed_assignments: string[]
  attendance_sessions: number
  report_data: any
  created_at: string
}
