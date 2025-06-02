import React, { useRef, useEffect, useCallback } from 'react'
import { DrawingTool, Point, Shape } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, AUTO_TOOL_RETURN_DELAY, RESIZE_HANDLE_SIZE } from '../utils/constants'
import { hitTest, snapPointToGrid } from '../utils/canvasHelpers'
import { throttle } from '../utils/debounceThrottle'

interface InteractionLayerProps {
  tool: DrawingTool
  shapes: Shape[]
  penColor: string
  penSize: number
  gridSize: number
  selectedId: string | null
  onToolChange: (tool: DrawingTool) => void
  onStartStroke: (point: Point) => string
  onAddPointToStroke: (strokeId: string, point: Point) => void
  onFinishStroke: () => void
  onEraseAtPoint: (point: Point) => void
  onSelectShape: (shapeId: string | null) => void
  onCreateRect: (point: Point) => string
  currentStrokeId: string | null
  onDeleteSelectedShape?: () => void
  onDuplicateSelectedShape?: () => void
  onMoveShape?: (shapeId: string, newPosition: Point) => void
  onResizeShape?: (shapeId: string, newSize: { width: number; height: number; x?: number; y?: number }) => void
  onSyncShapes?: (shapes: Shape[]) => void
  onEditEnd?: (shapes: Shape[]) => void
}

// resize handle 위치 타입
type ResizeHandlePosition = 
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

const InteractionLayer: React.FC<InteractionLayerProps> = ({
  tool,
  shapes,
  gridSize,
  selectedId,
  onToolChange,
  onStartStroke,
  onAddPointToStroke,
  onFinishStroke,
  onEraseAtPoint,
  onSelectShape,
  onCreateRect,
  currentStrokeId,
  onDeleteSelectedShape,
  onDuplicateSelectedShape,
  onMoveShape,
  onResizeShape,
  onSyncShapes,
  onEditEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const autoReturnTimerRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartPointRef = useRef<Point | null>(null)
  const selectedShapeRef = useRef<Shape | null>(null)
  const isResizingRef = useRef(false)
  const resizeStartPointRef = useRef<Point | null>(null)
  const originalSizeRef = useRef<{ width: number; height: number } | null>(null)
  const resizeHandlePositionRef = useRef<ResizeHandlePosition | null>(null)
  const throttledSync = useRef(onSyncShapes ? throttle(onSyncShapes, 300) : undefined).current

  // 자동 도구 복귀 타이머 설정
  const resetAutoReturnTimer = useCallback(() => {
    if (autoReturnTimerRef.current) {
      clearTimeout(autoReturnTimerRef.current)
    }

    if (tool === 'pen' || tool === 'eraser') {
      autoReturnTimerRef.current = window.setTimeout(() => {
        // AdminPage와 ViewPage 모두 select로 복귀
        if (onToolChange) {
          onToolChange('select')
        }
      }, AUTO_TOOL_RETURN_DELAY)
    }
  }, [tool, onToolChange])

  // 타이머 정리
  const clearAutoReturnTimer = useCallback(() => {
    if (autoReturnTimerRef.current) {
      clearTimeout(autoReturnTimerRef.current)
      autoReturnTimerRef.current = null
    }
  }, [])

  // 캔버스 좌표 변환
  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }, [])

  // resize handle 히트 테스트
  const hitTestResizeHandle = useCallback((point: Point, shape: Shape): ResizeHandlePosition | null => {
    const { x, y, width = 100, height = 60 } = shape
    const handleSize = RESIZE_HANDLE_SIZE

    // 각 handle의 위치와 크기
    const handles = {
      'top-left': { x, y },
      'top': { x: x + width / 2, y },
      'top-right': { x: x + width, y },
      'left': { x, y: y + height / 2 },
      'right': { x: x + width, y: y + height / 2 },
      'bottom-left': { x, y: y + height },
      'bottom': { x: x + width / 2, y: y + height },
      'bottom-right': { x: x + width, y: y + height }
    }

    // 각 handle에 대한 히트 테스트
    for (const [position, handle] of Object.entries(handles)) {
      if (
        point.x >= handle.x - handleSize / 2 &&
        point.x <= handle.x + handleSize / 2 &&
        point.y >= handle.y - handleSize / 2 &&
        point.y <= handle.y + handleSize / 2
      ) {
        return position as ResizeHandlePosition
      }
    }

    return null
  }, [])

  // 생성형 도구 자동 복귀 처리
  const handleCreationToolAutoRevert = useCallback((newShapeId: string) => {
    onSelectShape(newShapeId)
    onToolChange('select')
  }, [onSelectShape, onToolChange])

  // 포인터 다운 이벤트
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY)

    switch (tool) {
      case 'pen':
        isDrawingRef.current = true
        lastPointRef.current = point
        onStartStroke(point)
        resetAutoReturnTimer()
        break

      case 'eraser':
        isDrawingRef.current = true
        onEraseAtPoint(point)
        resetAutoReturnTimer()
        break

      case 'select':
        const hitShape = hitTest(shapes, point)
        if (hitShape) {
          onSelectShape(hitShape.id)
          
          // resize handle 체크 (크기조절 가능한 경우에만)
          if (hitShape.meta?.isResizable) {
            const handlePosition = hitTestResizeHandle(point, hitShape)
            if (handlePosition) {
              isResizingRef.current = true
              resizeStartPointRef.current = point
              selectedShapeRef.current = hitShape
              resizeHandlePositionRef.current = handlePosition
              originalSizeRef.current = {
                width: hitShape.width || 100,
                height: hitShape.height || 60
              }
            }
          }
          
          // 리사이즈 핸들을 클릭하지 않았고, 이동 가능한 객체인 경우 드래그 시작
          if (!isResizingRef.current && hitShape.meta?.isMovable !== false && onMoveShape) {
            isDraggingRef.current = true
            dragStartPointRef.current = point
            selectedShapeRef.current = hitShape
          }
        } else {
          onSelectShape(null)
        }
        break

      case 'rect':
        const snappedPoint = snapPointToGrid(point, gridSize)
        const rectId = onCreateRect(snappedPoint)
        handleCreationToolAutoRevert(rectId)
        break
    }

    e.preventDefault()
  }, [tool, shapes, gridSize, onStartStroke, onEraseAtPoint, onSelectShape, onCreateRect, onToolChange, getCanvasPoint, resetAutoReturnTimer, onMoveShape, hitTestResizeHandle, handleCreationToolAutoRevert])

  // 포인터 이동 이벤트
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY)

    switch (tool) {
      case 'pen':
        if (isDrawingRef.current && currentStrokeId && lastPointRef.current) {
          const distance = Math.sqrt(
            Math.pow(point.x - lastPointRef.current.x, 2) + 
            Math.pow(point.y - lastPointRef.current.y, 2)
          )
          
          if (distance > 2) {
            onAddPointToStroke(currentStrokeId, point)
            lastPointRef.current = point
            resetAutoReturnTimer()
          }
        }
        break

      case 'eraser':
        if (isDrawingRef.current) {
          onEraseAtPoint(point)
          resetAutoReturnTimer()
        }
        break

      case 'select':
        if (isResizingRef.current && selectedShapeRef.current && resizeStartPointRef.current && originalSizeRef.current && onResizeShape) {
          const dx = point.x - resizeStartPointRef.current.x
          const dy = point.y - resizeStartPointRef.current.y
          const position = resizeHandlePositionRef.current
          
          let newWidth = originalSizeRef.current.width
          let newHeight = originalSizeRef.current.height
          let newX = selectedShapeRef.current.x
          let newY = selectedShapeRef.current.y

          // handle 위치에 따른 크기 조정
          switch (position) {
            case 'top-left':
              newWidth = Math.max(50, originalSizeRef.current.width - dx)
              newHeight = Math.max(50, originalSizeRef.current.height - dy)
              newX = selectedShapeRef.current.x + (originalSizeRef.current.width - newWidth)
              newY = selectedShapeRef.current.y + (originalSizeRef.current.height - newHeight)
              break
            case 'top':
              newHeight = Math.max(50, originalSizeRef.current.height - dy)
              newY = selectedShapeRef.current.y + (originalSizeRef.current.height - newHeight)
              break
            case 'top-right':
              newWidth = Math.max(50, originalSizeRef.current.width + dx)
              newHeight = Math.max(50, originalSizeRef.current.height - dy)
              newY = selectedShapeRef.current.y + (originalSizeRef.current.height - newHeight)
              break
            case 'left':
              newWidth = Math.max(50, originalSizeRef.current.width - dx)
              newX = selectedShapeRef.current.x + (originalSizeRef.current.width - newWidth)
              break
            case 'right':
              newWidth = Math.max(50, originalSizeRef.current.width + dx)
              break
            case 'bottom-left':
              newWidth = Math.max(50, originalSizeRef.current.width - dx)
              newHeight = Math.max(50, originalSizeRef.current.height + dy)
              newX = selectedShapeRef.current.x + (originalSizeRef.current.width - newWidth)
              break
            case 'bottom':
              newHeight = Math.max(50, originalSizeRef.current.height + dy)
              break
            case 'bottom-right':
              newWidth = Math.max(50, originalSizeRef.current.width + dx)
              newHeight = Math.max(50, originalSizeRef.current.height + dy)
              break
          }
          
          // 그리드에 스냅
          const snappedWidth = Math.round(newWidth / gridSize) * gridSize
          const snappedHeight = Math.round(newHeight / gridSize) * gridSize
          const snappedX = Math.round(newX / gridSize) * gridSize
          const snappedY = Math.round(newY / gridSize) * gridSize
          
          onResizeShape(selectedShapeRef.current.id, {
            width: snappedWidth,
            height: snappedHeight,
            x: snappedX,
            y: snappedY
          })
          if (throttledSync) throttledSync(shapes)
        }
        else if (isDraggingRef.current && selectedShapeRef.current && dragStartPointRef.current && onMoveShape) {
          const dx = point.x - dragStartPointRef.current.x
          const dy = point.y - dragStartPointRef.current.y
          
          const newPosition = {
            x: selectedShapeRef.current.x + dx,
            y: selectedShapeRef.current.y + dy
          }
          
          onMoveShape(selectedShapeRef.current.id, newPosition)
          dragStartPointRef.current = point
          
          selectedShapeRef.current = {
            ...selectedShapeRef.current,
            x: newPosition.x,
            y: newPosition.y
          }
          if (throttledSync) throttledSync(shapes)
        }
        break
    }

    e.preventDefault()
  }, [tool, currentStrokeId, onAddPointToStroke, onEraseAtPoint, getCanvasPoint, resetAutoReturnTimer, onMoveShape, onResizeShape, gridSize, shapes, throttledSync])

  // 포인터 업 이벤트
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    switch (tool) {
      case 'pen':
        if (isDrawingRef.current) {
          isDrawingRef.current = false
          lastPointRef.current = null
          onFinishStroke()
          resetAutoReturnTimer()
        }
        break

      case 'eraser':
        if (isDrawingRef.current) {
          isDrawingRef.current = false
          resetAutoReturnTimer()
        }
        break

      case 'select':
        if (isResizingRef.current) {
          isResizingRef.current = false
          resizeStartPointRef.current = null
          originalSizeRef.current = null
          resizeHandlePositionRef.current = null
          if (onEditEnd) onEditEnd(shapes)
        }
        else if (isDraggingRef.current && selectedShapeRef.current && onMoveShape) {
          const finalPosition = snapPointToGrid({
            x: selectedShapeRef.current.x,
            y: selectedShapeRef.current.y
          }, gridSize)
          
          onMoveShape(selectedShapeRef.current.id, finalPosition)
          isDraggingRef.current = false
          dragStartPointRef.current = null
          selectedShapeRef.current = null
          if (onEditEnd) onEditEnd(shapes)
        }
        break
    }

    e.preventDefault()
  }, [tool, onFinishStroke, resetAutoReturnTimer, onMoveShape, gridSize, shapes, onEditEnd])

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 텍스트 편집 중인지 확인 (input, textarea, contenteditable 요소가 포커스된 경우)
      const activeElement = document.activeElement
      const isTextEditing = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true' ||
        activeElement.getAttribute('contenteditable') === ''
      )

      // 텍스트 편집 중이면 Delete/Backspace 키 무시
      if (isTextEditing && (e.key === 'Delete' || e.key === 'Backspace')) {
        return
      }

      // Ctrl 키 조합 처리
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault()
            if (selectedId && onDuplicateSelectedShape) {
              onDuplicateSelectedShape()
            }
            break
        }
        return
      }

      // 단일 키 처리
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onSelectShape(null)
          onToolChange('select')
          break

        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          if (selectedId && onDeleteSelectedShape) {
            // 선택된 객체의 삭제 가능 여부 확인
            const selectedShape = shapes.find(s => s.id === selectedId)
            if (selectedShape?.meta?.isDeletable !== false) {
              onDeleteSelectedShape()
            }
          }
          break

        // 도구 단축키
        case '1':
          e.preventDefault()
          onToolChange('select')
          break
        case '2':
          e.preventDefault()
          onToolChange('pen')
          break
        case '3':
          e.preventDefault()
          onToolChange('eraser')
          break
        case '4':
          e.preventDefault()
          onToolChange('rect')
          break
      }
    }

    // 캔버스가 포커스를 가질 수 있도록 설정
    const canvas = canvasRef.current
    if (canvas) {
      canvas.tabIndex = 0 // 포커스 가능하게 설정
    }

    // 전역 키보드 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedId, shapes, onSelectShape, onToolChange, onDeleteSelectedShape, onDuplicateSelectedShape])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearAutoReturnTimer()
    }
  }, [clearAutoReturnTimer])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 3,
        pointerEvents: 'auto',
        cursor: tool === 'pen' ? 'crosshair' : 
               tool === 'eraser' ? 'pointer' :
               tool === 'select' ? 'default' :
               tool === 'rect' ? 'crosshair' : 'default',
        outline: 'none' // 포커스 시 외곽선 제거
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  )
}

export default InteractionLayer 