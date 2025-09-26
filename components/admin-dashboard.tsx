"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import {
  Home,
  Users,
  Video,
  FileText,
  BarChart3,
  MessageSquare,
  LogOut,
  GraduationCap,
  AlertCircle,
  Calendar,
  TrendingUp,
  Sheet,
  UserCheck,
} from "lucide-react"
import { HomeContentManager } from "@/components/admin/home-content-manager"
import { UserManager } from "@/components/admin/user-manager"
import { VideoManager } from "@/components/admin/video-manager"
import { QuizManager } from "@/components/admin/quiz-manager"
import { StudentProgress } from "@/components/admin/student-progress"
import { StudentQuestions } from "@/components/admin/student-questions"
import { SubmissionTracker } from "@/components/admin/submission-tracker"
import { SessionManager } from "@/components/admin/session-manager"
import { GroupManager } from "@/components/admin/group-manager"
import { ParentManager } from "@/components/admin/parent-manager"
import { ParentQuestions } from "@/components/admin/parent-questions"
import { CertificateManager } from "@/components/admin/certificate-manager"
import { WeeklyReportsManager } from "@/components/admin/weekly-reports-manager"
import { SheetsManager } from "@/components/admin/sheets-manager" // Added import for SheetsManager
import { AttendanceManager } from "@/components/admin/attendance-manager" // Added import for AttendanceManager

export function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Sara American Diploma</h1>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.username}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent p-0 space-y-1">
                <TabsTrigger
                  value="home"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home Content
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Groups
                </TabsTrigger>
                <TabsTrigger
                  value="parents"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Parent Management
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Session Schedule
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video Links
                </TabsTrigger>
                <TabsTrigger
                  value="sheets"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Sheet className="h-4 w-4 mr-2" />
                  Sheets
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Students Arrivals
                </TabsTrigger>
                <TabsTrigger
                  value="quizzes"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Quizzes & Homework
                </TabsTrigger>
                <TabsTrigger
                  value="progress"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Student Progress
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Student Questions
                </TabsTrigger>
                <TabsTrigger
                  value="submissions"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Submission Tracker
                </TabsTrigger>
                <TabsTrigger
                  value="parent-questions"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Parent Questions
                </TabsTrigger>
                <TabsTrigger
                  value="certificates"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Certificates
                </TabsTrigger>
                <TabsTrigger
                  value="weekly-reports"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Weekly Reports
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="home" className="mt-0">
              <HomeContentManager />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <UserManager />
            </TabsContent>
            <TabsContent value="groups" className="mt-0">
              <GroupManager />
            </TabsContent>
            <TabsContent value="parents" className="mt-0">
              <ParentManager />
            </TabsContent>
            <TabsContent value="sessions" className="mt-0">
              <SessionManager />
            </TabsContent>
            <TabsContent value="videos" className="mt-0">
              <VideoManager />
            </TabsContent>
            <TabsContent value="sheets" className="mt-0">
              <SheetsManager />
            </TabsContent>
            <TabsContent value="attendance" className="mt-0">
              <AttendanceManager />
            </TabsContent>
            <TabsContent value="quizzes" className="mt-0">
              <QuizManager />
            </TabsContent>
            <TabsContent value="progress" className="mt-0">
              <StudentProgress />
            </TabsContent>
            <TabsContent value="questions" className="mt-0">
              <StudentQuestions />
            </TabsContent>
            <TabsContent value="submissions" className="mt-0">
              <SubmissionTracker />
            </TabsContent>
            <TabsContent value="parent-questions" className="mt-0">
              <ParentQuestions />
            </TabsContent>
            <TabsContent value="certificates" className="mt-0">
              <CertificateManager />
            </TabsContent>
            <TabsContent value="weekly-reports" className="mt-0">
              <WeeklyReportsManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
