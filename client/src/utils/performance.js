export const measurePerformance = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const timing = window.performance.timing;
      const interactive = timing.domInteractive - timing.navigationStart;
      const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
      const complete = timing.domComplete - timing.navigationStart;
      
      console.log(`
        Interactive: ${interactive}ms
        DOMContentLoaded: ${dcl}ms
        Complete: ${complete}ms
      `);
    });
  }
}; 