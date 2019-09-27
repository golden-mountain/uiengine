import _ from 'lodash'

import NodeController from '../data-layer/NodeController'
import {
  Cache,
  Request,
  StepProcess,
  DataPool,
  DataEngine,
} from '../helpers'

import {
  IListenerConfig,
  IListener,
  IListenerParam,
  IObject,
  IStepConfig,
  IUINode,
} from '../../typings'

// submit function interfaces
export interface ISubmitProcess {
  key?: string
  targets: Array<ISubmitTarget|ISubmitProcess>
  mode?: 'async' | 'sync'
}
export interface ISubmitTarget {
  key?: string
  dataSource: string | ISubmitDataConfig
  dataSchema?: string | ISubmitSchemaConfig
  dependOn?: string | ISubmitDependConfig
}
export interface ISubmitOption {
  urlParam?: IObject
  envParam?: IObject
  /**
   * Call this callback when each target is submited successfully
   * @param target the target's config (readonly)
   * @param record the target's record (readonly)
   * @returns a Promise or void
   */
  onTargetSuccess?: (
    target: ISubmitTarget,
    record: ISubmitTargetRecord,
  ) => void | Promise<any>
  /**
   * Call this callback when each target failed to submit
   * @param target the target's config (readonly)
   * @param record the target's record (readonly)
   * @returns a Promise or void
   */
  onTargetFailure?: (
    target: ISubmitTarget,
    record: ISubmitTargetRecord,
  ) => void | Promise<any>
  /**
   * Call this callback when all targets/sub-processes of one process are completed with success
   * @param process the process's config (readonly)
   * @param record the process's record (readonly)
   * @returns a Promise or void
   */
  onProcessCompleted?: (
    process: ISubmitProcess,
    record: ISubmitProcessRecord,
  ) => void | Promise<any>
  /**
   * Call this callback when one process failed because some of its targets/sub-processes failed to submit
   * @param process the process's config (readonly)
   * @param record the process's record (readonly)
   * @returns a Promise or void
   */
  onProcessFailed?: (
    process: ISubmitProcess,
    record: ISubmitProcessRecord,
  ) => void | Promise<any>
  /**
   * In each async-process, call this callback when every of its targets/sub-processes ends
   * @param asyncProcess the async-process's config (readonly)
   * @param processRecord the async-process's record (readonly)
   * @param tpConfig the target/sub-process's config (readonly)
   * @param tpRecord the target/sub-process's record (readonly)
   * @param helper a helper supports setProcessErrorInfo() to edit the async-process's record
   * @returns the control info used to ignore the failure of current step, or a Promise of it
   */
  asyncController?: (
    asyncProcess: ISubmitProcess,
    processRecord: ISubmitProcessRecord,
    tpConfig: ISubmitTarget | ISubmitProcess,
    tpRecord: ISubmitTargetRecord | ISubmitProcessRecord,
    helper: ISubmitControllerHelper,
  ) => void | ISubmitAsyncControlInfo | Promise<void|ISubmitAsyncControlInfo>
  /**
   * In each sync-process, call this callback when one of its targets/sub-processes ends and the next one has not begun
   * @param syncProcess the sync-process's config (readonly)
   * @param processRecord the sync-process's record (readonly)
   * @param tpConfig the target/sub-process's config (readonly)
   * @param tpRecord the target/sub-process's record (readonly)
   * @param helper a helper supports setProcessErrorInfo() to edit the sync-process record
   * @returns the control info used to ignore the failure of current step or stop the sync-process, or a Promise of it
   */
  syncController?: (
    syncProcess: ISubmitProcess,
    processRecord: ISubmitProcessRecord,
    tpConfig: ISubmitTarget | ISubmitProcess,
    tpRecord: ISubmitTargetRecord | ISubmitProcessRecord,
    helper: ISubmitControllerHelper,
  ) => void | ISubmitSyncControlInfo | Promise<void|ISubmitSyncControlInfo>
  /**
   * Call this callback when one sync-process is terminated by one of its targets/sub-processes
   * @param process the sync-process's config (readonly)
   * @param record the sync-process's record (readonly)
   * @returns a Promise or void
   */
  onProcessTerminated?: (
    process: ISubmitProcess,
    record: ISubmitProcessRecord,
  ) => void | Promise<void>
}

export interface ISubmitDataConfig {
  source: string
  wrappedIn?: string
  exclude?: string | string[]
}
export interface ISubmitSchemaConfig {
  lineage: string
  method?: 'post' | 'put'
}
export interface ISubmitDependConfig {
  targetKey: string
  dependList?: string[]
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

export interface ISubmitProcessRecord {
  key?: string
  status: ISubmitProcessStatus
  errorInfo?: string[]
  records: Array<ISubmitTargetRecord|ISubmitProcessRecord>
}
export type ISubmitProcessStatus = 'NORMAL'
  | 'HAS_ERROR'
  | 'HAS_FAILURE'
  | 'TERMINATED'
  | 'COMPLETED'
  | 'FAILED'
const SubmitProcessRunStatus = [
  'NORMAL',
  'HAS_ERROR',
  'HAS_FAILURE',
]
const SubmitProcessEndStatus = [
  'TERMINATED',
  'COMPLETED',
  'FAILED',
]
export interface ISubmitTargetRecord {
  key?: string
  status: ISubmitTargetStatus
  errorInfo?: string[]
  response?: any
}
export type ISubmitTargetStatus = 'NORMAL'
  | 'HAS_ERROR'
  | 'SUCCESS'
  | 'FAILURE'
const SubmitTargetRunStatus = [
  'NORMAL',
  'HAS_ERROR',
]
const SubmitTargetEndStatus = [
  'SUCCESS',
  'FAILURE',
]

export interface ITargetRecordMap {
  [targetKey: string]: ISubmitTargetRecord
}

async function submit(
  target: ISubmitProcess | ISubmitTarget,
  options?: ISubmitOption,
) {
  const targetRecordMap: ITargetRecordMap = {}
  if (_.has(target, 'targets')) {
    const processConfig = target as ISubmitProcess
    return await submitProcess(processConfig, options, targetRecordMap)
  } else {
    const targetConfig = target as ISubmitTarget
    return await submitTarget(targetConfig, options, targetRecordMap)
  }
}

async function submitProcess(
  process: ISubmitProcess,
  options?: ISubmitOption,
  targetRecordMap?: ITargetRecordMap,
) {
  const processRecord: ISubmitProcessRecord = {
    status: 'NORMAL',
    errorInfo: [],
    records: []
  }

  if (!_.isNil(process) && _.isObject(process)) {
    const { targets, mode = 'async' } = process

    if (_.isArray(targets) && targets.length > 0) {
      if (mode === 'async') {
        // async submit all targets in the array

        const promises = targets.map(
          async (config: ISubmitTarget | ISubmitProcess, index: number) => {
            if (_.has(config, 'targets')) {
              // it is a sub submit-process with multiple targets
              const pConfig = config as ISubmitProcess
              const pRecord = await submitProcess(pConfig, options, targetRecordMap)

              let ignore: boolean = false
              if (_.isObject(options)) {
                const { asyncController } = options
                if (_.isFunction(asyncController)) {
                  const info = await asyncController(
                    _.cloneDeep(process),
                    _.cloneDeep(processRecord),
                    _.cloneDeep(pConfig),
                    _.cloneDeep(pRecord),
                    {
                      setProcessErrorInfo: setErrorInfo.bind({}, processRecord.errorInfo)
                    },
                  )
                  if (!_.isNil(info) && _.isObject(info) && info.action === 'ignore') {
                    ignore = true
                  }
                }
              }

              processRecord.records[index] = pRecord
              if (pRecord.status === 'FAILED' || pRecord.status === 'TERMINATED') {
                if (!ignore) {
                  processRecord.status = 'HAS_FAILURE'
                }
              } else if (pRecord.status !== 'COMPLETED') {
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    `Found unexpected status "${
                      processRecord.status
                    }" in the sub-process ${
                      pConfig.key || ''
                    } of the process ${
                      process.key || ''
                    }`
                  )
                }
              }
              return pRecord
            } else {
              // it is a single submit-target
              const tConfig = config as ISubmitTarget
              const tRecord = await submitTarget(tConfig, options, targetRecordMap)

              if (!_.isNil(targetRecordMap) && _.isString(tConfig.key)) {
                targetRecordMap[tConfig.key] = tRecord
              }

              let ignore: boolean = false
              if (_.isObject(options)) {
                const { asyncController } = options
                if (_.isFunction(asyncController)) {
                  const info = await asyncController(
                    _.cloneDeep(process),
                    _.cloneDeep(processRecord),
                    _.cloneDeep(tConfig),
                    _.cloneDeep(tRecord),
                    {
                      setProcessErrorInfo: setErrorInfo.bind({}, processRecord.errorInfo)
                    },
                  )
                  if (!_.isNil(info) && _.isObject(info) && info.action === 'ignore') {
                    ignore = true
                  }
                }
              }

              processRecord.records[index] = tRecord
              if (tRecord.status === 'FAILURE') {
                if (!ignore) {
                  processRecord.status = 'HAS_FAILURE'
                }
              } else if (tRecord.status !== 'SUCCESS') {
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    `Found unexpected status "${
                      processRecord.status
                    }" in the target ${
                      tConfig.key || ''
                    } of the process ${
                      process.key || ''
                    }`
                  )
                }
              }
              return tRecord
            }
          }
        )
        // wait for all targets/sub-process
        await Promise.all(promises)

      } else if (mode === 'sync') {
        // sync submit all targets in the array

        for (let index = 0; index < targets.length ; index++) {
          const config = targets[index]

          if (_.has(config, 'targets')) {
            // it is a sub submit-process with multiple targets
            const pConfig = config as ISubmitProcess
            const pRecord = await submitProcess(pConfig, options, targetRecordMap)

            let stop: boolean = false
            let ignore: boolean = false
            if (_.isObject(options)) {
              const { syncController } = options
              if (_.isFunction(syncController)) {
                const info = await syncController(
                  _.cloneDeep(process),
                  _.cloneDeep(processRecord),
                  _.cloneDeep(pConfig),
                  _.cloneDeep(pRecord),
                  {
                    setProcessErrorInfo: setErrorInfo.bind({}, processRecord.errorInfo)
                  },
                )
                if (!_.isNil(info) && _.isObject(info)) {
                  if (info.action === 'stop') {
                    stop = true
                  } else if (info.action === 'ignore') {
                    ignore = true
                  }
                }
              }
            }

            processRecord.records[index] = pRecord
            if (stop) {
              processRecord.status = 'TERMINATED'
              break
            } else {
              if (pRecord.status === 'FAILED') {
                if (!ignore) {
                  processRecord.status = 'HAS_FAILURE'
                  break
                } else {
                  continue
                }
              } else if (pRecord.status === 'TERMINATED') {
                if (!ignore) {
                  processRecord.status = 'TERMINATED'
                  break
                } else {
                  continue
                }
              } else if (pRecord.status !== 'COMPLETED') {
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    `Found unexpected status "${
                      processRecord.status
                    }" in the sub-process ${
                      pConfig.key || ''
                    } of the process ${
                      process.key || ''
                    }`
                  )
                }
              }
            }
          } else {
            // it is a single submit-target
            const tConfig = config as ISubmitTarget
            const tRecord = await submitTarget(tConfig, options, targetRecordMap)

            if (!_.isNil(targetRecordMap) && _.isString(tConfig.key)) {
              targetRecordMap[tConfig.key] = tRecord
            }

            let stop: boolean = false
            let ignore: boolean = false
            if (_.isObject(options)) {
              const { syncController } = options
              if (_.isFunction(syncController)) {
                const info = await syncController(
                  _.cloneDeep(process),
                  _.cloneDeep(processRecord),
                  _.cloneDeep(tConfig),
                  _.cloneDeep(tRecord),
                  {
                    setProcessErrorInfo: setErrorInfo.bind({}, processRecord.errorInfo)
                  },
                )
                if (!_.isNil(info) && _.isObject(info)) {
                  if (info.action === 'stop') {
                    stop = true
                  } else if (info.action === 'ignore') {
                    ignore = true
                  }
                }
              }
            }

            processRecord.records[index] = tRecord
            if (stop) {
              processRecord.status = 'TERMINATED'
              break
            } else {
              if (tRecord.status === 'FAILURE') {
                if (!ignore) {
                  processRecord.status = 'HAS_FAILURE'
                  break
                } else {
                  continue
                }
              } else if (tRecord.status !== 'SUCCESS') {
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    `Found unexpected status "${
                      processRecord.status
                    }" in the target ${
                      tConfig.key || ''
                    } of the process ${
                      process.key || ''
                    }`
                  )
                }
              }
            }
          }
        }

      } else {
        processRecord.status = 'HAS_ERROR'
        if (_.isArray(processRecord.errorInfo)) {
          processRecord.errorInfo.push('The submit mode is undefined')
        }
      }
    } else {
      processRecord.status = 'HAS_ERROR'
      if (_.isArray(processRecord.errorInfo)) {
        processRecord.errorInfo.push('The targets of the submit process is undefined or empty')
      }
    }
  } else {
    processRecord.status = 'HAS_ERROR'
    if (_.isArray(processRecord.errorInfo)) {
      processRecord.errorInfo.push('The submit process is undefined')
    }
  }

  switch (processRecord.status) {
    case 'NORMAL':
      processRecord.status = 'COMPLETED'
      break
    case 'HAS_ERROR':
    case 'HAS_FAILURE':
      processRecord.status = 'FAILED'
      break
    case 'TERMINATED':
      processRecord.status = 'TERMINATED'
      break
    default:
      if (_.isArray(processRecord.errorInfo)) {
        processRecord.errorInfo.push(
          `Found unexpected status "${
            processRecord.status
          }" in the end of the process ${
            process.key || ''
          }`
        )
      }
      break
  }
  if (_.isEmpty(processRecord.errorInfo)) {
    delete processRecord.errorInfo
  }

  if (_.isObject(options)) {
    const {
      onProcessCompleted,
      onProcessFailed,
      onProcessTerminated,
    } = options
    const { status } = processRecord

    if (status === 'COMPLETED' && _.isFunction(onProcessCompleted)) {
      onProcessCompleted(
        _.cloneDeep(process),
        _.cloneDeep(processRecord),
      )
    } else if (status === 'FAILED' && _.isFunction(onProcessFailed)) {
      onProcessFailed(
        _.cloneDeep(process),
        _.cloneDeep(processRecord),
      )
    } else if (status === 'TERMINATED' && _.isFunction(onProcessTerminated)) {
      onProcessTerminated(
        _.cloneDeep(process),
        _.cloneDeep(processRecord),
      )
    }
  }

  return processRecord
}

async function submitTarget(
  target: ISubmitTarget,
  options?: ISubmitOption,
  targetRecordMap?: ITargetRecordMap,
) {
  const { dataSource, dataSchema } = target

  // create a target record
  const targetRecord: ISubmitTargetRecord = {
    status: 'NORMAL',
    errorInfo: [],
  }

  let sourceStr: string = ''
  let wrapPath: string = ''
  let excludes: string[] = []
  if (_.isString(dataSource)) {
    sourceStr = dataSource
  } else if (_.isObject(dataSource)) {
    const { source, wrappedIn, exclude } = dataSource
    sourceStr = source
    if (_.isString(wrappedIn) && wrappedIn) {
      wrapPath = wrappedIn
    }
    if (_.isString(exclude)) {
      excludes.push(exclude)
    } else if (_.isArray(exclude) && exclude.length) {
      exclude.forEach((item: any) => {
        if (_.isString(item)) {
          excludes.push(item)
        }
      })
    }
  }

  let schemaStr: string = sourceStr
  let submitMethod: string = 'post'
  if (_.isString(dataSchema)) {
    schemaStr = dataSchema
  } else if (_.isObject(dataSchema)) {
    const { lineage, method } = dataSchema
    schemaStr = lineage
    if (method === 'put') {
      submitMethod = 'put'
    }
  }

  // deal with data
  const dataPool = DataPool.getInstance()
  let submitData = dataPool.get(sourceStr, false)
  if (_.isObject(submitData) && excludes.length > 0) {
    excludes.forEach((key: string) => {
      delete submitData[key]
    })
  }
  if (_.isString(wrapPath) && wrapPath) {
    submitData = _.set({}, wrapPath, submitData)
  } else {
    const defaultWrapper = _.trim(schemaStr.replace(':', '.'), '.').split('.').pop()
    if (_.isString(defaultWrapper)) {
      submitData = _.set({}, defaultWrapper, submitData)
    }
  }

  // deal with params
  let urlMapper = {}
  if (_.isObject(options)) {
    const { envParam, urlParam } = options
    if (_.isObject(urlParam) && !_.isEmpty(urlParam)) {
      urlMapper = { ...urlMapper, ...urlParam }
    }
  }
  const controller = NodeController.getInstance()
  const layoutName = `schema/ui/${_.trim(schemaStr.replace(':', '.'), '.')}.json`
  const wMode = controller.getWorkingMode(layoutName)
  if (_.isObject(wMode)) {
    const urlParam = _.get(wMode, 'options.urlParam')
    if (_.isObject(urlParam) && !_.isEmpty(urlParam)) {
      urlMapper = { ...urlMapper, ...urlParam }
    }
  }

  // deal with URL
  const status = dataPool.getStatus(sourceStr)
  const engine = DataEngine.getInstance()
  const schema = await engine.mapper.getSchema({ source: sourceStr })
  let url: string = ''
  if (_.isObject(schema)) {
    const { endpoint } = schema as any
    if (_.has(endpoint, submitMethod)) {
      url = endpoint[submitMethod]
    }

    if (status === 'view' || status === 'update') {
      const matchBraces = /\{.*\}/g
      const matchParam = /\{(.*)\}/
      const result = url.match(matchBraces)
      if (_.isArray(result)) {
        result.forEach((item: string) => {
          const res = item.match(matchParam)
          if (_.isArray(res) && _.isString(res[1])) {
            const paramKey = res[1]
            const paramStr = urlMapper[paramKey]
            if (_.isString(paramStr)) {
              url = url.replace(`{${paramKey}}`, paramStr)
            }
          }
        })
      }
    } else if (status === 'create') {
      const slices = _.trimEnd(url, '/').split('/')
      const lastPath = slices.pop()
      if (_.isString(lastPath)) {
        if (lastPath.match(/\{.*\}/) ) {
          url = slices.join('/')
        } else {
          slices.push(lastPath)
          url = slices.join('/')
        }
      }
    } else if (status === 'delete') {
      submitMethod = 'delete'
      // To do uuid delete
    }
  }
  console.log(url)

  // send request
  if (submitMethod === 'post') {
    const result = await engine.request.post(url, submitData)
    console.log(result)
  }

  return targetRecord
}

function setErrorInfo(errorInfo?: string[], info?: string, index?: number) {
  if (_.isArray(errorInfo)) {
    if (!_.isNil(index) && _.isFinite(index)) {
      if (_.isNil(info)) {
        errorInfo.splice(index, 1)
      } else if (_.isString(info)) {
        errorInfo[index] = info
      }
    } else {
      if (_.isNil(info)) {
        errorInfo.pop()
      } else if (_.isString(info)) {
        errorInfo.push(info)
      }
    }
  }
  return -1
}

const listener: IListener = (directParam: IListenerParam) => {
  const event: Event = _.get(directParam, 'event')
  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const target: ISubmitProcess = _.get(directParam, 'target')
  const options: ISubmitOption = _.get(directParam, 'options')

  if (event instanceof Event) {
    if (_.isFunction(event.stopPropagation)) {
      event.stopPropagation()
    } else if (event.cancelBubble === false) {
      event.cancelBubble = true
    }
  }

  console.log(target, options)
  submit(target, options)

}

export const submitData: IListenerConfig = {
  name: 'submitData',
  paramKeys: ['event', 'uiNode', 'target', 'options'],
  debugList: ['event', 'uiNode.id', 'target', 'options'],
  listener,
  weight: 0,
  describe: {
    target: {
      type: 'template',
      tempalte: [
        {
          dataSource: 'domain:',
          dataSchema: 'a.b.c',
        },
        {
          key: 'submit key',
          dataSource: {
            source: 'domain:',
            wrappedIn: 'wrapper name',
            exclude: ['field name'],
          },
          dataSchema: {
            lineage: 'a.b.c',
            method: 'post or put',
          },
          dependOn: {
            targetKey: 'submit key',
            dependList: ['field name'],
          },
        },
      ]
    },
    options: [
      {
        envParam: 'object',
      }
    ]
  }
}
