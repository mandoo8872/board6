import React, { useEffect, useRef } from 'react';

interface InlineEditorProps {
  text: string;
  textStyle: {
    color: string;
    bold: boolean;
    italic: boolean;
    horizontalAlign: string;
    fontFamily: string;
  };
  fontSize: number;
  onChange: (text: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const InlineEditor: React.FC<InlineEditorProps> = ({
  text,
  textStyle,
  fontSize,
  onChange,
  onBlur,
  onKeyDown
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 포커스 시 커서를 맨 뒤로 이동 (단, 사용자가 이미 선택한 경우는 유지)
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // 포커스를 먼저 설정
      textarea.focus();
      
      // 사용자가 이미 텍스트를 선택하거나 커서를 이동한 경우가 아니라면 맨 뒤로 이동
      if (textarea.selectionStart === textarea.selectionEnd && textarea.selectionStart === 0) {
        const textLength = text.length;
        setTimeout(() => {
          textarea.setSelectionRange(textLength, textLength);
        }, 0);
      }
    }
  }, []); // 컴포넌트 마운트 시에만 실행

  // 텍스트 변경 시 커서 위치 유지
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    const newText = e.target.value;
    
    onChange(newText);
    
    // 커서 위치 복원 (다음 렌더링 후)
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = Math.min(cursorPosition, newText.length);
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={handleChange}
      onBlur={onBlur}
      onKeyDown={(e) => {
        // 화살표 키는 텍스트 편집용으로 사용 (기본 동작 허용)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          // 기본 동작 허용 (커서 이동)
          return;
        }
        // 다른 키는 기존 핸들러로 전달
        onKeyDown(e);
      }}
      data-editing="true"
      className="w-full h-full bg-transparent border-none outline-none resize-none"
      style={{
        color: textStyle.color,
        fontFamily: textStyle.fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: textStyle.bold ? 'bold' : 'normal',
        fontStyle: textStyle.italic ? 'italic' : 'normal',
        textAlign: textStyle.horizontalAlign as any,
        lineHeight: '1.2',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap', // 줄바꿈 문자 보존
        cursor: 'text',
        userSelect: 'text', // 텍스트 선택 허용
        // 일반적인 텍스트 편집기 동작을 위한 스타일
        padding: '8px',
        boxSizing: 'border-box',
        overflow: 'auto',
        // 드래그 선택을 위한 스타일
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        msUserSelect: 'text',
      }}
      // 텍스트 선택 및 편집을 위한 이벤트 처리
      onSelect={() => {
        // 텍스트 선택 이벤트 처리 (필요시)
      }}
      onMouseDown={(e) => {
        // 마우스 클릭으로 커서 위치 지정 허용
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        // 마우스 드래그 선택 허용
        e.stopPropagation();
      }}
      onMouseMove={(e) => {
        // 마우스 드래그 중 텍스트 선택 허용
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        // 포인터 이벤트도 처리
        e.stopPropagation();
      }}
    />
  );
};

export default InlineEditor;