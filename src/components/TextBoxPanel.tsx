import React, { useState, useEffect } from 'react'
import { TextBox } from '../types'

interface TextBoxPanelProps {
  textBox: TextBox
  onUpdate: (updates: Partial<TextBox>) => void
  onUpdateComplete: (updates: Partial<TextBox>) => void
  onResize?: (width: number, height: number) => void
}

export const TextBoxPanel: React.FC<TextBoxPanelProps> = ({
  textBox,
  onUpdate,
  onUpdateComplete,
  onResize
}) => {
  const [localFill, setLocalFill] = useState<string>(textBox.fill || '#ffffff')
  const [localOpacity, setLocalOpacity] = useState<number>(textBox.opacity ?? 1)

  useEffect(() => {
    setLocalFill(textBox.fill || '#ffffff')
    setLocalOpacity(textBox.opacity ?? 1)
  }, [textBox])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value })
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setLocalFill(newColor)
    onUpdate({ fill: newColor })
  }

  const handleColorComplete = () => {
    onUpdateComplete({
      ...textBox,
      fill: localFill
    })
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value)
    setLocalOpacity(newOpacity)
    onUpdate({ opacity: newOpacity })
  }

  const handleOpacityComplete = () => {
    onUpdateComplete({
      ...textBox,
      opacity: localOpacity
    })
  }

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    onUpdate({ textAlign: align })
  }

  const handleVerticalAlignChange = (align: 'top' | 'middle' | 'bottom') => {
    onUpdate({ verticalAlign: align })
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value)
    onResize?.(width, textBox.height || 100)
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value)
    onResize?.(textBox.width || 200, height)
  }

  return (
    <div className="text-box-panel">
      <div className="panel-section">
        <label>텍스트 내용</label>
        <textarea
          value={textBox.content ?? ''}
          onChange={handleContentChange}
          rows={3}
        />
      </div>

      <div className="panel-section">
        <label>크기</label>
        <div className="size-controls">
          <div>
            <label>너비</label>
            <input
              type="number"
              value={textBox.width || 200}
              onChange={handleWidthChange}
              min="50"
              max="1000"
            />
          </div>
          <div>
            <label>높이</label>
            <input
              type="number"
              value={textBox.height || 100}
              onChange={handleHeightChange}
              min="50"
              max="1000"
            />
          </div>
        </div>
      </div>

      <div className="panel-section">
        <label>배경색</label>
        <div className="color-input-group">
          <input
            type="color"
            value={localFill}
            onChange={handleColorChange}
            onMouseUp={handleColorComplete}
            onBlur={handleColorComplete}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={textBox.meta?.noBackground === true}
              onChange={(e) => onUpdate({ 
                meta: { 
                  ...textBox.meta, 
                  noBackground: e.target.checked 
                } 
              })}
            />
            배경 없음
          </label>
        </div>
      </div>

      <div className="panel-section">
        <label>투명도</label>
        <div className="opacity-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={localOpacity}
            onChange={handleOpacityChange}
            onMouseUp={handleOpacityComplete}
            onBlur={handleOpacityComplete}
          />
          <span>{Math.round(localOpacity * 100)}%</span>
        </div>
      </div>

      <div className="panel-section">
        <label>수평 정렬</label>
        <div className="alignment-buttons">
          <button
            onClick={() => handleTextAlignChange('left')}
            className={textBox.textAlign === 'left' ? 'active' : ''}
            title="왼쪽 정렬"
          >
            ⇤
          </button>
          <button
            onClick={() => handleTextAlignChange('center')}
            className={textBox.textAlign === 'center' ? 'active' : ''}
            title="가운데 정렬"
          >
            ⇔
          </button>
          <button
            onClick={() => handleTextAlignChange('right')}
            className={textBox.textAlign === 'right' ? 'active' : ''}
            title="오른쪽 정렬"
          >
            ⇥
          </button>
        </div>
      </div>

      <div className="panel-section">
        <label>수직 정렬</label>
        <div className="alignment-buttons">
          <button
            onClick={() => handleVerticalAlignChange('top')}
            className={textBox.verticalAlign === 'top' ? 'active' : ''}
            title="위 정렬"
          >
            ⇧
          </button>
          <button
            onClick={() => handleVerticalAlignChange('middle')}
            className={textBox.verticalAlign === 'middle' ? 'active' : ''}
            title="가운데 정렬"
          >
            ⇕
          </button>
          <button
            onClick={() => handleVerticalAlignChange('bottom')}
            className={textBox.verticalAlign === 'bottom' ? 'active' : ''}
            title="아래 정렬"
          >
            ⇩
          </button>
        </div>
      </div>
    </div>
  )
} 