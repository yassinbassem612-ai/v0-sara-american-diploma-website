"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import type { Group, GroupMembership, User } from "@/lib/types"
import { Trash2, Users, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function GroupManager() {
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groupMemberships, setGroupMemberships] = useState<GroupMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("") // Added search state for filtering users
  const { toast } = useToast()

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false })

      if (groupsError) throw groupsError

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("username")

      if (usersError) throw usersError

      // Fetch group memberships
      const { data: membershipsData, error: membershipsError } = await supabase.from("group_memberships").select("*")

      if (membershipsError) throw membershipsError

      setGroups(groupsData || [])
      setUsers(usersData || [])
      setGroupMemberships(membershipsData || [])
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingGroup) {
        // Update existing group
        const { error: groupError } = await supabase
          .from("groups")
          .update({
            name: newGroupName.trim(),
            description: newGroupDescription.trim() || null,
          })
          .eq("id", editingGroup.id)

        if (groupError) throw groupError

        // Remove existing memberships
        const { error: deleteError } = await supabase.from("group_memberships").delete().eq("group_id", editingGroup.id)

        if (deleteError) throw deleteError

        // Add new memberships
        if (selectedUsers.length > 0) {
          const memberships = selectedUsers.map((userId) => ({
            group_id: editingGroup.id,
            user_id: userId,
          }))

          const { error: membershipError } = await supabase.from("group_memberships").insert(memberships)

          if (membershipError) throw membershipError
        }

        toast({
          title: "Success",
          description: "Group updated successfully",
        })
      } else {
        // Create new group
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .insert({
            name: newGroupName.trim(),
            description: newGroupDescription.trim() || null,
          })
          .select()
          .single()

        if (groupError) throw groupError

        // Add selected users to group
        if (selectedUsers.length > 0) {
          const memberships = selectedUsers.map((userId) => ({
            group_id: groupData.id,
            user_id: userId,
          }))

          const { error: membershipError } = await supabase.from("group_memberships").insert(memberships)

          if (membershipError) throw membershipError
        }

        toast({
          title: "Success",
          description: "Group created successfully",
        })
      }

      // Reset form
      setNewGroupName("")
      setNewGroupDescription("")
      setSelectedUsers([])
      setShowCreateForm(false)
      setEditingGroup(null)
      setUserSearchTerm("") // Reset search term when canceling

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error saving group:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingGroup ? "update" : "create"} group`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return

    try {
      const { error } = await supabase.from("groups").delete().eq("id", groupId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Group deleted successfully",
      })

      fetchData()
    } catch (error) {
      console.error("Error deleting group:", error)
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      })
    }
  }

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group)
    setNewGroupName(group.name)
    setNewGroupDescription(group.description || "")

    // Get current members of the group
    const currentMembers = groupMemberships
      .filter((membership) => membership.group_id === group.id)
      .map((membership) => membership.user_id)

    setSelectedUsers(currentMembers)
    setUserSearchTerm("") // Reset search term when editing a group
    setShowCreateForm(true)
  }

  const getGroupMembers = (groupId: string) => {
    const memberIds = groupMemberships
      .filter((membership) => membership.group_id === groupId)
      .map((membership) => membership.user_id)

    return users.filter((user) => memberIds.includes(user.id))
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    }
  }

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(userSearchTerm.toLowerCase()))

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Groups Management</h2>
          <p className="text-muted-foreground">Create and manage student groups</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingGroup ? "Edit Group" : "Create New Group"}</CardTitle>
            <CardDescription>
              {editingGroup ? "Update group details and members" : "Create a group and assign members"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label htmlFor="groupDescription">Description (Optional)</Label>
                <Textarea
                  id="groupDescription"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label>Select Members</Label>
              <div className="relative mt-2 mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                    />
                    <Label htmlFor={user.id} className="text-sm">
                      {user.username}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {user.category?.toUpperCase()} - {user.level}
                      </Badge>
                    </Label>
                  </div>
                ))}
                {filteredUsers.length === 0 && userSearchTerm && (
                  <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                    No users found matching "{userSearchTerm}"
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateGroup}>{editingGroup ? "Update Group" : "Create Group"}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewGroupName("")
                  setNewGroupDescription("")
                  setSelectedUsers([])
                  setEditingGroup(null)
                  setUserSearchTerm("") // Reset search term when canceling
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => {
          const members = getGroupMembers(group.id)
          return (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.description && <CardDescription>{group.description}</CardDescription>}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <span className="text-sm">{member.username}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.category?.toUpperCase()} - {member.level}
                      </Badge>
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-sm text-muted-foreground">No members</p>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Groups Created</h3>
            <p className="text-muted-foreground mb-4">Create your first group to organize students</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
