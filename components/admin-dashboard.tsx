"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import {
  Home,
  Users,
  FileText,
  BarChart3,
  LogOut,
  GraduationCap,
  AlertCircle,
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
import { QuizManager } from "@/components/admin/quiz-manager"
import { StudentProgress } from "@/components/admin/student-progress"
import { SubmissionTracker } from "@/components/admin/submission-tracker"
import { GroupManager } from "@/components/admin/group-manager"
import { StudentMarks } from "@/components/admin/student-marks"
import { QRAttendance } from "@/components/admin/qr-attendance"

export function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("home")

  const menuItems = [
    { id: "home", label: "Home Content", icon: Home },
    { id: "users", label: "User Management", icon: Users },
    { id: "groups", label: "Groups", icon: Users },
    { id: "qr-attendance", label: "QR Attendance", icon: ScanLine },
    { id: "quizzes", label: "Quizzes & Homework", icon: FileText },
    { id: "marks", label: "Student Marks", icon: BookOpen },
    { id: "progress", label: "Student Progress", icon: BarChart3 },
    { id: "submissions", label: "Submission Tracker", icon: AlertCircle },
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
              <TabsContent value="submissions" className="mt-0">
                <SubmissionTracker />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
