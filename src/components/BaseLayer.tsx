import React, { useRef, useEffect, useCallback } from 'react'
import { Shape } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_COLOR } from '../utils/constants'
import { clearCanvas, drawGrid, drawAllShapes } from '../utils/canvasHelpers'

interface BaseLayerProps {
  shapes: Shape[]
  selectedId: string | null
  gridSize: number
  showGrid: boolean
}

const BaseLayer: React.FC<BaseLayerProps> = ({ 
  shapes, 
  selectedId, 
  gridSize, 
  showGrid 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // resize handle 그리기
  const drawResizeHandle = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = RESIZE_HANDLE_COLOR
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // handle 배경
    ctx.fillRect(
      x - RESIZE_HANDLE_SIZE / 2,
      y - RESIZE_HANDLE_SIZE / 2,
      RESIZE_HANDLE_SIZE,
      RESIZE_HANDLE_SIZE
    )

    // handle 테두리
    ctx.strokeRect(
      x - RESIZE_HANDLE_SIZE / 2,
      y - RESIZE_HANDLE_SIZE / 2,
      RESIZE_HANDLE_SIZE,
      RESIZE_HANDLE_SIZE
    )
  }, [])

  // 그리드와 셰이프 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 초기화
    clearCanvas(ctx)

    // 그리드 그리기
    if (showGrid) {
      drawGrid(ctx, gridSize)
    }

    // 선택 상태 업데이트된 셰이프들 그리기
    const shapesWithSelection = shapes.map(shape => ({
      ...shape,
      selected: shape.id === selectedId
    }))

    drawAllShapes(ctx, shapesWithSelection)

    // 선택된 셰이프의 resize handle 그리기
    if (selectedId) {
      const selectedShape = shapes.find(s => s.id === selectedId)
      if (selectedShape?.meta?.isResizable) {
        const { x, y, width = 100, height = 60 } = selectedShape
        
        // 8방향 handle 그리기
        // 상단
        drawResizeHandle(ctx, x + width / 2, y) // top
        drawResizeHandle(ctx, x, y) // top-left
        drawResizeHandle(ctx, x + width, y) // top-right
        
        // 중앙
        drawResizeHandle(ctx, x, y + height / 2) // left
        drawResizeHandle(ctx, x + width, y + height / 2) // right
        
        // 하단
        drawResizeHandle(ctx, x + width / 2, y + height) // bottom
        drawResizeHandle(ctx, x, y + height) // bottom-left
        drawResizeHandle(ctx, x + width, y + height) // bottom-right
      }
    }
  }, [shapes, selectedId, gridSize, showGrid, drawResizeHandle])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none' // 포인터 이벤트는 InteractionLayer에서 처리
      }}
    />
  )
}

export default BaseLayer 