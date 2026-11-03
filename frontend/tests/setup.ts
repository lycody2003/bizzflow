
import 'fake-indexeddb/auto'

import {
  Blob as NodeBlob,
  File as NodeFile,
} from 'node:buffer'

// Use Node.js native Blob and File implementations.
// This makes structured cloning compatible with fake-indexeddb.
Object.defineProperty(globalThis, 'Blob', {
  value: NodeBlob,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'File', {
  value: NodeFile,
  writable: true,
  configurable: true,
})
