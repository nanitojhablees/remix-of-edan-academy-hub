import { ComponentType, lazy, LazyExoticComponent } from 'react';

interface LazyComponentModule {
  default: ComponentType<any>;
}

// Enhanced lazy loading with retry mechanism and better error handling
export const lazyWithRetry = (
  importFunc: () => Promise<LazyComponentModule>,
  componentName: string,
  maxRetries = 3
) => {
  return lazy(() => 
    new Promise<LazyComponentModule>((resolve, reject) => {
      let attempts = 0;
      
      const attemptLoad = () => {
        attempts++;
        importFunc()
          .then(resolve)
          .catch((error) => {
            // Log detailed error information
            console.warn(`Retry ${attempts}/${maxRetries} for component: ${componentName}`, {
              error,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            });
            
            if (attempts < maxRetries) {
              // Exponential backoff with jitter
              const delay = Math.min(1000 * Math.pow(2, attempts - 1) + Math.random() * 1000, 10000);
              setTimeout(attemptLoad, delay);
            } else {
              console.error(`Failed to load component ${componentName} after ${maxRetries} attempts:`, {
                error,
                timestamp: new Date().toISOString(),
                stack: error instanceof Error ? error.stack : 'No stack trace'
              });
              // Provide a fallback error component
              reject(new Error(`Failed to load component: ${componentName}. Please refresh the page.`));
            }
          });
      };
      
      attemptLoad();
    })
  );
};

// Preload function for critical components with better error handling
export const preloadComponent = (importFunc: () => Promise<any>) => {
  importFunc().catch((error) => {
    console.warn('Preload failed (this is normal during development):', error);
  });
};

// Enhanced preload with error recovery
export const preloadWithRetry = (
  importFunc: () => Promise<any>,
  componentName: string,
  maxRetries = 2
) => {
  let attempts = 0;
  
  const attemptPreload = () => {
    attempts++;
    importFunc().catch((error) => {
      if (attempts < maxRetries) {
        console.warn(`Preload retry ${attempts}/${maxRetries} for component: ${componentName}`);
        setTimeout(attemptPreload, 500 * attempts);
      } else {
        console.warn(`Preload failed for component: ${componentName} after ${maxRetries} attempts:`, error);
      }
    });
  };
  
  attemptPreload();
};
