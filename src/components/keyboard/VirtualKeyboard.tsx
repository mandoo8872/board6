import React, { useState } from 'react';

interface VirtualKeyboardProps {
  onInput?: (text: string) => void;
  onClose?: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  if (!isVisible) {
    return null;
  }

  const handleKeyPress = (key: string) => {
    if (key === 'Backspace') {
      setInputText(prev => prev.slice(0, -1));
    } else if (key === 'Space') {
      setInputText(prev => prev + ' ');
    } else if (key === 'Enter') {
      // Enter 키 처리 (개행)
      setInputText(prev => prev + '\n');
    } else {
      setInputText(prev => prev + key);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const keyboardLayout = [
    ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
    ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 z-50">
      {/* 입력 텍스트 미리보기 */}
      <div className="bg-white text-black p-2 rounded mb-4 min-h-[60px] overflow-auto">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-full border-none outline-none resize-none"
          placeholder="여기에 텍스트를 입력하세요..."
        />
      </div>

      {/* 키보드 레이아웃 */}
      <div className="flex flex-col gap-2">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded min-w-[40px] transition-colors"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        
        {/* 특수 키들 */}
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={() => handleKeyPress('Space')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
          >
            스페이스
          </button>
          <button
            onClick={() => handleKeyPress('Backspace')}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
          >
            ⌫
          </button>
          <button
            onClick={() => handleKeyPress('Enter')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          >
            ↵
          </button>
          <button
            onClick={handleClose}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard; 