"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Palette,
  Brush,
  Eraser,
  Undo,
  Redo,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Maximize,
  Minimize,
  Upload,
  FileImage,
  FileText,
} from "lucide-react"

declare global {
  interface Window {
    pdfjsLib: any
  }
}

interface DrawingState {
  imageData: string
  paths: Path[]
  backgroundImage?: string
  isPdfPage?: boolean
  pdfPageNumber?: number
}

interface Path {
  points: { x: number; y: number }[]
  color: string
  width: number
  tool: "brush" | "eraser"
}

interface PdfData {
  pdf: any
  totalPages: number
  currentPdfPage: number
}

export function PaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [toolbarPosition, setToolbarPosition] = useState({ x: 16, y: 16 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<"brush" | "eraser">("brush")
  const [brushSize, setBrushSize] = useState(5)
  const [currentColor, setCurrentColor] = useState("#000000")
  const [currentPage, setCurrentPage] = useState(1)
  const [pages, setPages] = useState<DrawingState[]>([{ imageData: "", paths: [] }])
  const [undoStack, setUndoStack] = useState<DrawingState[]>([])
  const [redoStack, setRedoStack] = useState<DrawingState[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)
  const [pdfData, setPdfData] = useState<PdfData | null>(null)
  const [isPdfMode, setIsPdfMode] = useState(false)

  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#008000",
    "#000080",
    "#800000",
  ]

  const brushSizes = [1, 3, 5, 10, 15, 20, 30]

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type === "application/pdf") {
      setIsLoadingPdf(true)
      try {
        await handlePdfUpload(file)
      } catch (error) {
        console.error("Error loading PDF:", error)
        alert("Error loading PDF file. Please try again.")
      } finally {
        setIsLoadingPdf(false)
      }
    } else if (file.type.startsWith("image/")) {
      setIsPdfMode(false)
      setPdfData(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          setBackgroundImage(result)
          const newPages = [...pages]
          newPages[currentPage - 1] = {
            ...newPages[currentPage - 1],
            backgroundImage: result,
            isPdfPage: false,
          }
          setPages(newPages)
          redrawCanvas(result)
        }
      }
      reader.readAsDataURL(file)
    } else {
      // For other file types, try to display as image
      setIsPdfMode(false)
      setPdfData(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          setBackgroundImage(result)
          const newPages = [...pages]
          newPages[currentPage - 1] = {
            ...newPages[currentPage - 1],
            backgroundImage: result,
            isPdfPage: false,
          }
          setPages(newPages)
          redrawCanvas(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePdfUpload = async (file: File) => {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js not loaded")
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise

    // Set PDF mode and store PDF data
    setIsPdfMode(true)
    setPdfData({
      pdf,
      totalPages: pdf.numPages,
      currentPdfPage: 1,
    })

    // Create pages for all PDF pages
    const newPages: DrawingState[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const pageImage = await renderPdfPage(pdf, i)
      newPages.push({
        imageData: "",
        paths: [],
        backgroundImage: pageImage,
        isPdfPage: true,
        pdfPageNumber: i,
      })
    }

    setPages(newPages)
    setCurrentPage(1)

    // Render first page
    const firstPageImage = await renderPdfPage(pdf, 1)
    setBackgroundImage(firstPageImage)
    redrawCanvas(firstPageImage)
  }

  const renderPdfPage = async (pdf: any, pageNumber: number): Promise<string> => {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1.5 })

    // Create canvas to render PDF page
    const pdfCanvas = document.createElement("canvas")
    const pdfContext = pdfCanvas.getContext("2d")
    pdfCanvas.height = viewport.height
    pdfCanvas.width = viewport.width

    if (pdfContext) {
      const renderContext = {
        canvasContext: pdfContext,
        viewport: viewport,
      }

      await page.render(renderContext).promise
      return pdfCanvas.toDataURL()
    }

    return ""
  }

  const goToPdfPage = async (pageNumber: number) => {
    if (!pdfData || !isPdfMode || pageNumber < 1 || pageNumber > pdfData.totalPages) return

    saveCurrentState()

    // Update PDF data
    setPdfData({
      ...pdfData,
      currentPdfPage: pageNumber,
    })

    // Switch to the corresponding canvas page
    setCurrentPage(pageNumber)

    // Load the PDF page image if not already loaded
    const pageData = pages[pageNumber - 1]
    if (pageData && pageData.backgroundImage) {
      setBackgroundImage(pageData.backgroundImage)
      redrawCanvas(pageData.backgroundImage)
    }
  }

  const redrawCanvas = (bgImage?: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const imageToUse = bgImage || pages[currentPage - 1]?.backgroundImage
    if (imageToUse) {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        ctx.fillStyle = "#000000"
        ctx.font = "bold 24px serif"
        ctx.textAlign = "center"
        ctx.fillText("Sara Abdelwahab", canvas.width / 2, 40)

        const currentPageData = pages[currentPage - 1]
        if (currentPageData.imageData && !bgImage) {
          const drawingImg = new Image()
          drawingImg.onload = () => {
            ctx.drawImage(drawingImg, 0, 0)
          }
          drawingImg.src = currentPageData.imageData
        }
      }
      img.src = imageToUse
    } else {
      ctx.fillStyle = "#000000"
      ctx.font = "bold 24px serif"
      ctx.textAlign = "center"
      ctx.fillText("Sara Abdelwahab", canvas.width / 2, 40)
    }
  }

  const updateCanvasSize = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = canvas.toDataURL()

    if (isFullscreen) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    } else {
      canvas.width = 800
      canvas.height = 600
    }

    redrawCanvas()

    if (imageData && imageData !== "data:,") {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = imageData
    }
  }

  useEffect(() => {
    updateCanvasSize()
  }, [isFullscreen])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (isFullscreen) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    } else {
      canvas.width = 800
      canvas.height = 600
    }

    redrawCanvas()

    const currentPageData = pages[currentPage - 1]
    if (currentPageData.imageData) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = currentPageData.imageData
    }
  }, [currentPage, pages])

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    if (e.target === toolbarRef.current || toolbarRef.current?.contains(e.target as Node)) {
      setIsDragging(true)
      const rect = toolbarRef.current!.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleToolbarMouseMove = (e: MouseEvent) => {
    if (isDragging && toolbarRef.current) {
      const newX = Math.max(0, Math.min(window.innerWidth - toolbarRef.current.offsetWidth, e.clientX - dragOffset.x))
      const newY = Math.max(0, Math.min(window.innerHeight - toolbarRef.current.offsetHeight, e.clientY - dragOffset.y))

      setToolbarPosition({ x: newX, y: newY })
    }
  }

  const handleToolbarMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleToolbarMouseMove)
      document.addEventListener("mouseup", handleToolbarMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleToolbarMouseMove)
        document.removeEventListener("mouseup", handleToolbarMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const saveCurrentState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL()
    const newPages = [...pages]
    newPages[currentPage - 1] = {
      imageData,
      paths: [],
      backgroundImage: newPages[currentPage - 1]?.backgroundImage,
      isPdfPage: newPages[currentPage - 1]?.isPdfPage,
      pdfPageNumber: newPages[currentPage - 1]?.pdfPageNumber,
    }
    setPages(newPages)

    setUndoStack((prev) => [...prev, newPages[currentPage - 1]])
    setRedoStack([])
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = getCanvasCoordinates(e)

    setIsDrawing(true)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)

    if (currentTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
    } else {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = currentColor
    }

    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = getCanvasCoordinates(e)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    saveCurrentState()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    saveCurrentState()

    redrawCanvas()
  }

  const undo = () => {
    if (undoStack.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const currentState = {
      imageData: canvas.toDataURL(),
      paths: [],
      backgroundImage: pages[currentPage - 1]?.backgroundImage,
      isPdfPage: pages[currentPage - 1]?.isPdfPage,
      pdfPageNumber: pages[currentPage - 1]?.pdfPageNumber,
    }
    setRedoStack((prev) => [currentState, ...prev])

    const previousState = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))

    if (previousState.imageData) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = previousState.imageData
    }
  }

  const redo = () => {
    if (redoStack.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const currentState = {
      imageData: canvas.toDataURL(),
      paths: [],
      backgroundImage: pages[currentPage - 1]?.backgroundImage,
      isPdfPage: pages[currentPage - 1]?.isPdfPage,
      pdfPageNumber: pages[currentPage - 1]?.pdfPageNumber,
    }
    setUndoStack((prev) => [...prev, currentState])

    const nextState = redoStack[0]
    setRedoStack((prev) => prev.slice(1))

    if (nextState.imageData) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = nextState.imageData
    }
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    const fileName =
      isPdfMode && pages[currentPage - 1]?.isPdfPage
        ? `sara-drawing-pdf-page-${pages[currentPage - 1]?.pdfPageNumber || currentPage}.png`
        : `sara-drawing-page-${currentPage}.png`
    link.download = fileName
    link.href = canvas.toDataURL()
    link.click()
  }

  const addNewPage = () => {
    if (isPdfMode) return

    saveCurrentState()
    setPages((prev) => [...prev, { imageData: "", paths: [] }])
    setCurrentPage(pages.length + 1)
  }

  const goToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > pages.length) return

    if (isPdfMode) {
      goToPdfPage(pageNumber)
      return
    }

    saveCurrentState()
    setCurrentPage(pageNumber)
  }

  const deletePage = () => {
    if (isPdfMode || pages.length <= 1) return

    const newPages = pages.filter((_, index) => index !== currentPage - 1)
    setPages(newPages)

    if (currentPage > newPages.length) {
      setCurrentPage(newPages.length)
    }
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div
          ref={toolbarRef}
          className="absolute z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border cursor-move select-none"
          style={{
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
            userSelect: "none",
          }}
          onMouseDown={handleToolbarMouseDown}
        >
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Minimize className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoadingPdf}>
              {isLoadingPdf ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
            <div className="flex gap-1">
              <Button
                variant={currentTool === "brush" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("brush")}
              >
                <Brush className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("eraser")}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              {[5, 10, 20].map((size) => (
                <Button
                  key={size}
                  variant={brushSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrushSize(size)}
                  className="px-2"
                >
                  {size}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {["#000000", "#FF0000", "#00FF00", "#0000FF"].map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded border-2 ${currentColor === color ? "border-primary" : "border-gray-300"}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length === 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.length === 0}>
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            {isPdfMode && <FileText className="h-3 w-3" />}
            Page {currentPage} of {pages.length}
            {isPdfMode && pdfData && ` (PDF: ${pdfData.currentPdfPage}/${pdfData.totalPages})`}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages.length}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isPdfMode && (
            <Button variant="outline" size="sm" onClick={addNewPage}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,*/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <canvas
          ref={canvasRef}
          className="cursor-crosshair w-full h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Paint Application</h2>
        <p className="text-muted-foreground">
          Create digital artwork with drawing tools and multiple pages. Upload images or PDFs to draw on them.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Upload File</h4>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*,.pdf,*/*"
                  onChange={handleFileUpload}
                  className="text-sm"
                  disabled={isLoadingPdf}
                />
                {isLoadingPdf && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading PDF...
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload images, PDFs, or any file type to draw on top of them. PDFs will load all pages automatically.
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Drawing Tools</h4>
              <div className="flex gap-2">
                <Button
                  variant={currentTool === "brush" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("brush")}
                >
                  <Brush className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentTool === "eraser" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("eraser")}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Brush Size</h4>
              <div className="grid grid-cols-4 gap-1">
                {brushSizes.map((size) => (
                  <Button
                    key={size}
                    variant={brushSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBrushSize(size)}
                    className="p-2"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Colors</h4>
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${currentColor === color ? "border-primary" : "border-gray-300"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-full mt-2 h-8 rounded border"
              />
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length === 0}>
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.length === 0}>
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={toggleFullscreen} className="w-full bg-transparent">
                  <Maximize className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
                <Button variant="outline" size="sm" onClick={clearCanvas} className="w-full bg-transparent">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Page
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCanvas} className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Canvas
                <Badge variant="outline" className="flex items-center gap-1">
                  {isPdfMode && <FileText className="h-3 w-3" />}
                  Page {currentPage} of {pages.length}
                </Badge>
                {pages[currentPage - 1]?.backgroundImage && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {pages[currentPage - 1]?.isPdfPage ? (
                      <FileText className="h-3 w-3" />
                    ) : (
                      <FileImage className="h-3 w-3" />
                    )}
                    {pages[currentPage - 1]?.isPdfPage ? "PDF Page" : "Background"}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {pages.length}
                  {isPdfMode && pdfData && ` (PDF: ${pdfData.currentPdfPage}/${pdfData.totalPages})`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pages.length}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isPdfMode && (
                  <>
                    <Button variant="outline" size="sm" onClick={addNewPage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={deletePage} disabled={pages.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white" ref={containerRef}>
              <canvas
                ref={canvasRef}
                className="cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ display: "block", maxWidth: "100%", height: "auto" }}
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Click and drag to draw. Use the tools on the left to change brush size, color, and drawing mode.</p>
              <p>Upload any file type (images, PDFs, documents) to use as a background and draw on top of them.</p>
              {isPdfMode && (
                <p className="font-medium text-blue-600">
                  PDF Mode: Navigate through all {pdfData?.totalPages} pages using the arrow buttons. Each page
                  maintains separate drawings.
                </p>
              )}
              <p>Each page displays "Sara Abdelwahab" at the top and provides a clean canvas for drawing.</p>
              <p>Click the Fullscreen button for a larger drawing area with a movable toolbar.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
