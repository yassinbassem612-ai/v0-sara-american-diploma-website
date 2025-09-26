"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { HomeContent } from "@/lib/types"

export function HomeContentManager() {
  const [content, setContent] = useState<HomeContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchHomeContent()
  }, [])

  const fetchHomeContent = async () => {
    try {
      const { data, error } = await supabase.from("home_content").select("*").limit(1)

      if (error) {
        console.error("Error fetching home content:", error)
        return
      }

      const homeContent = data && data.length > 0 ? data[0] : null

      setContent(
        homeContent || {
          id: "",
          phone_number: "",
          center_location: "",
          free_session_link: "",
          about_text: "",
          video_title: "",
        },
      )
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content) return

    setIsSaving(true)
    setMessage("")

    try {
      const { error } = await supabase.from("home_content").upsert({
        phone_number: content.phone_number,
        center_location: content.center_location,
        free_session_link: content.free_session_link,
        about_text: content.about_text,
        video_title: content.video_title,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        setMessage("Error saving content: " + error.message)
      } else {
        setMessage("Content saved successfully!")
        setTimeout(() => {
          setMessage("")
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      setMessage("Error saving content")
    } finally {
      setIsSaving(false)
    }
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Home Page Content</h2>
        <p className="text-muted-foreground">Manage the content displayed on your website's homepage.</p>
      </div>

      {message && (
        <Alert className={message.includes("Error") ? "border-destructive" : "border-green-500"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
              Phone Number
            </label>
            <Input
              id="phone"
              value={content?.phone_number || ""}
              onChange={(e) => setContent((prev) => (prev ? { ...prev, phone_number: e.target.value } : null))}
              placeholder="01020176774"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
              Center Location
            </label>
            <Input
              id="location"
              value={content?.center_location || ""}
              onChange={(e) => setContent((prev) => (prev ? { ...prev, center_location: e.target.value } : null))}
              placeholder="zayed-روضة زايد / Dokki-center enovation"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="video-title" className="block text-sm font-medium text-foreground mb-2">
              Video Title
            </label>
            <Input
              id="video-title"
              value={content?.video_title || ""}
              onChange={(e) => setContent((prev) => (prev ? { ...prev, video_title: e.target.value } : null))}
              placeholder="Introduction Video"
            />
          </div>

          <div>
            <label htmlFor="video-link" className="block text-sm font-medium text-foreground mb-2">
              Video Link
            </label>
            <Input
              id="video-link"
              value={content?.free_session_link || ""}
              onChange={(e) => setContent((prev) => (prev ? { ...prev, free_session_link: e.target.value } : null))}
              placeholder="https://example.com/video"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label htmlFor="about" className="block text-sm font-medium text-foreground mb-2">
              About Text
            </label>
            <Textarea
              id="about"
              value={content?.about_text || ""}
              onChange={(e) => setContent((prev) => (prev ? { ...prev, about_text: e.target.value } : null))}
              placeholder="Expert SAT, ACT, and EST test preparation with personalized tutoring and comprehensive study materials."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  )
}
