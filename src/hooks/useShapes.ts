import { useCallback, useRef } from 'react'
import { Shape, Point, TextBox, DrawingTool } from '../types'
import { snapPointToGrid } from '../utils/canvasHelpers'
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_FILL_COLOR } from '../utils/constants'
import { updateBoardData, isFirebaseAvailable } from '../firebase'
import { createTextBox } from '../utils/objectFactory'

interface UseShapesProps {
  shapes: Shape[]
  setShapes: (fn: (prev: Shape[]) => Shape[]) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  gridSize: number
}

export const useShapes = ({ shapes, setShapes, selectedId, setSelectedId, gridSize }: UseShapesProps) => {
  // 새 사각형 생성
  const createRect = useCallback((point: Point) => {
    const snappedPoint = snapPointToGrid(point, gridSize)
    const userId = (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous')
    const now = Date.now()
    const currentZIndex = shapes.length

    const newRect: Shape = {
      id: now.toString(),
      type: 'rect',
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      fill: DEFAULT_FILL_COLOR,
      color: '#000000',
      selected: true,
      movable: true,
      deletable: true,
      resizable: true,
      userId,
      updatedAt: now,
      updatedBy: userId,
      zIndex: currentZIndex,
      meta: {
        isMovable: true,
        isDeletable: true,
        isResizable: true,
        isErasable: false
      }
    }

    // 로컬 상태 업데이트
    setShapes(prev => [...prev, newRect])

    // Firebase에 전체 객체 저장
    if (isFirebaseAvailable()) {
      updateBoardData({
        [`shapes/${newRect.id}`]: {
          ...newRect,
          zIndex: currentZIndex
        }
      })
    }

    return newRect.id
  }, [gridSize, setShapes, shapes.length])

  // 새 텍스트박스 생성
  const createText = useCallback((point: Point, content: string = '새 텍스트') => {
    const snappedPoint = snapPointToGrid(point, gridSize)
    const userId = (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous')
    const now = Date.now()
    const currentZIndex = shapes.length

    const newTextBox = createTextBox(snappedPoint.x, snappedPoint.y, content, currentZIndex)
    newTextBox.selected = true
    newTextBox.fill = '#888888'
    newTextBox.opacity = 0.5
    newTextBox.meta = {
      ...newTextBox.meta,
      fontSize: 40
    }
    newTextBox.updatedAt = now
    newTextBox.updatedBy = userId

    // 로컬 상태 업데이트
    setShapes(prev => [...prev, newTextBox])

    // Firebase에 전체 객체 저장
    if (isFirebaseAvailable()) {
      const updates = {
        [`shapes/${newTextBox.id}`]: {
          ...newTextBox,
          zIndex: currentZIndex
        }
      }
      console.log('[useShapes] 텍스트박스 생성:', updates)
      updateBoardData(updates)
    }

    return newTextBox.id
  }, [gridSize, shapes.length, setShapes])

  // 새 이미지 생성
  const createImage = useCallback((point: Point, imageUrl: string) => {
    const snappedPoint = snapPointToGrid(point, gridSize)
    const userId = (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous')
    const now = Date.now()
    const currentZIndex = shapes.length

    // 이미지 크기 계산을 위한 Promise 생성
    const getImageDimensions = () => {
      return new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const width = 400
          const height = Math.round(img.height * (width / img.width))
          resolve({ width, height })
        }
        img.onerror = () => {
          // 이미지 로드 실패 시 기본 크기 사용
          resolve({ width: 400, height: 300 })
        }
        img.src = imageUrl
      })
    }

    // 이미지 생성 및 저장
    getImageDimensions().then(({ width, height }) => {
      const newImage: Shape = {
        id: now.toString(),
        type: 'image',
        x: snappedPoint.x,
        y: snappedPoint.y,
        width,
        height,
        fill: '#ffffff',
        opacity: 1,
        selected: true,
        zIndex: currentZIndex,
        src: imageUrl,
        meta: {
          isMovable: true,
          isDeletable: true,
          isResizable: true,
          isErasable: false
        },
        updatedAt: now,
        updatedBy: userId
      }

      // 로컬 상태 업데이트
      setShapes(prev => [...prev, newImage])

      // Firebase에 전체 객체 저장
      if (isFirebaseAvailable()) {
        const updates = {
          [`shapes/${newImage.id}`]: {
            ...newImage,
            zIndex: currentZIndex
          }
        }
        console.log('[useShapes] 이미지 생성:', updates)
        updateBoardData(updates)
      }
    })

    return now.toString() // 임시 ID 반환
  }, [gridSize, shapes.length, setShapes])

  // 셰이프 선택 (선택만 로컬에서 관리)
  const selectShape = useCallback((shapeId: string | null) => {
    setSelectedId(shapeId)
  }, [setSelectedId])

  // 선택된 셰이프 삭제
  const deleteSelectedShape = useCallback(() => {
    if (!selectedId) return
    const shape = shapes.find(s => s.id === selectedId)
    if (!shape?.meta?.isDeletable) return
    const userId = (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous')
    const now = Date.now()
    setShapes(prev => prev.filter(s => s.id !== selectedId))
    updateBoardData({ [`shapes/${selectedId}`]: { id: selectedId, deleted: true, updatedAt: now, updatedBy: userId } })
    setSelectedId(null)
  }, [shapes, selectedId, setSelectedId, setShapes])

  // 셰이프 이동
  const moveShape = useCallback((shapeId: string, newPosition: Point) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, x: newPosition.x, y: newPosition.y } : s))
    const shape = shapes.find(s => s.id === shapeId)
    if (shape) {
      if (shape.type === 'text' || shape.type === 'textbox') {
        // 전체 객체 저장
        updateBoardData({ [`shapes/${shapeId}`]: { ...shape, x: newPosition.x, y: newPosition.y, updatedAt: Date.now() } })
      } else {
        // 기존 patch
        updateBoardData({ [`shapes/${shapeId}/x`]: newPosition.x, [`shapes/${shapeId}/y`]: newPosition.y, [`shapes/${shapeId}/updatedAt`]: Date.now() })
      }
    }
  }, [setShapes, shapes])

  // 셰이프 복제
  const duplicateShape = useCallback((shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId)
    if (!shape) return

    const now = Date.now()
    const userId = (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous')
    const duplicatedShape: Shape = {
      ...shape,
      id: now.toString(),
      x: shape.x + 20,
      y: shape.y + 20,
      selected: true,
      updatedAt: now,
      updatedBy: userId
    }
    setShapes(prev => [...prev.map(s => ({ ...s, selected: false })), duplicatedShape])
    setSelectedId(duplicatedShape.id)
    updateBoardData({ [`shapes/${duplicatedShape.id}`]: { ...duplicatedShape, selected: undefined } })
  }, [shapes, setShapes, setSelectedId])

  // 셰이프 속성 업데이트
  const updateShapeProperty = useCallback((shapeId: string, property: keyof Shape, value: any) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, [property]: value } : s))
    const shape = shapes.find(s => s.id === shapeId)
    if (shape) {
      if (shape.type === 'text' || shape.type === 'textbox') {
        // 전체 객체 저장
        updateBoardData({ [`shapes/${shapeId}`]: { ...shape, [property]: value, updatedAt: Date.now() } })
      } else {
        // 기존 patch
        updateBoardData({ [`shapes/${shapeId}/${property}`]: value })
      }
    }
  }, [setShapes, shapes])

  // 선택 해제
  const clearSelection = useCallback(() => {
    setShapes(prev => prev.map(shape => ({ ...shape, selected: false })))
    setSelectedId(null)
  }, [setShapes, setSelectedId])

  // 레이어 정렬 기능들
  const bringToFront = useCallback((shapeId: string) => {
    setShapes(prev => {
      const shapeIndex = prev.findIndex(s => s.id === shapeId)
      if (shapeIndex === -1 || shapeIndex === prev.length - 1) return prev
      const shape = prev[shapeIndex]
      const newShapes = [...prev]
      newShapes.splice(shapeIndex, 1)
      newShapes.push(shape)
      
      // z-index 업데이트
      const updatedShape = {
        ...shape,
        zIndex: newShapes.length - 1,
        updatedAt: Date.now(),
        updatedBy: 'admin'
      }
      
      // Firebase 업데이트
      if (isFirebaseAvailable()) {
        updateBoardData({
          [`shapes/${shapeId}`]: updatedShape
        })
      }
      
      return newShapes.map((s, index) => ({
        ...s,
        zIndex: index
      }))
    })
  }, [setShapes])

  const sendToBack = useCallback((shapeId: string) => {
    setShapes(prev => {
      const shapeIndex = prev.findIndex(s => s.id === shapeId)
      if (shapeIndex === -1 || shapeIndex === 0) return prev
      const shape = prev[shapeIndex]
      const newShapes = [...prev]
      newShapes.splice(shapeIndex, 1)
      newShapes.unshift(shape)
      
      // z-index 업데이트
      const updatedShape = {
        ...shape,
        zIndex: 0,
        updatedAt: Date.now(),
        updatedBy: 'admin'
      }
      
      // Firebase 업데이트
      if (isFirebaseAvailable()) {
        updateBoardData({
          [`shapes/${shapeId}`]: updatedShape
        })
      }
      
      return newShapes.map((s, index) => ({
        ...s,
        zIndex: index
      }))
    })
  }, [setShapes])

  const moveForward = useCallback((shapeId: string) => {
    setShapes(prev => {
      const shapeIndex = prev.findIndex(s => s.id === shapeId)
      if (shapeIndex === -1 || shapeIndex === prev.length - 1) return prev
      const newShapes = [...prev]
      const temp = newShapes[shapeIndex]
      newShapes[shapeIndex] = newShapes[shapeIndex + 1]
      newShapes[shapeIndex + 1] = temp
      
      // z-index 업데이트
      const updatedShape = {
        ...temp,
        zIndex: shapeIndex + 1,
        updatedAt: Date.now(),
        updatedBy: 'admin'
      }
      
      // Firebase 업데이트
      if (isFirebaseAvailable()) {
        updateBoardData({
          [`shapes/${shapeId}`]: updatedShape
        })
      }
      
      return newShapes.map((s, index) => ({
        ...s,
        zIndex: index
      }))
    })
  }, [setShapes])

  const moveBackward = useCallback((shapeId: string) => {
    setShapes(prev => {
      const shapeIndex = prev.findIndex(s => s.id === shapeId)
      if (shapeIndex === -1 || shapeIndex === 0) return prev
      const newShapes = [...prev]
      const temp = newShapes[shapeIndex]
      newShapes[shapeIndex] = newShapes[shapeIndex - 1]
      newShapes[shapeIndex - 1] = temp
      
      // z-index 업데이트
      const updatedShape = {
        ...temp,
        zIndex: shapeIndex - 1,
        updatedAt: Date.now(),
        updatedBy: 'admin'
      }
      
      // Firebase 업데이트
      if (isFirebaseAvailable()) {
        updateBoardData({
          [`shapes/${shapeId}`]: updatedShape
        })
      }
      
      return newShapes.map((s, index) => ({
        ...s,
        zIndex: index
      }))
    })
  }, [setShapes])

  return {
    createRect,
    createText,
    createImage,
    selectShape,
    deleteSelectedShape,
    moveShape,
    duplicateShape,
    updateShapeProperty,
    clearSelection,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward
  }
} 