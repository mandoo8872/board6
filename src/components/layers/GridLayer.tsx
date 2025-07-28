import React from 'react';

interface GridLayerProps {
  gridEnabled: boolean;
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

const GridLayer: React.FC<GridLayerProps> = React.memo(({ 
  gridEnabled, 
  gridSize, 
  canvasWidth, 
  canvasHeight 
}) => {
  if (!gridEnabled) return null;

  // 그리드 라인 생성
  const verticalLines = [];
  const horizontalLines = [];

  // 세로 라인
  for (let x = 0; x <= canvasWidth; x += gridSize) {
    verticalLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={canvasHeight}
        stroke="#e5e7eb"
        strokeWidth={1}
        opacity={0.5}
      />
    );
  }

  // 가로 라인
  for (let y = 0; y <= canvasHeight; y += gridSize) {
    horizontalLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={canvasWidth}
        y2={y}
        stroke="#e5e7eb"
        strokeWidth={1}
        opacity={0.5}
      />
    );
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ zIndex: 1 }}
    >
      {verticalLines}
      {horizontalLines}
    </svg>
  );
});

GridLayer.displayName = 'GridLayer';

export default GridLayer; 