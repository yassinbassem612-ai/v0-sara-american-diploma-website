"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, Plus, Edit, Trash2, Save, X, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Session, User, Group } from "@/lib/types"

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    session_date: "",
    start_time: "",
    category: "all" as "act" | "sat" | "est" | "all",
    level: "all" as "advanced" | "basics" | "all",
  })

  const [targetingMode, setTargetingMode] = useState<"category" | "users" | "groups">("category")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchSessions()
    fetchUsers()
    fetchGroups()
  }, [])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("username", { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase.from("groups").select("*").order("name", { ascending: true })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const targetUsers = targetingMode === "users" && selectedUsers.length > 0 ? selectedUsers : null
      const targetGroups = targetingMode === "groups" && selectedGroups.length > 0 ? selectedGroups : null

      const sessionData = {
        ...formData,
        target_users: targetUsers,
        target_groups: targetGroups,
      }

      if (editingSession) {
        const { error } = await supabase.from("sessions").update(sessionData).eq("id", editingSession.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("sessions").insert([sessionData])
        if (error) throw error
      }

      await fetchSessions()
      resetForm()
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  const handleEdit = (session: Session) => {
    setEditingSession(session)
    setFormData({
      title: session.title,
      session_date: session.session_date,
      start_time: session.start_time,
      category: session.category,
      level: session.level,
    })
    setTargetingMode(session.target_users || session.target_groups ? "users" : "category")
    setSelectedUsers(session.target_users || [])
    setSelectedGroups(session.target_groups || [])
    setShowForm(true)
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return

    try {
      const { error } = await supabase.from("sessions").delete().eq("id", sessionId)

      if (error) throw error
      await fetchSessions()
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      session_date: "",
      start_time: "",
      category: "all",
      level: "all",
    })
    setTargetingMode("category")
    setSelectedUsers([])
    setSelectedGroups([])
    setEditingSession(null)
    setShowForm(false)
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups((prev) => [...prev, groupId])
    } else {
      setSelectedGroups((prev) => prev.filter((id) => id !== groupId))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Session Management</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Session Management</h2>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Session</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSession ? "Edit Session" : "Add New Session"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter session title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_date">Date</Label>
                  <Input
                    id="session_date"
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="sat">SAT</SelectItem>
                      <SelectItem value="act">ACT</SelectItem>
                      <SelectItem value="est">EST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: any) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="basics">Basics</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label>Target Audience</Label>
                  <Select
                    value={targetingMode}
                    onValueChange={(value: "category" | "users" | "groups") => setTargetingMode(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">By Category & Level</SelectItem>
                      <SelectItem value="users">Specific Users</SelectItem>
                      <SelectItem value="groups">By Groups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetingMode === "users" && (
                  <div>
                    <Label>
                      <Users className="inline h-4 w-4 mr-1" />
                      Select Users ({selectedUsers.length} selected)
                    </Label>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={user.id}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                          />
                          <label htmlFor={user.id} className="text-sm flex-1 cursor-pointer">
                            {user.username}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({user.category?.toUpperCase()} - {user.level || "basics"})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {targetingMode === "groups" && (
                  <div>
                    <Label>
                      <Users className="inline h-4 w-4 mr-1" />
                      Select Groups ({selectedGroups.length} selected)
                    </Label>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={group.id}
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={(checked) => handleGroupSelection(group.id, checked as boolean)}
                          />
                          <label htmlFor={group.id} className="text-sm flex-1 cursor-pointer">
                            {group.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({group.description || "No description"})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{editingSession ? "Update Session" : "Add Session"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center space-x-2 bg-transparent"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sessions Scheduled</h3>
              <p className="text-muted-foreground">Add your first session to get started.</p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(session)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                      className="flex items-center space-x-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(session.session_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(session.start_time)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={session.category === "all" ? "secondary" : "default"}>
                      {session.category.toUpperCase()}
                    </Badge>
                    <Badge variant={session.level === "all" ? "secondary" : "outline"}>
                      {session.level.charAt(0).toUpperCase() + session.level.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
