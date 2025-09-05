import React from 'react';

interface NumberKeyboardProps {
  onKeyPress: (key: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const NumberKeyboard: React.FC<NumberKeyboardProps> = ({ onKeyPress, isVisible, onClose }) => {
  if (!isVisible) {
    return null;
  }

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0']
  ];

  const handleKeyPress = (key: string) => {
    onKeyPress(key);
  };

  const handleBackspace = () => {
    onKeyPress('Backspace');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm p-4 z-50 border-t border-gray-600">
      <div className="max-w-sm mx-auto">
        {/* 키보드 제목 */}
        <div className="text-white text-center mb-4 flex justify-between items-center">
          <span className="text-lg font-medium">숫자 키보드</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* 숫자 키패드 */}
        <div className="space-y-3">
          {numbers.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-3">
              {row.map((number) => (
                <button
                  key={number}
                  onClick={() => handleKeyPress(number)}
                  className="w-16 h-16 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 
                           text-white text-xl font-bold rounded-lg transition-all duration-150
                           border border-gray-600 hover:border-gray-500"
                >
                  {number}
                </button>
              ))}
            </div>
          ))}
          
          {/* 백스페이스 버튼 */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleBackspace}
              className="w-32 h-12 bg-red-600 hover:bg-red-500 active:bg-red-400
                       text-white text-lg font-medium rounded-lg transition-all duration-150
                       border border-red-500 hover:border-red-400"
            >
              ⌫ 지우기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberKeyboard; 