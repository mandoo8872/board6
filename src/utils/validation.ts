/**
 * 값 유효성 검사 유틸리티
 */

// 숫자가 유효한지 확인 (NaN, Infinity 제외)
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// 좌표 객체가 유효한지 확인
export function isValidPosition(position: { x: number; y: number }): boolean {
  return isValidNumber(position.x) && isValidNumber(position.y);
}

// 크기 객체가 유효한지 확인
export function isValidSize(size: { width: number; height: number }): boolean {
  return isValidNumber(size.width) && isValidNumber(size.height) && 
         size.width > 0 && size.height > 0;
}

// 안전한 숫자 값 반환 (기본값 포함)
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (isValidNumber(value)) {
    return value;
  }
  console.warn(`Invalid number value: ${value}, using default: ${defaultValue}`);
  return defaultValue;
}

// 안전한 좌표 객체 반환
export function safePosition(
  position: { x: number; y: number }, 
  defaultPosition: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  return {
    x: safeNumber(position.x, defaultPosition.x),
    y: safeNumber(position.y, defaultPosition.y)
  };
}

// 안전한 크기 객체 반환
export function safeSize(
  size: { width: number; height: number },
  defaultSize: { width: number; height: number } = { width: 100, height: 100 }
): { width: number; height: number } {
  return {
    width: safeNumber(size.width, defaultSize.width),
    height: safeNumber(size.height, defaultSize.height)
  };
}

// Firebase 업데이트 데이터 검증
export function validateFirebaseUpdate(data: Record<string, any>): Record<string, any> {
  const validatedData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (key === 'x' || key === 'y') {
      validatedData[key] = safeNumber(value, 0);
    } else if (key === 'width' || key === 'height') {
      validatedData[key] = safeNumber(value, key === 'width' ? 100 : 100);
    } else {
      validatedData[key] = value;
    }
  }
  
  return validatedData;
} 