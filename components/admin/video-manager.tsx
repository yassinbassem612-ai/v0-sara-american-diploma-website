"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, ExternalLink, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { RecordedSession, User, Group } from "@/lib/types"

export function VideoManager() {
  const [videos, setVideos] = useState<RecordedSession[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState("")

  // Form state
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newCategory, setNewCategory] = useState<"act" | "sat" | "est" | "all">("all")
  const [newLevel, setNewLevel] = useState<"advanced" | "basics" | "all">("all")
  const [targetingMode, setTargetingMode] = useState<"category" | "users" | "groups">("category")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  useEffect(() => {
    fetchVideos()
    fetchUsers()
    fetchGroups()
  }, [])

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("recorded_sessions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching videos:", error)
        return
      }

      setVideos(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, category, level")
        .eq("role", "student")
        .order("username", { ascending: true })

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase.from("groups").select("*").order("name", { ascending: true })

      if (error) {
        console.error("Error fetching groups:", error)
        return
      }

      setGroups(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups([...selectedGroups, groupId])
    } else {
      setSelectedGroups(selectedGroups.filter((id) => id !== groupId))
    }
  }

  const handleCreateVideo = async () => {
    if (!newTitle || !newUrl) {
      setMessage("Title and URL are required")
      return
    }

    if (targetingMode === "users" && selectedUsers.length === 0) {
      setMessage("Please select at least one user when using user targeting")
      return
    }

    if (targetingMode === "groups" && selectedGroups.length === 0) {
      setMessage("Please select at least one group when using group targeting")
      return
    }

    setIsCreating(true)
    setMessage("")

    try {
      const videoData = {
        title: newTitle,
        video_url: newUrl,
        category: targetingMode === "category" ? newCategory : "all",
        level: targetingMode === "category" ? newLevel : "all",
        target_users: targetingMode === "users" ? selectedUsers : null,
        target_groups: targetingMode === "groups" ? selectedGroups : null,
      }

      const { error } = await supabase.from("recorded_sessions").insert([videoData])

      if (error) {
        setMessage("Error creating video: " + error.message)
      } else {
        setMessage("Video added successfully!")
        setNewTitle("")
        setNewUrl("")
        setNewCategory("all")
        setNewLevel("all")
        setSelectedUsers([])
        setSelectedGroups([])
        setTargetingMode("category")
        fetchVideos()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error creating video")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return

    try {
      const { error } = await supabase.from("recorded_sessions").delete().eq("id", videoId)

      if (error) {
        setMessage("Error deleting video: " + error.message)
      } else {
        setMessage("Video deleted successfully!")
        fetchVideos()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Error deleting video")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Video Links Management</h2>
        <p className="text-muted-foreground">Add and manage recorded session links for students.</p>
      </div>

      {message && (
        <Alert className={message.includes("Error") ? "border-destructive" : "border-green-500"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Add Video Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Video Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Video Title
              </label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
                Video URL
              </label>
              <Input
                id="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/video"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Targeting Mode</label>
              <Select
                value={targetingMode}
                onValueChange={(value: "category" | "users" | "groups") => setTargetingMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">By Category & Level</SelectItem>
                  <SelectItem value="users">By Specific Users</SelectItem>
                  <SelectItem value="groups">By Groups</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetingMode === "category" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                    Target Category
                  </label>
                  <Select
                    value={newCategory}
                    onValueChange={(value: "act" | "sat" | "est" | "all") => setNewCategory(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="sat">SAT Only</SelectItem>
                      <SelectItem value="act">ACT Only</SelectItem>
                      <SelectItem value="est">EST Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-foreground mb-2">
                    Target Level
                  </label>
                  <Select value={newLevel} onValueChange={(value: "advanced" | "basics" | "all") => setNewLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="advanced">Advanced Only</SelectItem>
                      <SelectItem value="basics">Basics Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : targetingMode === "users" ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Users ({selectedUsers.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={user.id}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                      />
                      <label htmlFor={user.id} className="flex-1 cursor-pointer">
                        <span className="font-medium">{user.username}</span>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs uppercase">
                            {user.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {user.level || "basics"}
                          </Badge>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Groups ({selectedGroups.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={group.id}
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={(checked) => handleGroupSelection(group.id, checked as boolean)}
                      />
                      <label htmlFor={group.id} className="flex-1 cursor-pointer">
                        <span className="font-medium">{group.name}</span>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleCreateVideo} disabled={isCreating} className="bg-primary hover:bg-primary/90">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No videos found.</p>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{video.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">{video.video_url}</p>
                      <p className="text-xs text-muted-foreground">
                        Added: {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {video.target_users ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {video.target_users.length} users
                        </Badge>
                      ) : video.target_groups ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {video.target_groups.length} groups
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="secondary" className="uppercase">
                            {video.category}
                          </Badge>
                          <Badge variant="outline" className="capitalize text-xs">
                            {video.level || "all"} level
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteVideo(video.id)}>
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
