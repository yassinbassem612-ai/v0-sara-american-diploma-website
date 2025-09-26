"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, Edit, Trash2, ExternalLink, Target } from "lucide-react"

interface Sheet {
  id: string
  title: string
  link_url: string
  description: string | null
  target_categories: string[] | null
  target_levels: string[] | null
  target_groups: string[] | null
  target_users: string[] | null
  is_active: boolean
  created_at: string
}

interface User {
  id: string
  username: string
  category: string
  level: string
}

interface Group {
  id: string
  name: string
}

export function SheetsManager() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSheet, setEditingSheet] = useState<Sheet | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    link_url: "",
    description: "",
    target_groups: [] as string[],
    target_users: [] as string[],
    is_active: true,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: sheetsData, error: sheetsError } = await supabase
        .from("sheets")
        .select("*")
        .order("created_at", { ascending: false })

      if (sheetsError) throw sheetsError

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, category, level")
        .eq("role", "student")

      if (usersError) throw usersError

      const { data: groupsData, error: groupsError } = await supabase.from("groups").select("id, name")

      if (groupsError) throw groupsError

      setSheets(sheetsData || [])
      setUsers(usersData || [])
      setGroups(groupsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      link_url: "",
      description: "",
      target_groups: [],
      target_users: [],
      is_active: true,
    })
    setEditingSheet(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log("[v0] Form data before processing:", formData)

      const hasTargeting = formData.target_groups.length > 0 || formData.target_users.length > 0

      console.log("[v0] Has targeting:", hasTargeting)

      const sheetData = {
        ...formData,
        target_categories: null,
        target_levels: null,
        target_groups: formData.target_groups.length > 0 ? formData.target_groups : null,
        target_users: formData.target_users.length > 0 ? formData.target_users : null,
      }

      console.log("[v0] Sheet data to be saved:", sheetData)

      if (editingSheet) {
        const { error } = await supabase.from("sheets").update(sheetData).eq("id", editingSheet.id)

        if (error) {
          console.log("[v0] Update error:", error)
          throw error
        }

        toast({
          title: "Success",
          description: "Sheet updated successfully",
        })
      } else {
        const { error } = await supabase.from("sheets").insert([sheetData])

        if (error) {
          console.log("[v0] Insert error:", error)
          throw error
        }

        toast({
          title: "Success",
          description: "Sheet created successfully",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error("[v0] Error saving sheet:", error)

      let errorMessage = "Failed to save sheet"
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (sheet: Sheet) => {
    setEditingSheet(sheet)
    setFormData({
      title: sheet.title,
      link_url: sheet.link_url,
      description: sheet.description || "",
      target_groups: sheet.target_groups || [],
      target_users: sheet.target_users || [],
      is_active: sheet.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sheet?")) return

    try {
      const { error } = await supabase.from("sheets").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Sheet deleted successfully",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting sheet:", error)
      toast({
        title: "Error",
        description: "Failed to delete sheet",
        variant: "destructive",
      })
    }
  }

  const handleTargetChange = (type: "groups" | "users", value: string, checked: boolean) => {
    const key = `target_${type}` as keyof typeof formData
    const currentValues = formData[key] as string[]

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        [key]: [...currentValues, value],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [key]: currentValues.filter((v) => v !== value),
      }))
    }
  }

  const getTargetingSummary = (sheet: Sheet) => {
    const targets = []
    if (sheet.target_groups?.length) {
      const groupNames = sheet.target_groups
        .map((gId) => groups.find((g) => g.id === gId)?.name || "Unknown")
        .join(", ")
      targets.push(`Groups: ${groupNames}`)
    }
    if (sheet.target_users?.length) {
      const userNames = sheet.target_users
        .map((uId) => users.find((u) => u.id === uId)?.username || "Unknown")
        .join(", ")
      targets.push(`Users: ${userNames}`)
    }
    return targets.length > 0 ? targets.join(" | ") : "All users"
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sheets Management</h2>
          <p className="text-muted-foreground">Manage shared links and documents for students</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sheet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSheet ? "Edit Sheet" : "Add New Sheet"}</DialogTitle>
              <DialogDescription>
                Create a new sheet link with targeting options to control who can see it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Target Audience</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Groups</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={formData.target_groups.includes(group.id)}
                            onCheckedChange={(checked) => handleTargetChange("groups", group.id, checked as boolean)}
                          />
                          <Label htmlFor={`group-${group.id}`}>{group.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Specific Users</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={formData.target_users.includes(user.id)}
                            onCheckedChange={(checked) => handleTargetChange("users", user.id, checked as boolean)}
                          />
                          <Label htmlFor={`user-${user.id}`}>
                            {user.username} ({user.category} - {user.level})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="is_active">Active (visible to targeted users)</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingSheet ? "Update Sheet" : "Create Sheet"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sheets.map((sheet) => (
          <Card key={sheet.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {sheet.title}
                    {!sheet.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  {sheet.description && <CardDescription>{sheet.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(sheet.link_url, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(sheet)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(sheet.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>{getTargetingSummary(sheet)}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {sheets.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No sheets created yet. Click "Add Sheet" to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
