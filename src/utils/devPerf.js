/**
 * Development performance utilities
 * Lightweight wrappers for measuring performance
 */

const marks = new Map();

export const startMark = (label) => {
  if (process.env.NODE_ENV === 'development') {
    const markName = `${label}-start`;
    marks.set(label, performance.now());
    performance.mark(markName);
  }
};

export const endMark = (label) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = marks.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
      marks.delete(label);
      
      const markName = `${label}-end`;
      performance.mark(markName);
      try {
        performance.measure(label, `${label}-start`, markName);
      } catch (e) {
        // Ignore if marks don't exist
      }
    }
  }
};
