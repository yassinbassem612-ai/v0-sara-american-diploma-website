"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Certificate } from "@/lib/types"
import { Award, Printer } from "lucide-react"
import { CertificatePreview } from "./certificate-preview"

interface StudentCertificatesProps {
  userId: string
}

export function StudentCertificates({ userId }: StudentCertificatesProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCertificates()
  }, [userId])

  const fetchCertificates = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", userId)
        .eq("is_visible_to_student", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCertificates(data || [])
    } catch (error) {
      console.error("Error fetching certificates:", error)
    } finally {
      setLoading(false)
    }
  }

  const printCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate)
    // Trigger print after a short delay to allow the component to render
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const getScorePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading certificates...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Certificates</h2>
        <p className="text-muted-foreground">View and print your achievement certificates</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No certificates available yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{certificate.category.toUpperCase()}</Badge>
                </div>
                <CardTitle className="text-lg">{certificate.quiz_title}</CardTitle>
                <CardDescription>Achievement Certificate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {getScorePercentage(certificate.score, certificate.total_questions)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {certificate.score} out of {certificate.total_questions} correct
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Instructor: {certificate.instructor_name}</p>
                  <p>Date: {new Date(certificate.created_at).toLocaleDateString()}</p>
                </div>
                <Button onClick={() => printCertificate(certificate)} className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Certificate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden certificate preview for printing */}
      {selectedCertificate && (
        <div className="print:block hidden">
          <CertificatePreview certificate={selectedCertificate} />
        </div>
      )}
    </div>
  )
}
