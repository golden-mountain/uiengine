import _ from 'lodash'
import * as TYPES from '../../typings/PluginManager'

export class PluginManager implements TYPES.IPluginManager {
  private static instance: PluginManager
  static getInstance() {
    if (_.isNil(PluginManager.instance)) {
      PluginManager.instance = new PluginManager
    }
    return PluginManager.instance
  }

  private scopes: TYPES.IPluginScopeMap = {
    global: {
      name: 'global',
      plugins: {},
      subScopes: {},
    }
  }
  private registry: TYPES.IPluginCallerRegistry = {
  }
  private history: TYPES.IPluginHistory = {
    capacity: 100,
    lastStartNumber: 0,
    lastStoreNumber: 0,
    records: [],
    indexTree: {
      idTree: {
      },
      categoryTree: {
      }
    },
    indexOffset: 0,
  }

  private searchPluginScope(
    scopeMap: TYPES.IPluginScopeMap,
    scopePath: string[],
    autoCreate?: boolean
  ) {
    const [topScope, ...restPath] = scopePath

    if (_.isNil(scopeMap[topScope])) {
      if (autoCreate === true) {
        scopeMap[topScope] = {
          name: topScope,
          plugins: {},
        }
      } else {
        return null
      }
    }

    if (restPath.length > 0) {
      let currentScope: TYPES.IPluginScope = scopeMap[topScope]
      const isFound = restPath.every((subScopeName: string) => {
        if (_.isNil(currentScope.subScopes)) {
          if (autoCreate) {
            currentScope.subScopes = {}
          } else {
            return false
          }
        }
        if (_.isNil(currentScope.subScopes[subScopeName])) {
          if (autoCreate) {
            currentScope.subScopes[subScopeName] = {
              name: subScopeName,
              plugins: {}
            }
          } else {
            return false
          }
        }
        currentScope = currentScope.subScopes[subScopeName]
        return true
      })
      if (isFound) {
        return currentScope
      } else {
        return null
      }
    } else {
      return scopeMap[topScope]
    }
  }

  private getPluginWeight(
    plugin: TYPES.IPlugin,
    scopePath?: string
  ) {
    let weight: number = _.get(plugin, 'weight', 0)
    if (_.isString(scopePath)) {
      const scopeConfig = _.get(plugin, 'scopePaths')
      if (_.isArray(scopeConfig)) {
        scopeConfig.forEach((config: string | TYPES.IPluginScopeConfig) => {
          if (_.isObject(config)) {
            const path = _.get(config, 'path')
            if (path === scopePath) {
              weight = _.get(config, 'weight', weight)
            }
          }
        })
      } else if (_.isObject(scopeConfig)) {
        const path = _.get(scopeConfig, 'path')
        if (path === scopePath) {
          weight = _.get(scopeConfig, 'weight', weight)
        }
      }
    }
    return weight
  }
  private defaultConflictResolver(
    pluginA: TYPES.IPlugin,
    pluginB: TYPES.IPlugin,
    infor: TYPES.IPluginConflictInfo,
  ) {
    const { scopePath } = infor
    const weightA = this.getPluginWeight(pluginA, scopePath)
    const weightB = this.getPluginWeight(pluginB, scopePath)
    if (weightA > weightB) {
      return pluginA
    }
    return pluginB
  }
  loadPlugins(
    plugins: TYPES.IPlugin | TYPES.IPlugin[],
    resolver?: TYPES.IPluginConflictResolver
  ) {
    let pluginArray: TYPES.IPlugin[] = []
    if (_.isArray(plugins)) {
      pluginArray = plugins
    } else {
      pluginArray.push(plugins)
    }

    let allAreLoaded: boolean = true
    pluginArray.forEach((plugin: TYPES.IPlugin) => {
      if (!_.has(plugin, 'name')) {
        allAreLoaded = false
        return
      }
      const { name, categories, scopePaths } = plugin

      let categoryList: string[] = []
      if (_.isArray(categories) && categories.length > 0) {
        categoryList = categories.map((config: string | TYPES.IPluginCategoryConfig) => {
          if (!_.isString(config)) {
            return _.get(config, 'name', 'undefined')
          } else {
            return config
          }
        })
      } else if (_.isObject(categories)) {
        categoryList.push(_.get(categories, 'name', 'undefined'))
      } else if (_.isString(categories)) {
        categoryList.push(categories)
      }
      let workingScopes: string[] = ['global']
      if (_.isArray(scopePaths) && scopePaths.length > 0) {
        workingScopes = scopePaths.map((config: string | TYPES.IPluginScopeConfig) => {
          if (!_.isString(config)) {
            return _.get(config, 'path', 'undefined')
          } else {
            return config
          }
        })
      } else if (_.isObject(scopePaths)) {
        categoryList = [_.get(categories, 'path', 'undefined')]
      } else if (_.isString(scopePaths)) {
        workingScopes = [scopePaths]
      }

      workingScopes.forEach((scopePath: string) => {
        const paths: string[] = scopePath.split('.')
        const scopeConfig = this.searchPluginScope(this.scopes, paths, true)
        if (!_.isNil(scopeConfig)) {
          const { plugins: categoryMap } = scopeConfig

          categoryList.forEach((category: string) => {
            if (_.isNil(categoryMap[category])) {
              categoryMap[category] = {}
            }
            if (_.isNil(categoryMap[category][name])) {
              categoryMap[category][name] = _.cloneDeep(plugin)
            } else if (_.isFunction(resolver)) {
              const prevPlugin = categoryMap[category][name]
              const nextPlugin = _.cloneDeep(plugin)
              const result = resolver(
                prevPlugin,
                nextPlugin,
                {
                  scopePath,
                  category,
                }
              )
              if (!_.isEmpty(result)) {
                categoryMap[category][name] = result
              }
            } else {
              const prevPlugin = categoryMap[category][name]
              const nextPlugin = _.cloneDeep(plugin)
              categoryMap[category][name] = this.defaultConflictResolver(
                prevPlugin,
                nextPlugin,
                {
                  scopePath,
                  category,
                }
              )
            }
          })
        }
      })
    })
    return allAreLoaded
  }
  unloadPlugins(
    scopePath?: string,
    category?: string | string[],
    name?: string | string[],
  ) {
    // validate scopePath
    if (_.isString(scopePath) && scopePath.length > 0) {
      const scopeConfig = this.searchPluginScope(this.scopes, scopePath.split('.'))
      if (!_.isNil(scopeConfig)) {

        // validate category
        if (_.isNil(category)) {
          // no specified category
          scopeConfig.plugins = {}
        } else {
          const { plugins } = scopeConfig

          let categoryList: string[] = []
          if (_.isArray(category) && category.length > 0) {
            categoryList = category
          } else if (_.isString(category)) {
            categoryList.push(category)
          }

          categoryList.forEach((categoryName: string) => {
            if (!_.isString(categoryName)) {
              return
            }
            const categoryMap = plugins[categoryName]
            if (!_.isNil(categoryMap)) {

              // validate name
              if (_.isNil(name)) {
                // no specified name
                delete plugins[categoryName]
              } else {

                let nameList: string[] = []
                if (_.isArray(name) && name.length > 0) {
                  nameList = name
                } else if (_.isString(name)) {
                  nameList.push(name)
                }

                nameList.forEach((pluginName: string) => {
                  if (!_.isString(pluginName)) {
                    return
                  }
                  delete categoryMap[pluginName]
                })
              }
            }
          })
        }
        return true
      } else {
        // no scope config
        return false
      }
    } else {
      // no scope path
      return false
    }
  }
  getPlugins(
    scopePath?: string,
    category?: string,
    name?: string,
  ) {
    if (_.isNil(scopePath)) {
      return this.scopes
    } else if (!_.isString(scopePath)) {
      return null
    }

    const scopeConfig = this.searchPluginScope(this.scopes, scopePath.split('.'))
    if (_.isNil(scopeConfig)) {
      return null
    } else if (_.isNil(category)) {
      return scopeConfig.plugins
    } else if (!_.isString(category)) {
      return null
    }

    const pluginMap = scopeConfig.plugins[category] || null
    if (_.isNil(pluginMap) || _.isNil(name)) {
      return pluginMap
    } else if (!_.isString(name)) {
      return null
    }

    return pluginMap[name] || null
  }

  register(
    id: string,
    info?: TYPES.IPluginCallerRegisterInfo
  ) {
    if (_.isString(id) && id.length > 0) {
      let registerInfo: TYPES.IPluginCallerRegisterInfo | undefined = info

      if (_.isNil(registerInfo) || !_.isObject(registerInfo)) {
        registerInfo = {
          categories: [],
          scopePaths: ['global'],
        }
      } else {
        const { categories, scopePaths } = registerInfo

        const infoObj = {
          categories: [] as string[],
          scopePaths: [] as string[],
        }

        if (_.isArray(categories) && categories.length > 0) {
          categories.forEach((item: string) => {
            if (_.isString(item)) {
              infoObj.categories.push(item)
            }
          })
        } else if (_.isString(categories)) {
          infoObj.categories.push(categories)
        }

        if (_.isNil(scopePaths)) {
          infoObj.scopePaths.push('global')
        } else if (_.isArray(scopePaths)) {
          if (scopePaths.length === 0) {
            infoObj.scopePaths.push('global')
          } else {
            scopePaths.forEach((item: string) => {
              if (_.isString(item)) {
                infoObj.scopePaths.push(item)
              }
            })
          }
        } else if (_.isString(scopePaths)) {
          infoObj.scopePaths.push(scopePaths)
        }

        registerInfo = infoObj
      }

      this.registry[id] = registerInfo
      return true
    }
    return false
  }
  unregister(
    id: string,
  ) {
    if (_.isString(id) && id.length > 0) {
      delete this.registry[id]
      return true
    }
    return false
  }
  getRegisterInfo(
    id: string,
  ) {
    if (_.isString(id) && id.length > 0) {
      const info = this.registry[id]
      if (!_.isNil(info)) {
        return {
          categories: _.cloneDeep(info.categories),
          scopePaths: _.cloneDeep(info.scopePaths),
        } as TYPES.IPluginCallerRegisterInfo
      }
    }
    return null
  }

  private mapHistoryRecords(
    indexes: number[],
  ) {
    const history = this.history
    const indexOffset = history.indexOffset
    return indexes.map((index: number) => {
      return _.cloneDeep(history.records[index + indexOffset])
    })
  }
  private filterHistoryRecords(
    records: TYPES.IPluginExecuteRecord[],
    exclude?: TYPES.IPluginExportExclude,
    include?: TYPES.IPluginExportInclude,
  ) {
    let excludeEmptyQueue = false
    let excludeNonEmptyQueue = false
    let excludeEmptyRecord = false
    let excludeNonEmptyRecord = false
    if (_.isString(exclude)) {
      switch (exclude) {
        case 'empty-queue':
          excludeEmptyQueue = true
          break
        case 'non-empty-queue':
          excludeNonEmptyQueue = true
          break
        case 'empty-record':
          excludeEmptyRecord = true
          break
        case 'non-empty-record':
          excludeNonEmptyRecord = true
          break
      }
    } else if (_.isArray(exclude)) {
      exclude.forEach((item: TYPES.IPluginExcludeType) => {
        switch (item) {
          case 'empty-queue':
            excludeEmptyQueue = true
            break
          case 'non-empty-queue':
            excludeNonEmptyQueue = true
            break
          case 'empty-record':
            excludeEmptyRecord = true
            break
          case 'non-empty-record':
            excludeNonEmptyRecord = true
            break
        }
      })
    }

    const includeId: string[] = []
    const includeCategory: Array<string|null> = []
    if (!_.isNil(include)) {
      const id = _.get(include, 'id')
      if (_.isArray(id) && id.length > 0) {
        id.forEach((item: any) => {
          if (_.isString(item)) {
            includeId.push(item)
          }
        })
      } else if (_.isString(id)) {
        includeId.push(id)
      }
      const category = _.get(include, 'category')
      if (_.isArray(category) && category.length > 0) {
        category.forEach((item: any) => {
          if (_.isString(item)) {
            includeCategory.push(item)
          } else if (item === null) {
            includeCategory.push(item)
          }
        })
      } else if (_.isString(category)) {
        includeCategory.push(category)
      } else if (category === null) {
        includeCategory.push(category)
      }
    }

    return records.filter((record?: TYPES.IPluginExecuteRecord) => {
      let passFilter: boolean = true
      if (_.isNil(record)) {
        passFilter = false
      } else {
        const id = _.get(record, 'id')
        const category = _.get(record, 'category')
        const queue = _.get(record, 'queue', [])
        const records = _.get(record, 'records', [])
        if (excludeEmptyQueue && queue.length === 0) {
          passFilter = false
        }
        if (excludeNonEmptyQueue && queue.length > 0) {
          passFilter = false
        }
        if (excludeEmptyRecord && records.length === 0) {
          passFilter = false
        }
        if (excludeNonEmptyRecord && records.length > 0) {
          passFilter = false
        }

        if (includeId.length > 0 && !includeId.includes(id)) {
          passFilter = false
        }
        if (includeCategory.length > 0 && !includeCategory.includes(category)) {
          passFilter = false
        }
      }
      return passFilter
    })
  }
  resetHistory(
    capacity?: number,
  ) {
    this.history = {
      capacity: !_.isNil(capacity) && _.isFinite(capacity) ? capacity : 100,
      lastStartNumber: 0,
      lastStoreNumber: 0,
      records: [],
      indexTree: {
        idTree: {
        },
        categoryTree: {
        }
      },
      indexOffset: 0,
    }
  }
  searchHistoryRecords(
    id?: string,
    category?: string,
    exclude?: TYPES.IPluginExportExclude,
  ) {
    const history = this.history

    if (!_.isNil(id) && _.isString(id) && !_.isEmpty(id)) {
      const node = history.indexTree.idTree[id]

      if (!_.isNil(node)) {
        if (!_.isNil(category) && _.isString(category) && !_.isEmpty(category)) {
          const subNode = node.categoryTree[category]
          if (!_.isNil(subNode)) {
            return this.filterHistoryRecords(this.mapHistoryRecords(subNode.indexes), exclude)
          }
        } else {
          return this.filterHistoryRecords(this.mapHistoryRecords(node.indexes), exclude)
        }
      }
    } else if (!_.isNil(category) && _.isString(category) && !_.isEmpty(category)) {
      const node = history.indexTree.categoryTree[category]

      if (!_.isNil(node)) {
        if (!_.isNil(id) && _.isString(id) && !_.isEmpty(id)) {
          const subNode = node.idTree[id]
          if (!_.isNil(subNode)) {
            return this.filterHistoryRecords(this.mapHistoryRecords(subNode.indexes), exclude)
          }
        } else {
          return this.filterHistoryRecords(this.mapHistoryRecords(node.indexes), exclude)
        }
      }
    } else {
      return this.filterHistoryRecords(_.cloneDeep(history.records), exclude)
    }
    return []
  }
  exportHistoryRecords(
    options?: TYPES.IPluginExportOption,
  ) {
    const history = this.history
    const idTree = history.indexTree.idTree
    const categoryTree = history.indexTree.categoryTree

    let exportHistory: TYPES.IPluginExportTree | TYPES.IPluginExecuteRecord[] = {}
    if (!_.isNil(options) && _.isObject(options)) {
      const { struct, exclude, include, clean } = options

      switch (struct) {
        case 'id-tree':
          Object.keys(idTree).forEach((id: string) => {
            const records = this.filterHistoryRecords(
              this.mapHistoryRecords(idTree[id].indexes),
              exclude,
              include,
              )
            if (_.isArray(records) && records.length > 0) {
              exportHistory[id] = records
            }
          })
          break
        case 'id-category-tree':
          Object.keys(idTree).forEach((id: string) => {
            const cTree = idTree[id].categoryTree

            const categoryMap = {}
            Object.keys(cTree).forEach((category: string) => {
              const records = this.filterHistoryRecords(
                this.mapHistoryRecords(cTree[category].indexes),
                exclude,
                include,
              )
              if (_.isArray(records) && records.length > 0) {
                categoryMap[category] = records
              }
            })
            if (!_.isEmpty(categoryMap)) {
              exportHistory[id] = categoryMap
            }
          })
          break
        case 'category-tree':
          Object.keys(categoryTree).forEach((category: string) => {
            const records = this.filterHistoryRecords(
              this.mapHistoryRecords(categoryTree[category].indexes),
              exclude,
              include,
            )
            if (_.isArray(records) && records.length > 0) {
              exportHistory[category] = records
            }
          })
          break
        case 'category-id-tree':
          Object.keys(categoryTree).forEach((category: string) => {
            const iTree = categoryTree[category].idTree

            const idMap = {}
            Object.keys(iTree).forEach((id: string) => {
              const records = this.filterHistoryRecords(
                this.mapHistoryRecords(iTree[id].indexes),
                exclude,
                include,
              )
              if (_.isArray(records) && records.length > 0) {
                idMap[id] = records
              }
            })
            if (!_.isEmpty(idMap)) {
              exportHistory[category] = idMap
            }
          })
          break
        case 'sequence':
        default:
          exportHistory = this.filterHistoryRecords(
            _.cloneDeep(history.records),
            exclude,
            include,
          )
          break
      }

      if (clean === true) {
        history.records = []
        history.indexTree = {
          idTree: {},
          categoryTree: {},
        }
        history.indexOffset = 0
      }

      return exportHistory
    }

    return _.cloneDeep(history.records)
  }

  private sortPluginsByPriority (
    pluginMap: TYPES.IPluginMap,
    category?: string,
  ) {
    // get priority
    let pQueue = Object.values(pluginMap).map((plugin: TYPES.IPlugin) => {
      let priority = _.get(plugin, 'priority', 0)
      const categories = _.get(plugin, 'categories')
      if (_.isArray(categories) && categories.length > 0) {
        categories.forEach((config: string | TYPES.IPluginCategoryConfig) => {
          if (_.isObject(config) && config.name === category) {
            priority = _.get(config, 'priority', priority)
          }
        })
      } else if (_.isObject(categories)) {
        if (_.get(categories, 'name') === category) {
          priority = _.get(categories, 'priority', priority)
        }
      }
      return {
        priority,
        plugin
      }
    })

    // sort by priority
    pQueue.sort((pluginA, pluginB) => {
      let priorityA = _.get(pluginA, 'priority', 0)
      let priorityB = _.get(pluginB, 'priority', 0)
      return priorityB - priorityA
    })

    return pQueue.map((plugin) => {
      return plugin.plugin
    })
  }
  private preparePluginQueue (
    id: string,
    category: string,
    options?: TYPES.IPluginExecuteOption
  ) {
    let registerInfo: TYPES.IPluginCallerRegisterInfo | null = null
    if (_.isString(id) && id.length > 0) {
      registerInfo = this.registry[id] || null
    }

    if (_.isNil(registerInfo)) {
      return {
        status: 'IN_ERROR',
        errorInfo: `The id ${id} is not registered in the PluginManager`,
        results: [],
      } as TYPES.IPluginExecutionResult
    } else {
      const { categories: validCategory, scopePaths: workScope } = registerInfo
      if (_.isNil(validCategory) || !validCategory.includes(category)) {
        return {
          status: 'IN_ERROR',
          errorInfo: `The category ${category} is not registered by the id ${id}`,
          results: [],
        } as TYPES.IPluginExecutionResult
      } else {
        const pluginMap: TYPES.IPluginMap = {}
        if (_.isArray(workScope) && workScope.length > 0) {
          workScope.forEach((scopeString: string) => {
            const scopePath: string[] = scopeString.split('.')

            let currentMap: {[key: string]: TYPES.IPluginScope} | null = this.scopes
            scopePath.every((path: string) => {
              if (_.isNil(currentMap)) {
                return false
              }
              const scopeConfig = this.searchPluginScope(currentMap, [path])
              if (_.isNil(scopeConfig)) {
                return false
              }
              const { plugins, subScopes } = scopeConfig
              if (!_.isNil(plugins[category])) {
                Object.assign(pluginMap, plugins[category])
              }

              if (_.isNil(subScopes)) {
                currentMap = null
              } else {
                currentMap = subScopes
              }
              return true
            })
          })
        }

        let executeQueue: TYPES.IPlugin[] = []
        if (!_.isNil(options)) {
          const { exclude, beforeAll, afterAll, extraInvoker } = options

          // exclude plugins
          if (_.isArray(exclude) && exclude.length > 0) {
            exclude.forEach((name: string) => {
              if (_.isString(name)) {
                delete pluginMap[name]
              }
            })
          } else if (_.isString(exclude)) {
            delete pluginMap[exclude]
          }

          // plugins execute before others
          const beforeQueue: TYPES.IPlugin[] = []
          if (_.isArray(beforeAll) && beforeAll.length > 0) {
            beforeAll.forEach((name: string) => {
              if (_.isString(name) && !_.isNil(pluginMap[name])) {
                beforeQueue.push(pluginMap[name])
                delete pluginMap[name]
              }
            })
          } else if (_.isString(beforeAll)) {
            if (!_.isNil(pluginMap[beforeAll])) {
              beforeQueue.push(pluginMap[beforeAll])
              delete pluginMap[beforeAll]
            }
          }

          // plugins execute after others
          const afterQueue: TYPES.IPlugin[] = []
          if (_.isArray(afterAll) && afterAll.length > 0) {
            afterAll.forEach((name: string) => {
              if (_.isString(name) && !_.isNil(pluginMap[name])) {
                afterQueue.push(pluginMap[name])
                delete pluginMap[name]
              }
            })
          } else if (_.isString(afterAll)) {
            if (!_.isNil(pluginMap[afterAll])) {
              afterQueue.push(pluginMap[afterAll])
              delete pluginMap[afterAll]
            }
          }

          // sort by priority
          const midQueue: TYPES.IPlugin[] = this.sortPluginsByPriority(pluginMap, category)
          executeQueue = executeQueue.concat(
            beforeQueue,
            midQueue,
            afterQueue,
          )

          if (_.isFunction(extraInvoker)) {
            try {
              const result = extraInvoker(executeQueue)
              if (_.isArray(result)) {
                const validPlugin = result.every((plugin: TYPES.IPlugin) => {
                  return !_.isNil(plugin.name)
                })
                if (validPlugin) {
                  executeQueue = result
                } else {
                  throw Error('Plugin invoker returns invalid plugins which has no name')
                }
              }
            } catch(e) {
              console.log(e)
            }
          }

        } else {
          executeQueue = this.sortPluginsByPriority(pluginMap, category)
        }
        return executeQueue
      }
    }
  }
  private adapteParam (
    param: any,
    plugin: TYPES.IPlugin,
    category: string,
  ) {
    if (_.isObject(plugin) && _.isObject(param)) {
      const { categories } = plugin
      if (_.isArray(categories)) {
        let adapter: TYPES.IPluginParamRouteMap | TYPES.IPluginParamAdapter | any = null
        categories.forEach((config: string | TYPES.IPluginCategoryConfig) => {
          if (_.isObject(config) && config.name === category) {
            adapter = _.get(config, 'adapter', null)
          }
        })

        if (_.isNil(adapter)) {
          return param
        } else if (_.isFunction(adapter)) {
          return adapter(param)
        } else if (_.isObject(adapter) && !_.isEmpty(adapter)) {
          const adaptedParam = {}
          Object.keys(adapter).forEach((key: string) => {
            if (_.isString(adapter[key])) {
              adaptedParam[key] = _.get(param, adapter[key])
            }
          })
          return Object.assign({}, param, adaptedParam)
        }
      }
    }
    return param
  }
  private storeExecuteRecord(
    id: string,
    category: string | null,
    queue: string[],
    records: TYPES.IPluginRecord[],
    startNumber: number,
  ) {
    const history = this.history
    const list = history.records
    const idTree = history.indexTree.idTree
    const categoryTree = history.indexTree.categoryTree

    while (list.length >= history.capacity) {
      list.shift()
      history.indexOffset--
    }

    const index = list.push({
      id,
      category,
      queue,
      records,
      startNumber,
      storeNumber: ++history.lastStoreNumber,
    }) - 1 - history.indexOffset

    const categoryName = category || 'undefined'

    let idNode = idTree[id]
    if (_.isNil(idNode)) {
      idTree[id] = {
        indexes: [],
        categoryTree: {}
      }
      idNode = idTree[id]
    }
    idNode.indexes.push(index)

    let subCNode = idNode.categoryTree[categoryName]
    if (_.isNil(subCNode)) {
      idNode.categoryTree[categoryName] = {
        indexes: []
      }
      subCNode = idNode.categoryTree[categoryName]
    }
    subCNode.indexes.push(index)

    let categoryNode = categoryTree[categoryName]
    if (_.isNil(categoryNode)) {
      categoryTree[categoryName] = {
        indexes: [],
        idTree: {}
      }
      categoryNode = categoryTree[categoryName]
    }
    categoryNode.indexes.push(index)

    let subINode = categoryNode.idTree[id]
    if (_.isNil(subINode)) {
      categoryNode.idTree[id] = {
        indexes: []
      }
      subINode = categoryNode.idTree[id]
    }
    subINode.indexes.push(index)
  }
  private defaultPluginExecution(
    plugin: TYPES.IPlugin,
    param: any,
    helper: TYPES.IPluginExecutionHelper
  ) {
    const name = _.get(plugin, 'name', 'Unknown')
    console.log(`run plugin "${name}" without execution.`)
    return null
  }
  private getDebugInfo(
    param: any,
    debugList: Array<string|TYPES.IPluginDebugConfig>
  ) {
    const info = {}
    if (_.isArray(debugList)) {
      debugList.forEach((config: string | TYPES.IPluginDebugConfig) => {
        if (_.isString(config)) {
          info[config] = _.cloneDeep(_.get(param, config))
        } else if (_.isObject(config)) {
          const { lineage, label } = config
          if (_.isString(lineage)) {
            const key = _.isString(label) && label ? label : lineage
            info[key] = _.cloneDeep(_.get(param, lineage))
          }
        }
      })
    }
    return info
  }
  private async asyncExecute(
    plugin: TYPES.IPlugin,
    param: any,
    info: TYPES.IPluginExecutionInfo,
    debugKeys?: Array<string|TYPES.IPluginDebugConfig>
  ) {
    // prepare helper
    const exeHelper: TYPES.IPluginExecutionHelper = {
      getCallerId: () => {
        return _.get(info, 'caller', null)
      },
      getCategoryName: () => {
        return _.get(info, 'category', null)
      },
      getExecuteQueue: () => {
        const queue = _.get(info, 'queue', null)
        if (_.isArray(queue)) {
          return queue.map((item: string | TYPES.IPlugin) => {
            if (_.isString(item)) {
              return item
            } else {
              return _.get(item, 'name', 'unknown')
            }
          })
        } else {
          return null
        }
      },
      getExecuteRecords: () => {
        return _.cloneDeep(_.get(info, 'records', null))
      },
    }

    // prepare record
    const { name, paramKeys, debugList = debugKeys, execution } = plugin
    const record: TYPES.IPluginRecord = {
      pluginName: name,
      result: null,
    }

    // prepare param
    const exeParam = {}
    if (_.isArray(paramKeys) && paramKeys.length > 0) {
      paramKeys.forEach((config: string | TYPES.IPluginParamConfig) => {
        if (_.isString(config)) {
          exeParam[config] = _.get(param, config)
        } else if (_.isObject(config)) {
          const { key, default: defaultValue } = config
          if (_.isString(key)) {
            exeParam[key] = _.get(param, key, defaultValue)
          }
        }
      })
    } else if (_.isString(paramKeys)) {
      exeParam[paramKeys] = _.get(param, paramKeys)
    } else if (_.isObject(paramKeys)) {
      const key = _.get(paramKeys, 'key')
      const defaultValue = _.get(paramKeys, 'default')
      if (_.isString(key)) {
        exeParam[key] = _.get(param, key, defaultValue)
      }
    }

    // execute
    if (_.isArray(debugList) && debugList.length > 0) {
      record.originInfo = this.getDebugInfo(param, debugList)
    }
    if (_.isFunction(execution)) {
      try {
        record.result = await execution(exeParam, exeHelper)
      } catch(e) {
        const caller = _.get(info, 'caller', null)
        const category = _.get(info, 'category', null)
        console.error(e)
        console.error(`The above error happens in the execution of plugin ${name}, which is called by ${caller}
          ${category ? ` for ${category}` : ''}.`)
      }
    } else {
      this.defaultPluginExecution(plugin, exeParam, exeHelper)
    }
    if (_.isArray(debugList) && debugList.length > 0) {
      record.finialInfo = this.getDebugInfo(param, debugList)
    }

    return record
  }
  async executePlugin(
    id: string,
    plugin: TYPES.IPlugin,
    param: any,
  ) {
    const startNumber = ++this.history.lastStartNumber

    let registerInfo: TYPES.IPluginCallerRegisterInfo | null = null
    if (_.isString(id) && id.length > 0) {
      registerInfo = this.registry[id] || null
    }

    if (_.isNil(registerInfo)) {
      return {
        status: 'IN_ERROR',
        errorInfo: `The id ${id} is not registered in the PluginManager`,
        results: [],
      } as TYPES.IPluginExecutionResult
    } else {
      const queue = [plugin.name]
      const record = await this.asyncExecute(
        plugin,
        param,
        { caller: id, queue, records: [] },
        [],
      )

      this.storeExecuteRecord(id, null, queue, [record], startNumber)

      return {
        status: 'COMPLETED',
        results: [{ name: record.pluginName, result: record.result }],
      } as TYPES.IPluginExecutionResult
    }
  }
  async executePlugins(
    id: string,
    category: string,
    param: any,
    options?: TYPES.IPluginExecuteOption
  ) {
    const startNumber = ++this.history.lastStartNumber

    const executeQueue = this.preparePluginQueue(id, category, options)
    if (!_.isArray(executeQueue)) {
      return executeQueue
    }

    let status: string = 'NORMAL'
    const records: TYPES.IPluginRecord[] = []
    if (!_.isNil(options)) {
      const { beforeExecute, afterExecute, debugList } = options
      for( let index = 0; index < executeQueue.length; index++ ) {
        const plugin = executeQueue[index]

        // call adapter
        const realParam = await this.adapteParam(param, plugin, category)

        // call intercepter
        if (_.isFunction(beforeExecute)) {
          const { skip, stop } = beforeExecute(plugin, realParam, undefined)
          if (stop === true) {
            status = 'TERMINATED'
            break
          }
          if (skip === true) {
            continue
          }
        }

        // execute
        const record = await this.asyncExecute(
          plugin,
          realParam,
          { caller: id, category, queue: executeQueue, records },
          realParam === param ? debugList : undefined,
          )
        records.push(record)

        // call intercepter
        if (_.isFunction(afterExecute)) {
          const { stop } = afterExecute(plugin, realParam, record.result)
          if (stop === true) {
            status = 'TERMINATED'
            break
          }
        }
      }
    } else {
      for(let index = 0; index < executeQueue.length; index++ ) {
        const plugin = executeQueue[index]

        // call adapter
        const realParam = await this.adapteParam(param, plugin, category)

        // execute
        records.push(await this.asyncExecute(
          plugin,
          realParam,
          { caller: id, category, queue: executeQueue, records },
        ))
      }
    }

    this.storeExecuteRecord(
      id,
      category,
      executeQueue.map((p: TYPES.IPlugin) => p.name),
      records,
      startNumber,
    )

    return {
      status: status === 'NORMAL' ? 'COMPLETED' : status,
      results: records.map((record: TYPES.IPluginRecord) => {
        return {
          name: record.pluginName,
          result: record.result,
        }
      }),
    } as TYPES.IPluginExecutionResult
  }
  private syncExecute(
    plugin: TYPES.IPlugin,
    param: any,
    info: TYPES.IPluginExecutionInfo,
    debugKeys?: Array<string|TYPES.IPluginDebugConfig>
  ) {
    // prepare helper
    const exeHelper: TYPES.IPluginExecutionHelper = {
      getCallerId: () => {
        return _.get(info, 'caller', null)
      },
      getCategoryName: () => {
        return _.get(info, 'category', null)
      },
      getExecuteQueue: () => {
        const queue = _.get(info, 'queue', null)
        if (_.isArray(queue)) {
          return queue.map((item: string | TYPES.IPlugin) => {
            if (_.isString(item)) {
              return item
            } else {
              return _.get(item, 'name', 'unknown')
            }
          })
        } else {
          return null
        }
      },
      getExecuteRecords: () => {
        return _.cloneDeep(_.get(info, 'records', null))
      },
    }

    // prepare record
    const { name, paramKeys, debugList = debugKeys, execution } = plugin
    const record: TYPES.IPluginRecord = {
      pluginName: name,
      result: null,
    }

    // prepare param
    const exeParam = {}
    if (_.isArray(paramKeys) && paramKeys.length > 0) {
      paramKeys.forEach((config: string | TYPES.IPluginParamConfig) => {
        if (_.isString(config)) {
          exeParam[config] = _.get(param, config)
        } else if (_.isObject(config)) {
          const { key, default: defaultValue } = config
          if (_.isString(key)) {
            exeParam[key] = _.get(param, key, defaultValue)
          }
        }
      })
    } else if (_.isString(paramKeys)) {
      exeParam[paramKeys] = _.get(param, paramKeys)
    } else if (_.isObject(paramKeys)) {
      const key = _.get(paramKeys, 'key')
      const defaultValue = _.get(paramKeys, 'default')
      if (_.isString(key)) {
        exeParam[key] = _.get(param, key, defaultValue)
      }
    }

    // execute
    if (_.isArray(debugList) && debugList.length > 0) {
      record.originInfo = this.getDebugInfo(param, debugList)
    }
    if (_.isFunction(execution)) {
      try {
        const result = execution(exeParam, exeHelper)
        if (result instanceof Promise) {
          record.result = result.then((data: any) => {
            record.result = data
            return data
          })
        } else {
          record.result = result
        }
      } catch(e) {
        const caller = _.get(info, 'caller', null)
        const category = _.get(info, 'category', null)
        console.error(e)
        console.error(`The above error happens in the execution of plugin ${name}, which is called by ${caller}
          ${category ? ` for ${category}` : ''}.`)
      }
    } else {
      this.defaultPluginExecution(plugin, exeParam, exeHelper)
    }
    if (_.isArray(debugList) && debugList.length > 0) {
      record.finialInfo = this.getDebugInfo(param, debugList)
    }

    return record
  }
  syncExecutePlugin(
    id: string,
    plugin: TYPES.IPlugin,
    param: any,
  ) {
    const startNumber = ++this.history.lastStartNumber

    let registerInfo: TYPES.IPluginCallerRegisterInfo | null = null
    if (_.isString(id) && id.length > 0) {
      registerInfo = this.registry[id] || null
    }

    if (_.isNil(registerInfo)) {
      return {
        status: 'IN_ERROR',
        errorInfo: `The id ${id} is not registered in the PluginManager`,
        results: [],
      } as TYPES.IPluginExecutionResult
    } else {
      const queue = [plugin.name]
      const record = this.syncExecute(
        plugin,
        param,
        { caller: id, queue, records: [] },
        [],
      )

      this.storeExecuteRecord(id, null, queue, [record], startNumber)

      const pluginResult: TYPES.IPluginResult = {
        name: record.pluginName,
        result: record.result,
      }
      if (pluginResult.result instanceof Promise) {
        pluginResult.result = pluginResult.result.then((data: any) => {
          pluginResult.result = data
          return data
        })
      }
      return {
        status: 'COMPLETED',
        results: [
          pluginResult,
        ],
      } as TYPES.IPluginExecutionResult
    }
  }
  syncExecutePlugins(
    id: string,
    category: string,
    param: any,
    options?: TYPES.IPluginExecuteOption
  ) {
    const startNumber = ++this.history.lastStartNumber

    const executeQueue = this.preparePluginQueue(id, category, options)
    if (!_.isArray(executeQueue)) {
      return executeQueue
    }

    let status: string = 'NORMAL'
    const records: TYPES.IPluginRecord[] = []
    if (!_.isNil(options)) {
      const { beforeExecute, afterExecute, debugList } = options
      for( let index = 0; index < executeQueue.length; index++ ) {
        const plugin = executeQueue[index]

        // call adapter
        const realParam = this.adapteParam(param, plugin, category)
        if (realParam instanceof Promise) {
          console.log(`Error: The adapter returns a Promise param in sync execution.(id:${id}, category:${category}, plugin:${plugin.name})`)
        }

        // call intercepter
        if (_.isFunction(beforeExecute)) {
          const { skip, stop } = beforeExecute(plugin, realParam, undefined)
          if (stop === true) {
            status = 'TERMINATED'
            break
          }
          if (skip === true) {
            continue
          }
        }

        // execute
        const record = this.syncExecute(
          plugin,
          realParam,
          { caller: id, category, queue: executeQueue, records },
          realParam === param ? debugList : undefined,
          )
        records.push(record)

        // call intercepter
        if (_.isFunction(afterExecute)) {
          const { stop } = afterExecute(plugin, realParam, record.result)
          if (stop === true) {
            status = 'TERMINATED'
            break
          }
        }
      }
    } else {
      for(let index = 0; index < executeQueue.length; index++ ) {
        const plugin = executeQueue[index]

        // call adapter
        const realParam = this.adapteParam(param, plugin, category)
        if (realParam instanceof Promise) {
          console.log(`Error: The adapter returns a Promise param in sync execution.(id:${id}, category:${category}, plugin:${plugin.name})`)
        }

        // execute
        records.push(this.syncExecute(
          plugin,
          realParam,
          { caller: id, category, queue: executeQueue, records },
        ))
      }
    }

    this.storeExecuteRecord(
      id,
      category,
      executeQueue.map((p: TYPES.IPlugin) => p.name),
      records,
      startNumber,
    )

    return {
      status: status === 'NORMAL' ? 'COMPLETED' : status,
      results: records.map((record: TYPES.IPluginRecord) => {
        const pluginResult: TYPES.IPluginResult = {
          name: record.pluginName,
          result: record.result,
        }
        if (pluginResult.result instanceof Promise) {
          pluginResult.result = pluginResult.result.then((data: any) => {
            pluginResult.result = data
            return data
          })
        }
        return pluginResult
      }),
    } as TYPES.IPluginExecutionResult
  }

  private sendErrorInfo(error: string) {
  }
}

export default PluginManager
