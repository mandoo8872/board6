// 그리드 스냅 함수
export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

// 위치를 그리드에 스냅
export const snapPositionToGrid = (
  x: number, 
  y: number, 
  gridSize: number
): { x: number; y: number } => {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize)
  };
};

// 크기를 그리드에 스냅 (최소 크기 보장)
export const snapSizeToGrid = (
  width: number, 
  height: number, 
  gridSize: number,
  minWidth: number = 50,
  minHeight: number = 30
): { width: number; height: number } => {
  return {
    width: Math.max(snapToGrid(width, gridSize), minWidth),
    height: Math.max(snapToGrid(height, gridSize), minHeight)
  };
}; 