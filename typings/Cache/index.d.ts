
export interface ICache {
  [cacheType: string]: ICacheBlock
}
export interface ICacheBlock {
  [uniqueId: string]: ICachePiece
}
export interface ICachePiece {
  data?: any
  defaultValue?: any
  subPieces?: {
    [cacheKey: string]: any
  }
}

export interface ICacheSetOption {
  cacheKey?: string,
  defaultValue?: any
}
export interface ICacheGetOption {
  cacheKey?: string,
  allCacheKeys?: boolean
}
export interface ICacheClearOption {
  cacheKey?: string,
}
