export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  
  export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number) {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
          if (lastArgs) {
            fn(...lastArgs);
            lastArgs = null;
          }
        }, limit);
      } else {
        lastArgs = args;
      }
    };
  }