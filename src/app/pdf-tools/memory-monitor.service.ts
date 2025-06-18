import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MemoryMonitorService {
  
  /**
   * Get current memory usage information
   */
  getMemoryInfo(): any {
    const memoryInfo = (performance as any).memory;
    if (!memoryInfo) {
      return null;
    }

    return {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      usedMB: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
      limitMB: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024),
      usagePercentage: Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)
    };
  }

  /**
   * Check if memory usage is approaching dangerous levels
   */
  isMemoryHigh(): boolean {
    const info = this.getMemoryInfo();
    if (!info) return false;
    
    return info.usagePercentage > 70; // Alert if over 70% memory usage
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): void {
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Alternative method to encourage GC
    try {
      const trigger = new Array(1000).fill(new Array(1000).fill(0));
      trigger.length = 0;
    } catch {}
  }

  /**
   * Log current memory usage
   */
  logMemoryUsage(context?: string): void {
    const info = this.getMemoryInfo();
    if (info) {
      const prefix = context ? `[${context}]` : '[Memory]';
      console.log(`${prefix} Used: ${info.usedMB}MB / ${info.limitMB}MB (${info.usagePercentage}%)`);
      
      if (info.usagePercentage > 80) {
        console.warn(`${prefix} HIGH MEMORY USAGE WARNING - Consider clearing resources`);
      }
    }
  }

  /**
   * Monitor memory usage with automatic cleanup suggestions
   */
  startMemoryMonitoring(intervalMs: number = 10000): () => void {
    const interval = setInterval(() => {
      const info = this.getMemoryInfo();
      if (info && info.usagePercentage > 75) {
        console.warn(`Memory usage high: ${info.usedMB}MB (${info.usagePercentage}%)`);
        
        if (info.usagePercentage > 85) {
          console.error('Critical memory usage! Consider:\n' +
            '• Closing unused PDF documents\n' +
            '• Processing fewer pages at once\n' +
            '• Refreshing the page to clear memory');
        }
      }
    }, intervalMs);

    // Return function to stop monitoring
    return () => clearInterval(interval);
  }
}