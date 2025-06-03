import { useCallback } from 'react'
import { Stroke, Point, DrawingTool } from '../types'

interface UseStrokeProps {
  setStrokes: (fn: (prev: Stroke[]) => Stroke[]) => void
  penColor: string
  penSize: number
}

export const useStroke = ({ setStrokes, penColor, penSize }: UseStrokeProps) => {
  // 새 스트로크 시작
  const startStroke = useCallback((point: Point, tool: DrawingTool) => {
    const newStroke: Stroke = {
      id: Date.now().toString(),
      tool,
      points: [point],
      color: penColor,
      size: penSize,
      isErasable: true
    }

    setStrokes(prev => [...prev, newStroke])
    return newStroke.id
  }, [penColor, penSize, setStrokes])

  // 현재 스트로크에 포인트 추가
  const addPointToStroke = useCallback((strokeId: string, point: Point) => {
    setStrokes(prev => prev.map(stroke => 
      stroke.id === strokeId 
        ? { ...stroke, points: [...stroke.points, point] }
        : stroke
    ))
  }, [setStrokes])

  // 지우개로 스트로크 삭제 (포인트 기반)
  const eraseAtPoint = useCallback((point: Point, eraseRadius: number = 10) => {
    setStrokes(prev => prev.filter(stroke => {
      if (!stroke.isErasable) return true

      // 스트로크의 어떤 포인트라도 지우개 범위 내에 있으면 삭제
      return !stroke.points.some(strokePoint => {
        const distance = Math.sqrt(
          Math.pow(strokePoint.x - point.x, 2) + 
          Math.pow(strokePoint.y - point.y, 2)
        )
        return distance <= eraseRadius
      })
    }))
  }, [setStrokes])

  // 모든 스트로크 삭제
  const clearAllStrokes = useCallback(() => {
    setStrokes(() => [])
  }, [setStrokes])

  // Undo 기능을 위한 마지막 스트로크 삭제
  const removeLastStroke = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1))
  }, [setStrokes])

  return {
    startStroke,
    addPointToStroke,
    eraseAtPoint,
    clearAllStrokes,
    removeLastStroke
  }
} 