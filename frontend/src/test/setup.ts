import { vi } from 'vitest'

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(),
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          getAll: vi.fn(() => []),
        })),
      })),
      close: vi.fn(),
    },
  })),
} as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
