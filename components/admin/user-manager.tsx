"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Edit, Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { createUser } from "@/lib/auth"

interface Student {
  id: string
  username: string
  category: "act" | "sat" | "est"
  level: "advanced" | "basics"
  created_at: string
}

export function UserManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<{
    category: "act" | "sat" | "est"
    level: "advanced" | "basics"
  } | null>(null)

  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newCategory, setNewCategory] = useState<"act" | "sat" | "est">("sat")
  const [newLevel, setNewLevel] = useState<"advanced" | "basics">("basics")

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching students:", error)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      setMessage("Username and password are required")
      return
    }

    setIsCreating(true)
    setMessage("")

    try {
      const result = await createUser(newUsername, newPassword, newCategory, newLevel)

      if (result.error) {
        setMessage("Error creating user: " + result.error)
      } else {
        setMessage("User created successfully!")
        setNewUsername("")
        setNewPassword("")
        setNewCategory("sat")
        setNewLevel("basics")
        fetchStudents()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error creating user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditUser = (student: Student) => {
    setEditingId(student.id)
    setEditingData({ category: student.category, level: student.level })
  }

  const handleSaveEdit = async (userId: string) => {
    if (!editingData) return

    try {
      const { error } = await supabase
        .from("users")
        .update({
          category: editingData.category,
          level: editingData.level,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        setMessage("Error updating user: " + error.message)
      } else {
        setMessage("User updated successfully!")
        setEditingId(null)
        setEditingData(null)
        fetchStudents()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error updating user")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) {
        setMessage("Error deleting user: " + error.message)
      } else {
        setMessage("User deleted successfully!")
        fetchStudents()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error deleting user")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">User Management</h2>
        <p className="text-muted-foreground">Create and manage student accounts with categories and levels.</p>
      </div>

      {message && (
        <Alert className={message.includes("Error") ? "border-destructive" : "border-green-500"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Student Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <Select value={newCategory} onValueChange={(value: "act" | "sat" | "est") => setNewCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sat">SAT</SelectItem>
                  <SelectItem value="act">ACT</SelectItem>
                  <SelectItem value="est">EST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-foreground mb-2">
                Level
              </label>
              <Select value={newLevel} onValueChange={(value: "advanced" | "basics") => setNewLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basics">Basics</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCreateUser} disabled={isCreating} className="bg-primary hover:bg-primary/90">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Students</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No students found.</p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-foreground">{student.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(student.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {editingId === student.id ? (
                      <div className="flex items-center space-x-2">
                        <Select
                          value={editingData?.category}
                          onValueChange={(value: "act" | "sat" | "est") =>
                            setEditingData((prev) =>
                              prev ? { ...prev, category: value } : { category: value, level: "basics" },
                            )
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sat">SAT</SelectItem>
                            <SelectItem value="act">ACT</SelectItem>
                            <SelectItem value="est">EST</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={editingData?.level}
                          onValueChange={(value: "advanced" | "basics") =>
                            setEditingData((prev) =>
                              prev ? { ...prev, level: value } : { category: "sat", level: value },
                            )
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basics">Basics</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="uppercase">
                          {student.category}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {student.level || "basics"}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingId === student.id ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleSaveEdit(student.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(student.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
