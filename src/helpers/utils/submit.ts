import _ from 'lodash'

import { DataMapper } from '../DataMapper'
import { DataPool } from '../DataPool'
import { Request } from '../Request'
import { NodeController } from '../../data-layer/NodeController'

import { replaceParam } from './data'

import {
  IDataSchema,
  IRequest,
  IRequestConfig,
  ISubmitProcess,
  ISubmitTarget,
  ISubmitOption,
  ISubmitCallback,
  ISubmitProcessRecord,
  ISubmitTargetRecord,
  ISubmitRecordMap,
  ISubmitRequest,
} from '../../../typings'

function setErrorInfo(errorInfo?: string[], info?: string, index?: number) {
  if (_.isArray(errorInfo)) {
    if (!_.isNil(index) && _.isFinite(index)) {
      if (_.isNil(info)) {
        errorInfo.splice(index, 1)
      } else if (_.isString(info)) {
        errorInfo[index] = info
        return index
      }
    } else {
      if (_.isNil(info)) {
        errorInfo.pop()
      } else if (_.isString(info)) {
        const length = errorInfo.push(info)
        return length - 1
      }
    }
  }
  return -1
}

function search(
  target: any,
  callback: (value: any, path: string, wholePath: string, parent: any) => boolean,
  path?: string,
  wholePath?: string,
  parent?: any,
) {
  let currentPath = ''
  let currentWholePath = ''
  if (_.isString(path) && path) {
    currentPath = path
  }
  if (_.isString(wholePath) && wholePath) {
    currentWholePath = wholePath
  }

  if (_.isFunction(callback)) {
    const deepSearch = callback(
      target,
      currentPath,
      currentWholePath,
      parent,
    )

    if (deepSearch !== false) {
      if (_.isArray(target)) {
        target.forEach((item: any, index: number) => {
          search(
            item,
            callback,
            `${index}`,
            currentPath + `[${index}]`,
            target,
          )
        })
      } else if (_.isObject(target)) {
        _.forIn(target, (item, key) => {
          search(
            item,
            callback,
            key,
            currentPath ? currentPath + `.${key}` : key,
            target,
          )
        })
      }
    }
  }
}

export function requestGenerator(
  targetRecord: ISubmitTargetRecord,
) {
  const { record } = targetRecord
  const {
    source, wrappedIn, exclude,
    schema, method, config,
    engineId, layoutKey,
  } = record

  const dataPool = DataPool.getInstance()
  const dataMapper = DataMapper.getInstance()
  const controller = NodeController.getInstance()

  if (_.isString(source) && source) {
    // get data from dataPool
    const submitData = _.cloneDeep(dataPool.get(source, { withPath: false }))

    // generate request config for data
    if (_.isObject(submitData) && !_.isArray(submitData)) {

      /**  Method  **/
      let submitMethod: string = ''
      const status = dataPool.getInfo(source, 'status')
      switch (status) {
        case 'delete':
          submitMethod = 'delete'
          break
        case 'create':
        case 'update':
        case 'view':
        default:
          if (_.isString(method) && method) {
            submitMethod = method
          } else {
            submitMethod = 'post'
          }
          break
      }
      /**  Method  **/


      /**  URL  **/
      let submitURL: string = ''

      if (_.isString(schema) && schema) {
        // get data schema from DataMapper
        const dataSchema = dataMapper.getDataSchema(schema, true)

        if (_.isObject(dataSchema) && _.has(dataSchema, 'endpoints')) {
          // get the url from schema
          const { endpoints } = dataSchema as IDataSchema

          if (_.has(endpoints, submitMethod)) {
            const urlTemplate = endpoints[submitMethod]
            if (_.isString(urlTemplate) && urlTemplate) {
              submitURL = urlTemplate
            } else if (_.isObject(urlTemplate)) {
              const { path } = urlTemplate as any
              if (_.isString(path) && path) {
                submitURL = path
              }
            }
          } else {
            const defaultConfig = _.get(endpoints, 'default')
            if (_.isString(defaultConfig) && defaultConfig) {
              submitURL = defaultConfig
            } else if (_.isObject(defaultConfig)) {
              const { path } = defaultConfig as any
              if (_.isString(path) && path) {
                submitURL = path
              }
            }
          }

        } else {
          targetRecord.status = 'HAS_ERROR'
          if (_.isArray(targetRecord.errorInfo)) {
            targetRecord.errorInfo.push(
              'Submit Target Error: Invalid Data Schema.'
            )
          }
          return
        }

      } else {
        targetRecord.status = 'HAS_ERROR'
        if (_.isArray(targetRecord.errorInfo)) {
          targetRecord.errorInfo.push(
            'Submit Target Error: Invalid Schema Config.'
          )
        }
        return
      }

      // remove the last path when create new
      if (status === 'create') {
        const urlPath = submitURL.split('/')
        const lastPath = urlPath.pop()
        if (_.isString(lastPath) && lastPath.match(/\{.*\}/)) {
          submitURL = urlPath.join('/')
        }
      }
      /**  URL  **/


      /**  URL Param  **/
      const urlParam: any = _.cloneDeep(submitData)

      // get working mode
      if (_.isString(layoutKey) && layoutKey) {
        const wMode = controller.getWorkingMode(layoutKey)

        // get url param from working mode
        if (_.isObject(wMode)) {
          const { mode, operationModes, options } = wMode
          const commonParam = _.get(options, ['urlParam'])
          if (_.isObject(commonParam) && !_.isEmpty(commonParam)) {
            _.assign(urlParam, commonParam)
          }
          if (mode === 'customize') {
            if (_.isArray(operationModes)) {
              operationModes.forEach((item) => {
                const { source: itemSrc, options: itemOpt } = item
                if (_.isString(source) && source.startsWith(itemSrc)) {
                  const itemParam = _.get(itemOpt, ['urlParam'])
                  if (_.isObject(itemParam) && !_.isEmpty(itemParam)) {
                    _.assign(urlParam, itemParam)
                  }
                }
              })
            } else if (_.isObject(operationModes)) {
              const { source: itemSrc, options: itemOpt } = operationModes
              if (_.isString(source) && source.startsWith(itemSrc)) {
                const itemParam = _.get(itemOpt, ['urlParam'])
                if (_.isObject(itemParam) && !_.isEmpty(itemParam)) {
                  _.assign(urlParam, itemParam)
                }
              }
            }
          }
        }
      }
      /**  URL Param  **/


      /**  Payload  **/
      let payload = submitData

      // remove the keys of exclude
      if (
        _.isObject(payload) &&
        !_.isNil(exclude) && exclude.length > 0
      ) {
        exclude.forEach((excludeKey: string) => {
          if (excludeKey.includes('.')) {
            const routes = excludeKey.split('.')
            const lastRoute = routes.pop()
            const targetObj = _.get(payload, routes)
            if (_.isObject(targetObj) && _.isString(lastRoute)) {
              delete targetObj[lastRoute]
            }
          } else {
            delete payload[excludeKey]
          }
        })
      }

      // remove the invisible field
      if (_.isObject(payload) && !_.isEmpty(payload)) {
        search(
          payload,
          (value: any, path: string, wholePath: string, parent: any) => {
            if (_.isObject(parent)) {
              const state = dataPool.getInfo(wholePath, 'state')
              if (_.has(state, 'visible') && state.visible === false) {
                delete parent[path]
                return false
              }
            }
            return true
          },
          '',
          source,
        )
      }

      // wrap the payload
      if (_.isString(wrappedIn) && wrappedIn) {
        payload = _.set({}, wrappedIn, payload)
      } else if (_.isString(schema) && schema) {
        const defaultWrapper = _.trim(schema.replace(':', '.'), '.').split('.').pop()
        if (_.isString(defaultWrapper) && defaultWrapper) {
          payload = _.set({}, defaultWrapper, payload)
        }
      }
      /**  Payload  **/


      /**  Request Config  **/
      const submitConfig: IRequestConfig = { prefixType: 'data' }

      if (_.isObject(config)) {
        _.assign(submitConfig, config)
      }
      /**  Request Config  **/


      const requestConfig: ISubmitRequest = {
        method: submitMethod,
        url: submitURL,
        urlParam: urlParam,
        payload,
        config: submitConfig,
      }

      if (_.isString(engineId) && engineId) {
        requestConfig.configId = engineId
      }
      record.requestQueue = [requestConfig]
      record.requestMode = 'async'

    } else if (_.isArray(submitData)) {
      record.requestQueue = submitData.map((data: any, index: number) => {
        const dataSource = source + `[${index}]`

        /**  Method  **/
        let submitMethod: string = ''

        const status = dataPool.getInfo(dataSource, 'status')
        switch (status) {
          case 'delete':
            submitMethod = 'delete'
            break
          case 'create':
          case 'update':
          case 'view':
          default:
            if (_.isString(method) && method) {
              submitMethod = method
            } else {
              submitMethod = 'post'
            }
            break
        }
        /**  Method  **/


        /**  URL  **/
        let submitURL: string = ''

        if (_.isString(schema) && schema) {
          // get data schema from DataMapper
          const dataSchema = dataMapper.getDataSchema(schema, true)

          if (_.isObject(dataSchema) && _.has(dataSchema, 'endpoints')) {
            // get the url from schema
            const { endpoints } = dataSchema as IDataSchema

            if (_.has(endpoints, submitMethod)) {
              const urlTemplate = endpoints[submitMethod]
              if (_.isString(urlTemplate) && urlTemplate) {
                submitURL = urlTemplate
              } else if (_.isObject(urlTemplate)) {
                const { path } = urlTemplate as any
                if (_.isString(path) && path) {
                  submitURL = path
                }
              }
            } else {
              const defaultConfig = _.get(endpoints, 'default')
              if (_.isString(defaultConfig) && defaultConfig) {
                submitURL = defaultConfig
              } else if (_.isObject(defaultConfig)) {
                const { path } = defaultConfig as any
                if (_.isString(path) && path) {
                  submitURL = path
                }
              }
            }

          } else {
            targetRecord.status = 'HAS_ERROR'
            if (_.isArray(targetRecord.errorInfo)) {
              targetRecord.errorInfo.push(
                'Submit Target Error: Invalid Data Schema.'
              )
            }
            return undefined
          }

        } else {
          targetRecord.status = 'HAS_ERROR'
          if (_.isArray(targetRecord.errorInfo)) {
            targetRecord.errorInfo.push(
              'Submit Target Error: Invalid Schema Config.'
            )
          }
          return undefined
        }

        // remove the last path when create new
        if (status === 'create') {
          const urlPath = submitURL.split('/')
          const lastPath = urlPath.pop()
          if (_.isString(lastPath) && lastPath.match(/\{.*\}/)) {
            submitURL = urlPath.join('/')
          }
        }
        /**  URL  **/


        /**  URL Param  **/
        const urlParam: any = _.cloneDeep(data)

        // get working mode
        if (_.isString(layoutKey) && layoutKey) {
          const wMode = controller.getWorkingMode(layoutKey)

          // get url param from working mode
          if (_.isObject(wMode)) {
            const { mode, operationModes, options } = wMode
            const commonParam = _.get(options, ['urlParam'])
            if (_.isObject(commonParam) && !_.isEmpty(commonParam)) {
              _.assign(urlParam, commonParam)
            }
            if (mode === 'customize') {
              if (_.isArray(operationModes)) {
                operationModes.forEach((item) => {
                  const { source: itemSrc, options: itemOpt } = item
                  if (_.isString(dataSource) && dataSource.startsWith(itemSrc)) {
                    const itemParam = _.get(itemOpt, ['urlParam'])
                    if (_.isObject(itemParam) && !_.isEmpty(itemParam)) {
                      _.assign(urlParam, itemParam)
                    }
                  }
                })
              } else if (_.isObject(operationModes)) {
                const { source: itemSrc, options: itemOpt } = operationModes
                if (_.isString(dataSource) && dataSource.startsWith(itemSrc)) {
                  const itemParam = _.get(itemOpt, ['urlParam'])
                  if (_.isObject(itemParam) && !_.isEmpty(itemParam)) {
                    _.assign(urlParam, itemParam)
                  }
                }
              }
            }
          }
        }
        /**  URL Param  **/


        /**  Payload  **/
        let payload = data

        // remove the keys of exclude
        if (
          _.isObject(payload) &&
          !_.isNil(exclude) && exclude.length > 0
        ) {
          exclude.forEach((excludeKey: string) => {
            if (excludeKey.includes('.')) {
              const routes = excludeKey.split('.')
              const lastRoute = routes.pop()
              const targetObj = _.get(payload, routes)
              if (_.isObject(targetObj) && _.isString(lastRoute)) {
                delete targetObj[lastRoute]
              }
            } else {
              delete payload[excludeKey]
            }
          })
        }

        // remove the invisible field
        if (_.isObject(payload) && !_.isEmpty(payload)) {
          search(
            payload,
            (value: any, path: string, wholePath: string, parent: any) => {
              if (_.isObject(parent)) {
                const state = dataPool.getInfo(wholePath, 'state')
                if (_.has(state, 'visible') && state.visible === false) {
                  delete parent[path]
                  return false
                }
              }
              return true
            },
            '',
            dataSource,
          )
        }

        // wrap the payload
        if (_.isString(wrappedIn) && wrappedIn) {
          payload = _.set({}, wrappedIn, payload)
        } else if (_.isString(schema) && schema) {
          const defaultWrapper = _.trim(schema.replace(':', '.'), '.').split('.').pop()
          if (_.isString(defaultWrapper) && defaultWrapper) {
            payload = _.set({}, defaultWrapper, payload)
          }
        }
        /**  Payload  **/


        /**  Request Config  **/
        const submitConfig: IRequestConfig = { prefixType: 'data' }

        if (_.isObject(config)) {
          _.assign(submitConfig, config)
        }
        /**  Request Config  **/


        const requestConfig: ISubmitRequest = {
          method: submitMethod,
          url: submitURL,
          urlParam: urlParam,
          payload,
          config: submitConfig,
        }

        if (_.isString(engineId) && engineId) {
          requestConfig.configId = engineId
        }

        return requestConfig
      }).filter((request: ISubmitRequest | undefined) => {
        return !_.isNil(request)
      }) as ISubmitRequest[]
      record.requestMode = 'sync'
    } else {
      targetRecord.status = 'HAS_ERROR'
      if (_.isArray(targetRecord.errorInfo)) {
        targetRecord.errorInfo.push(
          'Submit Target Error: Invalid Data.'
        )
      }
    }

  } else {
    targetRecord.status = 'HAS_ERROR'
    if (_.isArray(targetRecord.errorInfo)) {
      targetRecord.errorInfo.push(
        'Submit Target Error: Invalid Data Source.'
      )
    }
  }

}

export function dependResolver(
  targetRecord: ISubmitTargetRecord,
  targetRecordMap?: ISubmitRecordMap,
) {
  const { record } = targetRecord
  const { dependOn, requestQueue } = record

  if (!_.isNil(dependOn) && !_.isNil(targetRecordMap) && !_.isNil(requestQueue)) {
    _.forIn(dependOn, (dependMap, dependTarget) => {
      const dependRecord = targetRecordMap[dependTarget]

      const dependParam = {}
      _.forIn(dependMap, (mapKey: string, dependKey: string) => {
        if (_.isString(dependKey) && dependKey) {
          const dependValue = _.get(dependRecord, `record.requestQueue.${dependKey}`)

          if (_.isString(dependValue) || _.isFinite(dependValue)) {
            dependParam[mapKey] = `${dependValue}`
          }
        }
      })

      requestQueue.forEach((request: ISubmitRequest) => {
        const { urlParam } = request

        if (!_.isEmpty(dependParam)) {
          _.assign(urlParam, _.cloneDeep(dependParam))
        }
      })
    })
  }
}

export async function submit(
  target: ISubmitProcess | ISubmitTarget,
  options?: ISubmitOption,
  callbacks?: ISubmitCallback,
) {
  // to store the target records
  const targetRecordMap: ISubmitRecordMap = {}

  try {
    if (_.has(target, 'targets')) {
      const processConfig = target as ISubmitProcess
      return await submitProcess(
        processConfig,
        options,
        callbacks,
        targetRecordMap,
      )
    } else {
      const targetConfig = target as ISubmitTarget
      return await submitTarget(
        targetConfig,
        options,
        callbacks,
        targetRecordMap,
      )
    }
  } catch (e) {
    console.error(e)
    console.error(`Above error happens when submit the target `, target)
  }
}

export async function submitProcess(
  process: ISubmitProcess,
  options?: ISubmitOption,
  callbacks?: ISubmitCallback,
  targetRecordMap?: ISubmitRecordMap,
) {
  const processRecord: ISubmitProcessRecord = {
    status: 'NORMAL',
    errorInfo: [],
    records: []
  }

  if (!_.isNil(process) && _.isObject(process)) {
    const { key, targets, mode = 'async' } = process

    if (_.isString(key) && key) {
      processRecord.key = key
    }

    if (_.isArray(targets) && targets.length > 0) {
      if (mode === 'async') {
        // Async Submit:
        // all targets/sub-processes begin to submit at the same time
        const promises = targets.map(
          async (config: ISubmitTarget | ISubmitProcess, index: number) => {
            if (_.has(config, 'targets')) {
              // it is a sub-process with multiple targets
              const pConfig = config as ISubmitProcess
              const pRecord = await submitProcess(
                pConfig,
                options,
                callbacks,
                targetRecordMap,
              )

              let ignore: boolean = false
              if (_.isObject(callbacks)) {
                const { asyncController } = callbacks
                if (_.isFunction(asyncController)) {
                  const info = await asyncController(
                    _.cloneDeep(process),
                    _.cloneDeep(processRecord),
                    _.cloneDeep(pConfig),
                    _.cloneDeep(pRecord),
                    {
                      setProcessErrorInfo: setErrorInfo.bind(
                        null,
                        processRecord.errorInfo,
                      )
                    }
                  )
                  if (!_.isNil(info) && _.isObject(info)) {
                    ignore = info.action === 'ignore'
                  }
                }
              }

              if (pRecord.status === 'FAILED') {
                if (!ignore) {
                  processRecord.status = 'HAS_FAILURE'
                }
              } else if (pRecord.status === 'TERMINATED') {
                if (!ignore) {
                  processRecord.status = 'TERMINATED'
                }
              } else if (pRecord.status !== 'COMPLETED') {

                processRecord.status = 'HAS_ERROR'
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    'Submit Process Error: Unexpected Status.'
                  )
                }
              }

              processRecord.records[index] = pRecord
              return pRecord
            } else {
              // it is a single submit-target
              const tConfig = config as ISubmitTarget
              const tRecord = await submitTarget(
                tConfig,
                options,
                callbacks,
                targetRecordMap,
              )

              if (!_.isNil(targetRecordMap)) {
                if (_.isString(tConfig.key) && tConfig.key) {
                  targetRecordMap[tConfig.key] = tRecord
                } else {
                  let sourceStr = ''
                  const dataSource = tConfig.dataSource
                  if (_.isObject(dataSource)) {
                    sourceStr = dataSource.source
                  } else if (_.isString(dataSource)) {
                    sourceStr = dataSource
                  }
                  if (_.isString(sourceStr) && sourceStr) {
                    targetRecordMap[sourceStr] = tRecord
                  }
                }
              }

              let ignore: boolean = false
              if (_.isObject(callbacks)) {
                const { asyncController } = callbacks
                if (_.isFunction(asyncController)) {
                  const info = await asyncController(
                    _.cloneDeep(process),
                    _.cloneDeep(processRecord),
                    _.cloneDeep(tConfig),
                    _.cloneDeep(tRecord),
                    {
                      setProcessErrorInfo: setErrorInfo.bind(
                        null,
                        processRecord.errorInfo
                      )
                    }
                  )
                  if (!_.isNil(info) && _.isObject(info)) {
                    ignore = info.action === 'ignore'
                  }
                }
              }

              if (tRecord.status === 'FAILURE') {
                if (!ignore) {
                  processRecord.status = 'HAS_FAILURE'
                }
              } else if (tRecord.status !== 'SUCCESS') {

                processRecord.status = 'HAS_ERROR'
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    'Submit Process Error: Unexpected Status.'
                  )
                }
              }

              processRecord.records[index] = tRecord
              return tRecord
            }
          }
        )

        // wait for all targets/sub-processes
        await Promise.all(promises)

      } else if (mode === 'sync') {
        // Sync Submit:
        // all targets/sub-processes begin the submit after the prev one ends
        for (let index = 0; index < targets.length; index++) {
          const config = targets[index]

          if (_.has(config, 'targets')) {
            // it is a sub-process with multiple targets
            const pConfig = config as ISubmitProcess
            const pRecord = await submitProcess(
              pConfig,
              options,
              callbacks,
              targetRecordMap,
            )

            let stop: boolean = false
            let ignore: boolean = false
            if (_.isObject(callbacks)) {
              const { syncController } = callbacks
              if (_.isFunction(syncController)) {
                const info = await syncController(
                  _.cloneDeep(process),
                  _.cloneDeep(processRecord),
                  _.cloneDeep(pConfig),
                  _.cloneDeep(pRecord),
                  {
                    setProcessErrorInfo: setErrorInfo.bind(
                      null,
                      processRecord.errorInfo
                    )
                  }
                )
                if (!_.isNil(info) && _.isObject(info)) {
                  stop = info.action === 'stop'
                  ignore = info.action === 'ignore'
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

                processRecord.status = 'HAS_ERROR'
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    'Submit Process Error: Unexpected Status.'
                  )
                }

              }
            }

          } else {
            // it is a single submit-target
            const tConfig = config as ISubmitTarget
            const tRecord = await submitTarget(
              tConfig,
              options,
              callbacks,
              targetRecordMap,
            )

            if (!_.isNil(targetRecordMap)) {
              if (_.isString(tConfig.key) && tConfig.key) {
                targetRecordMap[tConfig.key] = tRecord
              } else {
                let sourceStr = ''
                const dataSource = tConfig.dataSource
                if (_.isObject(dataSource)) {
                  sourceStr = dataSource.source
                } else if (_.isString(dataSource)) {
                  sourceStr = dataSource
                }
                if (_.isString(sourceStr) && sourceStr) {
                  targetRecordMap[sourceStr] = tRecord
                }
              }
            }

            let stop: boolean = false
            let ignore: boolean = false
            if (_.isObject(callbacks)) {
              const { syncController } = callbacks
              if (_.isFunction(syncController)) {
                const info = await syncController(
                  _.cloneDeep(process),
                  _.cloneDeep(processRecord),
                  _.cloneDeep(tConfig),
                  _.cloneDeep(tRecord),
                  {
                    setProcessErrorInfo: setErrorInfo.bind(
                      null,
                      processRecord.errorInfo
                    )
                  }
                )
                if (!_.isNil(info) && _.isObject(info)) {
                  stop = info.action === 'stop'
                  ignore = info.action === 'ignore'
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

                processRecord.status = 'HAS_ERROR'
                if (_.isArray(processRecord.errorInfo)) {
                  processRecord.errorInfo.push(
                    'Submit Process Error: Unexpected Status.'
                  )
                }
              }
            }
          }
        }

      } else {
        processRecord.status = 'HAS_ERROR'
        if (_.isArray(processRecord.errorInfo)) {
          processRecord.errorInfo.push(
            'Can\'t resolve the submit process: Invalid Mode.'
          )
        }
      }
    } else {
      processRecord.status = 'HAS_ERROR'
      if (_.isArray(processRecord.errorInfo)) {
        processRecord.errorInfo.push(
          'Can\'t resolve the submit process: Invalid Targets.'
        )
      }
    }
  } else {
    processRecord.status = 'HAS_ERROR'
    if (_.isArray(processRecord.errorInfo)) {
      processRecord.errorInfo.push(
        'Can\'t resolve the submit process: Invalid Config.'
      )
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
      break
  }
  if (_.isEmpty(processRecord.errorInfo)) {
    delete processRecord.errorInfo
  }

  if (_.isObject(callbacks)) {
    const { onProcessCompleted, onProcessFailed, onProcessTerminated } = callbacks

    const { status } = processRecord
    if (status === 'COMPLETED' && _.isFunction(onProcessCompleted)) {
      await onProcessCompleted(
        _.cloneDeep(process),
        _.cloneDeep(processRecord)
      )
    } else if (status === 'FAILED' && _.isFunction(onProcessFailed)) {
      await onProcessFailed(
        _.cloneDeep(process),
        _.cloneDeep(processRecord)
      )
    } else if (status === 'TERMINATED' && _.isFunction(onProcessTerminated)) {
      await onProcessTerminated(
        _.cloneDeep(process),
        _.cloneDeep(processRecord)
      )
    }
  }

  return processRecord
}

export async function submitTarget(
  target: ISubmitTarget,
  options?: ISubmitOption,
  callbacks?: ISubmitCallback,
  targetRecordMap?: ISubmitRecordMap,
) {
  const { key, dataSource, dataSchema, dependOn } = target

  // create target submit record
  const targetRecord: ISubmitTargetRecord = {
    status: 'NORMAL',
    errorInfo: [],
    record: {},
  }
  if (_.isString(key) && key) {
    targetRecord.key = key
  }

  const record = targetRecord.record
  // record target data config
  if (_.isString(dataSource) && dataSource) {
    record.source = dataSource
  } else if (_.isObject(dataSource)) {
    const { source, wrappedIn, exclude } = dataSource
    if (_.isString(source) && source) {
      record.source = source
    }
    if (_.isString(wrappedIn) && wrappedIn) {
      record.wrappedIn = wrappedIn
    }
    if (_.isString(exclude) && exclude) {
      record.exclude = [exclude]
    } else if (_.isArray(exclude) && exclude.length) {
      const excludes: string[] = []
      exclude.forEach((item: any) => {
        if (_.isString(item) && item) {
          excludes.push(item)
        }
      })
      record.exclude = excludes
    }
  }

  // record target schema config
  if (_.isString(dataSchema) && dataSchema) {
    record.schema = dataSchema
  } else if (_.isObject(dataSchema)) {
    const { schema, method, config } = dataSchema
    if (_.isString(schema) && schema) {
      record.schema = schema
    }
    if (_.isString(method) && method) {
      record.method = method
    }
    if (_.isObject(config) && !_.isEmpty(config)) {
      record.config = config
    }
  }
  if (!_.isString(record.schema) || !record.schema) {
    record.schema = record.source
  }

  // record dependOn config
  if (_.isObject(dependOn)) {
    _.forIn(dependOn, (dependMap, targetKey) => {
      if (
        _.isObject(targetRecordMap) && targetRecordMap[targetKey] &&
        _.isObject(dependMap) && !_.isEmpty(dependMap)
      ) {
        if (_.isNil(record.dependOn)) {
          record.dependOn = {
            [targetKey]: dependMap
          }
        } else {
          record.dependOn[targetKey] = dependMap
        }
      } else {
        console.warn(`Can\'t find the record of submit target '${targetKey}'. Please check the config.`)
      }
    })
  }

  // record engineId and layoutKey
  if (_.isObject(options)) {
    const { engineId, layoutKey } = options
    if (_.isString(engineId) && engineId) {
      record.engineId = engineId
    }
    if (_.isString(layoutKey) && layoutKey) {
      record.layoutKey = layoutKey
    }
  }

  // generate request
  if (_.isObject(options) && _.isFunction(options.requestGenerator)) {
    options.requestGenerator(targetRecord)
  } else {
    requestGenerator(targetRecord)
  }

  // solve depend param
  if (_.isObject(options) && _.isFunction(options.dependResolver)) {
    options.dependResolver(targetRecord, targetRecordMap)
  } else {
    dependResolver(targetRecord, targetRecordMap)
  }

  if (targetRecord.status === 'NORMAL') {
    const mode = _.get(targetRecord, ['record', 'requestMode'], 'async')
    const queue = _.get(targetRecord, ['record', 'requestQueue'], [] as ISubmitRequest[])

    let request: IRequest = Request.getInstance()
    if (_.isObject(options) && !_.isNil(options.request)) {
      request = options.request
    }

    if (mode === 'async') {
      const promises = queue.map(async (item: ISubmitRequest) => {
        let { method, url, urlParam, payload, config, configId } = item

        if (!_.isNil(urlParam)) {
          url = replaceParam(url, urlParam)
        }
        try {
          // send request
          if (method === 'post') {
            const result = await request.post(url, payload, config, configId)
            if (_.has(result, 'data')) {
              item.response = _.get(result, 'data')
            }
          } else if (method === 'put') {
            const result = await request.put(url, payload, config, configId)
            if (_.has(result, 'data')) {
              item.response = _.get(result, 'data')
            }
          } else if (method === 'delete') {
            const result = await request.delete(url, config, configId)
            if (_.has(result, 'data')) {
              item.response = _.get(result, 'data')
            }
          }
        } catch (e) {
          console.error(e)
          if (_.has(e, 'response.data')) {
            item.response = _.get(e, 'response.data')
          }

          targetRecord.status = 'HAS_ERROR'
          if (_.isArray(targetRecord.errorInfo)) {
            targetRecord.errorInfo.push(
              `Request Error: Failed to submit data to "${url}".`
            )
          }
        }
      })
      await Promise.all(promises)
    } else if (mode === 'sync') {
      for (let index = 0; index < queue.length; index++) {
        const item = queue[index]

        let { method, url, urlParam, payload, config, configId } = item

        if (!_.isNil(urlParam)) {
          url = replaceParam(url, urlParam)
        }
        try {
          // send request
          if (method === 'post') {
            const result = await request.post(url, payload, config, configId)
            if (_.has(result, 'data')) {
              item.response = _.get(result, 'data')
            }
          } else if (method === 'put') {
            const result = await request.put(url, payload, config, configId)
            if (_.has(result, 'data')) {
              item.response = _.get(result, 'data')
            }
          } else if (method === 'delete') {
            const result = await request.delete(url, config, configId)
            if (_.has(result, 'data')) {
              item.response = _.get(result, 'data')
            }
          }
        } catch (e) {
          console.error(e)
          if (_.has(e, 'response.data')) {
            item.response = _.get(e, 'response.data')
          }

          targetRecord.status = 'HAS_ERROR'
          if (_.isArray(targetRecord.errorInfo)) {
            targetRecord.errorInfo.push(
              `Request Error: Failed to submit data to "${url}".`
            )
          }
        }
      }
    } else {
      targetRecord.status = 'HAS_ERROR'
      if (_.isArray(targetRecord.errorInfo)) {
        targetRecord.errorInfo.push(
          'Submit Target Error: Invalid Mode'
        )
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
      break
  }
  if (_.isEmpty(targetRecord.errorInfo)) {
    delete targetRecord.errorInfo
  }

  if (_.isObject(callbacks)) {
    const { onTargetSuccess, onTargetFailure } = callbacks

    const { status } = targetRecord
    if (status === 'SUCCESS' && _.isFunction(onTargetSuccess)) {
      await onTargetSuccess(
        _.cloneDeep(target),
        _.cloneDeep(targetRecord),
      )
    } else if (status === 'FAILURE' && _.isFunction(onTargetFailure)) {
      await onTargetFailure(
        _.cloneDeep(target),
        _.cloneDeep(targetRecord)
      )
    }
  }

  return targetRecord
}
