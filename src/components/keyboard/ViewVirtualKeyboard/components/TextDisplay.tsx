import React from 'react';

interface TextDisplayProps {
  currentText: string;
  onTextChange: (text: string) => void;
  onApply: () => void;
  onCancel: () => void;
  onClearAll: () => void;
}

const TextDisplay: React.FC<TextDisplayProps> = ({ 
  currentText, 
  onTextChange, 
  onApply, 
  onCancel,
  onClearAll 
}) => {
  return (
    <div className="p-3 bg-gray-700 border-b border-gray-600">
      <div className="flex gap-2">
        <textarea
          value={currentText}
          onChange={(e) => onTextChange(e.target.value)}
          className="flex-1 h-12 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none focus:outline-none focus:border-blue-500"
          placeholder="텍스트 입력..."
          style={{
            whiteSpace: 'pre-wrap', // 줄바꿈 문자 보존
            minHeight: '48px',
            maxHeight: '120px',
          }}
        />
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              onClick={onApply}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
            >
              적용
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors"
            >
              취소
            </button>
          </div>
          <button
            onClick={onClearAll}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors"
          >
            전체삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextDisplay;