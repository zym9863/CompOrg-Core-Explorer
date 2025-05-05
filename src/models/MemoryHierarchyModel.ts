// Memory Hierarchy Model Definition

// Memory Component Types
export enum MemoryComponentType {
  CPU = 'CPU',
  CACHE = 'CACHE',
  MAIN_MEMORY = 'MAIN_MEMORY'
}

// Memory Operation Types
export enum MemoryOperationType {
  READ = 'READ',
  WRITE = 'WRITE'
}

// Memory Access Result
export enum MemoryAccessResult {
  HIT = 'HIT',
  MISS = 'MISS'
}

// Memory Access Stage
export enum MemoryAccessStage {
  IDLE = 'IDLE',
  CPU_REQUEST = 'CPU_REQUEST',
  CHECK_CACHE = 'CHECK_CACHE',
  ACCESS_MAIN_MEMORY = 'ACCESS_MAIN_MEMORY',
  UPDATE_CACHE = 'UPDATE_CACHE',
  RETURN_DATA = 'RETURN_DATA',
  COMPLETE = 'COMPLETE'
}

// Data Flow Direction
export enum MemoryDataFlowDirection {
  CPU_TO_CACHE = 'CPU_TO_CACHE',
  CACHE_TO_CPU = 'CACHE_TO_CPU',
  CACHE_TO_MAIN_MEMORY = 'CACHE_TO_MAIN_MEMORY',
  MAIN_MEMORY_TO_CACHE = 'MAIN_MEMORY_TO_CACHE'
}

// Cache Entry
export interface CacheEntry {
  valid: boolean;
  tag: number;
  data: number;
  address: number;
}

// Memory Access Operation
export interface MemoryAccessOperation {
  type: MemoryOperationType;
  address: number;
  data?: number; // For write operations
}

// Memory Hierarchy State
export interface MemoryHierarchyState {
  currentStage: MemoryAccessStage;
  activeComponents: MemoryComponentType[];
  activeDataFlows: MemoryDataFlowDirection[];
  currentOperation: MemoryAccessOperation | null;
  accessResult: MemoryAccessResult | null;
  cache: CacheEntry[];
  mainMemory: Record<number, number>;
  cpuRegister: number | null;
  cacheSize: number;
  cacheHits: number;
  cacheMisses: number;
}

// Initial Memory Hierarchy State
export const initialMemoryHierarchyState: MemoryHierarchyState = {
  currentStage: MemoryAccessStage.IDLE,
  activeComponents: [],
  activeDataFlows: [],
  currentOperation: null,
  accessResult: null,
  cache: Array(4).fill(null).map(() => ({
    valid: false,
    tag: 0,
    data: 0,
    address: 0
  })),
  mainMemory: {
    100: 42,
    101: 55,
    102: 78,
    200: 90,
    201: 65,
    202: 33
  },
  cpuRegister: null,
  cacheSize: 4,
  cacheHits: 0,
  cacheMisses: 0
};

// Helper function to determine if an address is in cache
export const isCacheHit = (cache: CacheEntry[], address: number): number => {
  const index = address % cache.length;
  const tag = Math.floor(address / cache.length);
  
  if (cache[index].valid && cache[index].tag === tag) {
    return index; // Cache hit, return the index
  }
  
  return -1; // Cache miss
};

// Helper function to get cache index for an address
export const getCacheIndex = (address: number, cacheSize: number): number => {
  return address % cacheSize;
};

// Helper function to get cache tag for an address
export const getCacheTag = (address: number, cacheSize: number): number => {
  return Math.floor(address / cacheSize);
};
