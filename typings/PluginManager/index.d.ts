import { IErrorInfo } from '../Request'

// Plugin interfaces
export interface IPlugin {
  name: string
  categories?: Array<string|IPluginCategoryConfig>
  scopePaths?: Array<string|IPluginScopeConfig>
  paramKeys?: Array<string|IPluginParamConfig>
  debugList?: Array<string|IPluginDebugConfig>
  execution: IPluginExecution
  priority?: number
  weight?: number
  [anyKey: string]: any
}

export interface IPluginCategoryConfig {
  name: string
  priority?: number
  adapter?: IPluginParamRouteMap | IPluginParamAdapter
}
export interface IPluginScopeConfig {
  path: string
  weight?: number
}
export interface IPluginParamConfig {
  key: string
  default: any
}
export interface IPluginDebugConfig {
  lineage: string
  label?: string
}
export type IPluginExecution = (
  param: IPluginParam,
  helper: IPluginExecutionHelper
) => any | Promise<any>

export interface IPluginParam {
  [paramKey: string]: any
}
export interface IPluginParamRouteMap {
  [paramKey: string]: string
}
export type IPluginParamAdapter = (
  param: any
) => IPluginParam | Promise<IPluginParam>
export interface IPluginExecutionHelper {
  getCallerId: () => string | null
  getCategoryName: () => string | null
  getExecuteQueue: () => string[] | null
  getExecuteRecords: () => IPluginRecord[] | null
}
export interface IPluginExecutionInfo {
  caller?: string
  category?: string
  queue?: Array<string|IPlugin>
  records?: IPluginRecord[]
  [anyKey: string]: any
}

// PluginManager interfaces
export interface IPluginScopeMap {
  global?: IPluginScope
  [scopeName: string]: IPluginScope
}
export interface IPluginScope {
  name: string
  plugins: IPluginCategoryMap
  subScopes?: {
    [subScopeName: string]: IPluginScope
  }
}
export interface IPluginCategoryMap {
  [categoryName: string]: IPluginMap
}
export interface IPluginMap {
  [pluginName: string]: IPlugin
}

export interface IPluginCallerRegistry {
  [callerId: string]: IPluginCallerRegisterInfo
}
export interface IPluginCallerRegisterInfo {
  categories?: string[]
  scopePaths?: string[]
}

export interface IPluginHistory {
  capacity: number
  lastStartNumber: number
  lastStoreNumber: number
  records: IPluginExecuteRecord[]
  indexTree: {
    idTree: {
      [id: string]: {
        indexes: number[]
        categoryTree: {
          [category: string]: {
            indexes: number[]
          }
        }
      }
    }
    categoryTree: {
      [category: string]: {
        indexes: number[]
        idTree: {
          [id: string]: {
            indexes: number[]
          }
        }
      }
    }
  }
  indexOffset: number
}
export interface IPluginExportOption {
  struct?: IPluginExportStruct
  exclude?: IPluginExportExclude
  include?: IPluginExportInclude
  clean?: boolean
}
export type IPluginExportStruct = 'sequence'
  | 'id-tree'
  | 'id-category-tree'
  | 'category-tree'
  | 'category-id-tree'
export type IPluginExportExclude = IPluginExcludeType | Array<IPluginExcludeType>
export type IPluginExcludeType = 'empty-queue'
  | 'non-empty-queue'
  | 'empty-record'
  | 'non-empty-record'
export interface IPluginExportInclude {
  id?: string | string[]
  category?: string | null | Array<string|null>
}
export interface IPluginExportTree {
  [key: string]: IPluginExecuteRecord[] | { [subKey: string]: IPluginExecuteRecord[] }
}

export interface IPluginExecuteRecord {
  id: string
  category: string | null
  queue: string[]
  records: IPluginRecord[]
  startNumber?: number
  storeNumber?: number
}
export interface IPluginRecord {
  pluginName: string
  originInfo?: { [debugKey: string]: any }
  finialInfo?: { [debugKey: string]: any }
  result: any | Promise<any>
}

export type IPluginConflictResolver = (
  pluginA: IPlugin,
  pluginB: IPlugin,
  infor: IPluginConflictInfo
) => IPlugin
export interface IPluginConflictInfo {
  scopePath: string
  category: string
}

export interface IPluginExecuteOption {
  exclude?: string[]
  beforeAll?: string[]
  afterAll?: string[]
  extraInvoker?: IPluginInvoker
  beforeExecute?: IPluginIntercepter
  afterExecute?: IPluginIntercepter
  debugList?: Array<string|IPluginDebugConfig>
}
export type IPluginInvoker = (
  plugins: IPlugin[]
) => IPlugin[]
export type IPluginIntercepter = (
  plugin: IPlugin,
  param: any,
  result: any | Promise<any>
) => IPluginControlInfo
export interface IPluginControlInfo {
  stop?: boolean
  skip?: boolean
}

export interface IPluginExecutionResult {
  status: IPluginExecutionStatus
  errorInfo?: string
  results: IPluginResult[]
}
export type IPluginExecutionStatus = 'COMPLETED' | 'TERMINATED' | 'IN_ERROR'
export interface IPluginResult {
  name: string
  result: any | Promise<any>
}

export interface IPluginManager {
  // load & unload plugins
  loadPlugins: (plugins: IPlugin | IPlugin[], resolver?: IPluginConflictResolver) => boolean
  unloadPlugins: (scopePath?: string, category?: string | string[], name?: string | string[]) => boolean
  getPlugins: (scopePath?: string, category?: string, name?: string) => IPluginScopeMap | IPluginCategoryMap | IPluginMap | IPlugin | null
  // register & unregister callers
  register: (id: string, info?: IPluginCallerRegisterInfo) => boolean
  unregister: (id: string) => boolean
  getRegisterInfo: (id: string) => IPluginCallerRegisterInfo | null
  // get & export history records
  resetHistory: (capacity?: number) => void
  searchHistoryRecords: (id?: string, category?: string, exclude?: IPluginExportExclude) => IPluginExecuteRecord[]
  exportHistoryRecords: (options?: IPluginExportOption) => IPluginExecuteRecord[] | IPluginExportTree
  // execute plugins
  executePlugin: (id: string, plugin: IPlugin, param: any) => Promise<IPluginExecutionResult>
  executePlugins: (id: string, category: string, param: any, options?: IPluginExecuteOption) => Promise<IPluginExecutionResult>
  syncExecutePlugin: (id: string, plugin: IPlugin, param: any) => IPluginExecutionResult
  syncExecutePlugins: (id: string, category: string, param: any, options?: IPluginExecuteOption) => IPluginExecutionResult
}
