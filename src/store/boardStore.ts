import { create } from 'zustand';
import { TextObject, ImageObject, Stroke } from '../types';

type BoardObject = TextObject | ImageObject;

interface BoardState {
  objects: BoardObject[];
  strokes: Stroke[];
  selectedObjectId: string | null;
  isAdmin: boolean;
  scale: number;
  
  // Actions
  addObject: (object: BoardObject) => void;
  updateObject: (id: string, updates: Partial<BoardObject>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  addStroke: (stroke: Stroke) => void;
  updateStroke: (id: string, updates: Partial<Stroke>) => void;
  deleteStroke: (id: string) => void;
  setScale: (scale: number) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  objects: [],
  strokes: [],
  selectedObjectId: null,
  isAdmin: window.location.pathname.includes('/admin'),
  scale: 1,

  addObject: (object) => 
    set((state) => ({ objects: [...state.objects, object] })),
  
  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),
  
  deleteObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
    })),
  
  selectObject: (id) => set({ selectedObjectId: id }),
  
  addStroke: (stroke) =>
    set((state) => ({ strokes: [...state.strokes, stroke] })),
  
  updateStroke: (id, updates) =>
    set((state) => ({
      strokes: state.strokes.map((stroke) =>
        stroke.id === id ? { ...stroke, ...updates } : stroke
      ),
    })),
  
  deleteStroke: (id) =>
    set((state) => ({
      strokes: state.strokes.filter((stroke) => stroke.id !== id),
    })),
  
  setScale: (scale) => set({ scale }),
})); 