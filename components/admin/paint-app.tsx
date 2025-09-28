"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"

interface DrawingState {
  imageData: string
  paths: Path[]
}

interface Path {
  points: { x: number; y: number }[]
  color: string
  width: number
  tool: "brush" | "eraser"
}

export function PaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
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

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#000000"
    ctx.font = "bold 24px serif"
    ctx.textAlign = "center"
    ctx.fillText("Sara Abdelwahab", canvas.width / 2, 40)

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

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#000000"
    ctx.font = "bold 24px serif"
    ctx.textAlign = "center"
    ctx.fillText("Sara Abdelwahab", canvas.width / 2, 40)

    const currentPageData = pages[currentPage - 1]
    if (currentPageData.imageData) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
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
    newPages[currentPage - 1] = { imageData, paths: [] }
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

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#000000"
    ctx.font = "bold 24px serif"
    ctx.textAlign = "center"
    ctx.fillText("Sara Abdelwahab", canvas.width / 2, 40)
  }

  const undo = () => {
    if (undoStack.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const currentState = { imageData: canvas.toDataURL(), paths: [] }
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

    const currentState = { imageData: canvas.toDataURL(), paths: [] }
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
    link.download = `sara-drawing-page-${currentPage}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const addNewPage = () => {
    saveCurrentState()
    setPages((prev) => [...prev, { imageData: "", paths: [] }])
    setCurrentPage(pages.length + 1)
  }

  const goToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > pages.length) return
    saveCurrentState()
    setCurrentPage(pageNumber)
  }

  const deletePage = () => {
    if (pages.length <= 1) return

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
          <Badge variant="outline">
            Page {currentPage} of {pages.length}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages.length}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={addNewPage}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

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
        <p className="text-muted-foreground">Create digital artwork with drawing tools and multiple pages.</p>
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
                    className={`w-8 h-8 rounded border-2 ${
                      currentColor === color ? "border-primary" : "border-gray-300"
                    }`}
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
                <Badge variant="outline">
                  Page {currentPage} of {pages.length}
                </Badge>
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
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pages.length}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={addNewPage}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={deletePage} disabled={pages.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
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
              <p>Each page displays "Sara Abdelwahab" at the top and provides a clean white canvas for drawing.</p>
              <p>Click the Fullscreen button for a larger drawing area.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
