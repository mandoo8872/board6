// 기본 도구 타입
export type Tool = 'select' | 'text' | 'checkbox' | 'image' | 'pen' | 'eraser';

// Undo/Redo Snapshot 타입 (Draw 상태 제외)
export interface CanvasSnapshot {
  textObjects: TextObject[];
  imageObjects: ImageObject[];
  floorImage: FloorImage | null;
  // UI 인지 가능한 편집 상태 포함
  selectedObjectId?: string | null;
  selectedCellIds?: string[];
  timestamp: number;
}

export interface UndoRedoState {
  history: CanvasSnapshot[];
  cursor: number;
}

// 캔버스 관련 타입 정의
export interface CanvasProps {
  isViewPage: boolean;
}

export interface CanvasSize {
  width: number;
  height: number;
}

// 스트로크 타입 정의
export interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity: number;
}

// 셀 타입 정의
export interface Cell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
}

// 박스 스타일
export interface BoxStyle {
  backgroundColor: string;
  backgroundOpacity: number;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

// 텍스트 스타일
export interface TextStyle {
  color: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  horizontalAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

// 객체 권한
export interface ObjectPermissions {
  editable?: boolean;
  movable: boolean;
  deletable: boolean;
  resizable: boolean;
}

// 텍스트/체크박스 객체 (Firebase textObjects 스키마)
export interface TextObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  hasCheckbox: boolean;
  checkboxChecked: boolean;
  checkboxCheckedColor?: string;
  checkboxUncheckedColor?: string;
  checkedBackgroundColor?: string;
  uncheckedBackgroundColor?: string;
  checkedBackgroundOpacity?: number;
  uncheckedBackgroundOpacity?: number;
  boxStyle: BoxStyle;
  fontSize: number;
  textStyle: TextStyle;
  permissions: ObjectPermissions;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  isEditing: boolean;
  
  // 셀 관련 메타데이터 (엑셀 붙여넣기용)
  groupId?: string; // 셀 그룹 ID (예: 'excel-input-1234567890')
  cellType?: 'cell' | 'text' | 'checkbox'; // 객체 타입 구분
  cellPosition?: { row: number; col: number }; // 셀 위치 (행, 열)
  
  // LWW (Last Write Wins) 지원
  lastModified: number;
  modifiedBy?: string;
}

// 이미지 객체 (Firebase imageObjects 스키마)
export interface ImageObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  maintainAspectRatio: boolean;
  permissions: ObjectPermissions;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  
  // LWW (Last Write Wins) 지원
  lastModified: number;
  modifiedBy?: string;
}

// 필기 stroke (Firebase drawObjects 스키마)
export interface DrawObject {
  id: string;
  points: number[];
  color: string;
  width: number;
  createdAt: string;
  
  // perfect-freehand 지원
  usePerfectFreehand?: boolean;
  pressure?: number[]; // 각 포인트의 압력 데이터
  inputType?: 'mouse' | 'pen' | 'touch'; // 입력 디바이스 타입
  
  // LWW (Last Write Wins) 지원
  lastModified: number;
  modifiedBy?: string;
}

// 바닥 이미지 (Firebase floorImage)
export interface FloorImage {
  path: string;
}

// 설정값 (Firebase settings/{admin|view})
export interface Settings {
  admin: AdminSettings;
  view: ViewSettings;
}

export interface AdminSettings {
  autoToolSwitch: boolean;
  gridVisible: boolean;
  gridSize: number;
  gridSnapEnabled: boolean;
  stepSnapDuringDrag?: boolean;
  defaultFontSize: number;
  defaultBoxWidth: number;
  defaultBoxHeight: number;
  objectCreationPosition: {
    x: number;
    y: number;
  };
  defaultCheckboxSettings: {
    checkedColor: string;
    uncheckedColor: string;
    checkedBackgroundColor: string;
    uncheckedBackgroundColor: string;
    checkedBackgroundOpacity: number;
    uncheckedBackgroundOpacity: number;
  };
  // 엑셀 붙여넣기 설정
  excelPasteSettings: {
    startPosition: { x: number; y: number };
    cellWidth: number;
    cellHeight: number;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    maxRows: number;
    maxCols: number;
  };
  // 페이지별 패스워드 설정
  passwords: {
    admin: string;
    view: string;
  };
}

export interface ViewSettings {
  virtualKeyboardEnabled: boolean;
  touchMode: boolean;
  usePerfectFreehand: boolean; // perfect-freehand 사용 여부
}

// 캔버스 상태
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedObjectId: string | null;
  currentTool: Tool;
  isDrawing: boolean;
  currentStroke: number[];
}

// Zustand 스토어 타입들
export interface EditorStore {
  currentTool: Tool;
  zoom: number;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  creationMode: boolean;
  setCurrentTool: (tool: Tool) => void;
  setZoom: (zoom: number) => void;
  setSelectedObjectId: (id: string | null) => void;
  setHoveredObjectId: (id: string | null) => void;
  setCreationMode: (mode: boolean) => void;
}

export interface CanvasStore {
  isDragging: boolean;
  viewCam: { x: number; y: number };
  snapEnabled: boolean;
  setIsDragging: (dragging: boolean) => void;
  setViewCam: (cam: { x: number; y: number }) => void;
  setSnapEnabled: (enabled: boolean) => void;
}

export interface DrawStore {
  strokes: number[][];
  currentStroke: number[];
  isDrawing: boolean;
  addPoint: (x: number, y: number) => void;
  startStroke: () => void;
  endStroke: () => void;
  clearStrokes: () => void;
}

export interface AdminConfigStore {
  textObjects: TextObject[];
  imageObjects: ImageObject[];
  drawObjects: DrawObject[];
  floorImage: FloorImage | null;
  settings: Settings;
  isLoading: boolean;
  
  // Firebase 동기화
  initializeFirebaseListeners: () => void;
  
  // TextObject 관리
  addTextObject: (obj: Omit<TextObject, 'id'>) => Promise<void>;
  updateTextObject: (id: string, updates: Partial<TextObject>) => Promise<void>;
  deleteTextObject: (id: string) => Promise<void>;
  
  // ImageObject 관리
  addImageObject: (obj: Omit<ImageObject, 'id'>) => Promise<void>;
  updateImageObject: (id: string, updates: Partial<ImageObject>) => Promise<void>;
  deleteImageObject: (id: string) => Promise<void>;
  
  // DrawObject 관리
  deleteDrawObject: (id: string) => Promise<void>;
  
  // FloorImage 관리
  setFloorImage: (image: FloorImage) => Promise<void>;
  
  // Settings 관리
  updateSettings: (section: 'admin' | 'view', updates: Partial<AdminSettings | ViewSettings>) => Promise<void>;
} 