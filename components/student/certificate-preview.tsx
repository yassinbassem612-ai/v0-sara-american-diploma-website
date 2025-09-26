"use client"

import type { Certificate } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface CertificatePreviewProps {
  certificate: Certificate
}

export function CertificatePreview({ certificate }: CertificatePreviewProps) {
  const getScorePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} className="mb-4">
          Print Certificate
        </Button>
      </div>

      <div id="certificate" className="w-full max-w-4xl mx-auto bg-white p-12 print:p-8 print:shadow-none shadow-lg">
        {/* Certificate Border */}
        <div className="border-8 border-double border-primary p-8 print:p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl print:text-3xl font-bold text-primary mb-2">CERTIFICATE OF ACHIEVEMENT</h1>
            <div className="w-32 h-1 bg-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Sara American Diploma</p>
            <p className="text-sm text-muted-foreground">Excellence in Mathematics Education</p>
          </div>

          {/* Main Content */}
          <div className="text-center mb-8">
            <p className="text-lg mb-4">This is to certify that</p>
            <h2 className="text-3xl print:text-2xl font-bold text-primary mb-4 border-b-2 border-primary pb-2 inline-block">
              {certificate.student_name}
            </h2>
            <p className="text-lg mb-4">has successfully completed</p>
            <h3 className="text-2xl print:text-xl font-semibold mb-4">{certificate.quiz_title}</h3>
            <p className="text-lg mb-2">in the {certificate.category.toUpperCase()} program</p>
          </div>

          {/* Score Section */}
          <div className="text-center mb-8">
            <div className="inline-block bg-primary/10 border-2 border-primary rounded-lg p-4">
              <p className="text-lg font-medium">Final Score</p>
              <p className="text-3xl print:text-2xl font-bold text-primary">
                {getScorePercentage(certificate.score, certificate.total_questions)}%
              </p>
              <p className="text-sm text-muted-foreground">
                ({certificate.score} out of {certificate.total_questions} correct)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-12 print:mt-8">
            <div className="text-center">
              <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
              <p className="font-semibold">{certificate.instructor_name}</p>
              <p className="text-sm text-muted-foreground">Instructor</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
              <p className="font-semibold">{new Date(certificate.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">Date</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 print:hidden">
            <div className="w-16 h-16 border-4 border-primary rounded-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 print:hidden">
            <div className="w-16 h-16 border-4 border-primary rounded-full flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate, #certificate * {
            visibility: visible;
          }
          #certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          @page {
            margin: 0.5in;
            size: landscape;
          }
        }
      `}</style>
    </div>
  )
}
