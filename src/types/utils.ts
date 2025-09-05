/**
 * 유틸리티 타입 정의
 */

// 객체의 특정 키를 필수로 만드는 타입
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 객체의 특정 키를 선택적으로 만드는 타입
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 깊은 Partial 타입
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 깊은 Required 타입
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// 함수 타입 가드
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// 배열에서 null/undefined 제거
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isDefined);
}

// 객체 키의 타입 안전성 보장
export function getObjectKeys<T extends Record<string, any>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

// 안전한 JSON 파싱
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// 숫자 범위 체크
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 문자열이 비어있지 않은지 확인
export function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// 배열이 비어있지 않은지 확인
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

// Promise 에러 핸들링 래퍼
export async function safeAsync<T>(
  promise: Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    console.error('Async operation failed:', error);
    return fallback;
  }
}

// 디바운스 타입
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

// 컴포넌트 props에서 ref 제외
export type WithoutRef<T> = Omit<T, 'ref'>;

// 이벤트 핸들러 타입
export type EventHandler<T = Element, E = Event> = (event: E & { currentTarget: T }) => void;

// CSS 스타일 객체 타입
export type CSSProperties = React.CSSProperties;

// 조건부 타입 - 조건에 따라 다른 타입 반환
export type ConditionalType<T, Condition, TrueType, FalseType> = 
  T extends Condition ? TrueType : FalseType; 