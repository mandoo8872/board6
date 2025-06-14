export type DrawingTool = 'select' | 'pen' | 'eraser' | 'rect' | 'text' | 'image'
export type CommandTool = 'undo' | 'redo' | 'save' | 'load' | 'push' | 'pull' | 'settings' | 'image' | 'text' | 'grid'
export type ToolbarTool = DrawingTool | CommandTool

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  id: string
  tool: DrawingTool
  color: string
  size: number
  points: Point[]
  isErasable?: boolean
  updatedAt?: number
  updatedBy?: string
}

export interface Shape {
  id: string
  type: 'rect' | 'image' | 'textbox'
  x: number
  y: number
  width?: number
  height?: number
  fill?: string
  opacity?: number
  rotation?: number
  zIndex?: number
  selected?: boolean
  content?: string
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  src?: string
  meta?: {
    isMovable?: boolean
    isDeletable?: boolean
    isResizable?: boolean
    isErasable?: boolean
    noBackground?: boolean
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
  }
  updatedAt?: number
  updatedBy?: string
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