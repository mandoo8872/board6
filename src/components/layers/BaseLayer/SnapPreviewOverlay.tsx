import React from 'react';
import { useCanvasStore } from '../../../store/canvasStore';

const SnapPreviewOverlay: React.FC = () => {
  const snapPreview = useCanvasStore((s) => s.snapPreview);

  if (!snapPreview.center) return null;

  const center = snapPreview.center;
  const rect = snapPreview.rect;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* 중심 마커 */}
      <div
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 8,
          backgroundColor: '#0ea5e9',
          boxShadow: '0 0 0 3px rgba(14,165,233,0.25)',
          transform: 'translate(-50%, -50%)',
          left: center.x,
          top: center.y,
        }}
      />
      {/* 미리보기 박스(객체 크기 기준) */}
      {rect && (
        <div
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            border: '1.5px dashed #0ea5e9',
            borderRadius: 4,
            background: 'rgba(14,165,233,0.06)',
          }}
        />
      )}
    </div>
  );
};

export default SnapPreviewOverlay;


