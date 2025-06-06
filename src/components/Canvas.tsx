import React, { useRef, useEffect, useState } from 'react'
import { useTextBox } from '../hooks/useTextBox'
import { TextBoxPanel } from './TextBoxPanel'
import { Shape, DrawingTool, TextBox } from '../types'
import '../styles/TextBoxPanel.css'

interface CanvasProps {
  tool: DrawingTool
  shapes: Shape[]
  strokes: Shape[]
  penColor: string
  penSize: number
  gridSize: number
  selectedId: string | null
  setShapes: (fn: (prev: Shape[]) => Shape[]) => void
  setStrokes: (fn: (prev: Shape[]) => Shape[]) => void
  setSelectedId: (id: string | null) => void
  onPush?: () => void
  onPull?: () => void
}

export const Canvas: React.FC<CanvasProps> = ({
  tool,
  shapes,
  strokes,
  penColor,
  penSize,
  gridSize,
  selectedId,
  setShapes,
  setStrokes,
  setSelectedId,
  onPush,
  onPull
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { 
    selectedTextBox, 
    isEditing,
    createNewTextBox, 
    updateTextBox, 
    deselectTextBox, 
    handlePaste,
    handleTextBoxClick,
    handleCanvasClick,
    handleTextBoxResize
  } = useTextBox()

  const handleCanvasClickEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newTextBox = createNewTextBox(x, y)
        setShapes((prev: Shape[]) => [...prev, newTextBox])
      }
    }
    handleCanvasClick(e)
  }

  const handlePasteEvent = (e: ClipboardEvent) => {
    if (tool === 'text') {
      const newTextBox = handlePaste(e as any)
      if (newTextBox) {
        setShapes((prev: Shape[]) => [...prev, newTextBox])
      }
    }
  }

  const handleTextBoxSelect = (textBox: TextBox) => {
    handleTextBoxClick(textBox)
    setSelectedId(textBox.id)
  }

  const handleTextBoxUpdate = (updates: Partial<TextBox>) => {
    updateTextBox(updates)
    setShapes((prev: Shape[]) =>
      prev.map((shape: Shape) =>
        shape.id === selectedTextBox?.id
          ? { ...shape, ...updates }
          : shape
      )
    )
  }

  useEffect(() => {
    document.addEventListener('paste', handlePasteEvent)
    return () => {
      document.removeEventListener('paste', handlePasteEvent)
    }
  }, [tool])

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClickEvent}
        // ... existing canvas props ...
      />
      {selectedTextBox && isEditing && (
        <div className="side-panel">
          <TextBoxPanel
            textBox={selectedTextBox}
            onUpdate={handleTextBoxUpdate}
            onResize={handleTextBoxResize}
          />
        </div>
      )}
    </div>
  )
} 