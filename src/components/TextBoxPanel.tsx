import React from 'react'
import { TextBox } from '../types'

interface TextBoxPanelProps {
  textBox: TextBox
  onUpdate: (updates: Partial<TextBox>) => void
  onResize: (width: number, height: number) => void
}

export const TextBoxPanel: React.FC<TextBoxPanelProps> = ({ textBox, onUpdate, onResize }) => {
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value })
  }

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ backgroundColor: e.target.value })
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ opacity: parseFloat(e.target.value) })
  }

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    onUpdate({ textAlign: align })
  }

  const handleVerticalAlignChange = (align: 'top' | 'middle' | 'bottom') => {
    onUpdate({ verticalAlign: align })
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value)
    onResize(width, textBox.height || 100)
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value)
    onResize(textBox.width || 200, height)
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
        <input
          type="color"
          value={textBox.backgroundColor ?? '#888888'}
          onChange={handleBackgroundColorChange}
        />
      </div>

      <div className="panel-section">
        <label>투명도</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={typeof textBox.opacity === 'number' && !isNaN(textBox.opacity) ? textBox.opacity : 0.5}
          onChange={handleOpacityChange}
        />
        <span>{Math.round((typeof textBox.opacity === 'number' && !isNaN(textBox.opacity) ? textBox.opacity : 0.5) * 100)}%</span>
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