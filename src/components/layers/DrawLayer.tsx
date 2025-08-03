import React, { useRef, useEffect, useCallback } from 'react';
import { ref, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { useDrawStore, useAdminConfigStore, useEditorStore } from '../../store';
import { lwwCreateDrawObject } from '../../utils/lww';
import { getStroke } from 'perfect-freehand';

interface DrawLayerProps {
  isViewPage?: boolean;
}

const DrawLayer: React.FC<DrawLayerProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isErasingRef = useRef<boolean>(false); // 지우개 드래그 상태 추가
  const autoSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 자동 전환 타이머
  const renderQueueRef = useRef<boolean>(false); // 렌더링 대기열 플래그
  const activePointerRef = useRef<number | null>(null); // 활성 포인터 ID 추적
  const isWebkitRef = useRef<boolean>(false); // 웹킷 브라우저 감지
  const touchRejectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 터치 거부 타이머
  
  const { 
    currentStroke, 
    currentPressureStroke,
    isDrawing, 
    penColor,
    penWidth,
    usePerfectFreehand,
    addPoint, 
    startStroke, 
    endStroke, 
    clearCurrentStroke,
  } = useDrawStore();
  
  const { drawObjects, settings, isLoading } = useAdminConfigStore();
  const { currentTool, setCurrentTool } = useEditorStore();

  // iPad Safari 감지 및 최적화 (iPad Safari 터치 이벤트 충돌 해결)
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    
    // iPad Safari에서만 엄격한 입력 제한 및 충돌 방지 로직 적용
    isWebkitRef.current = isIOS || isSafari;
    
    if (import.meta.env.DEV) {
      console.log(`🔍 iPad Safari detection: iOS=${isIOS}, Safari=${isSafari}, Touch optimization=${isWebkitRef.current}`);
    }
  }, []);

  // perfect-freehand 옵션 설정
  const getStrokeOptions = useCallback((inputType: string = 'mouse') => {
    const baseOptions = {
      size: penWidth * 2,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      easing: (t: number) => t,
      start: {
        taper: 0,
        easing: (t: number) => t,
        cap: true
      },
      end: {
        taper: 100,
        easing: (t: number) => t,
        cap: true
      }
    };

    // 입력 타입에 따른 최적화
    if (inputType === 'pen') {
      return {
        ...baseOptions,
        thinning: 0.7, // 펜 입력 시 더 강한 압력 감도
        smoothing: 0.3, // 더 정밀한 입력
        streamline: 0.3
      };
    } else if (inputType === 'touch') {
      return {
        ...baseOptions,
        thinning: 0.4, // 터치 입력 시 약한 압력 감도
        smoothing: 0.7, // 더 부드러운 곡선
        streamline: 0.7,
        size: penWidth * 2.5 // 터치 시 약간 더 굵게
      };
    }

    return baseOptions;
  }, [penWidth]);



  // Canvas 2D 패스로 스트로크 그리기
  const drawStrokeToCanvas = useCallback((ctx: CanvasRenderingContext2D, stroke: number[][], color: string) => {
    if (stroke.length < 2) return;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();

    const [firstPoint] = stroke;
    ctx.moveTo(firstPoint[0], firstPoint[1]);

    for (let i = 1; i < stroke.length; i++) {
      const [x, y] = stroke[i];
      const [prevX, prevY] = stroke[i - 1];
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;
      ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  // 자동 도구 전환 기능
  const scheduleAutoSwitch = useCallback(() => {
    // 기존 타이머가 있으면 취소
    if (autoSwitchTimeoutRef.current) {
      clearTimeout(autoSwitchTimeoutRef.current);
      autoSwitchTimeoutRef.current = null;
    }
    
    // 자동 전환이 비활성화되었으면 리턴
    if (!settings?.admin?.autoToolSwitch) {
      return;
    }
    
    // 2초 후 select 도구로 전환
    autoSwitchTimeoutRef.current = setTimeout(() => {
      setCurrentTool('select');
      autoSwitchTimeoutRef.current = null;
    }, 2000);
  }, [settings?.admin?.autoToolSwitch, setCurrentTool]);

  // Canvas 초기화
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const newWidth = parent.offsetWidth;
    const newHeight = parent.offsetHeight;
    
    // 크기가 변경되었을 때만 업데이트
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      if (import.meta.env.DEV) {
        console.log(`🎨 Canvas initialized: ${newWidth}x${newHeight}`);
      }
      
      // 캔버스 크기 변경 후 렌더링 예약
      if (!renderQueueRef.current) {
        renderQueueRef.current = true;
        requestAnimationFrame(() => {
          if (renderQueueRef.current && !isLoading) {
            renderAll();
            renderQueueRef.current = false;
          }
        });
      }
    }
  }, [isLoading]);

  // 좌표 변환
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2160;
    const y = ((clientY - rect.top) / rect.height) * 3840;
    
    return { x, y };
  }, []);

  // 화면 좌표로 변환
  const toScreenCoords = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: (x / 2160) * canvas.width,
      y: (y / 3840) * canvas.height
    };
  }, []);

  // 지우개 기능
  const eraseAtPoint = useCallback(async (x: number, y: number) => {
    const eraserRadius = 20;
    
    for (const stroke of drawObjects) {
      for (let i = 0; i < stroke.points.length; i += 2) {
        const distance = Math.sqrt(
          (stroke.points[i] - x) ** 2 + 
          (stroke.points[i + 1] - y) ** 2
        );
        
        if (distance <= eraserRadius) {
          try {
            const strokeRef = ref(database, `drawObjects/${stroke.id}`);
            await remove(strokeRef);
            return;
          } catch (error) {
            console.error('❌ DrawLayer: Failed to erase stroke:', error);
          }
        }
      }
    }
  }, [drawObjects]);

  // 전체 렌더링
  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ DrawLayer: Canvas ref not available');
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ DrawLayer: Canvas context not available');
      }
      return;
    }

    // 캔버스가 초기화되지 않았으면 대기
    if (canvas.width === 0 || canvas.height === 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ DrawLayer: Canvas not initialized, deferring render');
      }
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let renderedStrokes = 0;

    // 저장된 스트로크 렌더링
    drawObjects.forEach(stroke => {
      if (stroke.points.length < 4) return;
      
      if (usePerfectFreehand && stroke.usePerfectFreehand) {
        // perfect-freehand를 사용한 렌더링
        try {
          const pressurePoints = [];
          for (let i = 0; i < stroke.points.length; i += 2) {
            const screenCoords = toScreenCoords(stroke.points[i], stroke.points[i + 1]);
            pressurePoints.push([
              screenCoords.x, 
              screenCoords.y, 
              stroke.pressure?.[i / 2] || 0.5
            ]);
          }
          
          if (pressurePoints.length >= 2) {
            const strokeOptions = getStrokeOptions(stroke.inputType || 'mouse');
            strokeOptions.size = stroke.width * 2;
            const pathData = getStroke(pressurePoints, strokeOptions);
            drawStrokeToCanvas(ctx, pathData, stroke.color);
          }
        } catch (error) {
          console.warn('🚫 perfect-freehand 렌더링 실패, 기본 렌더링으로 대체:', error);
          // 기본 렌더링으로 대체
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width;
          
          const startCoords = toScreenCoords(stroke.points[0], stroke.points[1]);
          ctx.moveTo(startCoords.x, startCoords.y);
          
          for (let i = 2; i < stroke.points.length; i += 2) {
            const coords = toScreenCoords(stroke.points[i], stroke.points[i + 1]);
            ctx.lineTo(coords.x, coords.y);
          }
          
          ctx.stroke();
        }
      } else {
        // 기본 렌더링 방식
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        
        const startCoords = toScreenCoords(stroke.points[0], stroke.points[1]);
        ctx.moveTo(startCoords.x, startCoords.y);
        
        for (let i = 2; i < stroke.points.length; i += 2) {
          const coords = toScreenCoords(stroke.points[i], stroke.points[i + 1]);
          ctx.lineTo(coords.x, coords.y);
        }
        
        ctx.stroke();
      }
      
      renderedStrokes++;
    });

    // 현재 스트로크 렌더링
    if (isDrawing && currentStroke.length >= 4) {
      if (usePerfectFreehand && currentPressureStroke.length >= 2) {
        // perfect-freehand를 사용한 실시간 렌더링
        try {
          const screenPoints = currentPressureStroke.map(point => {
            const screenCoords = toScreenCoords(point.x, point.y);
            return [screenCoords.x, screenCoords.y, point.pressure || 0.5];
          });
          
          const inputType = activePointerRef.current ? 
            (isWebkitRef.current ? 'touch' : 'mouse') : 'mouse';
          const strokeOptions = getStrokeOptions(inputType);
          const pathData = getStroke(screenPoints, strokeOptions);
          drawStrokeToCanvas(ctx, pathData, penColor);
        } catch (error) {
          console.warn('🚫 현재 스트로크 perfect-freehand 렌더링 실패:', error);
          // 기본 렌더링으로 대체
          ctx.beginPath();
          ctx.strokeStyle = penColor;
          ctx.lineWidth = penWidth;
          
          const startCoords = toScreenCoords(currentStroke[0], currentStroke[1]);
          ctx.moveTo(startCoords.x, startCoords.y);
          
          for (let i = 2; i < currentStroke.length; i += 2) {
            const coords = toScreenCoords(currentStroke[i], currentStroke[i + 1]);
            ctx.lineTo(coords.x, coords.y);
          }
          
          ctx.stroke();
        }
      } else {
        // 기본 렌더링 방식
        ctx.beginPath();
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
        
        const startCoords = toScreenCoords(currentStroke[0], currentStroke[1]);
        ctx.moveTo(startCoords.x, startCoords.y);
        
        for (let i = 2; i < currentStroke.length; i += 2) {
          const coords = toScreenCoords(currentStroke[i], currentStroke[i + 1]);
          ctx.lineTo(coords.x, coords.y);
        }
        
        ctx.stroke();
      }
    }

    // 첫 렌더링 시에만 로그 출력 (개발 환경)
    if (!isLoading && renderedStrokes > 0 && import.meta.env.DEV) {
      console.log(`🖌️ DrawLayer: Rendered ${renderedStrokes} strokes`);
    }
  }, [drawObjects, currentStroke, currentPressureStroke, isDrawing, penColor, penWidth, usePerfectFreehand, toScreenCoords, isLoading, getStrokeOptions, drawStrokeToCanvas]);

  // 입력 타입 검증 함수 (iPhone Safari 호환성 개선)
  const isValidInputType = useCallback((e: React.PointerEvent) => {
    // iPhone/iPad 구분하여 다른 로직 적용
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPhone = /iphone/.test(userAgent);
    const isIPad = /ipad/.test(userAgent);
    
    if (isWebkitRef.current) {
      // iPhone에서는 터치 입력 허용 (Apple Pencil 없이도 필기 가능)
      if (isIPhone) {
        // iPhone은 모든 입력 허용 (터치로도 필기 가능)
        return true;
      }
      
      // iPad에서만 엄격한 입력 제한 적용
      if (isIPad) {
        // 지우개는 펜과 터치 모두 허용하지만 펜 우선
        if (currentTool === 'eraser') {
          // 이미 펜이 활성화되어 있으면 터치 무시
          if (activePointerRef.current !== null && e.pointerType === 'touch') {
            if (import.meta.env.DEV) {
              console.log(`🚫 iPad: Rejecting ${e.pointerType} input (pen already active)`);
            }
            return false;
          }
        }
        
        // 펜 도구의 경우: 펜 입력이 우선이지만 터치도 허용 (iPad 호환성)
        if (currentTool === 'pen' && e.pointerType !== 'pen' && e.pointerType !== 'touch' && e.pointerType !== 'mouse') {
          if (import.meta.env.DEV) {
            console.log(`🚫 iPad: Rejecting ${e.pointerType} input for pen tool`);
          }
          return false;
        }
      }
    }
    
    return true;
  }, [currentTool]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (currentTool !== 'pen' && currentTool !== 'eraser') return;
    
    // 웹킷에서 입력 타입 검증 (iPhone에서는 더 관대하게)
    if (!isValidInputType(e)) {
      return;
    }
    
    // iPhone에서는 더 관대한 포인터 관리 (끊김 방지)
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPhone = /iphone/.test(userAgent);
    
    // iPhone이 아닌 경우에만 엄격한 포인터 ID 체크
    if (!isIPhone && activePointerRef.current !== null && activePointerRef.current !== e.pointerId) {
      return;
    }
    
    // iPhone에서는 preventDefault를 조건부로 적용
    if (!isIPhone || e.pointerType !== 'touch') {
      e.preventDefault();
    }
    e.stopPropagation();
    
    // 활성 포인터 설정
    activePointerRef.current = e.pointerId;
    
    // 기존 자동 전환 타이머 취소 (새로운 액션 시작)
    if (autoSwitchTimeoutRef.current) {
      clearTimeout(autoSwitchTimeoutRef.current);
      autoSwitchTimeoutRef.current = null;
    }
    
    // 터치 거부 타이머 해제
    if (touchRejectTimeoutRef.current) {
      clearTimeout(touchRejectTimeoutRef.current);
      touchRejectTimeoutRef.current = null;
    }
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (currentTool === 'pen') {
      startStroke();
      
      // 압력과 기울기 데이터 추출 (iPhone에서는 기본값 사용)
      const pressure = e.pressure || (isIPhone ? 0.7 : 0.5); // iPhone 터치는 약간 더 강하게
      const tiltX = e.tiltX || 0;
      const tiltY = e.tiltY || 0;
      
      addPoint(coords.x, coords.y, pressure, tiltX, tiltY);
      renderAll();
      
      if (import.meta.env.DEV && isIPhone) {
        console.log(`📱 iPhone: Pen stroke started with ${e.pointerType} at (${coords.x}, ${coords.y})`);
      }
    } else if (currentTool === 'eraser') {
      // 지우개 드래그 시작
      isErasingRef.current = true;
      eraseAtPoint(coords.x, coords.y);
      
      if (import.meta.env.DEV && isIPhone) {
        console.log(`📱 iPhone: Eraser started with ${e.pointerType} at (${coords.x}, ${coords.y})`);
      }
    }
    
    if (import.meta.env.DEV) {
      console.log(`✏️ Drawing started with ${e.pointerType} (ID: ${e.pointerId})`);
    }
  }, [currentTool, getCanvasCoordinates, startStroke, addPoint, renderAll, eraseAtPoint, isValidInputType]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // iPhone에서는 더 관대한 포인터 관리 (끊김 방지)
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPhone = /iphone/.test(userAgent);
    
    // iPhone이 아닌 경우에만 엄격한 포인터 ID 체크
    if (!isIPhone && activePointerRef.current !== e.pointerId) {
      return;
    }
    
    if (currentTool === 'pen' && isDrawing) {
      e.preventDefault();
      
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      
      // 압력과 기울기 데이터 추출
      const pressure = e.pressure || 0.5;
      const tiltX = e.tiltX || 0;
      const tiltY = e.tiltY || 0;
      
      addPoint(coords.x, coords.y, pressure, tiltX, tiltY);
      renderAll();
    } else if (currentTool === 'eraser' && isErasingRef.current) {
      // 지우개는 드래그 중일 때만 작동
      e.preventDefault();
      
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      eraseAtPoint(coords.x, coords.y);
    }
  }, [isDrawing, currentTool, getCanvasCoordinates, addPoint, renderAll, eraseAtPoint]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    // iPhone에서는 더 관대한 포인터 관리
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPhone = /iphone/.test(userAgent);
    
    // iPhone이 아닌 경우에만 엄격한 포인터 ID 체크
    if (!isIPhone && activePointerRef.current !== e.pointerId) {
      return;
    }
    
    // 필기 도구 처리
    if (isDrawing && currentTool === 'pen') {
      endStroke();
      
      if (currentStroke.length >= 4) {
        // 입력 타입 결정
        const inputType: 'pen' | 'touch' | 'mouse' = e.pointerType === 'pen' ? 'pen' : 
                         e.pointerType === 'touch' ? 'touch' : 'mouse';
        
        // 압력 데이터 추출
        const pressureData = currentPressureStroke.map(point => point.pressure || 0.5);
        
        const drawObject = {
          points: currentStroke,
          color: penColor,
          width: penWidth,
          createdAt: new Date().toISOString(),
          lastModified: Date.now(),
          // perfect-freehand 관련 데이터
          usePerfectFreehand: usePerfectFreehand,
          pressure: pressureData,
          inputType: inputType
        };

        try {
          await lwwCreateDrawObject(drawObject);
          if (import.meta.env.DEV) {
            console.log(`✏️ Stroke saved: ${inputType} input, ${pressureData.length} points, perfect-freehand: ${usePerfectFreehand}`);
          }
        } catch (error) {
          console.error('❌ DrawLayer: Failed to save stroke:', error);
        }
      }
      
      clearCurrentStroke();
      renderAll();
      
      // 필기 완료 후 자동 전환 스케줄링
      scheduleAutoSwitch();
    }
    
    // 지우개 드래그 종료
    if (currentTool === 'eraser' && isErasingRef.current) {
      isErasingRef.current = false;
      
      // 지우개 완료 후 자동 전환 스케줄링
      scheduleAutoSwitch();
    }
    
    // 활성 포인터 해제
    activePointerRef.current = null;
    
    // 웹킷에서 터치 입력 후 잠시 대기 (펜 입력과의 충돌 방지)
    if (isWebkitRef.current && e.pointerType === 'touch') {
      touchRejectTimeoutRef.current = setTimeout(() => {
        touchRejectTimeoutRef.current = null;
      }, 100);
    }
    
    if (import.meta.env.DEV) {
      console.log(`✏️ Drawing ended with ${e.pointerType} (ID: ${e.pointerId})`);
    }
  }, [isDrawing, currentTool, currentStroke, endStroke, penColor, penWidth, clearCurrentStroke, renderAll, scheduleAutoSwitch]);

  // 포인터 캔셀 핸들러 (예: 다른 앱으로 전환, 시스템 제스처 등)
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    // 활성 포인터가 아니면 무시
    if (activePointerRef.current !== e.pointerId) {
      return;
    }
    
    // 그리기 취소
    if (isDrawing) {
      endStroke();
      clearCurrentStroke();
      renderAll();
    }
    
    // 지우개 취소
    if (isErasingRef.current) {
      isErasingRef.current = false;
    }
    
    // 활성 포인터 해제
    activePointerRef.current = null;
    
    if (import.meta.env.DEV) {
      console.log(`🚫 Drawing cancelled with ${e.pointerType} (ID: ${e.pointerId})`);
    }
  }, [isDrawing, endStroke, clearCurrentStroke, renderAll]);

  useEffect(() => {
    // 초기 캔버스 설정
    initializeCanvas();
    
    const handleResize = () => {
      setTimeout(initializeCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas]);

  // 데이터 로딩 완료 후 렌더링
  useEffect(() => {
    if (!isLoading) {
      // 로딩 완료 후 약간 지연을 두고 렌더링
      const timeoutId = setTimeout(() => {
        renderAll();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // drawObjects 변경 시 실시간 렌더링 (로딩 중이 아닐 때만)
  useEffect(() => {
    if (!isLoading) {
      renderAll();
    }
  }, [drawObjects, isLoading]);

  // 도구 변경 시 자동 전환 타이머 리셋 (필기↔지우개 전환 시)
  useEffect(() => {
    // 필기나 지우개 도구로 변경될 때 기존 자동 전환 타이머 취소
    if ((currentTool === 'pen' || currentTool === 'eraser') && autoSwitchTimeoutRef.current) {
      clearTimeout(autoSwitchTimeoutRef.current);
      autoSwitchTimeoutRef.current = null;
      
      if (import.meta.env.DEV) {
        console.log(`🔄 자동 선택 타이머 리셋됨: ${currentTool} 도구로 변경`);
      }
    }
  }, [currentTool]);

  // 현재 스트로크 변경 시 실시간 렌더링
  useEffect(() => {
    if (isDrawing) {
      renderAll();
    }
  }, [currentStroke, isDrawing]);

  useEffect(() => {
    return () => {
      if (autoSwitchTimeoutRef.current) {
        clearTimeout(autoSwitchTimeoutRef.current);
        autoSwitchTimeoutRef.current = null;
      }
      
      if (touchRejectTimeoutRef.current) {
        clearTimeout(touchRejectTimeoutRef.current);
        touchRejectTimeoutRef.current = null;
      }
      
      // 활성 포인터 초기화
      activePointerRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      onPointerDown={currentTool === 'pen' || currentTool === 'eraser' ? handlePointerDown : undefined}
      onPointerMove={currentTool === 'pen' || currentTool === 'eraser' ? handlePointerMove : undefined}
      onPointerUp={currentTool === 'pen' || currentTool === 'eraser' ? handlePointerUp : undefined}
      onPointerCancel={currentTool === 'pen' || currentTool === 'eraser' ? handlePointerCancel : undefined}
      onPointerLeave={currentTool === 'pen' || currentTool === 'eraser' ? handlePointerUp : undefined}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
        cursor: currentTool === 'pen' ? 'crosshair' : currentTool === 'eraser' ? 'grab' : 'default',
        pointerEvents: (currentTool === 'pen' || currentTool === 'eraser') ? 'auto' : 'none',
        // 웹킷 특화 스타일
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    />
  );
};

export default DrawLayer;
