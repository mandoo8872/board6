import React from 'react';

interface KeyboardLayoutProps {
  isKorean: boolean;
  isShiftPressed: boolean;
  onKeyPress: (key: string) => void;
  onShiftPress: () => void;
  onLanguageToggle: () => void;
  keyboardWidth: number;
  keyboardHeight: number;
}

const KeyboardLayout: React.FC<KeyboardLayoutProps> = ({
  isKorean,
  isShiftPressed,
  onKeyPress,
  onShiftPress,
  onLanguageToggle,
  keyboardWidth,
  keyboardHeight
}) => {
  // 키보드 레이아웃 정의
  const koreanLayout = {
    row1: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
    row2: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    row3: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  };

  const koreanShiftLayout = {
    row1: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅒ', 'ㅖ'],
    row2: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    row3: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
    numbers: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']
  };

  const englishLayout = {
    row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  };

  const englishShiftLayout = {
    row1: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    row2: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    row3: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    numbers: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']
  };

  const getCurrentLayout = () => {
    if (isKorean) {
      return isShiftPressed ? koreanShiftLayout : koreanLayout;
    } else {
      return isShiftPressed ? englishShiftLayout : englishLayout;
    }
  };

  const layout = getCurrentLayout();

  // 키보드 영역 크기에 따른 키 크기 계산
  const availableWidth = Math.max(200, keyboardWidth - 32); // padding 제외
  const availableHeight = Math.max(140, keyboardHeight - 140); // 헤더, 텍스트영역 등 제외
  
  // 각 행의 키 개수에 맞춰 키 크기 계산
  const maxKeysPerRow = Math.max(
    layout.numbers.length,
    layout.row1.length,
    layout.row2.length,
    layout.row3.length + 2 // +2 for shift and backspace
  );
  // 키보드 최대 크기(가로 1600, 세로 800)에 맞춰 최대 키 크기도 자동 제한
  const keySize = Math.floor(availableWidth / maxKeysPerRow) - 4; // 가로 기준
  const rowCount = 5; // numbers + row1 + row2 + row3 + bottom
  const keyHeightCandidate = Math.floor(availableHeight / rowCount) - 4;
  const finalKeySize = Math.max(24, Math.min(60, keySize));
  const finalKeyHeight = Math.max(24, Math.min(50, keyHeightCandidate));

  const keyStyle = {
    width: `${finalKeySize}px`,
    height: `${finalKeyHeight}px`,
    fontSize: `${Math.max(10, finalKeySize * 0.4)}px`
  } as React.CSSProperties;

  const wideKeyStyle = {
    ...keyStyle,
    width: `${finalKeySize * 1.5}px`
  } as React.CSSProperties;

  const spaceKeyStyle = {
    ...keyStyle,
    width: `${finalKeySize * 4}px`
  } as React.CSSProperties;

  return (
    <div className="flex-1 p-4" style={{ minHeight: `${availableHeight}px` }}>
      {/* 숫자 행 */}
      <div className="flex gap-1 mb-1 justify-center">
        {layout.numbers.map((key, index) => (
          <button
            key={`num-${index}`}
            onClick={() => onKeyPress(key)}
            style={keyStyle}
            className="bg-gray-600 hover:bg-gray-500 text-white rounded font-medium transition-colors"
          >
            {key}
          </button>
        ))}
      </div>

      {/* 첫 번째 행 */}
      <div className="flex gap-1 mb-1 justify-center">
        {layout.row1.map((key, index) => (
          <button
            key={`row1-${index}`}
            onClick={() => onKeyPress(key)}
            style={keyStyle}
            className="bg-gray-600 hover:bg-gray-500 text-white rounded font-medium transition-colors"
          >
            {key}
          </button>
        ))}
      </div>

      {/* 두 번째 행 */}
      <div className="flex gap-1 mb-1 justify-center">
        {layout.row2.map((key, index) => (
          <button
            key={`row2-${index}`}
            onClick={() => onKeyPress(key)}
            style={keyStyle}
            className="bg-gray-600 hover:bg-gray-500 text-white rounded font-medium transition-colors"
          >
            {key}
          </button>
        ))}
      </div>

      {/* 세 번째 행 */}
      <div className="flex gap-1 mb-1 justify-center">
        {/* Shift 키 */}
        <button
          onClick={onShiftPress}
          style={wideKeyStyle}
          className={`rounded font-medium transition-colors ${
            isShiftPressed 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-gray-600 hover:bg-gray-500 text-white'
          }`}
        >
          ⇧
        </button>

        {layout.row3.map((key, index) => (
          <button
            key={`row3-${index}`}
            onClick={() => onKeyPress(key)}
            style={keyStyle}
            className="bg-gray-600 hover:bg-gray-500 text-white rounded font-medium transition-colors"
          >
            {key}
          </button>
        ))}

        {/* Backspace 키 */}
        <button
          onClick={() => onKeyPress('Backspace')}
          style={wideKeyStyle}
          className="bg-red-600 hover:bg-red-500 text-white rounded font-medium transition-colors"
        >
          ⌫
        </button>
      </div>

      {/* 하단 행 (스페이스, 언어 전환) */}
      <div className="flex gap-1 justify-center">
        {/* 언어 전환 */}
        <button
          onClick={onLanguageToggle}
          style={keyStyle}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
        >
          {isKorean ? '한' : 'EN'}
        </button>

        {/* 스페이스바 */}
        <button
          onClick={() => onKeyPress(' ')}
          style={spaceKeyStyle}
          className="bg-gray-600 hover:bg-gray-500 text-white rounded font-medium transition-colors"
        >
          Space
        </button>

        {/* 줄바꿈 */}
        <button
          onClick={() => onKeyPress('Enter')}
          style={wideKeyStyle}
          className="bg-green-600 hover:bg-green-500 text-white rounded font-medium transition-colors"
        >
          ↵
        </button>
      </div>
    </div>
  );
};

export default KeyboardLayout;