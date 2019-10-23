import { INodeProps } from '../UINode'

export interface IConnectOptions {
  source: string // from data source like a.b.c
  target: string // target data source like foo.bar
  options?: {
    clearSource: boolean
    [name: string]: any
  }
  targetSelector?: INodeProps
}

export interface IDataPoolSetOption {
  dataInfo?: IDataPoolInfoConfig | IDataPoolInfoConfig[]
  createPath?: boolean
  createChild?: boolean
}
export interface IDataPoolGetOption {
  content?: 'data' | 'status' | string
  withPath?: boolean
}
export interface IDataPoolClearOption {
  clearDomain?: boolean
}
export interface IDataPoolTransferOption {
  clearSrc?: boolean
  createDst?: boolean
  cloneConfig?: {
    shallowCloneData?: boolean
    deepCloneData?: boolean
    shallowCloneInfo?: boolean
    deepCloneInfo?: boolean
  }
  mergeConfig?: {
    mergeData?: boolean
    mergeInfo?: boolean
  }
}

export interface IDataPoolInfoConfig {
  key: string
  value?: any
  defaultValue?: any
  setDataInfo?: (infoKey: string, handle: IDataPoolHandle) => void
}

export interface IDataPoolConnectObject {
  onDataChange?: (...args: any) => void
  onStatusChange?: (...args: any) => void
  [anyKey: string]: any
}
export interface IDataPoolConnectOption {
  callbackOfData?: string | null
  mapDataToParam?: (prevData: any, nextData: any) => { [paramKey: string]: any } | null | undefined
  callbackOfStatus?: string | null
  mapStatusToParam?: (prevStatus: string, nextStatus: string) => { [paramKey: string]: any } | null | undefined
}

export interface IDataPool {
  set: (path: string, data: any, options?: IDataPoolSetOption) => boolean
  get: (path?: string, options?: IDataPoolGetOption) => any
  clear: (path?: string, options?: IDataPoolClearOption) => void
  transfer: (srcPath: string, dstPath: string, options?: IDataPoolTransferOption) => boolean

  setInfo: (path: string, config: IDataPoolInfoConfig | IDataPoolInfoConfig[]) => boolean
  getInfo: (path: string, key: string | string[]) => any
  clearInfo: (path: string, key?: string | string[]) => void

  connnect: (path: string, object: IDataPoolConnectObject, options?: IDataPoolConnectOption) => void
  disconnect: (path: string, object: IDataPoolConnectObject) => void
}
export interface IDataPoolHandle {
  getRoute: () => string | undefined
  getData: () => any | undefined
  getInfo: (infoKey?: string | string[]) => any
  setInfo: (infoKey: string, value: any) => boolean

  getParent: () => IDataPoolHandle | null
  getChildren: () => { [key: string]: IDataPoolHandle } | IDataPoolHandle[] | null
}
