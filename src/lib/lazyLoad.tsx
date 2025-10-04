import React from 'react'

// Helper to create a lazy-loaded component with a .preload() method
export function lazyWithPreload(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  const LazyComponent = React.lazy(factory)
  // @ts-ignore - attach preload for convenience
  LazyComponent.preload = factory
  return LazyComponent as React.LazyExoticComponent<any> & { preload?: () => Promise<any> }
}

export default lazyWithPreload
