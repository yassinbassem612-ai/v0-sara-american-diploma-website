"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import {
  GraduationCap,
  LogOut,
  UserIcon,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
  Award,
  CheckCircle,
  AlertCircle,
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
import { ParentMessages } from "@/components/parent/parent-messages"
import { ChildProgress } from "@/components/parent/child-progress"
import { WeeklyReports } from "@/components/parent/weekly-reports"
import { ChildSchedule } from "@/components/parent/child-schedule"
import { ParentNotifications } from "@/components/parent/parent-notifications"

export function ParentDashboard() {
  const { user, signOut } = useAuth()
  const [children, setChildren] = useState<User[]>([])
  const [selectedChild, setSelectedChild] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const supabase = createClient()

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "progress", label: "Progress & Grades", icon: FileText },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "reports", label: "Weekly Reports", icon: Award },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ]

  useEffect(() => {
    if (user) {
      fetchChildren()
    }
  }, [user])

  const fetchChildren = async () => {
    try {
      setLoading(true)

      // Fetch children linked to this parent
      const { data: relationships, error } = await supabase
        .from("parent_children")
        .select(`
          child_id,
          users (
            id,
            username,
            category,
            level
          )
        `)
        .eq("parent_id", user?.id)

      if (error) throw error

      const childrenData = relationships?.map((rel: any) => rel.users).filter(Boolean) || []
      setChildren(childrenData)

      // Set first child as selected by default
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0])
      }
    } catch (error) {
      console.error("Error fetching children:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Sara American Diploma</h1>
                <p className="text-sm text-muted-foreground">Parent Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.parent_name || user?.username}</span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <UserIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Children Linked</h2>
            <p className="text-muted-foreground">
              Please contact the administrator to link your children to your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-bold text-foreground">Sara American Diploma</h1>
                <p className="text-xs text-muted-foreground">Parent Portal</p>
              </div>
            </div>

            {/* Child Selector */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Select Child</h3>
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChild?.id === child.id ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedChild(child)}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    {child.username}
                  </Button>
                ))}
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
                    <p className="text-sm text-muted-foreground">Parent Portal</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Welcome, {user?.parent_name || user?.username}</span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {!selectedChild ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Please select a child to view their information</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight">{selectedChild.username} Overview</h2>
                        <div className="flex space-x-2 mt-2">
                          <Badge variant="secondary">{selectedChild.category?.toUpperCase()}</Badge>
                          <Badge variant="outline">{selectedChild.level}</Badge>
                        </div>
                      </div>
                    </div>

                    <ParentNotifications parentId={user?.id || ""} childrenIds={children.map((child) => child.id)} />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">12</div>
                          <p className="text-xs text-muted-foreground">+2 from last week</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Completed</CardTitle>
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">8</div>
                          <p className="text-xs text-muted-foreground">67% completion rate</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">85%</div>
                          <p className="text-xs text-muted-foreground">+5% from last week</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending</CardTitle>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">4</div>
                          <p className="text-xs text-muted-foreground">Due this week</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="progress" className="mt-0">
                  <ChildProgress childId={selectedChild.id} />
                </TabsContent>

                <TabsContent value="schedule" className="mt-0">
                  <ChildSchedule childId={selectedChild.id} />
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  <WeeklyReports parentId={user?.id || ""} childId={selectedChild.id} />
                </TabsContent>

                <TabsContent value="messages" className="mt-0">
                  <ParentMessages parentId={user?.id || ""} />
                </TabsContent>
              </Tabs>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
