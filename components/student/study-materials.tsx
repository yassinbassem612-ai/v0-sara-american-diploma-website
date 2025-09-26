"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, FileText, ImageIcon, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { StudyMaterial } from "@/lib/types"

export function StudyMaterials() {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchMaterials()
  }, [user])

  const fetchMaterials = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .or(`category.eq.${user.category},category.eq.all`)
        .or(`level.eq.${user.level || "basics"},level.eq.all`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />
    if (fileType.includes("image")) return <ImageIcon className="h-5 w-5 text-blue-500" />
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return <FileText className="h-5 w-5 text-green-500" />
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes("pdf")) return "PDF"
    if (fileType.includes("image")) return "Image"
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "Excel"
    return "File"
  }

  const handleDownload = (material: StudyMaterial) => {
    window.open(material.file_url, "_blank")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Study Materials</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <FolderOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Study Materials</h2>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <span>
            {user?.category?.toUpperCase()} - {user?.level?.charAt(0).toUpperCase() + user?.level?.slice(1)}
          </span>
        </Badge>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Materials Available</h3>
            <p className="text-muted-foreground">
              There are no study materials available for your category and level yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card key={material.id} className="transition-all duration-200 hover:shadow-md hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(material.file_type)}
                    <CardTitle className="text-base line-clamp-2">{material.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <Badge variant={material.category === "all" ? "secondary" : "default"} className="text-xs">
                      {material.category.toUpperCase()}
                    </Badge>
                    <Badge variant={material.level === "all" ? "secondary" : "outline"} className="text-xs">
                      {material.level.charAt(0).toUpperCase() + material.level.slice(1)}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getFileTypeLabel(material.file_type)}
                  </Badge>
                </div>
                <Button onClick={() => handleDownload(material)} className="w-full" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Material
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
