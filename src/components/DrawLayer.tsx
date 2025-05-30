import React, { useRef, useEffect } from 'react'
import { Stroke } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'
import { clearCanvas, drawAllStrokes } from '../utils/canvasHelpers'

interface DrawLayerProps {
  strokes: Stroke[]
  currentStroke: Stroke | null
}

const DrawLayer: React.FC<DrawLayerProps> = ({ strokes, currentStroke }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 스트로크 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 초기화
    clearCanvas(ctx)

    // 완성된 스트로크들 그리기
    drawAllStrokes(ctx, strokes)

    // 현재 그리고 있는 스트로크 그리기
    if (currentStroke) {
      drawAllStrokes(ctx, [currentStroke])
    }
  }, [strokes, currentStroke])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'auto'
      }}
    />
  )
}

export default DrawLayer 