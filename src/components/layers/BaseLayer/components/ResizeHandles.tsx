import React from 'react';

interface ResizeHandlesProps {
  onPointerDown: (e: React.PointerEvent, handle: string, objectId: string) => void;
  objectId: string;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ onPointerDown, objectId }) => {
  return (
    <>
      {/* 모서리 핸들 - iPad Safari 호환 포인터 이벤트만 사용 */}
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-nw-resize shadow-md"
        style={{ left: -6, top: -6 }}
        onPointerDown={(e) => onPointerDown(e, 'nw', objectId)}
      />
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-ne-resize shadow-md"
        style={{ right: -6, top: -6 }}
        onPointerDown={(e) => onPointerDown(e, 'ne', objectId)}
      />
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-sw-resize shadow-md"
        style={{ left: -6, bottom: -6 }}
        onPointerDown={(e) => onPointerDown(e, 'sw', objectId)}
      />
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize shadow-md"
        style={{ right: -6, bottom: -6 }}
        onPointerDown={(e) => onPointerDown(e, 'se', objectId)}
      />
      
      {/* 변 중앙 핸들 */}
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-n-resize shadow-md"
        style={{ left: '50%', top: -6, transform: 'translateX(-50%)' }}
        onPointerDown={(e) => onPointerDown(e, 'n', objectId)}
      />
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-s-resize shadow-md"
        style={{ left: '50%', bottom: -6, transform: 'translateX(-50%)' }}
        onPointerDown={(e) => onPointerDown(e, 's', objectId)}
      />
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-w-resize shadow-md"
        style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
        onPointerDown={(e) => onPointerDown(e, 'w', objectId)}
      />
      <div 
        className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-e-resize shadow-md"
        style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
        onPointerDown={(e) => onPointerDown(e, 'e', objectId)}
      />
    </>
  );
};

export default ResizeHandles;