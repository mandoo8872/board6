export type DrawingTool = 'pen' | 'eraser' | 'select' | 'rect'
export type CommandTool = 'text' | 'image' | 'undo' | 'redo' | 'grid' | 'settings' | 'save' | 'load' | 'push' | 'pull'
export type ToolbarTool = DrawingTool | CommandTool

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  id: string
  points: Point[]
  color: string
  size: number
  isErasable?: boolean
}

export interface Shape {
  id: string
  type: 'rect' | 'text' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  fill?: string
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  imageSrc?: string
  selected?: boolean
  meta?: {
    isMovable?: boolean
    isDeletable?: boolean
    isResizable?: boolean
    isErasable?: boolean
  }
}

// 보드 상태 타입
export interface BoardState {
  shapes: Shape[]
  strokes: Stroke[]
  selectedId: string | null
  metadata?: {
    version?: string
    timestamp?: string
    title?: string
  }
}

// Undo/Redo 액션 타입
export interface UndoRedoAction {
  id: string
  type: 'CREATE_SHAPE' | 'DELETE_SHAPE' | 'UPDATE_SHAPE' | 'CREATE_STROKE' | 'DELETE_STROKE' | 'BATCH'
  timestamp: number
  beforeState: Partial<BoardState>
  afterState: Partial<BoardState>
}

export interface CanvasWrapperProps {
  tool: DrawingTool
  shapes: Shape[]
  strokes: Stroke[]
  penColor: string
  penSize: number
  gridSize: number
  selectedId: string | null
  setShapes: (fn: (prev: Shape[]) => Shape[]) => void
  setStrokes: (fn: (prev: Stroke[]) => Stroke[]) => void
  setSelectedId: (id: string | null) => void
  onPush?: () => void
  onPull?: () => void
} 