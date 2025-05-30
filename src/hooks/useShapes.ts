import { useCallback } from 'react'
import { Shape, Point } from '../types'
import { snapPointToGrid } from '../utils/canvasHelpers'
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_FILL_COLOR } from '../utils/constants'

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
    const newRect: Shape = {
      id: Date.now().toString(),
      type: 'rect',
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      fill: DEFAULT_FILL_COLOR,
      selected: true,
      meta: {
        isMovable: true,
        isDeletable: true,
        isResizable: true,
        isErasable: false
      }
    }

    setShapes(prev => [...prev.map(shape => ({ ...shape, selected: false })), newRect])
    setSelectedId(newRect.id)
    return newRect.id
  }, [setShapes, setSelectedId, gridSize])

  // 새 텍스트 생성
  const createText = useCallback((point: Point, text: string = 'Text') => {
    const snappedPoint = snapPointToGrid(point, gridSize)
    const newText: Shape = {
      id: Date.now().toString(),
      type: 'text',
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      text,
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      selected: true,
      meta: {
        isMovable: true,
        isDeletable: true,
        isResizable: true,
        isErasable: false
      }
    }

    setShapes(prev => [...prev.map(shape => ({ ...shape, selected: false })), newText])
    setSelectedId(newText.id)
    return newText.id
  }, [setShapes, setSelectedId, gridSize])

  // 새 이미지 생성
  const createImage = useCallback((point: Point, imageSrc?: string) => {
    const snappedPoint = snapPointToGrid(point, gridSize)
    const newImage: Shape = {
      id: Date.now().toString(),
      type: 'image',
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_WIDTH, // 이미지는 정사각형으로
      imageSrc,
      selected: true,
      meta: {
        isMovable: true,
        isDeletable: true,
        isResizable: true,
        isErasable: false
      }
    }

    setShapes(prev => [...prev.map(shape => ({ ...shape, selected: false })), newImage])
    setSelectedId(newImage.id)
    return newImage.id
  }, [setShapes, setSelectedId, gridSize])

  // 셰이프 선택
  const selectShape = useCallback((shapeId: string | null) => {
    setShapes(prev => prev.map(shape => ({
      ...shape,
      selected: shape.id === shapeId
    })))
    setSelectedId(shapeId)
  }, [setShapes, setSelectedId])

  // 선택된 셰이프 삭제
  const deleteSelectedShape = useCallback(() => {
    if (!selectedId) return

    const shape = shapes.find(s => s.id === selectedId)
    if (!shape?.meta?.isDeletable) return

    setShapes(prev => prev.filter(shape => shape.id !== selectedId))
    setSelectedId(null)
  }, [shapes, selectedId, setShapes, setSelectedId])

  // 셰이프 이동
  const moveShape = useCallback((shapeId: string, newPosition: Point) => {
    setShapes(prev => prev.map(shape => {
      if (shape.id !== shapeId || !shape.meta?.isMovable) return shape

      return {
        ...shape,
        x: Math.max(0, Math.min(newPosition.x, 2160 - (shape.width || DEFAULT_SHAPE_WIDTH))),
        y: Math.max(0, Math.min(newPosition.y, 3840 - (shape.height || DEFAULT_SHAPE_HEIGHT)))
      }
    }))
  }, [setShapes])

  // 셰이프 복제
  const duplicateShape = useCallback((shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId)
    if (!shape) return

    const duplicatedShape: Shape = {
      ...shape,
      id: Date.now().toString(),
      x: shape.x + 20,
      y: shape.y + 20,
      selected: true
    }

    setShapes(prev => [...prev.map(s => ({ ...s, selected: false })), duplicatedShape])
    setSelectedId(duplicatedShape.id)
  }, [shapes, setShapes, setSelectedId])

  // 셰이프 속성 업데이트
  const updateShapeProperty = useCallback((shapeId: string, property: keyof Shape, value: any) => {
    setShapes(prev => prev.map(shape => 
      shape.id === shapeId 
        ? { ...shape, [property]: value }
        : shape
    ))
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
      newShapes.splice(shapeIndex, 1) // 기존 위치에서 제거
      newShapes.push(shape) // 맨 뒤에 추가 (최상단)
      return newShapes
    })
  }, [setShapes])

  const sendToBack = useCallback((shapeId: string) => {
    setShapes(prev => {
      const shapeIndex = prev.findIndex(s => s.id === shapeId)
      if (shapeIndex === -1 || shapeIndex === 0) return prev
      
      const shape = prev[shapeIndex]
      const newShapes = [...prev]
      newShapes.splice(shapeIndex, 1) // 기존 위치에서 제거
      newShapes.unshift(shape) // 맨 앞에 추가 (최하단)
      return newShapes
    })
  }, [setShapes])

  const moveForward = useCallback((shapeId: string) => {
    setShapes(prev => {
      const shapeIndex = prev.findIndex(s => s.id === shapeId)
      if (shapeIndex === -1 || shapeIndex === prev.length - 1) return prev
      
      const newShapes = [...prev]
      // 현재와 다음 요소 위치 교환
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
      // 현재와 이전 요소 위치 교환
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