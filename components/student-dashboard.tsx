"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { Home, FileText, LogOut, GraduationCap, User } from "lucide-react"
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
import { StudentOverview } from "@/components/student/student-overview"
import { StudentQuizzes } from "@/components/student/student-quizzes"

export function StudentDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  const menuItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "quizzes", label: "Quizzes & Homework", icon: FileText },
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
                <p className="text-xs text-muted-foreground">Student Portal</p>
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
                    <p className="text-sm text-muted-foreground">Student Portal</p>
                  </div>
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

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview" className="mt-0">
                <StudentOverview />
              </TabsContent>
              <TabsContent value="quizzes" className="mt-0">
                <StudentQuizzes />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
