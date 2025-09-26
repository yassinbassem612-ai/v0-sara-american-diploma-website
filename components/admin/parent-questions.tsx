"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { createClient } from "@/lib/supabase/client"
import type { ParentMessage, Parent } from "@/lib/types"
import { Send, Clock, CheckCircle, User } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ParentQuestions() {
  const [messages, setMessages] = useState<(ParentMessage & { parents: Parent })[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ParentMessage | null>(null)
  const [response, setResponse] = useState("")
  const [responding, setResponding] = useState(false)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)

  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<string>("")
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch messages with parent information
      const { data: messagesData, error: messagesError } = await supabase
        .from("parent_messages")
        .select(`
          *,
          parents (
            id,
            username,
            parent_name,
            email,
            phone
          )
        `)
        .order("created_at", { ascending: false })

      if (messagesError) throw messagesError

      // Fetch all parents
      const { data: parentsData, error: parentsError } = await supabase.from("parents").select("*").order("parent_name")

      if (parentsError) throw parentsError

      setMessages(messagesData || [])
      setParents(parentsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const openResponseDialog = (message: ParentMessage) => {
    setSelectedMessage(message)
    setResponse(message.admin_response || "")
    setIsResponseDialogOpen(true)
  }

  const sendResponse = async () => {
    try {
      if (!selectedMessage || !response.trim()) {
        toast.error("Please enter a response")
        return
      }

      setResponding(true)

      const { error } = await supabase
        .from("parent_messages")
        .update({
          admin_response: response.trim(),
          is_read_by_admin: true,
          is_read_by_parent: false,
          responded_at: new Date().toISOString(),
        })
        .eq("id", selectedMessage.id)

      if (error) throw error

      toast.success("Response sent successfully")
      setIsResponseDialogOpen(false)
      setSelectedMessage(null)
      setResponse("")
      fetchData()
    } catch (error) {
      console.error("Error sending response:", error)
      toast.error("Failed to send response")
    } finally {
      setResponding(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase.from("parent_messages").update({ is_read_by_admin: true }).eq("id", messageId)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const sendNewMessage = async () => {
    try {
      if (!selectedParent || !newMessage.trim()) {
        toast.error("Please select a parent and enter a message")
        return
      }

      setSendingMessage(true)

      const { error } = await supabase.from("parent_messages").insert({
        parent_id: selectedParent,
        message: newMessage.trim(),
        sender_type: "admin",
        admin_response: null,
        is_read_by_admin: true,
        is_read_by_parent: false,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success("Message sent to parent successfully")
      setIsNewMessageDialogOpen(false)
      setSelectedParent("")
      setNewMessage("")
      fetchData()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const unreadMessages = messages.filter((msg) => !msg.is_read_by_admin)
  const respondedMessages = messages.filter((msg) => msg.admin_response)
  const pendingMessages = messages.filter((msg) => !msg.admin_response)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading messages...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Parent Questions</h2>
          <p className="text-muted-foreground">Manage messages from parents</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsNewMessageDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Message to Parent
          </Button>
          <Badge variant="destructive">{unreadMessages.length} Unread</Badge>
          <Badge variant="secondary">{pendingMessages.length} Pending</Badge>
        </div>
      </div>

      <Tabs defaultValue="unread" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">Unread ({unreadMessages.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingMessages.length})</TabsTrigger>
          <TabsTrigger value="responded">Responded ({respondedMessages.length})</TabsTrigger>
          <TabsTrigger value="all">All Messages ({messages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
          {unreadMessages.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No unread messages</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            unreadMessages.map((message) => (
              <MessageCard key={message.id} message={message} onRespond={openResponseDialog} onMarkRead={markAsRead} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingMessages.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No pending messages</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingMessages.map((message) => (
              <MessageCard key={message.id} message={message} onRespond={openResponseDialog} onMarkRead={markAsRead} />
            ))
          )}
        </TabsContent>

        <TabsContent value="responded" className="space-y-4">
          {respondedMessages.map((message) => (
            <MessageCard key={message.id} message={message} onRespond={openResponseDialog} onMarkRead={markAsRead} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} onRespond={openResponseDialog} onMarkRead={markAsRead} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Parent Message</DialogTitle>
            <DialogDescription>Responding to message from {selectedMessage?.parents?.parent_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Original Message:</Label>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mt-1">{selectedMessage?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Type your response here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendResponse} disabled={responding || !response.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {responding ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Message to Parent</DialogTitle>
            <DialogDescription>Send a message to a parent without waiting for them to ask a question</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent-select">Select Parent</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a parent..." />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.parent_name} (@{parent.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-message">Message</Label>
              <Textarea
                id="new-message"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendNewMessage} disabled={sendingMessage || !selectedParent || !newMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {sendingMessage ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface MessageCardProps {
  message: ParentMessage & { parents: Parent }
  onRespond: (message: ParentMessage) => void
  onMarkRead: (messageId: string) => void
}

function MessageCard({ message, onRespond, onMarkRead }: MessageCardProps) {
  const isAdminMessage = message.sender_type === "admin"
  const isReply = message.parent_message_id !== null

  return (
    <Card className={!message.is_read_by_admin ? "border-primary" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <CardTitle className="text-lg">{message.parents.parent_name}</CardTitle>
            <Badge variant="outline">@{message.parents.username}</Badge>
            {isAdminMessage && <Badge variant="secondary">Admin Message</Badge>}
            {isReply && <Badge variant="outline">Reply</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            {message.admin_response ? (
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
            {!message.is_read_by_admin && <Badge variant="destructive">Unread</Badge>}
          </div>
        </div>
        <CardDescription>
          {message.parents.email && <span>Email: {message.parents.email} • </span>}
          {message.parents.phone && <span>Phone: {message.parents.phone} • </span>}
          {isAdminMessage ? "Your message sent" : "Received"} on {new Date(message.created_at).toLocaleDateString()} at{" "}
          {new Date(message.created_at).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">
            {isAdminMessage ? "Your Message to Parent:" : isReply ? "Parent's Reply:" : "Parent's Message:"}
          </h4>
          <p
            className={`p-3 rounded-lg ${isAdminMessage ? "bg-blue-50 border border-blue-200" : "text-muted-foreground bg-muted"}`}
          >
            {message.message}
          </p>
        </div>

        {message.admin_response && !isAdminMessage && (
          <div>
            <h4 className="font-medium mb-2 text-primary">Your Response:</h4>
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

        <div className="flex space-x-2">
          {!isAdminMessage && (
            <Button onClick={() => onRespond(message)}>
              <Send className="h-4 w-4 mr-2" />
              {message.admin_response ? "Edit Response" : "Respond"}
            </Button>
          )}
          {!message.is_read_by_admin && (
            <Button variant="outline" onClick={() => onMarkRead(message.id)}>
              Mark as Read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
