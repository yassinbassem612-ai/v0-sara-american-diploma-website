"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/lib/auth-context"
import { Plus, QrCode, X, CheckCircle, Loader2, Eye, Trash2, UserPlus } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface AttendanceSession {
  id: string
  session_name: string
  created_at: string
  closed_at: string | null
  is_active: boolean
  scanned_count: number
}

interface ScannedStudent {
  id: string
  student_id: string
  username: string
  scanned_at: string
}

interface Student {
  id: string
  username: string
}

export function QRAttendance() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null)
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([])
  const [sessionName, setSessionName] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isProcessingRef = useRef(false)

  const [viewingSession, setViewingSession] = useState<AttendanceSession | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null)
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (activeSession) {
      fetchScannedStudents(activeSession.id)
    }
  }, [activeSession])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => console.error("Error stopping scanner:", err))
      }
    }
  }, [])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select(`
          *,
          attendance_scans(count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const sessionsWithCount = (data || []).map((session: any) => ({
        ...session,
        scanned_count: session.attendance_scans?.[0]?.count || 0,
      }))

      setSessions(sessionsWithCount)
    } catch (error) {
      console.error("Error fetching sessions:", error)
    }
  }

  const fetchScannedStudents = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance_scans")
        .select(`
          id,
          user_id,
          scanned_at,
          users:user_id (username)
        `)
        .eq("session_id", sessionId)
        .order("scanned_at", { ascending: false })

      if (error) throw error

      const studentsData = (data || []).map((scan: any) => ({
        id: scan.id,
        student_id: scan.user_id,
        username: scan.users?.username || "Unknown",
        scanned_at: scan.scanned_at,
      }))

      setScannedStudents(studentsData)
    } catch (error) {
      console.error("Error fetching scanned students:", error)
    }
  }

  const fetchAvailableStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username")
        .eq("role", "student")
        .order("username")

      if (error) throw error

      setAvailableStudents(data || [])
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      setMessage("Please enter a session name")
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("attendance_sessions")
        .insert({
          session_name: sessionName,
          created_by: user?.id,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setMessage("Session created successfully!")
      setSessionName("")
      setActiveSession(data)
      await fetchSessions()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error creating session:", error)
      setMessage("Error creating session")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSession = async () => {
    if (!activeSession) return

    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({
          closed_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", activeSession.id)

      if (error) throw error

      setMessage("Session closed successfully!")
      setActiveSession(null)
      stopScanner()
      await fetchSessions()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error closing session:", error)
      setMessage("Error closing session")
    }
  }

  const startScanner = async () => {
    try {
      setIsScanning(true)
      await new Promise((resolve) => setTimeout(resolve, 100))
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (isProcessingRef.current) return
          isProcessingRef.current = true

          await handleQRCodeScanned(decodedText)

          setTimeout(() => {
            isProcessingRef.current = false
          }, 2000)
        },
        (errorMessage) => {
          // Ignore errors during scanning
        },
      )
    } catch (error) {
      console.error("Error starting scanner:", error)
      setMessage("Error starting scanner. Please check camera permissions.")
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }
    setIsScanning(false)
  }

  const handleQRCodeScanned = async (qrData: string) => {
    if (!activeSession) return

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username")
        .eq("qr_code_data", qrData)
        .eq("role", "student")
        .single()

      if (userError || !userData) {
        setMessage("Invalid QR code or student not found")
        setTimeout(() => setMessage(""), 3000)
        return
      }

      const { data: existingScan, error: checkError } = await supabase
        .from("attendance_scans")
        .select("id")
        .eq("session_id", activeSession.id)
        .eq("user_id", userData.id)
        .single()

      if (existingScan) {
        setMessage(`${userData.username} already scanned!`)
        setTimeout(() => setMessage(""), 3000)
        return
      }

      const { error: insertError } = await supabase.from("attendance_scans").insert({
        session_id: activeSession.id,
        user_id: userData.id,
      })

      if (insertError) throw insertError

      setMessage(`✓ ${userData.username} marked present!`)
      await fetchScannedStudents(activeSession.id)
      setTimeout(() => setMessage(""), 2000)
    } catch (error) {
      console.error("Error processing QR code:", error)
      setMessage("Error processing QR code")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleViewSession = async (session: AttendanceSession) => {
    setViewingSession(session)
    await fetchScannedStudents(session.id)
    await fetchAvailableStudents()
  }

  const handleAddStudent = async () => {
    if (!selectedStudentId || !viewingSession) return

    try {
      setLoading(true)

      const { data: existingScan } = await supabase
        .from("attendance_scans")
        .select("id")
        .eq("session_id", viewingSession.id)
        .eq("user_id", selectedStudentId)
        .single()

      if (existingScan) {
        setMessage("Student already marked present in this session")
        setTimeout(() => setMessage(""), 3000)
        return
      }

      const { error } = await supabase.from("attendance_scans").insert({
        session_id: viewingSession.id,
        user_id: selectedStudentId,
      })

      if (error) throw error

      setMessage("Student added successfully!")
      await fetchScannedStudents(viewingSession.id)
      await fetchSessions()
      setAddStudentDialogOpen(false)
      setSelectedStudentId("")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error adding student:", error)
      setMessage("Error adding student")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStudent = async (scanId: string) => {
    if (!viewingSession) return

    try {
      const { error } = await supabase.from("attendance_scans").delete().eq("id", scanId)

      if (error) throw error

      setMessage("Student removed from attendance")
      await fetchScannedStudents(viewingSession.id)
      await fetchSessions()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error removing student:", error)
      setMessage("Error removing student")
    }
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      setLoading(true)

      const { error } = await supabase.from("attendance_sessions").delete().eq("id", sessionToDelete.id)

      if (error) throw error

      setMessage("Session deleted successfully!")
      await fetchSessions()
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
      if (viewingSession?.id === sessionToDelete.id) {
        setViewingSession(null)
      }
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error deleting session:", error)
      setMessage("Error deleting session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">QR Code Attendance</h2>
        <p className="text-muted-foreground">Scan student QR codes to mark attendance</p>
      </div>

      {message && (
        <Alert
          className={
            message.includes("Error") || message.includes("Invalid") ? "border-destructive" : "border-green-500"
          }
        >
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {!activeSession && !viewingSession ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Session</CardTitle>
              <CardDescription>Start a new attendance session with QR code scanning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Morning Session - Jan 15"
                />
              </div>
              <Button onClick={handleCreateSession} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>View past attendance sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No sessions yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{session.session_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.is_active ? "default" : "secondary"}>
                            {session.scanned_count} students
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => handleViewSession(session)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSessionToDelete(session)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : viewingSession ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{viewingSession.session_name}</CardTitle>
                  <CardDescription>
                    Started: {new Date(viewingSession.created_at).toLocaleString()}
                    {viewingSession.closed_at && <> • Closed: {new Date(viewingSession.closed_at).toLocaleString()}</>}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setViewingSession(null)}>
                  <X className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => setAddStudentDialogOpen(true)} className="flex-1">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSessionToDelete(viewingSession)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Session
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance List ({scannedStudents.length})</CardTitle>
              <CardDescription>Students marked present in this session</CardDescription>
            </CardHeader>
            <CardContent>
              {scannedStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No students in attendance</p>
              ) : (
                <div className="space-y-2">
                  {scannedStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{student.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(student.scanned_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveStudent(student.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activeSession.session_name}</CardTitle>
                  <CardDescription>Started: {new Date(activeSession.created_at).toLocaleString()}</CardDescription>
                </div>
                <Button variant="destructive" onClick={handleCloseSession}>
                  <X className="mr-2 h-4 w-4" />
                  Close Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                {!isScanning ? (
                  <Button onClick={startScanner} size="lg">
                    <QrCode className="mr-2 h-5 w-5" />
                    Start QR Scanner
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="outline" size="lg">
                    <X className="mr-2 h-5 w-5" />
                    Stop Scanner
                  </Button>
                )}
              </div>

              {isScanning && (
                <div className="space-y-4">
                  <div id="qr-reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden border" />
                  <p className="text-center text-sm text-muted-foreground">
                    Point the camera at a student's QR code to mark attendance
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scanned Students ({scannedStudents.length})</CardTitle>
              <CardDescription>Students marked present in this session</CardDescription>
            </CardHeader>
            <CardContent>
              {scannedStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No students scanned yet</p>
              ) : (
                <div className="space-y-2">
                  {scannedStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{student.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(student.scanned_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">Present</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Attendance</DialogTitle>
            <DialogDescription>Select a student to manually add to this attendance session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStudentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={!selectedStudentId || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sessionToDelete?.session_name}"? This action cannot be undone and will
              remove all attendance records for this session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSession} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Session"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
