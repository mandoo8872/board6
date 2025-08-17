import React from 'react';
import { ImageObjectData } from '../types';
import ResizeHandles from './ResizeHandles';

interface ImageObjectRendererProps {
  obj: ImageObjectData;
  isSelected: boolean;
  isHovered: boolean;
  isViewPage: boolean;
  isDragging: boolean;
  currentX: number;
  currentY: number;
  currentWidth: number;
  currentHeight: number;
  currentTool: string;
  editingObjectId: string | null;
  onObjectClick: (e: React.MouseEvent, id: string) => void;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onResizePointerDown: (e: React.PointerEvent, handle: string, objectId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ImageObjectRenderer: React.FC<ImageObjectRendererProps> = ({
  obj,
  isSelected,
  isHovered,
  isViewPage,
  isDragging,
  currentX,
  currentY,
  currentWidth,
  currentHeight,
  currentTool,
  editingObjectId,
  onObjectClick,
  onPointerDown,
  onResizePointerDown,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      className={`absolute select-none ${
        isSelected ? 'ring-4 ring-blue-600' : 
        isHovered ? 'ring-2 ring-gray-400' : ''
      }`}
      style={{
        left: currentX,
        top: currentY,
        width: currentWidth,
        height: currentHeight,
        opacity: obj.opacity,
        zIndex: obj.zIndex || 0,
        cursor: editingObjectId === obj.id ? 'text' : (
          isViewPage 
            ? 'default' 
            : (isDragging ? 'grabbing' : (obj.permissions?.movable ? 'grab' : 'default'))
        ),
        transition: isDragging ? 'none' : 'all 0.1s ease',
        // iPad Safari 최적화: 펜/지우개 도구 사용 시 포인터 이벤트 비활성화
        pointerEvents: (currentTool === 'pen' || currentTool === 'eraser') ? 'none' : 'auto'
      }}
      onClick={(e) => onObjectClick(e, obj.id)}
      onPointerDown={(e) => onPointerDown(e, obj.id)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 이미지 */}
      <img
        src={obj.src}
        alt=""
        className={`w-full h-full ${
          obj.maintainAspectRatio ? 'object-contain' : 'object-fill'
        }`}
        draggable={false}
        style={{
          pointerEvents: 'none',
        }}
      />

      {/* 크기조절 핸들 */}
      {isSelected && !isViewPage && obj.permissions?.resizable && (
        <ResizeHandles onPointerDown={onResizePointerDown} objectId={obj.id} />
      )}
    </div>
  );
};

export default ImageObjectRenderer;