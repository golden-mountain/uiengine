import _ from 'lodash'

import {
  ICache,
  ICacheBlock,
  ICachePiece,
  ICacheSetOption,
  ICacheGetOption,
  ICacheClearOption,
  IUINode,
} from '../../typings'

export class Cache {
  static cache: ICache = {
    dataSchema: {},
    data: {},
    layoutSchema: {},
    layoutNode: {}
  }

  static setCache = (
    cacheType: string,
    uniqueId: string,
    data: any,
    options?: ICacheSetOption,
  ) => {
    const wholeCache = Cache.cache
    if (_.isString(cacheType) && cacheType) {
      let cacheBlock = wholeCache[cacheType]
      if (_.isNil(cacheBlock)) {
        wholeCache[cacheType] = {}
        cacheBlock = wholeCache[cacheType]
      }

      if (_.isString(uniqueId) && uniqueId) {
        let cachePiece = cacheBlock[uniqueId]
        if (_.isNil(cachePiece)) {
          cacheBlock[uniqueId] = {}
          cachePiece = cacheBlock[uniqueId]
        }

        let cToken: string | undefined
        if (_.isObject(options)) {
          const { cacheKey, defaultValue } = options
          if (_.isString(cacheKey) && cacheKey) {
            cToken = cacheKey
          }
          if (defaultValue !== undefined) {
            cachePiece.defaultValue = defaultValue
          }
        }

        if (!_.isNil(cToken)) {
          let subPieces = cachePiece.subPieces
          if (_.isNil(subPieces)) {
            cachePiece.subPieces = {}
            subPieces = cachePiece.subPieces
          }

          if (!_.isNil(subPieces)) {
            subPieces[cToken] = data
          }
        } else {
          cachePiece.data = data
        }

      } else {
        console.warn(`Cache id is invalid, so the data may be lost.`)
      }
    } else {
      console.warn(`Cache type is invalid, so the data may be lost.`)
    }
  }
  static getCache(
    cacheType: string,
    uniqueId?: string,
    options?: ICacheGetOption,
  ) {
    const wholeCache = Cache.cache
    if (_.isString(cacheType) && cacheType) {
      let cacheBlock = wholeCache[cacheType]
      if (_.isNil(cacheBlock)) {
        return undefined
      }

      if (_.isString(uniqueId) && uniqueId) {
        let cachePiece = cacheBlock[uniqueId]
        if (_.isNil(cachePiece)) {
          return undefined
        }

        let returnWhole = false
        let cToken: string | undefined
        if (_.isObject(options)) {
          const { cacheKey, allCacheKeys } = options
          if (allCacheKeys === true) {
            returnWhole = true
          } else if (_.isString(cacheKey) && cacheKey) {
            cToken = cacheKey
          }
        }

        if (returnWhole) {
          return cachePiece.subPieces
        } else if (!_.isNil(cToken)) {
          let subPieces = cachePiece.subPieces
          if (_.isNil(subPieces)) {
            return undefined
          } else {
            return subPieces[cToken] || cachePiece.defaultValue
          }
        } else {
          return cachePiece.data || cachePiece.defaultValue
        }

      } else {
        return cacheBlock
      }
    } else {
      console.warn(`Cache type is invalid, so can't get cache data.`)
    }

    return undefined
  }
  static clearCache = (
    cacheType: string,
    uniqueId: string,
    options?: ICacheClearOption,
  ) => {
    const wholeCache = Cache.cache
    if (_.isString(cacheType) && cacheType) {
      let cacheBlock = wholeCache[cacheType]
      if (_.isNil(cacheBlock)) {
        return
      }

      if (_.isString(uniqueId) && uniqueId) {
        let cachePiece = cacheBlock[uniqueId]
        if (_.isNil(cachePiece)) {
          return
        }

        let cToken: string | undefined
        if (_.isObject(options)) {
          const { cacheKey } = options
          if (_.isString(cacheKey) && cacheKey) {
            cToken = cacheKey
          }
        }

        if (!_.isNil(cToken)) {
          let subPieces = cachePiece.subPieces
          if (_.isNil(subPieces)) {
            return
          } else {
            delete subPieces[cToken]
          }
        } else {
          delete cacheBlock[uniqueId]
        }

      } else {
        console.warn(`Cache id is invalid, so can't find cache data to clear.`)
      }
    } else {
      console.warn(`Cache type is invalid, so can't find cache data to clear.`)
    }
  }

  static setDataSchema(
    uniqueId: string,
    schema: any,
    options?: ICacheSetOption,
  ) {
    Cache.setCache('dataSchema', uniqueId, schema, options)
  }
  static getDataSchema(
    uniqueId?: string,
    options?: ICacheGetOption,
  ) {
    return Cache.getCache('dataSchema', uniqueId, options)
  }
  static clearDataSchema(
    uniqueId: string,
    options?: ICacheClearOption,
  ) {
    Cache.clearCache('dataSchema', uniqueId, options)
  }

  static setData(
    uniqueId: string,
    data: any,
    options?: ICacheSetOption,
  ) {
    Cache.setCache('data', uniqueId, data, options)
  }
  static getData(
    uniqueId?: string,
    options?: ICacheGetOption,
  ) {
    return Cache.getCache('data', uniqueId, options)
  }
  static clearData(
    uniqueId: string,
    options?: ICacheClearOption,
  ) {
    Cache.clearCache('data', uniqueId, options)
  }

  static setLayoutSchema(
    uniqueId: string,
    schema: any,
    options?: ICacheSetOption,
  ) {
    Cache.setCache('layoutSchema', uniqueId, schema, options)
  }
  static getLayoutSchema(
    uniqueId?: string,
    options?: ICacheGetOption,
  ) {
    return Cache.getCache('layoutSchema', uniqueId, options)
  }
  static clearLayoutSchema(
    uniqueId: string,
    options?: ICacheClearOption,
  ) {
    Cache.clearCache('layoutSchema', uniqueId, options)
  }

  static setLayoutNode(
    uniqueId: string,
    node: any,
    options?: ICacheSetOption,
  ) {
    Cache.setCache('layoutNode', uniqueId, node, options)
  }
  static getLayoutNode(
    uniqueId?: string,
    options?: ICacheGetOption,
  ) {
    return Cache.getCache('layoutNode', uniqueId, options)
  }
  static clearLayoutNode(
    uniqueId: string,
    options?: ICacheClearOption,
  ) {
    Cache.clearCache('layoutNode', uniqueId, options)
  }
}

export default Cache
