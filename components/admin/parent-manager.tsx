"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import type { User, Parent, ParentChild } from "@/lib/types"
import { Plus, Trash2, Users, UserPlus } from "lucide-react"
import { toast } from "sonner"

export function ParentManager() {
  const [parents, setParents] = useState<Parent[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [parentChildren, setParentChildren] = useState<ParentChild[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)

  // Form states
  const [newParent, setNewParent] = useState({
    username: "",
    password: "",
    parent_name: "",
    email: "",
    phone: "",
  })
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch parents
      const { data: parentsData, error: parentsError } = await supabase
        .from("parents")
        .select("*")
        .order("created_at", { ascending: false })

      if (parentsError) throw parentsError

      // Fetch users (students)
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .neq("role", "admin")
        .order("username")

      if (usersError) throw usersError

      // Fetch parent-child relationships
      const { data: relationshipsData, error: relationshipsError } = await supabase.from("parent_children").select(`
          *,
          parents(username, parent_name),
          users(username, category, level)
        `)

      if (relationshipsError) throw relationshipsError

      setParents(parentsData || [])
      setUsers(usersData || [])
      setParentChildren(relationshipsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const createParent = async () => {
    try {
      if (!newParent.username || !newParent.password || !newParent.parent_name) {
        toast.error("Please fill in all required fields")
        return
      }

      // Hash password (in production, use proper password hashing)
      const passwordHash = btoa(newParent.password) // Simple base64 encoding for demo

      const { data, error } = await supabase
        .from("parents")
        .insert([
          {
            username: newParent.username,
            password_hash: passwordHash,
            parent_name: newParent.parent_name,
            email: newParent.email,
            phone: newParent.phone,
          },
        ])
        .select()

      if (error) throw error

      toast.success("Parent account created successfully")
      setIsCreateDialogOpen(false)
      setNewParent({ username: "", password: "", parent_name: "", email: "", phone: "" })
      fetchData()
    } catch (error) {
      console.error("Error creating parent:", error)
      toast.error("Failed to create parent account")
    }
  }

  const linkChildren = async () => {
    try {
      if (!selectedParent || selectedChildren.length === 0) {
        toast.error("Please select children to link")
        return
      }

      const relationships = selectedChildren.map((childId) => ({
        parent_id: selectedParent.id,
        child_id: childId,
      }))

      const { error } = await supabase.from("parent_children").insert(relationships)

      if (error) throw error

      toast.success("Children linked successfully")
      setIsLinkDialogOpen(false)
      setSelectedChildren([])
      setSelectedParent(null)
      fetchData()
    } catch (error) {
      console.error("Error linking children:", error)
      toast.error("Failed to link children")
    }
  }

  const unlinkChild = async (relationshipId: string) => {
    try {
      const { error } = await supabase.from("parent_children").delete().eq("id", relationshipId)

      if (error) throw error

      toast.success("Child unlinked successfully")
      fetchData()
    } catch (error) {
      console.error("Error unlinking child:", error)
      toast.error("Failed to unlink child")
    }
  }

  const deleteParent = async (parentId: string) => {
    try {
      const { error } = await supabase.from("parents").delete().eq("id", parentId)

      if (error) throw error

      toast.success("Parent account deleted successfully")
      fetchData()
    } catch (error) {
      console.error("Error deleting parent:", error)
      toast.error("Failed to delete parent account")
    }
  }

  const getChildrenForParent = (parentId: string) => {
    return parentChildren.filter((pc) => pc.parent_id === parentId)
  }

  const getAvailableChildren = () => {
    const linkedChildIds = parentChildren.map((pc) => pc.child_id)
    return users.filter((user) => !linkedChildIds.includes(user.id))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Parent Management</h2>
          <p className="text-muted-foreground">Manage parent accounts and link them to students</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Parent Account
        </Button>
      </div>

      <Tabs defaultValue="parents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parents">Parent Accounts</TabsTrigger>
          <TabsTrigger value="relationships">Parent-Child Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="parents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parents.map((parent) => (
              <Card key={parent.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{parent.parent_name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedParent(parent)
                          setIsLinkDialogOpen(true)
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteParent(parent.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>@{parent.username}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {parent.email && <p className="text-muted-foreground">Email: {parent.email}</p>}
                    {parent.phone && <p className="text-muted-foreground">Phone: {parent.phone}</p>}
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{getChildrenForParent(parent.id).length} children</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          <div className="space-y-4">
            {parents.map((parent) => {
              const children = getChildrenForParent(parent.id)
              return (
                <Card key={parent.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>{parent.parent_name}</span>
                    </CardTitle>
                    <CardDescription>@{parent.username}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {children.length > 0 ? (
                      <div className="space-y-2">
                        {children.map((relationship: any) => (
                          <div
                            key={relationship.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-medium">{relationship.users.username}</p>
                                <div className="flex space-x-2">
                                  <Badge variant="secondary">{relationship.users.category}</Badge>
                                  <Badge variant="outline">{relationship.users.level}</Badge>
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => unlinkChild(relationship.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No children linked</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Parent Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Parent Account</DialogTitle>
            <DialogDescription>Create a new parent account and set their credentials</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={newParent.username}
                onChange={(e) => setNewParent({ ...newParent, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newParent.password}
                onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_name">Parent Name *</Label>
              <Input
                id="parent_name"
                value={newParent.parent_name}
                onChange={(e) => setNewParent({ ...newParent, parent_name: e.target.value })}
                placeholder="Enter parent's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newParent.email}
                onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newParent.phone}
                onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createParent}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Children Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Children</DialogTitle>
            <DialogDescription>Select students to link to {selectedParent?.parent_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {getAvailableChildren().map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox
                  id={user.id}
                  checked={selectedChildren.includes(user.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedChildren([...selectedChildren, user.id])
                    } else {
                      setSelectedChildren(selectedChildren.filter((id) => id !== user.id))
                    }
                  }}
                />
                <Label htmlFor={user.id} className="flex items-center space-x-2 cursor-pointer">
                  <span>{user.username}</span>
                  <Badge variant="secondary">{user.category}</Badge>
                  <Badge variant="outline">{user.level}</Badge>
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={linkChildren}>Link Children</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
