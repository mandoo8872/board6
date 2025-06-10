import { Point, Stroke, Shape } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_COLOR, GRID_LINE_WIDTH, SELECTED_COLOR } from './constants'

// 캔버스 초기화
export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

// 그리드 그리기
export const drawGrid = (ctx: CanvasRenderingContext2D, gridSize: number) => {
  ctx.strokeStyle = GRID_COLOR
  ctx.lineWidth = GRID_LINE_WIDTH
  ctx.setLineDash([])

  // 세로선
  for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_HEIGHT)
    ctx.stroke()
  }

  // 가로선
  for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_WIDTH, y)
    ctx.stroke()
  }
}

// 스트로크 그리기
export const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  if (stroke.points.length < 2) return

  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([])

  ctx.beginPath()
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
  }

  ctx.stroke()
}

// 모든 스트로크 그리기
export const drawAllStrokes = (ctx: CanvasRenderingContext2D, strokes: Stroke[]) => {
  strokes.forEach(stroke => drawStroke(ctx, stroke))
}

// 사각형 그리기
export const drawRect = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  if (shape.type !== 'rect') return

  const { x, y, width = 100, height = 60, fill = '#ffffff' } = shape

  // 배경 채우기
  ctx.fillStyle = fill
  ctx.fillRect(x, y, width, height)

  // 테두리 그리기
  ctx.strokeStyle = shape.selected ? SELECTED_COLOR : '#000000'
  ctx.lineWidth = shape.selected ? 3 : 1
  ctx.setLineDash([])
  ctx.strokeRect(x, y, width, height)
}

// 텍스트 그리기
export const drawText = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  if (shape.type !== 'text') return

  const { 
    x, 
    y, 
    text = 'Text', 
    width = 100, 
    height = 60,
    fontSize = 16,
    fontWeight = 'normal',
    fontStyle = 'normal'
  } = shape

  // 배경 그리기 (선택적)
  if (shape.fill) {
    ctx.fillStyle = shape.fill
    ctx.fillRect(x, y, width, height)
  }

  // 폰트 설정
  const fontStyleStr = fontStyle === 'italic' ? 'italic ' : ''
  const fontWeightStr = fontWeight === 'bold' ? 'bold ' : ''
  ctx.font = `${fontStyleStr}${fontWeightStr}${fontSize}px Arial`

  // 텍스트 그리기
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(text, x + 5, y + 5)

  // 선택 상태 표시
  if (shape.selected) {
    ctx.strokeStyle = SELECTED_COLOR
    ctx.lineWidth = 3
    ctx.setLineDash([])
    ctx.strokeRect(x, y, width, height)
  }
}

// 이미지 캐시
const imageCache = new Map<string, HTMLImageElement>()

// 이미지 그리기
export const drawImage = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  if (shape.type !== 'image') return

  const { x, y, width = 100, height = 100, imageSrc } = shape

  if (imageSrc) {
    // 캐시에서 이미지 확인
    let img = imageCache.get(imageSrc)
    
    if (img && img.complete && img.naturalWidth > 0) {
      // 이미지가 이미 로드되어 있으면 바로 그리기
      ctx.drawImage(img, x, y, width, height)
      
      // 선택 상태 표시
      if (shape.selected) {
        ctx.strokeStyle = SELECTED_COLOR
        ctx.lineWidth = 3
        ctx.setLineDash([])
        ctx.strokeRect(x, y, width, height)
      }
    } else if (!img) {
      // 새로운 이미지 생성 및 캐시에 저장
      img = new Image()
      imageCache.set(imageSrc, img)
      
      img.onload = () => {
        // 이미지 로드 완료 시 캔버스 다시 그리기
        const canvas = ctx.canvas
        if (canvas) {
          const event = new Event('imageLoaded')
          canvas.dispatchEvent(event)
        }
      }
      
      img.onerror = () => {
        // 에러 시 placeholder 그리기
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(x, y, width, height)

        ctx.strokeStyle = shape.selected ? SELECTED_COLOR : '#cccccc'
        ctx.lineWidth = shape.selected ? 3 : 1
        ctx.setLineDash([])
        ctx.strokeRect(x, y, width, height)

        // "ERROR" 텍스트 표시
        ctx.fillStyle = '#ff0000'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('ERROR', x + width / 2, y + height / 2)
      }
      
      img.src = imageSrc
      
      // 로딩 중일 때 placeholder 표시
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(x, y, width, height)

      ctx.strokeStyle = shape.selected ? SELECTED_COLOR : '#ddd'
      ctx.lineWidth = shape.selected ? 3 : 1
      ctx.setLineDash([])
      ctx.strokeRect(x, y, width, height)

      // "로딩중..." 텍스트 표시
      ctx.fillStyle = '#666666'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('로딩중...', x + width / 2, y + height / 2)
    }
  } else {
    // imageSrc가 없는 경우 placeholder
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(x, y, width, height)

    ctx.strokeStyle = shape.selected ? SELECTED_COLOR : '#cccccc'
    ctx.lineWidth = shape.selected ? 3 : 1
    ctx.setLineDash([])
    ctx.strokeRect(x, y, width, height)

    // "IMG" 텍스트 표시
    ctx.fillStyle = '#666666'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('IMG', x + width / 2, y + height / 2)
  }
}

// 모든 셰이프 그리기
export const drawAllShapes = (ctx: CanvasRenderingContext2D, shapes: Shape[]) => {
  // z-index 순서대로 정렬
  const sortedShapes = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  
  sortedShapes.forEach(shape => {
    const { type, x, y, width = 100, height = 60, fill = '#ffffff', opacity = 1, rotation = 0 } = shape

    ctx.save()
    ctx.globalAlpha = opacity

    // 회전 적용
    if (rotation) {
      ctx.translate(x + width / 2, y + height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-(x + width / 2), -(y + height / 2))
    }

    switch (type) {
      case 'rect':
        ctx.fillStyle = fill
        ctx.fillRect(x, y, width, height)
        break
      case 'image':
        // 배경 그리기
        ctx.fillStyle = fill
        ctx.fillRect(x, y, width, height)
        
        // 이미지 그리기
        if (shape.src) {
          // 캐시에서 이미지 확인
          let img = imageCache.get(shape.src)
          
          if (img && img.complete && img.naturalWidth > 0) {
            // 이미지가 이미 로드되어 있으면 바로 그리기
            ctx.drawImage(img, x, y, width, height)
          } else if (!img) {
            // 새로운 이미지 생성 및 캐시에 저장
            img = new Image()
            imageCache.set(shape.src, img)
            
            img.onload = () => {
              // 이미지 로드 완료 시 캔버스 다시 그리기
              const canvas = ctx.canvas
              if (canvas) {
                const event = new Event('imageLoaded')
                canvas.dispatchEvent(event)
              }
            }
            
            img.onerror = () => {
              // 에러 시 placeholder 그리기
              ctx.fillStyle = '#f0f0f0'
              ctx.fillRect(x, y, width, height)
              ctx.strokeStyle = shape.selected ? '#00ff00' : '#cccccc'
              ctx.lineWidth = shape.selected ? 3 : 1
              ctx.setLineDash([])
              ctx.strokeRect(x, y, width, height)
              
              // "ERROR" 텍스트 표시
              ctx.fillStyle = '#ff0000'
              ctx.font = '12px Arial'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('ERROR', x + width / 2, y + height / 2)
            }
            
            // 이미지 로딩 시작
            img.src = shape.src
            
            // 로딩 중일 때 placeholder 표시
            ctx.fillStyle = '#f8f9fa'
            ctx.fillRect(x, y, width, height)
            ctx.strokeStyle = shape.selected ? '#00ff00' : '#ddd'
            ctx.lineWidth = shape.selected ? 3 : 1
            ctx.setLineDash([])
            ctx.strokeRect(x, y, width, height)
            
            // "로딩중..." 텍스트 표시
            ctx.fillStyle = '#666666'
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('로딩중...', x + width / 2, y + height / 2)
          }
        } else {
          // 이미지 소스가 없는 경우 placeholder
          ctx.fillStyle = '#f0f0f0'
          ctx.fillRect(x, y, width, height)
          ctx.strokeStyle = shape.selected ? '#00ff00' : '#cccccc'
          ctx.lineWidth = shape.selected ? 3 : 1
          ctx.setLineDash([])
          ctx.strokeRect(x, y, width, height)
          
          // "IMG" 텍스트 표시
          ctx.fillStyle = '#666666'
          ctx.font = '14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('IMG', x + width / 2, y + height / 2)
        }
        break
      case 'textbox':
        // 배경 그리기
        ctx.fillStyle = fill
        ctx.fillRect(x, y, width, height)
        
        // 텍스트 그리기
        if (shape.content) {
          ctx.fillStyle = '#000000'
          const fontStyle = shape.meta?.fontStyle === 'italic' ? 'italic ' : ''
          const fontWeight = shape.meta?.fontWeight === 'bold' ? 'bold ' : ''
          ctx.font = `${fontStyle}${fontWeight}${shape.meta?.fontSize || 16}px Arial`
          
          // 텍스트 정렬 설정
          ctx.textAlign = shape.textAlign || 'left'
          ctx.textBaseline = shape.verticalAlign || 'top'
          
          // 텍스트 위치 계산
          let textX = x
          let textY = y
          
          if (shape.textAlign === 'center') {
            textX = x + width / 2
          } else if (shape.textAlign === 'right') {
            textX = x + width - 5
          } else {
            textX = x + 5
          }
          
          if (shape.verticalAlign === 'middle') {
            textY = y + height / 2
          } else if (shape.verticalAlign === 'bottom') {
            textY = y + height - 5
          } else {
            textY = y + 5
          }

          // 여러 줄 텍스트 처리
          const lines = shape.content.split('\n')
          const lineHeight = (shape.meta?.fontSize || 16) * 1.2 // 줄 간격을 폰트 크기의 1.2배로 설정
          
          lines.forEach((line, index) => {
            let currentY = textY
            if (shape.verticalAlign === 'middle') {
              currentY = textY - (lines.length * lineHeight) / 2 + index * lineHeight
            } else if (shape.verticalAlign === 'bottom') {
              currentY = textY - lines.length * lineHeight + index * lineHeight
            } else {
              currentY = textY + index * lineHeight
            }
            ctx.fillText(line, textX, currentY)
          })
        }
        break
    }

    // 선택 상태 표시
    if (shape.selected) {
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, width, height)
    }

    ctx.restore()
  })
}

// 히트 테스트 (선택 감지)
export const hitTest = (shapes: Shape[], point: Point): Shape | null => {
  // 역순으로 검사 (위에 있는 것부터)
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    const { x, y, width = 100, height = 60 } = shape

    if (
      point.x >= x &&
      point.x <= x + width &&
      point.y >= y &&
      point.y <= y + height
    ) {
      return shape
    }
  }

  return null
}

// 그리드에 스냅
export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize
}

// 포인트를 그리드에 스냅
export const snapPointToGrid = (point: Point, gridSize: number): Point => {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize)
  }
} 