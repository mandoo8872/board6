import { v4 as uuidv4 } from 'uuid'
import { Shape } from '../types'

export const createTextBox = (
  x: number,
  y: number,
  content: string = '새 텍스트',
  zIndex: number = 0
): Shape => {
  return {
    id: uuidv4(),
    type: 'textbox',
    x,
    y,
    width: 150,
    height: 60,
    fill: '#888888',
    opacity: 0.5,
    content,
    textAlign: 'left',
    verticalAlign: 'top',
    zIndex,
    meta: {
      fontSize: 40,
      isMovable: true,
      isDeletable: true,
      isResizable: true,
      isErasable: false
    }
  }
} 