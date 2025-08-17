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

  // 포커스 시 커서를 맨 뒤로 이동
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const textLength = text.length;
      
      // 포커스를 먼저 설정
      textarea.focus();
      
      // 커서를 맨 뒤로 이동
      setTimeout(() => {
        textarea.setSelectionRange(textLength, textLength);
      }, 0);
    }
  }, []); // 컴포넌트 마운트 시에만 실행

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
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
        cursor: 'text',
      }}
    />
  );
};

export default InlineEditor;