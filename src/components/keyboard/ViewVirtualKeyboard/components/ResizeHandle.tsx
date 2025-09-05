import React from 'react';

interface ResizeHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onPointerDown }) => {
  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 bg-gray-600 hover:bg-gray-500 cursor-se-resize transition-colors"
      style={{
        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
      }}
      onPointerDown={onPointerDown}
      title="드래그하여 크기 조절"
    >
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-400 rounded-full"></div>
      <div className="absolute bottom-1 right-2 w-1 h-1 bg-gray-400 rounded-full"></div>
      <div className="absolute bottom-2 right-1 w-1 h-1 bg-gray-400 rounded-full"></div>
    </div>
  );
};

export default ResizeHandle;