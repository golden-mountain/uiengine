import _ from 'lodash'

import * as TYPES from '../../typings/ListenerManager'

export class ListenerManager implements TYPES.IListenerManager {
  private static instance: ListenerManager
  static getInstance() {
    if (_.isNil(ListenerManager.instance)) {
      ListenerManager.instance = new ListenerManager
    }
    return ListenerManager.instance
  }

  private listeners: TYPES.IListenerMap = {
  }
  private history: TYPES.IEventHistory = {
    capacity: 100,
    lastStartNumber: 0,
    lastStoreNumber: 0,
    records: [],
    indexTree: {
      targetTree: {},
      eventTree: {},
      listenerTree: {},
    },
    indexOffset: 0,
  }

  private defaultConflictResolver (
    listenerA: TYPES.IListenerConfig,
    listenerB: TYPES.IListenerConfig,
  ) {
    const weightA = _.get(listenerA, 'weight', 0)
    const weightB = _.get(listenerB, 'weight', 0)
    if (weightA > weightB) {
      return listenerA
    }
    return listenerB
  }
  loadListeners(
    listeners: TYPES.IListenerConfig | TYPES.IListenerConfig[],
    resolver?: TYPES.IListenerConflictResolver,
  ) {
    let listenerArray: TYPES.IListenerConfig[] = []
    if (_.isArray(listeners)) {
      listenerArray = listeners
    } else {
      listenerArray.push(listeners)
    }

    let allAreLoaded: boolean = true
    listenerArray.forEach((config: TYPES.IListenerConfig) => {
      if (_.isObject(config)) {
        const { name } = config
        if (!_.isString(name) || _.isEmpty(name)) {
          allAreLoaded = false
          return
        }

        if (_.isNil(this.listeners[name])) {
          this.listeners[name] = _.cloneDeep(config)
        } else if (_.isFunction(resolver)) {
          const prevListener = this.listeners[name]
          const nextListener = _.cloneDeep(config)
          const result = resolver(
            prevListener,
            nextListener,
          )
          if (!_.isEmpty(result)) {
            this.listeners[name] = result
          }
        } else {
          this.listeners[name] = this.defaultConflictResolver(
            this.listeners[name],
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
  unloadListeners(
    name?: string
  ) {
    if (!_.isNil(name)) {
      if (_.isString(name)) {
        delete this.listeners[name]
      } else {
        return false
      }
    } else {
      this.listeners = {}
    }
    return true
  }
  getListenerConfig(
    name: string
  ) {
    if (_.isString(name) && name.length > 0) {
      return _.cloneDeep(this.listeners[name]) || null
    }
    return this.listeners
  }

  private prepareListenerQueue(
    eventConfig: TYPES.IEventConfig
  ) {
    const { listener } = eventConfig

    const listenerQueue: TYPES.IListenerConfig[] = []
    if (_.isString(listener)) {
      if (!_.isNil(this.listeners[listener])) {
        listenerQueue.push(
          _.cloneDeep(this.listeners[listener])
        )
      }
    } else if (!_.isArray(listener) && _.isObject(listener)) {
      const { name, adapter } = listener
      if (_.isString(name) && !_.isNil(this.listeners[name])) {
        listenerQueue.push(
          _.cloneDeep({
            ...this.listeners[name],
            adapter,
          })
        )
      }
    } else if (_.isArray(listener)) {
      listener.forEach((config: string | TYPES.IEventListenerConfig) => {
        if (_.isString(config)) {
          if (!_.isNil(this.listeners[config])) {
            listenerQueue.push(
              _.cloneDeep(this.listeners[config])
            )
          }
        } else if (_.isObject(config)) {
          const { name, adapter } = config
          if (_.isString(name) && !_.isNil(this.listeners[name])) {
            listenerQueue.push(
              _.cloneDeep({
                ...this.listeners[name],
                adapter,
              })
            )
          }
        }
      })
    }

    return listenerQueue
  }
  private generateDebugInfo(
    dataSource: any,
    debugList: Array<string|TYPES.IEventDebugConfig|TYPES.IListenerDebugConfig>,
  ) {
    const info: { [debugKey: string]: any } = {}
    if (_.isArray(debugList) && debugList.length > 0) {
      debugList.forEach((config: string|TYPES.IEventDebugConfig|TYPES.IListenerDebugConfig) => {
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
  private callEventListener(
    listenerConfig: TYPES.IListenerConfig,
    receivedParam: TYPES.IListenerParam,
    eventRecord: TYPES.IEventRecord,
  ) {
    if (_.isObject(listenerConfig)) {
      const { name, paramKeys, debugList, listener, adapter } = listenerConfig

      const listenerRecord: TYPES.IListenerRecord = {
        listenerName: name,
        eventRecord,
        result: null,
      }

      const directParam: TYPES.IListenerParam = {}
      if (_.isArray(paramKeys) && paramKeys.length > 0) {

        let adaptedParam: TYPES.IListenerParam = {}
        if (_.isFunction(adapter)) {
          const paramAdapter = adapter as TYPES.IListenerParamAdapter
          try {
            adaptedParam = paramAdapter(receivedParam)
          } catch (e) {
            console.error(`Error happens in the param adapter for listener "${name}".`)
            console.error('Which is called in the event ', eventRecord.eventName, ', and its target is ', eventRecord.target)
            console.error(e)
          }
        } else if (_.isObject(adapter) && !_.isEmpty(adapter)) {
          const paramRouteMap = adapter as TYPES.IListenerParamRouteMap
          Object.keys(paramRouteMap).forEach((key: string) => {
            if (_.isString(paramRouteMap[key]) && paramRouteMap[key]) {
              adaptedParam[key] = _.get(receivedParam, paramRouteMap[key])
            }
          })
        } else {
          adaptedParam = receivedParam
        }

        paramKeys.forEach((item: string | TYPES.IListenerParamConfig) => {
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
        listenerRecord.originInfo = this.generateDebugInfo(directParam, debugList)
      }

      if (_.isFunction(listener)) {
        const { eventName, queue, records } = eventRecord
        const helper: TYPES.IListenerHelper = {
          getEventName: () => eventName,
          getListenerQueue: () => queue,
          getListenerRecords: () => records,
        }
        try {
          const result = listener(directParam, helper)
          if (result instanceof Promise) {
            listenerRecord.result = result.then((returnData: any) => {
              if (_.isArray(debugList) && debugList.length > 0) {
                listenerRecord.finialInfo = this.generateDebugInfo(directParam, debugList)
              }
              listenerRecord.result = returnData
              return returnData
            })
          } else {
            listenerRecord.result = result
          }
        } catch(e) {
          console.error(`Error happens when call the listener "${name}".`)
          console.error('Which is called in the event ', eventName, ', its target is ', eventRecord.target)
          console.error(e)
        }
      } else {
        this.defaultEventListener(eventRecord, listenerRecord)
      }

      if (
        !(listenerRecord.result instanceof Promise) &&
        _.isArray(debugList) && debugList.length > 0
      ) {
        listenerRecord.finialInfo = this.generateDebugInfo(directParam, debugList)
      }

      return listenerRecord
    }
  }
  private defaultEventListener(
    eventRecord: TYPES.IEventRecord,
    listenerRecord: TYPES.IListenerRecord
  ) {
    const { eventName, target } = eventRecord
    const { listenerName } = listenerRecord
    console.log(`In the "${eventName}" event, the "${listenerName}" listener has no function to call.`)
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
      indexTree: { targetTree, eventTree, listenerTree },
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
    const { eventName, target, records: listenerRecords } = eventRecord
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
    // listener tree
    if (_.isArray(listenerRecords) && listenerRecords.length > 0) {
      listenerRecords.forEach((record: TYPES.IListenerRecord, index: number) => {
        const { listenerName } = record
        if (_.isString(listenerName) && listenerName) {

          // create listener node when not find
          if (_.isNil(listenerTree[listenerName])) {
            listenerTree[listenerName] = {
              indexes: [],
            }
          }

          // store index in the listener node
          const { indexes: lIndexes } = listenerTree[listenerName]
          lIndexes.push({
            eventIndex: recordIndex,
            listenerIndex: index,
          })
        }
      })
    }
  }
  getStaticEventProps(
    events: TYPES.IEventConfig | TYPES.IEventConfig[]
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
        } = config

        if (_.isString(eventName) && eventName.length > 0) {

          // In case that the event config changes or load new listeners
          // save listener config
          const listenerQueue = this.prepareListenerQueue(config)
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
              queue: listenerQueue.map((item) => item.name),
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

            if (_.isArray(listenerQueue) && listenerQueue.length > 0) {
              listenerQueue.forEach((listenerConfig: TYPES.IListenerConfig) => {
                const record = this.callEventListener(
                  listenerConfig,
                  receivedParam,
                  eventRecord,
                )
                if (!_.isNil(record)) {
                  eventRecord.records.push(record)
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
              results: eventRecord.records.map((record: TYPES.IListenerRecord) => {
                const resultObj: TYPES.IListenerResult = {
                  listenerName: record.listenerName,
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
    })

    return props
  }
  getDynamicEventListener(
    event: TYPES.IEventConfig
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
        } = event

        // get listener queue
        const listenerQueue = this.prepareListenerQueue(event)

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
          queue: listenerQueue.map((item) => item.name),
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

        if (_.isArray(listenerQueue) && listenerQueue.length > 0) {
          listenerQueue.forEach((listenerConfig: TYPES.IListenerConfig) => {
            const record = this.callEventListener(
              listenerConfig,
              receivedParam,
              eventRecord,
            )
            if (!_.isNil(record)) {
              eventRecord.records.push(record)
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
          results: eventRecord.records.map((record: TYPES.IListenerRecord) => {
            const resultObj: TYPES.IListenerResult = {
              listenerName: record.listenerName,
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
  private mapListenerRecords(
    indexes: Array<{ eventIndex: number, listenerIndex: number }>,
  ) {
    const history = this.history
    const indexOffset = history.indexOffset
    return indexes.map((index: { eventIndex: number, listenerIndex: number }) => {
      if (_.isObject(index)) {
        const { eventIndex, listenerIndex } = index
        const eventRecord = history.records[eventIndex + indexOffset]
        if (!_.isNil(eventRecord)) {
          return _.cloneDeep(eventRecord.records[listenerIndex])
        }
      }
    })
  }
  private filterListenerRecords(
    records: (TYPES.IListenerRecord|undefined)[],
    exclude?: TYPES.IEventExportExclude,
    include?: TYPES.IEventExportInclude,
  ) {
    const includeListenerName: string[] = []
    if (!_.isNil(include)) {
      const listener = _.get(include, 'listener')
      if (_.isArray(listener) && listener.length > 0) {
        listener.forEach((item: string) => {
          if (_.isString(item) && item) {
            includeListenerName.push(item)
          }
        })
      } else if (_.isString(listener) && listener) {
        includeListenerName.push(listener)
      }
    }

    return records.filter((record?: TYPES.IListenerRecord) => {
      if (_.isNil(record)) {
        return false
      } else {
        const listenerName = _.get(record, 'listenerName')
        if (includeListenerName.length > 0 && !includeListenerName.includes(listenerName)) {
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
        listenerTree: {},
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
      indexTree: { targetTree, eventTree, listenerTree },
    } = history

    if (!_.isNil(options) && _.isObject(options)) {
      const { struct, exclude, include, clean } = options

      let exportHistory: TYPES.IEventTargetExportTree |
        TYPES.IEventExportTree |
        TYPES.IListenerExportTree |
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
        case 'listener-tree':
          Object.keys(listenerTree).forEach((listenerName: string) => {
            const records = this.filterListenerRecords(
              this.mapListenerRecords(listenerTree[listenerName].indexes),
              exclude,
              include,
            )
            if (_.isArray(records) && records.length > 0) {
              exportHistory[listenerName] = records
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
          listenerTree: {},
        }
        history.indexOffset = 0
      }

      return exportHistory
    }

    return _.cloneDeep(records)
  }
}

export default ListenerManager
