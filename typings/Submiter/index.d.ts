import { IObject } from '../Common'
import { IRequest, IRequestConfig } from '../Request'

export interface ISubmitProcess {
  targets: Array<ISubmitTarget | ISubmitProcess>
  mode?: 'async' | 'sync'
  key?: string
}
export interface ISubmitTarget {
  dataSource: string | ISubmitDataConfig
  dataSchema?: string | ISubmitSendConfig
  dependOn?: ISubmitDependConfig
  key?: string
}
export interface ISubmitOption {
  engineId?: string
  layoutKey?: string
  request?: IRequest
  requestGenerator?: (
    targetRecord: ISubmitTargetRecord
  ) => void
  dependResolver?: (
    targetRecord: ISubmitTargetRecord,
    targetRecordMap?: ISubmitRecordMap,
  ) => void
  [otherKey: string]: any
}
export interface ISubmitCallback {
  /**
   * Call this callback when each target is submited successfully
   * @param target the target's config (readonly)
   * @param record the target's record (readonly)
   * @returns void or a Promise which the process will wait for
   */
  onTargetSuccess?: (target: ISubmitTarget, record: ISubmitTargetRecord) => void | Promise
  /**
   * Call this callback when each target failed to submit
   * @param target the target's config (readonly)
   * @param record the target's record (readonly)
   * @returns void or a Promise which the process will wait for
   */
  onTargetFailure?: (target: ISubmitTarget, record: ISubmitTargetRecord) => void | Promise
  /**
   * Call this callback when all the targets/sub-processes of one process finished with success or ignored error
   * @param process the process's config (readonly)
   * @param record the process's record (readonly)
   * @returns void or a Promise which the process will wait for
   */
  onProcessCompleted?: (process: ISubmitProcess, record: ISubmitProcessRecord) => void | Promise
  /**
   * Call this callback when one process failed because some of its targets/sub-processes failed with error
   * @param process the process's config (readonly)
   * @param record the process's record (readonly)
   * @returns void or a Promise which the process will wait for
   */
  onProcessFailed?: (process: ISubmitProcess, record: ISubmitProcessRecord) => void | Promise
  /**
   * Call this callback when one process is terminated by one of its targets/sub-processes
   * @param process the process's config (readonly)
   * @param record the process's record (readonly)
   * @returns void or a Promise which the process will wait for
   */
  onProcessTerminated?: (process: ISubmitProcess, record: ISubmitProcessRecord) => void | Promise
  /**
   * In each async-process, call this callback when any of its targets/sub-processes ends
   * @param asyncProcess the async-process's config (readonly)
   * @param processRecord the async-process's record (readonly)
   * @param tpConfig the target/sub-process's config (readonly)
   * @param tpRecord the target/sub-process's record (readonly)
   * @param helper a helper that supports setProcessErrorInfo() to edit the async-process's record
   * @returns void or a control info that can ignore the failure of current step,
   * or a Promise to wait for them
   */
  asyncController?: (
    asyncProcess: ISubmitProcess,
    processRecord: ISubmitProcessRecord,
    tpConfig: ISubmitTarget | ISubmitProcess,
    tpRecord: ISubmitTargetRecord | ISubmitProcessRecord,
    helper: ISubmitControllerHelper
  ) => void | ISubmitAsyncControlInfo | Promise<void | ISubmitAsyncControlInfo>
  /**
   * In each sync-process, call this callback when one of its targets/sub-processes ends and the next one has not begun
   * @param syncProcess the sync-process's config (readonly)
   * @param processRecord the sync-process's record (readonly)
   * @param tpConfig the target/sub-process's config (readonly)
   * @param tpRecord the target/sub-process's record (readonly)
   * @param helper a helper that supports setProcessErrorInfo() to edit the sync-process's record
   * @returns void or a control info that can ignore the failure of current step or stop the sync-process,
   * or a Promise to wait for them
   */
  syncController?: (
    syncProcess: ISubmitProcess,
    processRecord: ISubmitProcessRecord,
    tpConfig: ISubmitTarget | ISubmitProcess,
    tpRecord: ISubmitTargetRecord | ISubmitProcessRecord,
    helper: ISubmitControllerHelper
  ) => void | ISubmitSyncControlInfo | Promise<void | ISubmitSyncControlInfo>
}

export interface ISubmitDataConfig {
  source: string
  wrappedIn?: string
  exclude?: string | string[]
}
export interface ISubmitSendConfig {
  schema: string
  method?: 'post' | 'put'
  config?: IRequestConfig
}
export interface ISubmitDependConfig {
  [targetKey: string]: {
    [recordKey: string]: string
  }
}

export interface ISubmitRequest {
  method: string
  url: string
  urlParam?: IObject
  payload?: any
  config?: IRequestConfig
  configId?: string
  response?: any
}

export interface ISubmitAsyncControlInfo {
  action?: 'ignore'
}
export interface ISubmitSyncControlInfo {
  action?: 'ignore' | 'stop'
}
export interface ISubmitControllerHelper {
  /**
   * @param info the text of error message
   * @param index the index to edit with the info
   * @returns the index of the info which was edited
   */
  setProcessErrorInfo: (info?: string, index?: number) => number
}

export type ISubmitProcessStatus =
  | 'NORMAL'
  | 'HAS_ERROR'
  | 'HAS_FAILURE'
  | 'TERMINATED'
  | 'COMPLETED'
  | 'FAILED'
export interface ISubmitProcessRecord {
  key?: string
  status: ISubmitProcessStatus
  errorInfo?: string[]
  records: Array<ISubmitTargetRecord | ISubmitProcessRecord>
}
export type ISubmitTargetStatus =
  | 'NORMAL'
  | 'HAS_ERROR'
  | 'SUCCESS'
  | 'FAILURE'
export interface ISubmitTargetRecord {
  key?: string
  status: ISubmitTargetStatus
  errorInfo?: string[]
  record: {
    source?: string
    wrappedIn?: string
    exclude?: string[]
    schema?: string
    method?: string
    config?: IRequestConfig
    dependOn?: ISubmitDependConfig
    engineId?: string
    layoutKey?: string
    requestQueue?: ISubmitRequest[]
    requestMode?: 'async' | 'sync'
    [otherKey: string]: any
  }
}

export interface ISubmitRecordMap {
  [targetKey: string]: ISubmitTargetRecord
}
