"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Download, QrCodeIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"
import QRCodeStyling from "qr-code-styling"
import { useRef } from "react"

export function StudentQRCode() {
  const { user } = useAuth()
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const qrCodeInstance = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (user) {
      fetchQRCode()
    }
  }, [user])

  useEffect(() => {
    if (qrCodeData && qrCodeRef.current && !qrCodeInstance.current) {
      qrCodeInstance.current = new QRCodeStyling({
        width: 300,
        height: 300,
        data: qrCodeData,
        image: "",
        dotsOptions: {
          color: "#000000",
          type: "rounded",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 0,
        },
      })

      qrCodeInstance.current.append(qrCodeRef.current)
    } else if (qrCodeData && qrCodeInstance.current) {
      qrCodeInstance.current.update({ data: qrCodeData })
    }
  }, [qrCodeData])

  const fetchQRCode = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("users").select("qr_code_data, username").eq("id", user.id).single()

      if (error) throw error

      if (data?.qr_code_data) {
        setQrCodeData(data.qr_code_data)
      } else {
        const { error: updateError } = await supabase.from("users").update({ qr_code_data: user.id }).eq("id", user.id)

        if (updateError) throw updateError
        setQrCodeData(user.id)
      }
    } catch (error) {
      console.error("Error fetching QR code:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.download({
        name: `${user?.username}-qr-code`,
        extension: "png",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCodeIcon className="h-5 w-5" />
            <span>My QR Code</span>
          </CardTitle>
          <CardDescription>Your attendance QR code</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCodeIcon className="h-5 w-5" />
          <span>My QR Code</span>
        </CardTitle>
        <CardDescription>Show this QR code to mark your attendance</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-white rounded-lg border-2 border-dashed">
          <div ref={qrCodeRef} />
        </div>
        <div className="text-center space-y-2">
          <p className="font-medium text-lg">{user?.username}</p>
          <p className="text-sm text-muted-foreground">
            {user?.category?.toUpperCase()} - {user?.level}
          </p>
        </div>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  )
}
