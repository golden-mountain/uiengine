import { IPluginExcludeType } from "../PluginManager"

// Listener interfaces
export interface IListenerConfig {
  name: string
  paramKeys?: Array<string|IListenerParamConfig>
  debugList?: Array<string|IListenerDebugConfig>
  listener: IEventListener
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
export type IEventListener = (
  event: Event,
  param: IListenerParam,
  helper: IListenerHelper
) => any | Promise<any>

export interface IListenerParam{
  [paramKey: string]: any
}
export type IListenerParamAdapter = (
  param: any
) => IListenerParam | Promise<IListenerParam>
export interface IListenerParamRouteMap {
  [paramKey: string]: string
}
export interface IListenerHelper {
  getEventType: () => string
  getListenerQueue: () => string[]
  getListenerRecords: () => IListenerRecord[]
}

// Event interfaces
export interface IEventConfig {
  event: string
  listener: string | IEventListenerConfig | IEventListenerQueue
  param: any
  target?: string | IEventTargetConfig
  debugList?: Array<string|IEventDebugConfig>
}

export type IEventListenerQueue = Array<string|IEventListenerConfig>
export interface IEventListenerConfig {
  name: string
  adapter?: IListenerParamRouteMap | IListenerParamAdapter
}
export interface IEventTargetConfig {
  name: string
  reference?: object
}
export interface IEventDebugConfig {
  lineage: string
  label?: string
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
  eventObject: Event
  target?: string | IEventTargetConfig
  originInfo?: { [debugKey: string]: any }
  finialInfo?: { [debugKey: string]: any }
  queue: string[]
  records: IListenerRecord[]
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

export interface IEventResult {
  eventName: string
  eventObject: Event
  target?: string | IEventTargetConfig
  results: IListenerResult[]
}
export interface IListenerResult {
  listenerName: string
  result: any
}
export interface IEventProps {
  [eventName: string]: (event: Event) => Promise<IEventResult>
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
  getListenerConfig: (name: string) => IListenerConfig | null

  getStaticEventProps: (events: IEventConfig | IEventConfig[]) => IEventProps
  getDynamicEventProps: (events: IEventConfig | IEventConfig[]) => IEventProps

  resetHistory: (capacity?: number) => void
  setHistoryCapacity: (capacity: number) => boolean
  searchHistoryRecords: (target?: string | IEventTargetConfig, event?: string, exclude?: IEventExportExclude) => IEventRecord[]
  exportHistoryRecords: (options?: IEventExportOption) => IEventRecord[] | IEventTargetExportTree | IEventExportTree | IListenerExportTree
}
