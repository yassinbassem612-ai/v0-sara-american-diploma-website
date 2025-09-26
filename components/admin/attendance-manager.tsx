"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/lib/auth-context"
import { Plus, Users, CheckCircle, AlertTriangle, Send } from "lucide-react"

interface AttendanceBlock {
  id: string
  name: string
  description: string
  target_groups: string[]
  target_users: string[]
  created_at: string
  is_active: boolean
}

interface Student {
  student_id: string
  username: string
  category: string
  level: string
  is_present: boolean
}

interface Group {
  id: string
  name: string
}

interface User {
  id: string
  username: string
  category: string
  level: string
}

export function AttendanceManager() {
  const { user } = useAuth()
  const [attendanceBlocks, setAttendanceBlocks] = useState<AttendanceBlock[]>([])
  const [selectedBlock, setSelectedBlock] = useState<AttendanceBlock | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("blocks")

  // Form state for creating new attendance block
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetGroups: [] as string[],
    targetUsers: [] as string[],
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchAttendanceBlocks()
    fetchGroups()
    fetchUsers()
  }, [])

  const fetchAttendanceBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance_blocks")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAttendanceBlocks(data || [])
    } catch (error) {
      console.error("Error fetching attendance blocks:", error)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase.from("groups").select("id, name").order("name")

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, category, level")
        .eq("role", "student")
        .order("username")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchBlockStudents = async (blockId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc("get_attendance_block_students", { input_block_id: blockId })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error("Error fetching block students:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (!user?.id) {
      console.error("[v0] User not authenticated or user ID missing")
      alert("You must be logged in to create attendance blocks")
      return
    }

    console.log("[v0] Creating attendance block with user ID:", user.id)

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("attendance_blocks")
        .insert({
          name: formData.name,
          description: formData.description,
          target_groups: formData.targetGroups.length > 0 ? formData.targetGroups : null,
          target_users: formData.targetUsers.length > 0 ? formData.targetUsers : null,
          created_by_admin_id: user.id, // Removed optional chaining since we validated above
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Database error:", error)
        throw error
      }

      console.log("[v0] Attendance block created successfully:", data)
      setFormData({ name: "", description: "", targetGroups: [], targetUsers: [] })
      fetchAttendanceBlocks()
      setActiveTab("blocks")
    } catch (error) {
      console.error("Error creating attendance block:", error)
      alert("Failed to create attendance block. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBlock = (block: AttendanceBlock) => {
    setSelectedBlock(block)
    fetchBlockStudents(block.id)
    setActiveTab("attendance")
  }

  const handleAttendanceChange = async (studentId: string, isPresent: boolean) => {
    if (!selectedBlock) return

    if (!user?.id) {
      console.error("[v0] User not authenticated for attendance marking")
      return
    }

    try {
      const { data, error } = await supabase.rpc("upsert_attendance_record", {
        p_attendance_block_id: selectedBlock.id,
        p_student_id: studentId,
        p_is_present: isPresent,
        p_marked_by_admin_id: user.id,
      })

      if (error) throw error

      // Update local state
      setStudents((prev) =>
        prev.map((student) => (student.student_id === studentId ? { ...student, is_present: isPresent } : student)),
      )
    } catch (error) {
      console.error("Error updating attendance:", error)
    }
  }

  const handleNotifyParents = async () => {
    if (!selectedBlock) return

    const absentStudents = students.filter((student) => !student.is_present)

    if (absentStudents.length === 0) {
      alert("No absent students to notify parents about.")
      return
    }

    try {
      setLoading(true)

      for (const student of absentStudents) {
        const { data: parentRelation, error: parentError } = await supabase
          .from("parent_children")
          .select("parent_id")
          .eq("child_id", student.student_id)
          .single()

        if (parentError || !parentRelation) {
          console.error(`No parent found for student ${student.username}`)
          continue
        }

        const { error } = await supabase.from("absence_notifications").insert({
          student_id: student.student_id,
          parent_id: parentRelation.parent_id,
          attendance_block_id: selectedBlock.id, // Use attendance_block_id instead of session_id
          message: "The student didn't come today",
          notification_type: "absence",
          notification_sent_at: new Date().toISOString(),
        })

        if (error) {
          console.error(`Error notifying parent for student ${student.username}:`, error)
        }
      }

      alert(`Notifications sent to parents of ${absentStudents.length} absent students.`)
    } catch (error) {
      console.error("Error sending notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students Arrivals</h2>
          <p className="text-muted-foreground">Manage attendance blocks and track student arrivals</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="blocks">Attendance Blocks</TabsTrigger>
          <TabsTrigger value="create">Create Block</TabsTrigger>
          {selectedBlock && <TabsTrigger value="attendance">Take Attendance</TabsTrigger>}
        </TabsList>

        <TabsContent value="blocks" className="space-y-4">
          <div className="grid gap-4">
            {attendanceBlocks.map((block) => (
              <Card
                key={block.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectBlock(block)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{block.name}</CardTitle>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  {block.description && <CardDescription>{block.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(block.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Attendance Block</CardTitle>
              <CardDescription>Set up a new attendance tracking session</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBlock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Block Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter attendance block name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Target Students</Label>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">By Groups</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {groups.map((group) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={formData.targetGroups.includes(group.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    targetGroups: [...prev.targetGroups, group.id],
                                  }))
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    targetGroups: prev.targetGroups.filter((id) => id !== group.id),
                                  }))
                                }
                              }}
                            />
                            <Label htmlFor={`group-${group.id}`} className="text-sm">
                              {group.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">By Specific Users</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={formData.targetUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    targetUsers: [...prev.targetUsers, user.id],
                                  }))
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    targetUsers: prev.targetUsers.filter((id) => id !== user.id),
                                  }))
                                }
                              }}
                            />
                            <Label htmlFor={`user-${user.id}`} className="text-sm">
                              {user.username} ({user.category} - {user.level})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Attendance Block
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedBlock && (
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedBlock.name}</CardTitle>
                    <CardDescription>Mark student attendance</CardDescription>
                  </div>
                  <Button onClick={handleNotifyParents} variant="outline" disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    Notify Parents
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading students...</p>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => (
                      <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={student.is_present}
                              onCheckedChange={(checked) =>
                                handleAttendanceChange(student.student_id, checked as boolean)
                              }
                            />
                            {student.is_present ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{student.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.category} - {student.level}
                            </p>
                          </div>
                        </div>
                        <Badge variant={student.is_present ? "default" : "destructive"}>
                          {student.is_present ? "Present" : "Absent"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
