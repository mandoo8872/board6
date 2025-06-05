import { useState, useCallback } from 'react'
import { TextBox } from '../types'
import { createTextBox } from '../utils/objectFactory'

export const useTextBox = () => {
  const [selectedTextBox, setSelectedTextBox] = useState<TextBox | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const createNewTextBox = useCallback((x: number, y: number, content?: string) => {
    const newTextBox = createTextBox(x, y, content)
    setSelectedTextBox(newTextBox)
    setIsEditing(true)
    return newTextBox
  }, [])

  const updateTextBox = useCallback((updates: Partial<TextBox>) => {
    if (selectedTextBox) {
      setSelectedTextBox((prev: TextBox | null) => prev ? { ...prev, ...updates } : null)
    }
  }, [selectedTextBox])

  const deselectTextBox = useCallback(() => {
    setSelectedTextBox(null)
    setIsEditing(false)
  }, [])

  const handlePaste = useCallback((e: ClipboardEvent & { clientX: number; clientY: number }) => {
    const text = e.clipboardData?.getData('text')
    if (text) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const newTextBox = createTextBox(x, y, text)
      newTextBox.textAlign = 'left'
      newTextBox.verticalAlign = 'top'
      newTextBox.opacity = 0.5
      newTextBox.backgroundColor = '#888888'
      return createNewTextBox(x, y, text)
    }
    return null
  }, [createNewTextBox])

  const handleTextBoxClick = useCallback((textBox: TextBox) => {
    setSelectedTextBox(textBox)
    setIsEditing(true)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 캔버스 클릭 시 텍스트 박스 해제
    if (!(e.target as HTMLElement).closest('.text-box-panel')) {
      deselectTextBox()
    }
  }, [deselectTextBox])

  const handleTextBoxResize = useCallback((width: number, height: number) => {
    if (selectedTextBox) {
      updateTextBox({ width, height })
    }
  }, [selectedTextBox, updateTextBox])

  return {
    selectedTextBox,
    isEditing,
    createNewTextBox,
    updateTextBox,
    deselectTextBox,
    handlePaste,
    handleTextBoxClick,
    handleCanvasClick,
    handleTextBoxResize
  }
} 