"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { Home, Video, FileText, MessageSquare, LogOut, GraduationCap, User, Calendar, Award, Sheet } from "lucide-react"
import { StudentOverview } from "@/components/student/student-overview"
import { RecordedSessions } from "@/components/student/recorded-sessions"
import { StudentQuizzes } from "@/components/student/student-quizzes"
import { StudentQuestions } from "@/components/student/student-questions"
import { SessionSchedule } from "@/components/student/session-schedule"
import { StudentCertificates } from "@/components/student/student-certificates"
import { StudentSheets } from "@/components/student/student-sheets" // Added import for StudentSheets component

export function StudentDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Sara American Diploma</h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user?.username} ({user?.category?.toUpperCase()})
              </span>
            </div>
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
                  value="overview"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Session Schedule
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Recorded Sessions
                </TabsTrigger>
                <TabsTrigger
                  value="sheets"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Sheet className="h-4 w-4 mr-2" />
                  Sheets
                </TabsTrigger>
                <TabsTrigger
                  value="quizzes"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Quizzes & Homework
                </TabsTrigger>
                <TabsTrigger
                  value="certificates"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Award className="h-4 w-4 mr-2" />
                  My Certificates
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask Questions
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="mt-0">
              <StudentOverview />
            </TabsContent>
            <TabsContent value="schedule" className="mt-0">
              <SessionSchedule />
            </TabsContent>
            <TabsContent value="sessions" className="mt-0">
              <RecordedSessions />
            </TabsContent>
            <TabsContent value="sheets" className="mt-0">
              <StudentSheets />
            </TabsContent>
            <TabsContent value="quizzes" className="mt-0">
              <StudentQuizzes />
            </TabsContent>
            <TabsContent value="certificates" className="mt-0">
              <StudentCertificates userId={user?.id || ""} />
            </TabsContent>
            <TabsContent value="questions" className="mt-0">
              <StudentQuestions />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
