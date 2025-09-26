"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderOpen, FileText, ImageIcon, Plus, Edit, Trash2, Save, X, ExternalLink, Upload, File } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { StudyMaterial } from "@/lib/types"

export function MaterialsManager() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    file_url: "",
    file_type: "",
    category: "all" as "act" | "sat" | "est" | "all",
    level: "all" as "advanced" | "basics" | "all",
  })
  const supabase = createClient()

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setFormData((prev) => ({
      ...prev,
      title: prev.title || file.name.split(".")[0],
      file_type: getFileTypeFromFile(file),
    }))
  }

  const getFileTypeFromFile = (file: File) => {
    if (file.type.includes("pdf")) return "pdf"
    if (file.type.includes("image")) return "image"
    if (
      file.type.includes("excel") ||
      file.type.includes("spreadsheet") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls")
    )
      return "excel"
    return "other"
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    return URL.createObjectURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let fileUrl = formData.file_url

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile)
      }

      const dataToSubmit = {
        ...formData,
        file_url: fileUrl,
      }

      if (editingMaterial) {
        const { error } = await supabase.from("study_materials").update(dataToSubmit).eq("id", editingMaterial.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("study_materials").insert([dataToSubmit])
        if (error) throw error
      }

      await fetchMaterials()
      resetForm()
    } catch (error) {
      console.error("Error saving material:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (material: StudyMaterial) => {
    setEditingMaterial(material)
    setFormData({
      title: material.title,
      file_url: material.file_url,
      file_type: material.file_type,
      category: material.category,
      level: material.level,
    })
    setSelectedFile(null)
    setShowForm(true)
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return

    try {
      const { error } = await supabase.from("study_materials").delete().eq("id", materialId)

      if (error) throw error
      await fetchMaterials()
    } catch (error) {
      console.error("Error deleting material:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      file_url: "",
      file_type: "",
      category: "all",
      level: "all",
    })
    setSelectedFile(null)
    setEditingMaterial(null)
    setShowForm(false)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Study Materials Management</h2>
        </div>
        <div className="animate-pulse grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
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
          <h2 className="text-2xl font-bold">Study Materials Management</h2>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Material</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMaterial ? "Edit Material" : "Add New Material"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Material Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter material title"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Upload File</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <File className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">Drop files here or click to browse</p>
                          <p className="text-sm text-muted-foreground">Supports PDF, Images, Excel files and more</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          id="file-upload"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelect(e.target.files[0])
                            }
                          }}
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.doc,.docx"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="sat">SAT</SelectItem>
                      <SelectItem value="act">ACT</SelectItem>
                      <SelectItem value="est">EST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: any) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="basics">Basics</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  className="flex items-center space-x-2"
                  disabled={uploading || (!selectedFile && !formData.file_url)}
                >
                  <Save className="h-4 w-4" />
                  <span>{uploading ? "Uploading..." : editingMaterial ? "Update Material" : "Add Material"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center space-x-2 bg-transparent"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Materials Available</h3>
              <p className="text-muted-foreground">Add your first study material to get started.</p>
            </CardContent>
          </Card>
        ) : (
          materials.map((material) => (
            <Card key={material.id} className="transition-all duration-200 hover:shadow-md">
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(material.file_url, "_blank")}
                    className="flex-1 flex items-center space-x-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(material)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                    className="flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
