"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { ExternalLink, FileText, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Sheet {
  id: string
  title: string
  link_url: string
  description: string | null
  created_at: string
  target_users?: string[]
  target_groups?: string[]
  target_categories?: string[]
  target_levels?: string[]
}

export function StudentSheets() {
  const { user } = useAuth()
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (user?.id) {
      fetchUserSheets()
    }
  }, [user?.id])

  const fetchUserSheets = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Get user's groups
      const { data: userGroups, error: groupsError } = await supabase
        .from("group_memberships")
        .select("group_id")
        .eq("user_id", user.id)

      if (groupsError) throw groupsError

      const userGroupIds = userGroups?.map((g) => g.group_id) || []

      // Fetch sheets that are accessible to this user
      const { data: allSheets, error: sheetsError } = await supabase
        .from("sheets")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (sheetsError) throw sheetsError

      const accessibleSheets = (allSheets || []).filter((sheet) => {
        // Check if sheet targets specific users
        if (sheet.target_users && sheet.target_users.includes(user.id)) {
          return true
        }

        // Check if sheet targets user's groups
        if (sheet.target_groups && sheet.target_groups.some((groupId: string) => userGroupIds.includes(groupId))) {
          return true
        }

        // If no targeting is set (both groups and users are null/empty), sheet is accessible to all
        if (
          (!sheet.target_users || sheet.target_users.length === 0) &&
          (!sheet.target_groups || sheet.target_groups.length === 0)
        ) {
          return true
        }

        return false
      })

      setSheets(accessibleSheets)
    } catch (error) {
      console.error("Error fetching user sheets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sheets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSheet = (url: string, title: string) => {
    // Track sheet access (optional analytics)
    window.open(url, "_blank", "noopener,noreferrer")

    toast({
      title: "Opening Sheet",
      description: `Opening "${title}" in a new tab`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My Sheets</h2>
          <p className="text-muted-foreground">Access your assigned documents and links</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your sheets...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Sheets</h2>
        <p className="text-muted-foreground">Access your assigned documents and links</p>
      </div>

      {sheets.length > 0 ? (
        <div className="grid gap-4">
          {sheets.map((sheet) => (
            <Card key={sheet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {sheet.title}
                    </CardTitle>
                    {sheet.description && <CardDescription className="text-sm">{sheet.description}</CardDescription>}
                  </div>
                  <Button onClick={() => handleOpenSheet(sheet.link_url, sheet.title)} className="ml-4">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Added {formatDate(sheet.created_at)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Document
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sheets Available</h3>
            <p className="text-muted-foreground max-w-md">
              You don't have any sheets assigned to you yet. Your instructor will share relevant documents and links
              here when available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
