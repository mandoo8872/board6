// 동기화 이벤트 타입
export type SyncEventType = 
  | 'draw' 
  | 'move' 
  | 'resize' 
  | 'update' 
  | 'delete' 
  | 'create'

// 동기화 이벤트 데이터
export interface SyncEvent {
  type: SyncEventType
  shapeId?: string
  data: any
  timestamp: number
  userId: string
}

// 동기화 콜백 타입
export interface SyncCallbacks {
  onDrawEnd: () => void
  onMoveShape: (shapeId: string, newPosition: { x: number; y: number }) => void
  onResizeShape: (shapeId: string, newSize: { width: number; height: number; x?: number; y?: number }) => void
  onUpdateShape: (shapeId: string, property: keyof Shape, value: any) => void
  onDeleteShape: (shapeId: string) => void
  onCreateShape: (shape: Shape) => void
}

// 동기화 설정
export interface SyncConfig {
  drawDebounceMs: number
  moveThrottleMs: number
  resizeThrottleMs: number
  updateDebounceMs: number
}

// 기본 동기화 설정
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  drawDebounceMs: 200,
  moveThrottleMs: 300,
  resizeThrottleMs: 300,
  updateDebounceMs: 300
}

export type DrawingTool = 'pen' | 'eraser' | 'select' | 'rect'
export type CommandTool =
  | 'move'
  | 'resize'
  | 'delete'
  | 'duplicate'
  | 'text'
  | 'image'
  | 'save'
  | 'load'
  | 'push'
  | 'pull'
  | 'undo'
  | 'redo'
  | 'settings'

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  id: string
  points: Point[]
  color: string
  size: number
  userId: string
  updatedAt: number
  updatedBy: string
  tool?: string // pen, eraser 등
  isErasable?: boolean
  // 기타 실제 코드에서 사용하는 속성 추가 가능
}

export interface Shape {
  id: string
  type: 'rectangle' | 'circle' | 'triangle' | 'rect' | 'text' | 'image'
  x: number
  y: number
  width: number
  height: number
  color: string
  fill?: string
  fontWeight?: string
  fontSize?: number
  fontStyle?: string
  selected?: boolean
  movable: boolean
  deletable: boolean
  resizable: boolean
  userId: string
  updatedAt: number
  updatedBy: string
  deleted?: boolean
  meta?: {
    isResizable?: boolean
    isMovable?: boolean
    isDeletable?: boolean
    isErasable?: boolean
    // 필요시 추가
  }
  imageSrc?: string // image 타입일 때 사용
  text?: string // text 타입일 때 사용
  // 기타 실제 코드에서 사용하는 속성 추가 가능
}

export interface BoardData {
  shapes: { [key: string]: Shape }
  strokes: { [key: string]: Stroke }
  updatedAt: number
  updatedBy: string
}

export interface BoardState {
  shapes: Shape[]
  strokes: Stroke[]
  selectedId: string | null
}

export interface UndoRedoAction {
  id: string
  type: string
  timestamp: number
  beforeState: Partial<BoardState>
  afterState: Partial<BoardState>
} 