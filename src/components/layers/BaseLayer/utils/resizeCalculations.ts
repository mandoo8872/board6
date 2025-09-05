import { Position, Size, ResizeHandle } from '../types';

export interface ResizeCalculationParams {
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  startSize: Size;
  startPosition: Position;
  maintainAspectRatio?: boolean;
  originalAspectRatio?: number;
  objectType?: 'text' | 'checkbox' | 'image'; // 객체 타입 추가
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
    originalAspectRatio = 1,
    objectType = 'text'
  } = params;

  // 객체 타입에 따른 최소 크기 설정
  const getMinSize = () => {
    switch (objectType) {
      case 'checkbox':
        return { width: 80, height: 50 }; // 체크박스 모듈(35px) + 여백(8px) + 최소 텍스트 공간
      case 'image':
        return { width: 50, height: 30 }; // 이미지 최소 크기
      default: // text
        return { width: 50, height: 30 }; // 텍스트 최소 크기
    }
  };

  const minSize = getMinSize();
  let newWidth = startSize.width;
  let newHeight = startSize.height;
  let newX = startPosition.x;
  let newY = startPosition.y;

  // 핸들에 따른 크기 및 위치 계산
  switch (handle) {
    case 'nw': // 좌상단
      newWidth = Math.max(minSize.width, startSize.width - deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(minSize.height, startSize.height - deltaY);
      newX = startPosition.x + (startSize.width - newWidth);
      newY = startPosition.y + (startSize.height - newHeight);
      break;
      
    case 'ne': // 우상단
      newWidth = Math.max(minSize.width, startSize.width + deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(minSize.height, startSize.height - deltaY);
      newY = startPosition.y + (startSize.height - newHeight);
      break;
      
    case 'sw': // 좌하단
      newWidth = Math.max(minSize.width, startSize.width - deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(minSize.height, startSize.height + deltaY);
      newX = startPosition.x + (startSize.width - newWidth);
      break;
      
    case 'se': // 우하단
      newWidth = Math.max(minSize.width, startSize.width + deltaX);
      newHeight = maintainAspectRatio 
        ? newWidth / originalAspectRatio 
        : Math.max(minSize.height, startSize.height + deltaY);
      break;
      
    case 'n': // 상단
      if (maintainAspectRatio) {
        newHeight = Math.max(minSize.height, startSize.height - deltaY);
        newWidth = newHeight * originalAspectRatio;
        newX = startPosition.x + (startSize.width - newWidth) / 2;
      } else {
        newHeight = Math.max(minSize.height, startSize.height - deltaY);
      }
      newY = startPosition.y + (startSize.height - newHeight);
      break;
      
    case 's': // 하단
      if (maintainAspectRatio) {
        newHeight = Math.max(minSize.height, startSize.height + deltaY);
        newWidth = newHeight * originalAspectRatio;
        newX = startPosition.x + (startSize.width - newWidth) / 2;
      } else {
        newHeight = Math.max(minSize.height, startSize.height + deltaY);
      }
      break;
      
    case 'w': // 좌측
      if (maintainAspectRatio) {
        newWidth = Math.max(minSize.width, startSize.width - deltaX);
        newHeight = newWidth / originalAspectRatio;
        newY = startPosition.y + (startSize.height - newHeight) / 2;
      } else {
        newWidth = Math.max(minSize.width, startSize.width - deltaX);
      }
      newX = startPosition.x + (startSize.width - newWidth);
      break;
      
    case 'e': // 우측
      if (maintainAspectRatio) {
        newWidth = Math.max(minSize.width, startSize.width + deltaX);
        newHeight = newWidth / originalAspectRatio;
        newY = startPosition.y + (startSize.height - newHeight) / 2;
      } else {
        newWidth = Math.max(minSize.width, startSize.width + deltaX);
      }
      break;
  }

  return { newWidth, newHeight, newX, newY };
};