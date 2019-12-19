import _ from 'lodash'

import * as TYPES from '../../typings/HandlerManager'

export class HandlerManager implements TYPES.IHandlerManager {
  private static instance: HandlerManager
  static getInstance() {
    if (_.isNil(HandlerManager.instance)) {
      HandlerManager.instance = new HandlerManager
    }
    return HandlerManager.instance
  }

  private handlers: TYPES.IHandlerMap = {
  }
  private history: TYPES.IEventHistory = {
    capacity: 100,
    lastStartNumber: 0,
    lastStoreNumber: 0,
    records: [],
    indexTree: {
      targetTree: {},
      eventTree: {},
      handlerTree: {},
    },
    indexOffset: 0,
  }

  private defaultConflictResolver (
    handlerA: TYPES.IHandlerConfig,
    handlerB: TYPES.IHandlerConfig,
  ) {
    const weightA = _.get(handlerA, 'weight', 0)
    const weightB = _.get(handlerB, 'weight', 0)
    if (weightA > weightB) {
      return handlerA
    }
    return handlerB
  }
  loadHandlers(
    handlers: TYPES.IHandlerConfig | TYPES.IHandlerConfig[],
    resolver?: TYPES.IHandlerConflictResolver,
  ) {
    let handlerArray: TYPES.IHandlerConfig[] = []
    if (_.isArray(handlers)) {
      handlerArray = handlers
    } else {
      handlerArray.push(handlers)
    }

    let allAreLoaded: boolean = true
    handlerArray.forEach((config: TYPES.IHandlerConfig) => {
      if (_.isObject(config)) {
        const { name } = config
        if (!_.isString(name) || _.isEmpty(name)) {
          allAreLoaded = false
          return
        }

        if (_.isNil(this.handlers[name])) {
          this.handlers[name] = _.cloneDeep(config)
        } else if (_.isFunction(resolver)) {
          const prevHandler = this.handlers[name]
          const nextHandler = _.cloneDeep(config)
          const result = resolver(
            prevHandler,
            nextHandler,
          )
          if (!_.isEmpty(result)) {
            this.handlers[name] = result
          }
        } else {
          this.handlers[name] = this.defaultConflictResolver(
            this.handlers[name],
            _.cloneDeep(config),
          )
        }
      } else {
        allAreLoaded = false
        return
      }
    })
    return allAreLoaded
  }
  unloadHandlers(
    name?: string
  ) {
    if (!_.isNil(name)) {
      if (_.isString(name)) {
        delete this.handlers[name]
      } else {
        return false
      }
    } else {
      this.handlers = {}
    }
    return true
  }
  getHandlerConfig(
    name: string
  ) {
    if (_.isString(name) && name.length > 0) {
      return _.cloneDeep(this.handlers[name]) || null
    }
    return this.handlers
  }

  private prepareHandlerQueue(
    eventConfig: TYPES.IEventConfig
  ) {
    const { handler } = eventConfig

    const handlerQueue: TYPES.IHandlerConfig[] = []
    if (_.isString(handler)) {
      if (!_.isNil(this.handlers[handler])) {
        handlerQueue.push(
          _.cloneDeep(this.handlers[handler])
        )
      }
    } else if (!_.isArray(handler) && _.isObject(handler)) {
      const { name, adapter } = handler
      if (_.isString(name) && !_.isNil(this.handlers[name])) {
        handlerQueue.push(
          _.cloneDeep({
            ...this.handlers[name],
            adapter,
          })
        )
      }
    } else if (_.isArray(handler)) {
      handler.forEach((config: string | TYPES.IEventHandlerConfig) => {
        if (_.isString(config)) {
          if (!_.isNil(this.handlers[config])) {
            handlerQueue.push(
              _.cloneDeep(this.handlers[config])
            )
          }
        } else if (_.isObject(config)) {
          const { name, adapter } = config
          if (_.isString(name) && !_.isNil(this.handlers[name])) {
            handlerQueue.push(
              _.cloneDeep({
                ...this.handlers[name],
                adapter,
              })
            )
          }
        }
      })
    }

    return handlerQueue
  }
  private generateDebugInfo(
    dataSource: any,
    debugList: Array<string|TYPES.IEventDebugConfig|TYPES.IHandlerDebugConfig>,
  ) {
    const info: { [debugKey: string]: any } = {}
    if (_.isArray(debugList) && debugList.length > 0) {
      debugList.forEach((config: string|TYPES.IEventDebugConfig|TYPES.IHandlerDebugConfig) => {
        if (_.isString(config)) {
          info[config] = _.get(dataSource, config)
        } else if (_.isObject(config)) {
          const { lineage, label } = config
          info[label || lineage] = _.get(dataSource, lineage)
        }
      })
    }
    return info
  }
  private callEventHandler(
    handlerConfig: TYPES.IHandlerConfig,
    receivedParam: TYPES.IHandlerParam,
    eventRecord: TYPES.IEventRecord,
  ) {
    if (_.isObject(handlerConfig)) {
      const { name, paramKeys, debugList, handler, adapter } = handlerConfig

      const handlerRecord: TYPES.IHandlerRecord = {
        handlerName: name,
        eventRecord,
        result: null,
      }

      const directParam: TYPES.IHandlerParam = {}
      if (_.isArray(paramKeys) && paramKeys.length > 0) {

        let adaptedParam: TYPES.IHandlerParam = {}
        if (_.isFunction(adapter)) {
          const paramAdapter = adapter as TYPES.IHandlerParamAdapter
          try {
            adaptedParam = paramAdapter(receivedParam)
          } catch (e) {
            console.error(`Error happens in the param adapter for handler "${name}".`)
            console.error('Which is called in the event ', eventRecord.eventName, ', and its target is ', eventRecord.target)
            console.error(e)
          }
        } else if (_.isObject(adapter) && !_.isEmpty(adapter)) {
          const paramRouteMap = adapter as TYPES.IHandlerParamRouteMap
          Object.keys(paramRouteMap).forEach((key: string) => {
            if (_.isString(paramRouteMap[key]) && paramRouteMap[key]) {
              adaptedParam[key] = _.get(receivedParam, paramRouteMap[key])
            }
          })
        } else {
          adaptedParam = receivedParam
        }

        paramKeys.forEach((item: string | TYPES.IHandlerParamConfig) => {
          if (_.isString(item) && item) {
            directParam[item] = _.get(adaptedParam, item)
          } else if (_.isObject(item)) {
            const { key, default: defaultValue } = item
            if (_.isString(key) && key) {
              directParam[key] = _.get(adaptedParam, key, defaultValue)
            }
          }
        })
      }

      if (_.isArray(debugList) && debugList.length > 0) {
        handlerRecord.originInfo = this.generateDebugInfo(directParam, debugList)
      }

      if (_.isFunction(handler)) {
        const { eventName, queue, records } = eventRecord
        const helper: TYPES.IHandlerHelper = {
          getEventName: () => eventName,
          getHandlerQueue: () => queue,
          getHandlerRecords: () => records,
        }
        try {
          const result = handler(directParam, helper)
          if (result instanceof Promise) {
            handlerRecord.result = result.then((returnData: any) => {
              if (_.isArray(debugList) && debugList.length > 0) {
                handlerRecord.finialInfo = this.generateDebugInfo(directParam, debugList)
              }
              handlerRecord.result = returnData
              return returnData
            })
          } else {
            handlerRecord.result = result
          }
        } catch(e) {
          console.error(`Error happens when call the handler "${name}".`)
          console.error('Which is called in the event ', eventName, ', its target is ', eventRecord.target)
          console.error(e)
        }
      } else {
        this.defaultEventHandler(eventRecord, handlerRecord)
      }

      if (
        !(handlerRecord.result instanceof Promise) &&
        _.isArray(debugList) && debugList.length > 0
      ) {
        handlerRecord.finialInfo = this.generateDebugInfo(directParam, debugList)
      }

      return handlerRecord
    }
  }
  private defaultEventHandler(
    eventRecord: TYPES.IEventRecord,
    handlerRecord: TYPES.IHandlerRecord
  ) {
    const { eventName, target } = eventRecord
    const { handlerName } = handlerRecord
    console.log(`In the "${eventName}" event, the "${handlerName}" handler has no function to call.`)
    if (target) {
      console.log(`Target is: `, target)
    }
  }
  private storeHistoryRecord(
    eventRecord: TYPES.IEventRecord
  ) {
    const history = this.history
    const {
      capacity,
      records,
      indexTree: { targetTree, eventTree, handlerTree },
    } = history

    // check capacity
    while (records.length >= capacity) {
      records.shift()
      --history.indexOffset
    }

    // store event record
    if (_.isFinite(history.lastStoreNumber)) {
      eventRecord.storeNumber = ++history.lastStoreNumber
    }
    const recordIndex = records.push(eventRecord) - 1 - history.indexOffset

    // store index
    const { eventName, target, records: handlerRecords } = eventRecord
    const targetName = _.isString(target) ? target : _.get(target, 'name')
    const targetRef = _.get(target, 'reference')
    // target and event trees
    if (_.isString(targetName) && targetName) {
      // when has target name

      // create target node when not find
      if (_.isNil(targetTree[targetName])) {
        targetTree[targetName] = {
          indexes: [],
          eventTree: {},
        }
      }

      // store index in the target node
      const { indexes: tIndexes, eventTree: subEventTree } = targetTree[targetName]
      tIndexes.push(recordIndex)

      if (_.isString(eventName) && eventName) {
        // create sub event node when not find
        if (_.isNil(subEventTree[eventName])) {
          subEventTree[eventName] = {
            indexes: [],
          }
        }

        // store index in the sub event node
        const { indexes: subEIndexes } = subEventTree[eventName]
        subEIndexes.push(recordIndex)

        // create event node when not find
        if (_.isNil(eventTree[eventName])) {
          eventTree[eventName] = {
            indexes: [],
            targetTree: {},
          }
        }

        // store index in the event node
        const { indexes: eIndexes, targetTree: subTargetTree } = eventTree[eventName]
        eIndexes.push(recordIndex)

        // create sub target node when not find
        if (_.isNil(subTargetTree[targetName])) {
          subTargetTree[targetName] = {
            indexes: [],
          }
        }

        // store index in the sub target node
        const { indexes: subTIndexes } = subTargetTree[targetName]
        subTIndexes.push(recordIndex)
      }

    } else if (!_.isNil(targetRef)) {
      // when only has target reference

      const hasStored = Object.keys(targetTree).some((currentName: string) => {
        const { reference, indexes: tIndexes, eventTree: subEventTree } = targetTree[currentName]

        if (!_.isNil(reference) && reference === targetRef) {
          // store index to the target node with the same reference
          tIndexes.push(recordIndex)

          if (_.isString(eventName) && eventName) {

            // create sub event node when not find
            if (_.isNil(subEventTree[eventName])) {
              subEventTree[eventName] = {
                indexes: [],
              }
            }

            // store index in the sub event node
            const { indexes: subEIndexes } = subEventTree[eventName]
            subEIndexes.push(recordIndex)

            // create event node when not find
            if (_.isNil(eventTree[eventName])) {
              eventTree[eventName] = {
                indexes: [],
                targetTree: {},
              }
            }

            // store index in the event node
            const { indexes: eIndexes, targetTree: subTargetTree } = eventTree[eventName]
            eIndexes.push(recordIndex)

            // create sub target node when not find
            if (_.isNil(subTargetTree[currentName])) {
              subTargetTree[currentName] = {
                reference,
                indexes: [],
              }
            }

            // store index in the sub target node
            const { indexes: subTIndexes } = subTargetTree[currentName]
            subTIndexes.push(recordIndex)

          }

          return true
        }
        return false
      })

      if (!hasStored) {
        // no target node has the same reference
        let newTargetName = _.uniqueId('UnnamedTarget-')
        while(!_.isNil(targetTree[newTargetName])) {
          newTargetName = _.uniqueId('UnnamedTarget-')
        }

        // create new target node with the reference
        targetTree[newTargetName] = {
          reference: targetRef,
          indexes: [recordIndex],
          eventTree: {},
        }

        if (_.isString(eventName) && eventName) {
          // create new sub event node
          const subEventTree = targetTree[newTargetName].eventTree
          subEventTree[eventName] = { indexes: [recordIndex] }

          // create event node when not find
          if (_.isNil(eventTree[eventName])) {
            eventTree[eventName] = {
              indexes: [],
              targetTree: {},
            }
          }

          // store index in the event node
          const { indexes: eIndexes, targetTree: subTargetTree } = eventTree[eventName]
          eIndexes.push(recordIndex)

          // create sub target node when not find
          if (_.isNil(subTargetTree[newTargetName])) {
            subTargetTree[newTargetName] = {
              reference: targetRef,
              indexes: [],
            }
          }

          // store index in the sub target node
          const { indexes: subTIndexes } = subTargetTree[newTargetName]
          subTIndexes.push(recordIndex)

        }
      }

    }
    // handler tree
    if (_.isArray(handlerRecords) && handlerRecords.length > 0) {
      handlerRecords.forEach((record: TYPES.IHandlerRecord, index: number) => {
        const { handlerName } = record
        if (_.isString(handlerName) && handlerName) {

          // create handler node when not find
          if (_.isNil(handlerTree[handlerName])) {
            handlerTree[handlerName] = {
              indexes: [],
            }
          }

          // store index in the handler node
          const { indexes: lIndexes } = handlerTree[handlerName]
          lIndexes.push({
            eventIndex: recordIndex,
            handlerIndex: index,
          })
        }
      })
    }
  }
  getStaticEventProps(
    events: TYPES.IEventConfig | TYPES.IEventConfig[],
    simple?: boolean,
  ) {
    let eventArray: TYPES.IEventConfig[] = []
    if (_.isArray(events)) {
      eventArray = events
    } else {
      eventArray.push(events)
    }

    const props: TYPES.IEventProps = {}
    eventArray.forEach((config: TYPES.IEventConfig) => {
      if (_.isObject(config)) {
        const {
          eventName,
          receiveParams,
          defaultParams,
          debugList,
          target,
          resultSolver,
          simpleMode,
        } = config

        if (simple === true || simpleMode === true || _.isEqual(simpleMode, 'true')) {
          if (_.isString(eventName) && eventName.length > 0) {

            // In case that the event config changes or load new handlers
            // save handler config
            const handlerQueue = this.prepareHandlerQueue(config)
            // save param config
            const defaultConfig = _.isObject(defaultParams) ? {...defaultParams} : {}

            props[eventName] = (...args: any[]) => {
              handlerQueue.forEach((handlerConfig: TYPES.IHandlerConfig) => {
                const { handler } = handlerConfig
                if (_.isFunction(handler)) {
                  handler(...args, defaultConfig)
                }
              })
            }

          }
        } else {
          if (_.isString(eventName) && eventName.length > 0) {

            // In case that the event config changes or load new handlers
            // save handler config
            const handlerQueue = this.prepareHandlerQueue(config)
            // save param config
            const receiveConfig = _.isArray(receiveParams) ? [...receiveParams] : []
            const defaultConfig = _.isObject(defaultParams) ? {...defaultParams} : {}
            // save target config
            const targetConfig = {
              name: _.isString(target) ? target : _.get(target, 'name'),
              reference: _.get(target, 'reference'),
            }
            // save debug config
            const debugConfig = _.cloneDeep(debugList)

            props[eventName] = (...args: any[]) => {
              // copy the received param
              const receivedParam = defaultConfig
              receiveConfig.forEach((paramKey: string, index: number) => {
                if (_.isString(paramKey) && paramKey) {
                  if (!_.isUndefined(args[index])) {
                    receivedParam[paramKey] = args[index]
                  }
                }
              })

              // create event record
              const eventRecord: TYPES.IEventRecord = {
                eventName: eventName,
                queue: handlerQueue.map((item) => item.name),
                records: [],
              }

              if (_.isFinite(this.history.lastStartNumber)) {
                eventRecord.startNumber = ++(this.history.lastStartNumber)
              }

              if (_.isString(targetConfig.name) && targetConfig.name) {
                if (_.isNil(targetConfig.reference)) {
                  eventRecord.target = targetConfig.name
                } else {
                  eventRecord.target = targetConfig as TYPES.IEventTargetConfig
                }
              } else if (!_.isNil(targetConfig.reference)) {
                eventRecord.target = {
                  reference: targetConfig.reference,
                } as TYPES.IEventTargetConfig
              }

              if (_.isArray(debugConfig) && debugConfig.length > 0) {
                eventRecord.originInfo = this.generateDebugInfo(receivedParam, debugConfig)
              }

              if (_.isArray(handlerQueue) && handlerQueue.length > 0) {
                handlerQueue.forEach((handlerConfig: TYPES.IHandlerConfig) => {
                  const { simpleMode: handlerMode, handler } = handlerConfig
                  if (handlerMode === true || _.isEqual(handlerMode, 'true')) {
                    if (_.isFunction(handler)) {
                      handler(...args, defaultConfig)
                    }
                  } else {
                    const record = this.callEventHandler(
                      handlerConfig,
                      receivedParam,
                      eventRecord,
                    )
                    if (!_.isNil(record)) {
                      eventRecord.records.push(record)
                    }
                  }
                })
              }

              if (_.isArray(debugConfig) && debugConfig.length > 0) {
                eventRecord.finialInfo = this.generateDebugInfo(receivedParam, debugConfig)
              }

              this.storeHistoryRecord(eventRecord)

              const eventResult: TYPES.IEventResult = {
                eventName: eventRecord.eventName,
                queue: _.cloneDeep(eventRecord.queue),
                results: eventRecord.records.map((record: TYPES.IHandlerRecord) => {
                  const resultObj: TYPES.IHandlerResult = {
                    handlerName: record.handlerName,
                    result: record.result,
                  }
                  if (record.result instanceof Promise) {
                    resultObj.result = record.result.then((returnData: any) => {
                      resultObj.result = returnData
                      return returnData
                    })
                  }
                  return resultObj
                })
              }
              if (!_.isNil(eventRecord.target)) {
                eventResult.target = eventRecord.target
              }

              if (_.isFunction(resultSolver)) {
                return resultSolver(eventResult)
              } else {
                return eventResult
              }
            }
          }
        }
      }
    })

    return props
  }
  getDynamicEventHandler(
    event: TYPES.IEventConfig,
    simple?: boolean,
  ) {
    return (...args: any[]) => {
      if (_.isObject(event)) {
        const {
          eventName,
          receiveParams,
          defaultParams,
          debugList,
          target,
          resultSolver,
          simpleMode,
        } = event

        // get handler queue
        const handlerQueue = this.prepareHandlerQueue(event)

        if (simple === true || simpleMode === true || _.isEqual(simpleMode, 'true')) {
          handlerQueue.forEach((handlerConfig: TYPES.IHandlerConfig) => {
            const { handler } = handlerConfig
            if (_.isFunction(handler)) {
              handler(...args, defaultParams)
            }
          })
        } else {
          // copy the received param
          const receivedParam = _.isObject(defaultParams) ? {...defaultParams} : {}
          if (_.isArray(receiveParams) && receiveParams.length > 0) {
            receiveParams.forEach((paramKey: string, index: number) => {
              if (_.isString(paramKey) && paramKey) {
                if (!_.isUndefined(args[index])) {
                  receivedParam[paramKey] = args[index]
                }
              }
            })
          }

          // create event record
          const eventRecord: TYPES.IEventRecord = {
            eventName,
            queue: handlerQueue.map((item) => item.name),
            records: [],
          }

          if (_.isFinite(this.history.lastStartNumber)) {
            eventRecord.startNumber = ++(this.history.lastStartNumber)
          }

          if (!_.isNil(target)) {
            if (_.isString(target) && target) {
              eventRecord.target = target
            } else if (_.isObject(target)) {
              const targetCache: any = {}
              if (_.isString(target.name) && target.name) {
                targetCache.name = target.name
              }
              if (!_.isNil(target.reference)) {
                targetCache.reference = target.reference
              }
              if (!_.isEmpty(targetCache)) {
                eventRecord.target = targetCache
              }
            }
          }

          if (_.isArray(debugList) && debugList.length > 0) {
            eventRecord.originInfo = this.generateDebugInfo(receivedParam, debugList)
          }

          if (_.isArray(handlerQueue) && handlerQueue.length > 0) {
            handlerQueue.forEach((handlerConfig: TYPES.IHandlerConfig) => {
              const { simpleMode: handlerMode, handler } = handlerConfig
              if (handlerMode === true || _.isEqual(handlerMode, 'true')) {
                if (_.isFunction(handler)) {
                  handler(...args, defaultParams)
                }
              } else {
                const record = this.callEventHandler(
                  handlerConfig,
                  receivedParam,
                  eventRecord,
                )
                if (!_.isNil(record)) {
                  eventRecord.records.push(record)
                }
              }
            })
          }

          if (_.isArray(debugList) && debugList.length > 0) {
            eventRecord.finialInfo = this.generateDebugInfo(receivedParam, debugList)
          }

          this.storeHistoryRecord(eventRecord)

          const eventResult: TYPES.IEventResult = {
            eventName: eventRecord.eventName,
            queue: _.cloneDeep(eventRecord.queue),
            results: eventRecord.records.map((record: TYPES.IHandlerRecord) => {
              const resultObj: TYPES.IHandlerResult = {
                handlerName: record.handlerName,
                result: record.result,
              }
              if (record.result instanceof Promise) {
                resultObj.result = record.result.then((returnData: any) => {
                  resultObj.result = returnData
                  return returnData
                })
              }
              return resultObj
            })
          }
          if (!_.isNil(eventRecord.target)) {
            eventResult.target = eventRecord.target
          }

          if (_.isFunction(resultSolver)) {
            return resultSolver(eventResult)
          } else {
            return eventResult
          }
        }
      }
    }
  }

  private mapEventRecords(
    indexes: number[],
  ) {
    const history = this.history
    const indexOffset = history.indexOffset
    return indexes.map((index: number) => {
      return _.cloneDeep(history.records[index + indexOffset])
    })
  }
  private filterEventRecords(
    records: TYPES.IEventRecord[],
    exclude?: TYPES.IEventExportExclude,
    include?: TYPES.IEventExportInclude,
  ) {
    const {
      noTarget: excludeNoTarget = false,
      hasTarget: excludeHasTarget = false,
      emptyQueue: excludeEmptyQueue = false,
      nonEmptyQueue: excludeNonEmptyQueue = false,
      emptyRecord: excludeEmptyRecord= false,
      nonEmptyRecord: excludeNonEmptyRecord = false,
    } = _.isObject(exclude) ? exclude : {}

    const includeTargetName: string[] = []
    const includeTargetRef: any[] = []
    const includeEventName: string[] = []
    if (!_.isNil(include)) {
      const target = _.get(include, 'target')
      if (_.isArray(target) && target.length > 0) {
        target.forEach((item: string | TYPES.IEventTargetConfig) => {
          if (_.isString(item) && item) {
            includeTargetName.push(item)
          } else if (_.isObject(item)) {
            const { name, reference } = item
            if (_.isString(name) && name) {
              includeTargetName.push(name)
            }
            if (!_.isNil(reference)) {
              includeTargetRef.push(reference)
            }
          }
        })
      } else if (!_.isArray(target) && _.isObject(target)) {
        const { name, reference } = target
        if (_.isString(name) && name) {
          includeTargetName.push(name)
        }
        if (!_.isNil(reference)) {
          includeTargetRef.push(reference)
        }
      } else if (_.isString(target) && target) {
        includeTargetName.push(target)
      }

      const event = _.get(include, 'event')
      if (_.isArray(event) && event.length > 0) {
        event.forEach((item: string) => {
          if (_.isString(item) && item) {
            includeEventName.push(item)
          }
        })
      } else if (_.isString(event) && event) {
        includeEventName.push(event)
      }
    }

    return records.filter((record?: TYPES.IEventRecord) => {
      if (_.isNil(record)) {
        return false
      } else {
        const eventName = _.get(record, 'eventName')
        const target = _.get(record, 'target')
        const queue = _.get(record, 'queue', [])
        const records = _.get(record, 'records', [])

        const targetName = _.isString(target) ? target : _.get(target, 'name')
        const targetRef = _.get(target, 'reference')

        if (excludeNoTarget && !_.isString(targetName) && _.isNil(targetRef)) {
          return false
        }
        if (excludeHasTarget && (_.isString(targetName) || !_.isNil(targetRef))) {
          return false
        }

        if (excludeEmptyQueue && queue.length === 0) {
          return false
        }
        if (excludeNonEmptyQueue && queue.length > 0) {
          return false
        }

        if (excludeEmptyRecord && records.length === 0) {
          return false
        }
        if (excludeNonEmptyRecord && records.length > 0) {
          return false
        }

        if (includeTargetName.length > 0 && _.isString(targetName) && !includeTargetName.includes(targetName)) {
          return false
        }
        if (includeTargetRef.length > 0 && !_.isNil(targetRef) && !includeTargetRef.includes(targetRef)) {
          return false
        }
        if (includeEventName.length > 0 && !includeEventName.includes(eventName)) {
          return false
        }
      }
      return true
    })
  }
  private mapHandlerRecords(
    indexes: Array<{ eventIndex: number, handlerIndex: number }>,
  ) {
    const history = this.history
    const indexOffset = history.indexOffset
    return indexes.map((index: { eventIndex: number, handlerIndex: number }) => {
      if (_.isObject(index)) {
        const { eventIndex, handlerIndex } = index
        const eventRecord = history.records[eventIndex + indexOffset]
        if (!_.isNil(eventRecord)) {
          return _.cloneDeep(eventRecord.records[handlerIndex])
        }
      }
    })
  }
  private filterHandlerRecords(
    records: (TYPES.IHandlerRecord|undefined)[],
    exclude?: TYPES.IEventExportExclude,
    include?: TYPES.IEventExportInclude,
  ) {
    const includeHandlerName: string[] = []
    if (!_.isNil(include)) {
      const handler = _.get(include, 'handler')
      if (_.isArray(handler) && handler.length > 0) {
        handler.forEach((item: string) => {
          if (_.isString(item) && item) {
            includeHandlerName.push(item)
          }
        })
      } else if (_.isString(handler) && handler) {
        includeHandlerName.push(handler)
      }
    }

    return records.filter((record?: TYPES.IHandlerRecord) => {
      if (_.isNil(record)) {
        return false
      } else {
        const handlerName = _.get(record, 'handlerName')
        if (includeHandlerName.length > 0 && !includeHandlerName.includes(handlerName)) {
          return false
        }
      }
      return true
    })
  }
  resetHistory(
    capacity?: number
  ) {
    this.history = {
      capacity: !_.isNil(capacity) && _.isFinite(capacity) && capacity >= 0 ? capacity : 100,
      lastStartNumber: 0,
      lastStoreNumber: 0,
      records: [],
      indexTree: {
        targetTree: {},
        eventTree: {},
        handlerTree: {},
      },
      indexOffset: 0,
    }
  }
  setHistoryCapacity(
    capacity: number
  ) {
    const history = this.history

    if (_.isFinite(capacity) && capacity >= 0) {
      history.capacity = capacity

      while (history.records.length > capacity) {
        history.records.shift()
        --history.indexOffset
      }
      return true
    }
    return false
  }
  searchHistoryRecords(
    target?: string | TYPES.IEventTargetConfig,
    eventName?: string,
    exclude?: TYPES.IEventExportExclude,
  ) {
    const history = this.history
    const { indexTree: { targetTree, eventTree } } = history

    const targetName = _.isString(target) ? target : _.get(target, 'name')
    const targetRef = _.get(target, 'reference')

    if (_.isString(targetName) && targetName && !_.isNil(targetTree[targetName])) {
      const node = targetTree[targetName]

      if (_.isString(eventName) && eventName) {
        const subNode = node.eventTree[eventName]
        if (!_.isNil(subNode)) {
          return this.filterEventRecords(this.mapEventRecords(subNode.indexes), exclude)
        }
      } else {
        return this.filterEventRecords(this.mapEventRecords(node.indexes), exclude)
      }

    } else if (!_.isNil(targetRef)) {
      let result: TYPES.IEventRecord[] = []

      Object.keys(targetTree).some((name: string) => {
        const { reference } = targetTree[name]
        if (!_.isNil(reference) && reference === targetRef) {
          const node = targetTree[name]

          if (_.isString(eventName) && eventName) {
            const subNode = node.eventTree[eventName]
            if (!_.isNil(subNode)) {
              result = this.filterEventRecords(this.mapEventRecords(subNode.indexes), exclude)
            }
          } else {
            result = this.filterEventRecords(this.mapEventRecords(node.indexes), exclude)
          }

          return true
        }
        return false
      })

      return result
    } else if (_.isString(eventName) && eventName) {
      const node = eventTree[eventName]

      if (!_.isNil(node)) {
        return this.filterEventRecords(this.mapEventRecords(node.indexes), exclude)
      }

    } else {
      return this.filterEventRecords(_.cloneDeep(history.records), exclude)
    }

    return []
  }
  exportHistoryRecords(
    options?: TYPES.IEventExportOption
  ) {
    const history = this.history
    const {
      records,
      indexTree: { targetTree, eventTree, handlerTree },
    } = history

    if (!_.isNil(options) && _.isObject(options)) {
      const { struct, exclude, include, clean } = options

      let exportHistory: TYPES.IEventTargetExportTree |
        TYPES.IEventExportTree |
        TYPES.IHandlerExportTree |
        TYPES.IEventRecord[] = {}

      switch (struct) {
        case 'target-tree':
          Object.keys(targetTree).forEach((targetName: string) => {
            const records = this.filterEventRecords(
              this.mapEventRecords(targetTree[targetName].indexes),
              exclude,
              include,
              )
            if (_.isArray(records) && records.length > 0) {
              exportHistory[targetName] = records
            }
          })
          break
        case 'target-event-tree':
          Object.keys(targetTree).forEach((targetName: string) => {
            const subEventTree = targetTree[targetName].eventTree

            const eventMap = {}
            Object.keys(subEventTree).forEach((eventName: string) => {
              const records = this.filterEventRecords(
                this.mapEventRecords(subEventTree[eventName].indexes),
                exclude,
                include,
              )
              if (_.isArray(records) && records.length > 0) {
                eventMap[eventName] = records
              }
            })
            if (!_.isEmpty(eventMap)) {
              exportHistory[targetName] = eventMap
            }
          })
          break
        case 'event-tree':
          Object.keys(eventTree).forEach((eventName: string) => {
            const records = this.filterEventRecords(
              this.mapEventRecords(eventTree[eventName].indexes),
              exclude,
              include,
            )
            if (_.isArray(records) && records.length > 0) {
              exportHistory[eventName] = records
            }
          })
          break
        case 'event-target-tree':
          Object.keys(eventTree).forEach((eventName: string) => {
            const subTargetTree = eventTree[eventName].targetTree

            const targetMap = {}
            Object.keys(subTargetTree).forEach((targetName: string) => {
              const records = this.filterEventRecords(
                this.mapEventRecords(subTargetTree[targetName].indexes),
                exclude,
                include,
              )
              if (_.isArray(records) && records.length > 0) {
                targetMap[targetName] = records
              }
            })
            if (!_.isEmpty(targetMap)) {
              exportHistory[eventName] = targetMap
            }
          })
          break
        case 'handler-tree':
          Object.keys(handlerTree).forEach((handlerName: string) => {
            const records = this.filterHandlerRecords(
              this.mapHandlerRecords(handlerTree[handlerName].indexes),
              exclude,
              include,
            )
            if (_.isArray(records) && records.length > 0) {
              exportHistory[handlerName] = records
            }
          })
          break
        case 'sequence':
        default:
          exportHistory = this.filterEventRecords(
            _.cloneDeep(records),
            exclude,
            include,
          )
          break
      }

      if (clean === true) {
        history.records = []
        history.indexTree = {
          targetTree: {},
          eventTree: {},
          handlerTree: {},
        }
        history.indexOffset = 0
      }

      return exportHistory
    }

    return _.cloneDeep(records)
  }
}

export default HandlerManager
