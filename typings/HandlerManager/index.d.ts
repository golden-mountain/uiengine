
// Handler interfaces
export interface IHandlerConfig {
  name: string
  paramKeys?: Array<string|IHandlerParamConfig>
  debugList?: Array<string|IHandlerDebugConfig>
  handler: IHandler
  weight?: number
  simpleMode?: boolean
  [anyKey: string]: any
}

export interface IHandlerParamConfig {
  key: string
  default?: any
}
export interface IHandlerDebugConfig {
  lineage: string
  label?: string
}
export type IHandler = (
  directParam: IHandlerParam,
  helper: IHandlerHelper
) => any | Promise<any>

export interface IHandlerParam{
  [paramKey: string]: any
}
export interface IHandlerHelper {
  getEventName: () => string
  getHandlerQueue: () => string[]
  getHandlerRecords: () => IHandlerRecord[]
}

// Event interfaces
export interface IEventConfig {
  eventName: string
  receiveParams?: string[]
  defaultParams?: IHandlerParam
  debugList?: Array<string|IEventDebugConfig>
  target?: string | IEventTargetConfig
  handler: string | IEventHandlerConfig | Array<string|IEventHandlerConfig>
  resultSolver?: IEventResultSolver
  simpleMode?: boolean
  [anyKey: string]: any
}

export interface IEventDebugConfig {
  lineage: string
  label?: string
}
export interface IEventTargetConfig {
  name?: string
  reference?: object
}
export interface IEventHandlerConfig {
  name: string
  adapter?: IHandlerParamRouteMap | IHandlerParamAdapter
}
export type IHandlerParamAdapter = (
  receivedParam: IHandlerParam
) => IHandlerParam
export interface IHandlerParamRouteMap {
  [paramKey: string]: string
}

// Handler Manager interfaces
export interface IHandlerMap {
  [handlerName: string]: IHandlerConfig
}
export interface IEventHistory {
  capacity: number
  lastStartNumber: number
  lastStoreNumber: number
  records: IEventRecord[]
  indexTree: {
    targetTree: {
      [targetName: string]: {
        reference?: object
        indexes: number[]
        eventTree: {
          [eventName: string]: {
            indexes: number[]
          }
        }
      }
    }
    eventTree: {
      [eventName: string]: {
        indexes: number[]
        targetTree: {
          [targetName: string]: {
            reference?: object
            indexes: number[]
          }
        }
      }
    }
    handlerTree: {
      [handlerName: string]: {
        indexes: Array<{ eventIndex: number, handlerIndex: number }>
      }
    }
  }
  indexOffset: number
}
export interface IEventRecord {
  eventName: string
  target?: string | IEventTargetConfig
  queue: string[]
  records: IHandlerRecord[]
  originInfo?: { [debugKey: string]: any }
  finialInfo?: { [debugKey: string]: any }
  startNumber?: number
  storeNumber?: number
}
export interface IHandlerRecord {
  handlerName: string
  eventRecord: IEventRecord
  originInfo?: { [debugKey: string]: any }
  finialInfo?: { [debugKey: string]: any }
  result: any
}

export type IHandlerConflictResolver = (
  handlerA: IHandlerConfig,
  handlerB: IHandlerConfig,
) => IHandlerConfig

export type IEventResultSolver = (
  eventResult: IEventResult,
) => any
export interface IEventResult {
  eventName: string
  target?: string | IEventTargetConfig
  queue: string[]
  results: IHandlerResult[]
}
export interface IHandlerResult {
  handlerName: string
  result: any
}
export type IEventHandler = (
  ...args: any[],
) => IEventResult | any
export interface IEventProps {
  [eventName: string]: IEventHandler
}

export interface IEventExportOption {
  struct?: IEventExportType
  exclude?: IEventExportExclude
  include?: IEventExportInclude
  clean?: boolean
}
export type IEventExportType = 'sequence'
  | 'target-tree'
  | 'target-event-tree'
  | 'event-tree'
  | 'event-target-tree'
  | 'handler-tree'
export interface IEventExportExclude {
  noTarget?: boolean
  hasTarget?: boolean
  emptyQueue?: boolean
  nonEmptyQueue?: boolean
  emptyRecord?: boolean
  nonEmptyRecord?: boolean
}
export interface IEventExportInclude {
  target?: string | IEventTargetConfig | Array<string|IEventTargetConfig>
  event?: string | string[]
  handler?: string | string[]
}
export interface IEventTargetExportTree {
  [targetName: string]: IEventRecord[] | { [eventName:string]: IEventRecord[] }
}
export interface IEventExportTree {
  [eventName: string]: IEventRecord[] | { [targetName:string]: IEventRecord[] }
}
export interface IHandlerExportTree {
  [handlerName: string]: IHandlerRecord[]
}

export interface IHandlerManager {
  loadHandlers: (handlers: IHandlerConfig | IHandlerConfig[], resolver?: IHandlerConflictResolver) => boolean
  unloadHandlers: (name?: string) => boolean
  getHandlerConfig: (name: string) => IHandlerMap | IHandlerConfig | null

  getStaticEventProps: (events: IEventConfig | IEventConfig[], simpleMode?: boolean) => IEventProps
  getDynamicEventHandler: (event: IEventConfig, simpleMode?: boolean) => IEventHandler

  resetHistory: (capacity?: number) => void
  setHistoryCapacity: (capacity: number) => boolean
  searchHistoryRecords: (target?: string | IEventTargetConfig, event?: string, exclude?: IEventExportExclude) => IEventRecord[]
  exportHistoryRecords: (options?: IEventExportOption) => IEventRecord[] | IEventTargetExportTree | IEventExportTree | IHandlerExportTree
}
