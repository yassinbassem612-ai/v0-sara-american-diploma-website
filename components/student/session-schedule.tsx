"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@/lib/types"

export function SessionSchedule() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSessions()
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
        .from("sessions")
        .select("*")
        .or(
          `and(category.eq.${user.category},level.eq.${user.level || "basics"},or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}})),` +
            `and(category.eq.${user.category},level.eq.all,or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}})),` +
            `and(category.eq.all,level.eq.${user.level || "basics"},or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}})),` +
            `and(category.eq.all,level.eq.all,or(and(target_users.is.null,target_groups.is.null),target_users.cs.{${user.id}},target_groups.ov.{${userGroupIds.join(",")}}))`,
        )
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const isUpcoming = (dateString: string, timeString: string) => {
    const sessionDateTime = new Date(`${dateString}T${timeString}`)
    return sessionDateTime > new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Session Schedule</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
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
          <h2 className="text-2xl font-bold">Session Schedule</h2>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>
            {user?.category?.toUpperCase()} - {user?.level?.charAt(0).toUpperCase() + user?.level?.slice(1)}
          </span>
        </Badge>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Scheduled</h3>
            <p className="text-muted-foreground">There are no upcoming sessions for your category and level.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`transition-all duration-200 hover:shadow-md ${
                isUpcoming(session.session_date, session.start_time) ? "border-primary/20 bg-primary/5" : "opacity-75"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant={session.category === "all" ? "secondary" : "default"}>
                      {session.category.toUpperCase()}
                    </Badge>
                    <Badge variant={session.level === "all" ? "secondary" : "outline"}>
                      {session.level.charAt(0).toUpperCase() + session.level.slice(1)}
                    </Badge>
                    {isUpcoming(session.session_date, session.start_time) && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Upcoming</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
