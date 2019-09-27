
// Listener interfaces
export interface IListenerConfig {
  name: string
  paramKeys?: Array<string|IListenerParamConfig>
  debugList?: Array<string|IListenerDebugConfig>
  listener: IListener
  weight?: number
  [anyKey: string]: any
}

export interface IListenerParamConfig {
  key: string
  default?: any
}
export interface IListenerDebugConfig {
  lineage: string
  label?: string
}
export type IListener = (
  directParam: IListenerParam,
  helper: IListenerHelper
) => any | Promise<any>

export interface IListenerParam{
  [paramKey: string]: any
}
export interface IListenerHelper {
  getEventName: () => string
  getListenerQueue: () => string[]
  getListenerRecords: () => IListenerRecord[]
}

// Event interfaces
export interface IEventConfig {
  eventName: string
  receiveParams?: string[]
  defaultParams?: IListenerParam
  debugList?: Array<string|IEventDebugConfig>
  target?: string | IEventTargetConfig
  listener: string | IEventListenerConfig | Array<string|IEventListenerConfig>
  resultSolver?: IEventResultSolver
}

export interface IEventDebugConfig {
  lineage: string
  label?: string
}
export interface IEventTargetConfig {
  name?: string
  reference?: object
}
export interface IEventListenerConfig {
  name: string
  adapter?: IListenerParamRouteMap | IListenerParamAdapter
}
export type IListenerParamAdapter = (
  receivedParam: IListenerParam
) => IListenerParam
export interface IListenerParamRouteMap {
  [paramKey: string]: string
}

// Listener Manager interfaces
export interface IListenerMap {
  [listenerName: string]: IListenerConfig
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
    listenerTree: {
      [listenerName: string]: {
        indexes: Array<{ eventIndex: number, listenerIndex: number }>
      }
    }
  }
  indexOffset: number
}
export interface IEventRecord {
  eventName: string
  target?: string | IEventTargetConfig
  queue: string[]
  records: IListenerRecord[]
  originInfo?: { [debugKey: string]: any }
  finialInfo?: { [debugKey: string]: any }
  startNumber?: number
  storeNumber?: number
}
export interface IListenerRecord {
  listenerName: string
  eventRecord: IEventRecord
  originInfo?: { [debugKey: string]: any }
  finialInfo?: { [debugKey: string]: any }
  result: any
}

export type IListenerConflictResolver = (
  listenerA: IListenerConfig,
  listenerB: IListenerConfig,
) => IListenerConfig

export type IEventResultSolver = (
  eventResult: IEventResult,
) => any
export interface IEventResult {
  eventName: string
  target?: string | IEventTargetConfig
  queue: string[]
  results: IListenerResult[]
}
export interface IListenerResult {
  listenerName: string
  result: any
}
export type IEventListener = (
  ...args: any[],
) => IEventResult | any
export interface IEventProps {
  [eventName: string]: IEventListener
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
  | 'listener-tree'
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
  listener?: string | string[]
}
export interface IEventTargetExportTree {
  [targetName: string]: IEventRecord[] | { [eventName:string]: IEventRecord[] }
}
export interface IEventExportTree {
  [eventName: string]: IEventRecord[] | { [targetName:string]: IEventRecord[] }
}
export interface IListenerExportTree {
  [listenerName: string]: IListenerRecord[]
}

export interface IListenerManager {
  loadListeners: (listeners: IListenerConfig | IListenerConfig[], resolver?: IListenerConflictResolver) => boolean
  unloadListeners: (name?: string) => boolean
  getListenerConfig: (name: string) => IListenerMap | IListenerConfig | null

  getStaticEventProps: (events: IEventConfig | IEventConfig[]) => IEventProps
  getDynamicEventListener: (event: IEventConfig) => IEventListener

  resetHistory: (capacity?: number) => void
  setHistoryCapacity: (capacity: number) => boolean
  searchHistoryRecords: (target?: string | IEventTargetConfig, event?: string, exclude?: IEventExportExclude) => IEventRecord[]
  exportHistoryRecords: (options?: IEventExportOption) => IEventRecord[] | IEventTargetExportTree | IEventExportTree | IListenerExportTree
}
