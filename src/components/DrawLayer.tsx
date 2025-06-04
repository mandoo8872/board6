import React, { useRef, useEffect } from 'react'
import { Stroke } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'
import { clearCanvas, drawAllStrokes } from '../utils/canvasHelpers'

interface DrawLayerProps {
  strokes: Stroke[]
}

const DrawLayer: React.FC<DrawLayerProps> = ({
  strokes
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 캔버스 초기화 및 스트로크 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    clearCanvas(ctx)
    drawAllStrokes(ctx, strokes)
  }, [strokes])

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
        pointerEvents: 'auto',
        touchAction: 'none'
      }}
    />
  )
}

export default DrawLayer 