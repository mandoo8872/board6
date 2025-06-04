import { useState, useCallback } from 'react'
import { TextBox } from '../types'
import { createTextBox } from '../utils/objectFactory'

export const useTextBox = () => {
  const [selectedTextBox, setSelectedTextBox] = useState<TextBox | null>(null)

  const createNewTextBox = useCallback((x: number, y: number, content?: string) => {
    const newTextBox = createTextBox(x, y, content)
    setSelectedTextBox(newTextBox)
    return newTextBox
  }, [])

  const updateTextBox = useCallback((updates: Partial<TextBox>) => {
    if (selectedTextBox) {
      setSelectedTextBox((prev: TextBox | null) => prev ? { ...prev, ...updates } : null)
    }
  }, [selectedTextBox])

  const deselectTextBox = useCallback(() => {
    setSelectedTextBox(null)
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

  return {
    selectedTextBox,
    createNewTextBox,
    updateTextBox,
    deselectTextBox,
    handlePaste
  }
} 