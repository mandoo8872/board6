import React from 'react';

interface KeyboardHeaderProps {
  onPointerDown: (e: React.PointerEvent) => void;
}

const KeyboardHeader: React.FC<KeyboardHeaderProps> = ({ onPointerDown }) => {
  return (
    <div 
      className="bg-gray-700 px-3 py-2 rounded-t-lg border-b border-gray-600 cursor-move select-none flex items-center"
      onPointerDown={onPointerDown}
    >
      <div className="text-gray-300 font-medium text-sm">🎹 가상 키보드</div>
    </div>
  );
};

export default KeyboardHeader;