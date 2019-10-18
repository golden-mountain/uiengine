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

export interface ISubmitRecordMap {
  [targetKey: string]: ISubmitTargetRecord
}

async function submit(
  target: ISubmitProcess | ISubmitTarget,
  options?: ISubmitOption,
) {
  // to store the target records
  const targetRecordMap: ISubmitRecordMap = {}

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
  targetRecordMap?: ISubmitRecordMap,
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
      await onProcessCompleted(
        _.cloneDeep(process),
        _.cloneDeep(processRecord),
      )
    } else if (status === 'FAILED' && _.isFunction(onProcessFailed)) {
      await onProcessFailed(
        _.cloneDeep(process),
        _.cloneDeep(processRecord),
      )
    } else if (status === 'TERMINATED' && _.isFunction(onProcessTerminated)) {
      await onProcessTerminated(
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
  targetRecordMap?: ISubmitRecordMap,
) {
  const { key, dataSource, dataSchema, dependOn } = target

  // create target submit record
  const targetRecord: ISubmitTargetRecord = {
    status: 'NORMAL',
    errorInfo: [],
  }
  if (_.isString(key) && key) {
    targetRecord.key = key
  }

  // get target data config
  let sourceStr: string = ''
  let wrapPath: string = ''
  let excludes: string[] = []
  if (_.isString(dataSource)) {
    sourceStr = dataSource
  } else if (_.isObject(dataSource)) {
    const { source, wrappedIn, exclude } = dataSource
    if (_.isString(source)) {
      sourceStr = source
    }
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

  // get target schema config
  let schemaStr: string = sourceStr
  let submitMethod: string = 'post'
  if (_.isString(dataSchema)) {
    schemaStr = dataSchema
  } else if (_.isObject(dataSchema)) {
    const { lineage, method } = dataSchema
    if (_.isString(lineage)) {
      schemaStr = lineage
    }
    if (method === 'put') {
      submitMethod = 'put'
    }
  }

  // get depend on config
  let dependTarget: string = ''
  const dependKeys: string[] = []
  if (_.isString(dependOn)) {
    dependTarget = dependOn
  } else if (_.isObject(dependOn)) {
    const { targetKey, dependList } = dependOn
    if (_.isString(targetKey)) {
      dependTarget = targetKey
    }
    if (_.isArray(dependList)) {
      dependList.forEach((item: string) => {
        if (_.isString(item)) {
          dependKeys.push(item)
        }
      })
    }
  }

  // deal with data
  // get data from datapool
  const dataPool = DataPool.getInstance()
  const submitData = _.cloneDeep(dataPool.get(sourceStr, { withPath: false }))
  if (!_.isArray(submitData)) {
    let payload = submitData

    // get uuid if exist
    let dataUUID = _.get(submitData, 'uuid')

    // remove the excludes keys
    if (_.isObject(submitData) && excludes.length > 0) {
      excludes.forEach((excludeKey: string) => {
        delete submitData[excludeKey]
      })
    }
    // filter the valid data (Todo: through plugins)
    if (_.isObject(submitData) && !_.isEmpty(submitData)) {
      Object.keys(submitData).forEach((dataKey: string) => {
        let fieldSource: string = ''
        if (sourceStr.endsWith(':') || sourceStr.endsWith(']') || sourceStr.endsWith('.')) {
          fieldSource = sourceStr + dataKey
        } else {
          fieldSource = sourceStr + '.' + dataKey
        }

        if (_.isString(fieldSource) && fieldSource) {
          const state: any = dataPool.getInfo(fieldSource, 'state')
          if (_.has(state, 'visible') && state.visible === false) {
            delete submitData[dataKey]
          }
        }
      })
    }
    if (_.isString(wrapPath) && wrapPath) {
      payload = _.set({}, wrapPath, submitData)
    } else {
      const defaultWrapper = _.trim(schemaStr.replace(':', '.'), '.').split('.').pop()
      if (_.isString(defaultWrapper)) {
        payload = _.set({}, defaultWrapper, submitData)
      }
    }
    console.log('payload:', payload)

    // deal with URL
    // get url param map
    let urlMapper = {}
    if (!_.isNil(targetRecordMap)) {
      const dependRecord = targetRecordMap[dependTarget]
      if (!_.isNil(dependRecord)) {
        const { response } = dependRecord
        if (_.isObject(response) && dependKeys.length) {
          dependKeys.forEach((key: string) => {
            const value = _.get(response, [Object.keys(response)[0], key])
            if (_.isString(value) || _.isFinite(value)) {
              urlMapper[key] = value
            }
          })
        }
      }
    }
    if (_.isObject(options)) {
      const { urlParam } = options
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
    // replace the url param
    const status = dataPool.getInfo(sourceStr, 'status') || 'create'
    const engine = DataEngine.getInstance()
    const schema = await engine.mapper.getSchema({ source: sourceStr, schema: schemaStr })
    let url: string = ''
    if (_.isObject(schema)) {
      const { endpoint } = schema as any
      if (_.has(endpoint, submitMethod)) {
        url = endpoint[submitMethod]
      } else {
        url = _.get(endpoint, 'default.path')
      }

      if (status === 'view' || status === 'update') {
        const matchBraces = /\{[\w\-]*\}/g
        const matchParam = /\{(.*)\}/
        const results = url.match(matchBraces)
        if (_.isArray(results)) {
          results.forEach((item: string) => {
            const result = item.match(matchParam)
            if (_.isArray(result) && _.isString(result[1])) {
              const paramKey = result[1]
              let paramStr = urlMapper[paramKey]
              if (!paramStr) {
                paramStr = submitData[paramKey]
              }
              if (_.isString(paramStr) || _.isFinite(paramStr)) {
                url = url.replace(`{${paramKey}}`, `${paramStr}`)
              }
            }
          })
        }
      } else if (status === 'create') {
        const matchBraces = /\{[\w\-]*\}/g
        const matchParam = /\{(.*)\}/
        const results = url.match(matchBraces)
        if (_.isArray(results)) {
          results.forEach((item: string) => {
            const result = item.match(matchParam)
            if (_.isArray(result) && _.isString(result[1])) {
              const paramKey = result[1]
              const paramStr = urlMapper[paramKey]
              if (_.isString(paramStr)) {
                url = url.replace(`{${paramKey}}`, paramStr)
              }
            }
          })
        }

        // remove the last path when the param is not replaced
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
        if (_.isString(dataUUID)) {
          submitMethod = 'delete'
          url = `/axapi/v3/uuid/${dataUUID}`
        } else {
          submitMethod = ''
          url = ''
        }
      }
    }
    console.log(submitMethod, url)

    try {
      // send request
      if (submitMethod === 'post') {
        const result = await engine.request.post(url, payload)
        if (_.has(result, 'data')) {
          targetRecord.response = _.get(result, 'data')
        }
      } else if (submitMethod === 'put') {
        const result = await engine.request.put(url, payload)
        if (_.has(result, 'data')) {
          targetRecord.response = _.get(result, 'data')
        }
      } else if (submitMethod === 'delete') {
        const result = await engine.request.delete(url)
        if (_.has(result, 'data')) {
          targetRecord.response = _.get(result, 'data')
        }
      }
    } catch (e) {
      console.error(e)
      targetRecord.status = 'HAS_ERROR'
      if (_.isArray(targetRecord.errorInfo)) {
        targetRecord.errorInfo.push(`Failed to submit target ${target.key || sourceStr}`)
      }
      if (_.has(e, 'response.data')) {
        targetRecord.response = _.get(e, 'response.data')
      }
    }

  } else {
    for(let index = 0; index < submitData.length; index++) {
      const dataItem: any = submitData[index]
      let payload = dataItem

      // get uuid if exist
      let dataUUID = _.get(dataItem, 'uuid')

      // remove the excludes keys
      if (_.isObject(dataItem) && excludes.length > 0) {
        excludes.forEach((excludeKey: string) => {
          delete dataItem[excludeKey]
        })
      }
      // filter the valid data (Todo: through plugins)
      if (_.isObject(dataItem) && !_.isEmpty(dataItem)) {
        Object.keys(dataItem).forEach((dataKey: string) => {
          let fieldSource: string = ''
          if (sourceStr.endsWith(':') || sourceStr.endsWith(']') || sourceStr.endsWith('.')) {
            fieldSource = sourceStr + `[${index}]` + dataKey
          } else {
            fieldSource = sourceStr + `[${index}]` + dataKey
          }

          if (_.isString(fieldSource) && fieldSource) {
            const state: any = dataPool.getInfo(fieldSource, 'state')
            if (_.has(state, 'visible') && state.visible === false) {
              delete dataItem[dataKey]
            }
          }
        })
      }
      if (_.isString(wrapPath) && wrapPath) {
        payload = _.set({}, wrapPath, dataItem)
      } else {
        const defaultWrapper = _.trim(schemaStr.replace(':', '.'), '.').split('.').pop()
        if (_.isString(defaultWrapper)) {
          payload = _.set({}, defaultWrapper, dataItem)
        }
      }
      console.log('payload:', payload)

      // deal with URL
      // get url param map
      let urlMapper = {}
      if (!_.isNil(targetRecordMap)) {
        const dependRecord = targetRecordMap[dependTarget]
        if (!_.isNil(dependRecord)) {
          const { response } = dependRecord
          if (_.isObject(response) && dependKeys.length) {
            dependKeys.forEach((key: string) => {
              const value = _.get(response, [Object.keys(response)[0], key])
              if (_.isString(value) || _.isFinite(value)) {
                urlMapper[key] = value
              }
            })
          }
        }
      }
      if (_.isObject(options)) {
        const { urlParam } = options
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
      // replace the url param
      let status = dataPool.getInfo(sourceStr + `[${index}]`, 'status') || 'create'
      console.log(sourceStr + `[${index}]`, status, dataPool)
      const engine = DataEngine.getInstance()
      const schema = await engine.mapper.getSchema({ source: sourceStr, schema: schemaStr })
      let url: string = ''
      if (_.isObject(schema)) {
        const { endpoint } = schema as any
        if (_.has(endpoint, submitMethod)) {
          url = endpoint[submitMethod]
        } else {
          url = _.get(endpoint, 'default.path')
        }

        if (status === 'view' || status === 'update') {
          const matchBraces = /\{[\w\-]*\}/g
          const matchParam = /\{(.*)\}/
          const results = url.match(matchBraces)
          if (_.isArray(results)) {
            results.forEach((item: string) => {
              const result = item.match(matchParam)
              if (_.isArray(result) && _.isString(result[1])) {
                const paramKey = result[1]
                let paramStr = urlMapper[paramKey]
                if (!paramStr) {
                  paramStr = dataItem[paramKey]
                }
                if (_.isString(paramStr) || _.isFinite(paramStr)) {
                  url = url.replace(`{${paramKey}}`, `${paramStr}`)
                }
              }
            })
          }
        } else if (status === 'create') {
          const matchBraces = /\{[\w\-]*\}/g
          const matchParam = /\{(.*)\}/
          const results = url.match(matchBraces)
          if (_.isArray(results)) {
            results.forEach((item: string) => {
              const result = item.match(matchParam)
              if (_.isArray(result) && _.isString(result[1])) {
                const paramKey = result[1]
                const paramStr = urlMapper[paramKey]
                if (_.isString(paramStr)) {
                  url = url.replace(`{${paramKey}}`, paramStr)
                }
              }
            })
          }

          // remove the last path when the param is not replaced
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
          if (_.isString(dataUUID)) {
            submitMethod = 'delete'
            url = `/axapi/v3/uuid/${dataUUID}`
          } else {
            submitMethod = ''
            url = ''
          }
        }
      }
      console.log(submitMethod, url)

      try {
        // send request
        if (submitMethod === 'post') {
          const result = await engine.request.post(url, payload)
          if (_.has(result, 'data')) {
            _.set(targetRecord, `response.${index}`, _.get(result, 'data'))
          }
        } else if (submitMethod === 'put') {
          const result = await engine.request.put(url, payload)
          if (_.has(result, 'data')) {
            _.set(targetRecord, `response.${index}`, _.get(result, 'data'))
          }
        } else if (submitMethod === 'delete') {
          const result = await engine.request.delete(url)
          if (_.has(result, 'data')) {
            _.set(targetRecord, `response.${index}`, _.get(result, 'data'))
          }
        }
      } catch (e) {
        console.error(e)
        targetRecord.status = 'HAS_ERROR'
        if (_.isArray(targetRecord.errorInfo)) {
          targetRecord.errorInfo.push(`Failed to submit target ${target.key || sourceStr}`)
        }
        if (_.has(e, 'response.data')) {
          targetRecord.response = _.get(e, 'response.data')
        }
      }
    }
  }

  switch (targetRecord.status) {
    case 'NORMAL':
      targetRecord.status = 'SUCCESS'
      break
    case 'HAS_ERROR':
      targetRecord.status = 'FAILURE'
      break
    default:
      if (_.isArray(targetRecord.errorInfo)) {
        targetRecord.errorInfo.push(
          `Found unexpected status "${
            targetRecord.status
          }" in the end of the target ${
            target.key || target.dataSource
          }`
        )
      }
      break
  }
  if (_.isEmpty(targetRecord.errorInfo)) {
    delete targetRecord.errorInfo
  }

  if (_.isObject(options)) {
    const {
      onTargetSuccess,
      onTargetFailure,
    } = options
    const { status } = targetRecord

    if (status === 'SUCCESS' && _.isFunction(onTargetSuccess)) {
      await onTargetSuccess(
        _.cloneDeep(target),
        _.cloneDeep(targetRecord),
      )
    } else if (status === 'FAILURE' && _.isFunction(onTargetFailure)) {
      await onTargetFailure(
        _.cloneDeep(target),
        _.cloneDeep(targetRecord),
      )
    }
  }

  console.log(targetRecord)
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
  const target: ISubmitProcess | ISubmitTarget = _.get(directParam, 'target')
  const options: ISubmitOption = _.get(directParam, 'options')

  if (_.isObject(event)) {
    if (_.isFunction(event.stopPropagation)) {
      event.stopPropagation()
    } else if (event.cancelBubble === false) {
      event.cancelBubble = true
    }
  }

  console.log(target, options)
  if (_.isObject(target)) {
    submit(target, options)
  }

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
      template: [
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
