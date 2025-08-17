// BaseLayer 관련 타입 정의

export interface DragState {
  isDragging: boolean;
  draggedObjectId: string | null;
  offset: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

export interface ResizeState {
  isResizing: boolean;
  resizedObjectId: string | null;
  resizeHandle: string | null;
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
  startObjectPosition: { x: number; y: number };
  currentSize?: { width: number; height: number };
  currentPosition?: { x: number; y: number };
}

export interface InlineEditState {
  editingObjectId: string | null;
  editingText: string;
}

export interface ClickState {
  clickCount: number;
  clickTimer: NodeJS.Timeout | null;
}

export interface DeviceDetection {
  isSafari: boolean;
  lastPointerEventTime: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ObjectStyle {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
  cursor: string;
  transition: string;
  pointerEvents: string;
}

export interface BaseLayerProps {
  isViewPage?: boolean;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';

// 기존 타입들을 재사용
import { TextObject, ImageObject } from '../../../types/index';

export type TextObjectData = TextObject;
export type ImageObjectData = ImageObject;
export type ObjectData = TextObjectData | ImageObjectData;