"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
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
  Palette,
  BookOpen,
  ScanLine,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
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
import { SheetsManager } from "@/components/admin/sheets-manager"
import { AttendanceManager } from "@/components/admin/attendance-manager"
import { PaintApp } from "@/components/admin/paint-app"
import { StudentMarks } from "@/components/admin/student-marks"
import { QRAttendance } from "@/components/admin/qr-attendance"

export function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("home")

  const menuItems = [
    { id: "home", label: "Home Content", icon: Home },
    { id: "users", label: "User Management", icon: Users },
    { id: "groups", label: "Groups", icon: Users },
    { id: "parents", label: "Parent Management", icon: Users },
    { id: "sessions", label: "Session Schedule", icon: Calendar },
    { id: "videos", label: "Video Links", icon: Video },
    { id: "sheets", label: "Sheets", icon: Sheet },
    { id: "attendance", label: "Students Arrivals", icon: UserCheck },
    { id: "qr-attendance", label: "QR Attendance", icon: ScanLine },
    { id: "quizzes", label: "Quizzes & Homework", icon: FileText },
    { id: "marks", label: "Student Marks", icon: BookOpen },
    { id: "progress", label: "Student Progress", icon: BarChart3 },
    { id: "questions", label: "Student Questions", icon: MessageSquare },
    { id: "submissions", label: "Submission Tracker", icon: AlertCircle },
    { id: "parent-questions", label: "Parent Questions", icon: MessageSquare },
    { id: "certificates", label: "Certificates", icon: GraduationCap },
    { id: "weekly-reports", label: "Weekly Reports", icon: TrendingUp },
    { id: "paint", label: "Paint", icon: Palette },
  ]

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-bold text-foreground">Sara American Diploma</h1>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="border-b bg-card">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-2">
                <SidebarTrigger className="md:hidden" />
                <div className="hidden md:flex items-center space-x-2">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Sara American Diploma</h1>
                    <p className="text-sm text-muted-foreground">Admin Panel</p>
                  </div>
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
              <TabsContent value="qr-attendance" className="mt-0">
                <QRAttendance />
              </TabsContent>
              <TabsContent value="quizzes" className="mt-0">
                <QuizManager />
              </TabsContent>
              <TabsContent value="marks" className="mt-0">
                <StudentMarks />
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
              <TabsContent value="paint" className="mt-0">
                <PaintApp />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
