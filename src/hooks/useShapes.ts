import { useCallback } from 'react'
import { Shape, Point } from '../types'
import { snapPointToGrid } from '../utils/canvasHelpers'
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_FILL_COLOR } from '../utils/constants'
import { updateBoardData } from '../firebase'

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
      meta: {
        isMovable: true,
        isDeletable: true,
        isResizable: true,
        isErasable: false
      }
    }
    setShapes(prev => [...prev, newRect])
    updateBoardData({ [`shapes/${newRect.id}`]: newRect })
    return newRect.id
  }, [gridSize, setShapes])

  // 새 텍스트 생성
  const createText = useCallback((point: Point, text: string = 'Text') => {
    const snappedPoint = snapPointToGrid(point, gridSize)
    const userId = (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous')
    const now = Date.now()
    const newText: Shape = {
      id: now.toString(),
      type: 'text',
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      text,
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      selected: true,
      movable: true,
      deletable: true,
      resizable: true,
      userId,
      updatedAt: now,
      updatedBy: userId,
      meta: {
        isMovable: true,
        isDeletable: true,
        isResizable: true,
        isErasable: false
      }
    }
    setShapes(prev => [...prev, newText])
    updateBoardData({ [`shapes/${newText.id}`]: newText })
    return newText.id
  }, [gridSize, setShapes])

  // 새 이미지 생성
  const createImage = useCallback((point: Point, imageSrc?: string) => {
    const snappedPoint = snapPointToGrid(point, gridSize)
    const userId = (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous')
    const now = Date.now()
    const newImage: Shape = {
      id: now.toString(),
      type: 'image',
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_WIDTH, // 이미지는 정사각형으로
      imageSrc,
      color: '#000000',
      selected: true,
      movable: true,
      deletable: true,
      resizable: true,
      userId,
      updatedAt: now,
      updatedBy: userId,
      meta: {
        isMovable: true,
        isDeletable: true,
        isResizable: true,
        isErasable: false
      }
    }
    setShapes(prev => [...prev, newImage])
    updateBoardData({ [`shapes/${newImage.id}`]: newImage })
    return newImage.id
  }, [gridSize, setShapes])

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
    updateBoardData({ [`shapes/${shapeId}/x`]: newPosition.x, [`shapes/${shapeId}/y`]: newPosition.y })
  }, [setShapes])

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
    updateBoardData({ [`shapes/${shapeId}/${property}`]: value })
  }, [setShapes])

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
      return newShapes
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
      return newShapes
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
      return newShapes
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
      return newShapes
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