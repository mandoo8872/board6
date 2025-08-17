import { Position, Size, ResizeHandle } from '../types';

export interface ResizeCalculationParams {
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  startSize: Size;
  startPosition: Position;
  maintainAspectRatio?: boolean;
  originalAspectRatio?: number;
}

export interface ResizeResult {
  newWidth: number;
  newHeight: number;
  newX: number;
  newY: number;
}

export const calculateResize = (params: ResizeCalculationParams): ResizeResult => {
  const {
    handle,
    deltaX,
    deltaY,
    startSize,
    startPosition,
    maintainAspectRatio = false,
    originalAspectRatio = 1
  } = params;

  let newWidth = startSize.width;
  let newHeight = startSize.height;
  let newX = startPosition.x;
  let newY = startPosition.y;

  // 핸들에 따른 크기 및 위치 계산
  switch (handle) {
    case 'nw': // 좌상단
      newWidth = Math.max(50, startSize.width - deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(30, startSize.height - deltaY);
      newX = startPosition.x + (startSize.width - newWidth);
      newY = startPosition.y + (startSize.height - newHeight);
      break;
      
    case 'ne': // 우상단
      newWidth = Math.max(50, startSize.width + deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(30, startSize.height - deltaY);
      newY = startPosition.y + (startSize.height - newHeight);
      break;
      
    case 'sw': // 좌하단
      newWidth = Math.max(50, startSize.width - deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(30, startSize.height + deltaY);
      newX = startPosition.x + (startSize.width - newWidth);
      break;
      
    case 'se': // 우하단
      newWidth = Math.max(50, startSize.width + deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(30, startSize.height + deltaY);
      break;
      
    case 'n': // 상단
      if (maintainAspectRatio) {
        newHeight = Math.max(30, startSize.height - deltaY);
        newWidth = newHeight * originalAspectRatio;
        newX = startPosition.x + (startSize.width - newWidth) / 2;
      } else {
        newHeight = Math.max(30, startSize.height - deltaY);
      }
      newY = startPosition.y + (startSize.height - newHeight);
      break;
      
    case 's': // 하단
      if (maintainAspectRatio) {
        newHeight = Math.max(30, startSize.height + deltaY);
        newWidth = newHeight * originalAspectRatio;
        newX = startPosition.x + (startSize.width - newWidth) / 2;
      } else {
        newHeight = Math.max(30, startSize.height + deltaY);
      }
      break;
      
    case 'w': // 좌측
      if (maintainAspectRatio) {
        newWidth = Math.max(50, startSize.width - deltaX);
        newHeight = newWidth / originalAspectRatio;
        newY = startPosition.y + (startSize.height - newHeight) / 2;
      } else {
        newWidth = Math.max(50, startSize.width - deltaX);
      }
      newX = startPosition.x + (startSize.width - newWidth);
      break;
      
    case 'e': // 우측
      if (maintainAspectRatio) {
        newWidth = Math.max(50, startSize.width + deltaX);
        newHeight = newWidth / originalAspectRatio;
        newY = startPosition.y + (startSize.height - newHeight) / 2;
      } else {
        newWidth = Math.max(50, startSize.width + deltaX);
      }
      break;
  }

  return { newWidth, newHeight, newX, newY };
};