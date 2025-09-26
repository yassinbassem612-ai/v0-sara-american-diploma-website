"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { ParentMessage } from "@/lib/types"
import { Send, MessageSquare, Clock, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface ParentMessagesProps {
  parentId: string
}

export function ParentMessages({ parentId }: ParentMessagesProps) {
  const [messages, setMessages] = useState<ParentMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [parentId])

  const fetchMessages = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("parent_messages")
        .select("*")
        .eq("parent_id", parentId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    try {
      if (!newMessage.trim()) {
        toast.error("Please enter a message")
        return
      }

      setSending(true)

      const { error } = await supabase.from("parent_messages").insert([
        {
          parent_id: parentId,
          message: newMessage.trim(),
          sender_type: "parent",
          is_read_by_admin: false,
          is_read_by_parent: true,
        },
      ])

      if (error) throw error

      toast.success("Message sent successfully")
      setNewMessage("")
      fetchMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase.from("parent_messages").update({ is_read_by_parent: true }).eq("id", messageId)

      if (error) throw error

      fetchMessages()
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const replyToMessage = async (originalMessageId: string, replyText: string) => {
    try {
      if (!replyText.trim()) {
        toast.error("Please enter a reply")
        return
      }

      const { error } = await supabase.from("parent_messages").insert([
        {
          parent_id: parentId,
          message: replyText.trim(),
          sender_type: "parent",
          parent_message_id: originalMessageId,
          is_read_by_admin: false,
          is_read_by_parent: true,
        },
      ])

      if (error) throw error

      toast.success("Reply sent successfully")
      fetchMessages()
    } catch (error) {
      console.error("Error sending reply:", error)
      toast.error("Failed to send reply")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading messages...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        <p className="text-muted-foreground">Send messages to the admin and view responses</p>
      </div>

      {/* Send New Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Send New Message</span>
          </CardTitle>
          <CardDescription>Send a message to the admin team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Message History */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Message History</h3>
        {messages.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <MessageCard key={message.id} message={message} onReply={replyToMessage} onMarkAsRead={markAsRead} />
          ))
        )}
      </div>
    </div>
  )
}

interface MessageCardProps {
  message: ParentMessage
  onReply: (messageId: string, reply: string) => void
  onMarkAsRead: (messageId: string) => void
}

function MessageCard({ message, onReply, onMarkAsRead }: MessageCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)

  const handleReply = async () => {
    setSending(true)
    await onReply(message.id, replyText)
    setReplyText("")
    setShowReplyForm(false)
    setSending(false)
  }

  const isAdminMessage = message.sender_type === "admin"
  const isParentReply = message.parent_message_id !== null

  return (
    <Card className={!message.is_read_by_parent && isAdminMessage ? "border-primary" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isAdminMessage ? "Miss Sara sent this message" : isParentReply ? "Your Reply" : "Your Message"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isAdminMessage ? (
              <Badge variant="default">
                <MessageSquare className="h-3 w-3 mr-1" />
                From Admin
              </Badge>
            ) : message.admin_response ? (
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Responded
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {!message.is_read_by_parent && isAdminMessage && <Badge variant="destructive">New</Badge>}
          </div>
        </div>
        <CardDescription>
          {isAdminMessage ? "Received" : "Sent"} on {new Date(message.created_at).toLocaleDateString()} at{" "}
          {new Date(message.created_at).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">{isAdminMessage ? "Message from Miss Sara:" : "Your Message:"}</h4>
          <p
            className={`p-3 rounded-lg ${isAdminMessage ? "bg-primary/5 border border-primary/20" : "text-muted-foreground bg-muted"}`}
          >
            {message.message}
          </p>
        </div>

        {!isAdminMessage && message.admin_response && (
          <div>
            <h4 className="font-medium mb-2 text-primary">Admin Response:</h4>
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
              <p>{message.admin_response}</p>
              {message.responded_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Responded on {new Date(message.responded_at).toLocaleDateString()} at{" "}
                  {new Date(message.responded_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}

        {isAdminMessage && (
          <div className="space-y-3">
            {!showReplyForm ? (
              <Button onClick={() => setShowReplyForm(true)} variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Reply
              </Button>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button onClick={handleReply} disabled={sending || !replyText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? "Sending..." : "Send Reply"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReplyForm(false)
                      setReplyText("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!message.is_read_by_parent && isAdminMessage && (
          <Button variant="outline" size="sm" onClick={() => onMarkAsRead(message.id)}>
            Mark as Read
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
