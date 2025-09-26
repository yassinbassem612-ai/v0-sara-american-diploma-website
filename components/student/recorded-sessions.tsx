"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"
import type { RecordedSession } from "@/lib/types"

export function RecordedSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<RecordedSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const fetchSessions = async () => {
    if (!user) return

    try {
      const { data: groupMemberships, error: groupError } = await supabase
        .from("group_memberships")
        .select("group_id")
        .eq("user_id", user.id)

      if (groupError) {
        console.error("Error fetching group memberships:", groupError)
        return
      }

      const userGroupIds = groupMemberships?.map((gm) => gm.group_id) || []

      const { data, error } = await supabase
        .from("recorded_sessions")
        .select("*")
        .or(
          `and(category.eq.${user.category},level.eq.${user.level || "basics"},or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}})),` +
            `and(category.eq.${user.category},level.eq.all,or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}})),` +
            `and(category.eq.all,level.eq.${user.level || "basics"},or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}})),` +
            `and(category.eq.all,level.eq.all,or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}}))`,
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching sessions:", error)
        return
      }

      setSessions(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWatchNow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Recorded Sessions</h2>
        <p className="text-muted-foreground">Access your recorded learning sessions and tutorials.</p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No recorded sessions available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">{session.title}</CardTitle>
                  <Badge variant="secondary" className="uppercase text-xs">
                    {session.category === "all" ? "General" : session.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Added: {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  onClick={() => handleWatchNow(session.video_url)}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleWatchNow(session.video_url)}
                  className="w-full"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
