import React from 'react';

/**
 * 성능 모니터링 유틸리티
 * 개발 환경에서만 작동하며, 프로덕션에서는 no-op 함수가 됩니다.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface PerformanceTimer {
  start: number;
  label: string;
}

class PerformanceMonitor {
  private timers: Map<string, PerformanceTimer> = new Map();

  /**
   * 성능 측정 시작
   */
  start(label: string): void {
    if (!isDevelopment) return;
    
    this.timers.set(label, {
      start: performance.now(),
      label
    });
  }

  /**
   * 성능 측정 종료 및 결과 출력
   */
  end(label: string): number {
    if (!isDevelopment) return 0;
    
    const timer = this.timers.get(label);
    if (!timer) {
      console.warn(`Performance timer '${label}' not found`);
      return 0;
    }

    const duration = performance.now() - timer.start;
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    
    this.timers.delete(label);
    return duration;
  }

  /**
   * 함수 실행 시간 측정
   */
  measure<T>(label: string, fn: () => T): T {
    if (!isDevelopment) return fn();
    
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  /**
   * 비동기 함수 실행 시간 측정
   */
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!isDevelopment) return fn();
    
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }

  /**
   * 메모리 사용량 출력 (Chrome에서만 작동)
   */
  logMemoryUsage(label?: string): void {
    if (!isDevelopment) return;
    
    // @ts-ignore - Chrome specific API
    if (performance.memory) {
      // @ts-ignore
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const used = (usedJSHeapSize / 1024 / 1024).toFixed(2);
      const total = (totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limit = (jsHeapSizeLimit / 1024 / 1024).toFixed(2);
      
      const prefix = label ? `🧠 ${label} - ` : '🧠 ';
      console.log(`${prefix}Memory: ${used}MB / ${total}MB (limit: ${limit}MB)`);
    }
  }

  /**
   * 렌더링 성능 측정을 위한 React 훅
   */
  useRenderPerformance(componentName: string): void {
    if (!isDevelopment) return;
    
    const renderStart = performance.now();
    
    // useEffect는 렌더링 완료 후 실행됨
    React.useEffect(() => {
      const renderTime = performance.now() - renderStart;
      if (renderTime > 16) { // 16ms 이상 걸리면 경고
        console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    });
  }
}

// 전역 인스턴스 생성
export const perf = new PerformanceMonitor();

/**
 * 디바운스된 함수 실행 시간 측정
 */
export function debounceWithPerf<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  label?: string
): T {
  if (!isDevelopment) {
    // 프로덕션에서는 일반 디바운스
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      perf.measure(label || 'Debounced function', () => fn(...args));
    }, delay);
  }) as T;
}

/**
 * 쓰로틀(leading/trailing) + 성능 로깅
 */
export function throttleWithPerf<T extends (...args: any[]) => any>(
  fn: T,
  interval: number,
  label?: string
): T {
  let lastExecMs = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const invoke = (args: Parameters<T>) => {
    if (process.env.NODE_ENV === 'development') {
      perf.measure(label || 'Throttled function', () => fn(...args));
    } else {
      (fn as (...a: Parameters<T>) => unknown)(...args);
    }
  };

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastExecMs);
    lastArgs = args;

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastExecMs = now;
      invoke(args);
    } else if (!timeoutId) {
      // trailing 보장
      timeoutId = setTimeout(() => {
        lastExecMs = Date.now();
        timeoutId = null;
        if (lastArgs) invoke(lastArgs);
      }, remaining);
    }
  }) as T;
}

/**
 * Firebase 호출 성능 측정 래퍼
 */
export {};