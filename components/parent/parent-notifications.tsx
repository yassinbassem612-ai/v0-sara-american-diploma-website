"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { Bell, AlertTriangle, CheckCircle, X } from "lucide-react"

interface AbsenceNotification {
  id: string
  message: string
  created_at: string
  notification_sent_at: string
  student_id: string
  session_id: string
  student_username?: string
  is_read?: boolean
}

interface ParentNotificationsProps {
  parentId: string
  childrenIds: string[]
}

export function ParentNotifications({ parentId, childrenIds }: ParentNotificationsProps) {
  const [notifications, setNotifications] = useState<AbsenceNotification[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (childrenIds.length > 0) {
      fetchNotifications()
    }
  }, [childrenIds])

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      // Fetch absence notifications for all children of this parent
      const { data, error } = await supabase
        .from("absence_notifications")
        .select(`
          id,
          message,
          created_at,
          notification_sent_at,
          student_id,
          session_id,
          users!absence_notifications_student_id_fkey (
            username
          )
        `)
        .in("student_id", childrenIds)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      const notificationsWithUsernames =
        data?.map((notification: any) => ({
          ...notification,
          student_username: notification.users?.username || "Unknown Student",
        })) || []

      setNotifications(notificationsWithUsernames)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // For now, we'll just remove it from the local state
      // In a full implementation, you might want to add an is_read column
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading notifications...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </div>
          {notifications.length > 0 && <Badge variant="destructive">{notifications.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between p-3 border rounded-lg bg-red-50 border-red-200"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">{notification.student_username}</p>
                    <p className="text-sm text-red-700">{notification.message}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {new Date(notification.created_at).toLocaleDateString()} at{" "}
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
