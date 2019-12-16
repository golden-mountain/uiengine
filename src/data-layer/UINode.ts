import _ from 'lodash'

import {
  DataNode,
  StateNode,
  NodeController,
} from '../data-layer'
import {
  Cache,
  Messager,
  PluginManager,
  Request,
} from '../helpers'
import {
  cloneTemplateSchema, replaceParam,
} from '../helpers/utils'

import {
  IDataNode,
  IDataSource,
  IErrorInfo,
  IMessager,
  INodeController,
  IObject,
  IPluginManager,
  IRequest,
  IRequestConfig,
  IStateInfo,
  IStateNode,
  IUINode,
  IUINodeConfig,
  IUINodeRenderer,
  IUINodeClearOption,
  IUISchema,
} from '../../typings'
import { on } from 'cluster'

export class UINode implements IUINode {
  readonly id: string
  readonly engineId?: string
  readonly layoutKey?: string

  dataNode: IDataNode
  stateNode: IStateNode
  messager: IMessager = Messager.getInstance()
  controller: INodeController = NodeController.getInstance()
  pluginManager: IPluginManager = PluginManager.getInstance()
  request: IRequest = Request.getInstance()

  parent?: IUINode
  children?: IUINode[]

  private uiSchema: IUISchema = {}
  set schema(newSchema: IUISchema) {
    this.loadLayout(newSchema)
  }
  get schema() {
    return this.uiSchema
  }
  private loadQueue: number = 0
  private loadProcess: Promise<IUISchema | undefined> | undefined
  private loadingID?: number | string

  props: IObject = {}
  layoutMap: {
    [layoutKey: string]: IUINodeRenderer
  } = {}

  errorInfo: IErrorInfo = {}
  stateInfo: IStateInfo = {
    data: null,
    state: {},
    time: 0
  }
  isLiveChildren: boolean = false

  private initialConfig(config?: IUINodeConfig) {
    if (_.isObject(config)) {
      const { messager, controller, pluginManager, request } = config
      if (!_.isNil(messager)) {
        this.messager = messager
      }
      if (!_.isNil(controller)) {
        this.controller = controller
      }
      if (!_.isNil(pluginManager)) {
        this.pluginManager = pluginManager
      }
      if (!_.isNil(request)) {
        this.request = request
      }
    }
  }
  constructor(
    schema: IUISchema,
    engineId?: string,
    layoutKey?: string,
    parent?: IUINode,
    config?: IUINodeConfig,
  ) {
    // initialize the node ID, the ID can't be changed after the construction
    this.id = _.uniqueId(`UINode-`)

    // set the UIEngine and layout which this node belongs to
    if (_.isString(engineId) && engineId) {
      this.engineId = engineId
    }
    if (_.isString(layoutKey) && layoutKey) {
      this.layoutKey = layoutKey
    }

    // prepare the uiSchema that will be loaded later
    let uiSchema = this.uiSchema
    // assign id by schema or set _id to schema
    if (_.isObject(schema)) {
      const { _id } = schema
      if (_.isString(_id) && _id) {
        this.id = _id
      } else {
        schema._id = this.id
      }
      uiSchema = schema
    } else {
      uiSchema._id = this.id
    }

    // set the helpers which the node depends on
    this.initialConfig(config)

    // register the plugin types supported
    this.pluginManager.register(
      this.id,
      {
        categories: [
          'ui.parser',
          'ui.parser.before',
        ]
      }
    )

    // assign parent node
    if (_.isObject(parent)) {
      this.parent = parent
    }

    // prepare dataSource for data node
    const dataSource: IDataSource = {
      source: `$dummy.${this.id}`,
    }
    const { datasource: srcConfig } = uiSchema
    if (_.isObject(srcConfig) && !_.isEmpty(srcConfig)) {
      const { source } = srcConfig
      if (!_.isString(source) || _.isEmpty(source)) {
        srcConfig.source = dataSource.source
      }
      _.assign(dataSource, srcConfig)
    } else if (_.isString(srcConfig) && srcConfig) {
      dataSource.source = srcConfig
      uiSchema.datasource = _.cloneDeep(dataSource)
    } else {
      uiSchema.datasource = _.cloneDeep(dataSource)
    }

    // initialize data node
    this.dataNode = new DataNode(this, dataSource, { request: this.request })

    // initialize state node
    this.stateNode = new StateNode(this)

    // load the uiSchema
    // Attention: only when the uiSchema is loaded, will it be set to the uiNode
    this.uiSchema = uiSchema
  }

  private async parseBefore(schema: IUISchema) {
    // exec ui.parser.before plugin
    try {
      const { results } = await this.pluginManager.executePlugins(
        this.id,
        'ui.parser.before',
        { uiNode: this, schema }
      )
      if (_.isArray(results)) {
        results.forEach((resultItem) => {
          const { result } = resultItem
          if (_.isObject(results)) {
            _.assign(schema, result)
          }
        })
      }
    } catch (e) {
      console.error(e)
    }
    return schema
  }
  async parse() {
    // exec ui.parser plugin
    try {
      await this.pluginManager.executePlugins(
        this.id,
        'ui.parser',
        { uiNode: this }
      )
    } catch (e) {
      console.error(e)
    }
  }

  private createChildNode(schema: IUISchema, parent?: IUINode) {
    return new UINode(
      schema,
      this.engineId,
      this.layoutKey,
      parent !== undefined ? parent : this,
      {
        messager: this.messager,
        controller: this.controller,
        pluginManager: this.pluginManager,
        request: this.request,
      },
    )
  }
  /**
   * analyze the UI schema to generate the UI construct - UINode tree
   * TO DO: need to enhance:
   * 1. if only state change, on layout gen
   * 2. if data change, if the changed data has an item different than origin one, should renew the one, if delete one, should also remove the one
   * @param schema the source UI schema
   * @returns the final UI schema
   */
  private async analyzeSchema(schema: IUISchema) {
    schema = await this.parseBefore(schema)

    let currentSchema: IUISchema = schema

    // get source string and format datasource
    let sourceStr: string = `$dummy.${this.id}`
    const { datasource: srcConfig } = currentSchema
    if (_.isObject(srcConfig) && !_.isEmpty(srcConfig)) {
      const { source } = srcConfig
      if (!_.isString(source) || _.isEmpty(source)) {
        srcConfig.source = sourceStr
      } else {
        sourceStr = source
      }
    } else if (_.isString(srcConfig) && srcConfig) {
      sourceStr = srcConfig
      currentSchema.datasource = {
        source: srcConfig,
      }
    } else {
      currentSchema.datasource = {
        source: sourceStr,
      }
    }

    // use dataNode to load the dataSource, except:
    // 1. the source string is invalid
    // 2. the source string starts with '$dummy.'
    // 3. the load without loadID which means it still use prev data
    if (
      _.isString(sourceStr) && sourceStr &&
      !sourceStr.startsWith('$dummy.') &&
      !_.isNil(this.loadingID)
    ) {
      await this.dataNode.loadData(currentSchema.datasource, { loadID: this.loadingID })
    } else {
      await this.dataNode.loadSchema(currentSchema.datasource)
    }

    if (!_.isNil(currentSchema.$children)) {
      currentSchema = this.analyzeLiveSchema(currentSchema)
    }

    const { children } = currentSchema
    if (_.isArray(children)) {
      const childNodes: UINode[] = []
      for (let child of children) {
        let node: UINode | undefined
        if (_.isArray(child)) {
          node = this.createChildNode({}, this)
          for (let element of child) {
            // the upper 'node' is a dummy node which is just used to store these subnodes, so their real parent is still this
            const subnode = this.createChildNode(element, this)
            await subnode.loadLayout(element, this.loadingID)

            if (!_.isNil(node)) {
              if (_.isNil(node.children)) {
                node.children = []
              }
              if (_.isArray(node.children)) {
                node.children.push(subnode)
              }
            }
          }
        } else if (_.isObject(child)) {
          node = this.createChildNode(child, this)
          if (!_.isNil(node)) {
            await node.loadLayout(child, this.loadingID)
          }
        }
        if (!_.isNil(node)) {
          childNodes.push(node)
        }
      }
      this.children = childNodes
    }

    // reload State
    this.stateNode = new StateNode(this)
    await this.stateNode.renewStates()

    await this.parse()

    return currentSchema
  }

  private replaceLiveToken(
    source: string,
    token: string,
    replace: string,
    except?: Array<string | RegExp>,
    depth?: number,
  ) {
    // format the token to create the RegExp
    const formatToken = token
      .split('')
      .map((char: string) => {
        if ('{}[]()^$*\\'.includes(char)) {
          return '\\' + char
        }
        return char
      })
      .join('')
    // match the token and the following chars before the next token
    const tokenMatcher = RegExp(`${formatToken}[^${formatToken}]*`, 'g')

    const matchArray = source.match(tokenMatcher)
    if (!_.isNil(matchArray)) {
      const slices: string[] = []

      let restString = source
      matchArray.forEach((matchString: string, index: number) => {
        // the depth of the replacement
        if (_.isNumber(depth) && index + 1 > depth) {
          return
        }
        // the exception of the replacement
        if (_.isArray(except) && except.length) {
          const isExcepted = except.some((value: string | RegExp) => {
            if (_.isString(value) && matchString.startsWith(value)) {
              return true
            } else if (_.isRegExp(value) && value.test(matchString)) {
              return true
            }
            return false
          })
          if (isExcepted) {
            return
          }
        }

        const matchLength = matchString.length
        const startIndex = restString.indexOf(matchString)
        const endIndex = startIndex + matchLength

        slices.push(restString.slice(0, startIndex))
        slices.push(replace)
        slices.push(restString.slice(startIndex + token.length, endIndex))
        restString = restString.slice(endIndex)
      })

      slices.push(restString)
      return slices.join('')
    }
    return source
  }
  private searchAndReplace(
    target: any,
    token: string,
    replace: string,
    except?: Array<string | RegExp>,
    depth?: number,
  ) {
    if (_.isString(target)) {
      return this.replaceLiveToken(target, token, replace, except, depth)
    } else if (_.isObject(target)) {
      _.forIn(target, (value: any, key: string) => {
        if (_.isObject(value)) {
          const newValue = this.searchAndReplace(value, token, replace, except, depth)
          _.set(target, [key], newValue)
        } else if (_.isString(value)) {
          const newValue = this.replaceLiveToken(value, token, replace, except, depth)
          _.set(target, [key], newValue)
        }
      })
    }
    return target
  }
  private replaceChildToken(
    schema: IUISchema,
    index: number,
  ) {
    const { $children, children } = schema
    if (!_.isNil($children)) {
      if (_.isArray($children)) {
        $children.forEach(($child: IUISchema) => {
          $child.datasource = this.searchAndReplace(
            $child.datasource,
            '$',
            `${index}`,
            ['$dummy'],
            1,
          )
          $child.state = this.searchAndReplace(
            $child.state,
            '$',
            `${index}`,
            ['$dummy'],
            1,
          )
          this.replaceChildToken($child, index)
        })
      } else if (_.isObject($children)) {
        $children.datasource = this.searchAndReplace(
          $children.datasource,
          '$',
          `${index}`,
          ['$dummy'],
          1,
        )
        $children.state = this.searchAndReplace(
          $children.state,
          '$',
          `${index}`,
          ['$dummy'],
          1,
        )
        this.replaceChildToken($children, index)
      }
    } else if (_.isArray(children) && children.length) {
      children.forEach((child: IUISchema | IUISchema[]) => {
        if (_.isArray(child)) {
          child.forEach((item: IUISchema) => {
            item.datasource = this.searchAndReplace(
              item.datasource,
              '$',
              `${index}`,
              ['$dummy'],
              1,
            )
            item.state = this.searchAndReplace(
              item.state,
              '$',
              `${index}`,
              ['$dummy'],
              1,
            )
            this.replaceChildToken(item, index)
          })
        } else {
          child.datasource = this.searchAndReplace(
            child.datasource,
            '$',
            `${index}`,
            ['$dummy'],
            1,
          )
          child.state = this.searchAndReplace(
            child.state,
            '$',
            `${index}`,
            ['$dummy'],
            1,
          )
          this.replaceChildToken(child, index)
        }
      })
    }
  }
  private analyzeLiveSchema(schema: IUISchema) {
    const data = this.dataNode.data
    if (_.isArray(data)) {
      const { $children } = schema
      schema.children = data.map((value: any, index: number) => {
        if (_.isArray($children)) {
          cloneTemplateSchema($children)
          return $children.map(($child: IUISchema) => {
            const cloneSchema = _.cloneDeep($child)
            if (_.isObject(cloneSchema.datasource)) {
              cloneSchema.datasource = this.searchAndReplace(
                cloneSchema.datasource,
                '$',
                `${index}`,
                ['$dummy'],
                1,
              )
              cloneSchema.state = this.searchAndReplace(
                cloneSchema.state,
                '$',
                `${index}`,
                ['$dummy'],
                1,
              )
            }
            this.replaceChildToken(cloneSchema, index)
            cloneSchema._index = index
            return cloneSchema
          })
        } else if (_.isObject($children)) {
          cloneTemplateSchema($children)
          const cloneSchema = _.cloneDeep($children)
          if (_.isObject(cloneSchema.datasource)) {
            cloneSchema.datasource = this.searchAndReplace(
              cloneSchema.datasource,
              '$',
              `${index}`,
              ['$dummy'],
              1,
            )
            cloneSchema.state = this.searchAndReplace(
              cloneSchema.state,
              '$',
              `${index}`,
              ['$dummy'],
              1,
            )
          }
          this.replaceChildToken(cloneSchema, index)
          cloneSchema._index = index
          return cloneSchema
        } else {
          return undefined
        }
      }).filter((item) => {
        // remove the undefined
        return item !== undefined
      }) as Array<IUISchema | IUISchema[]>
    } else {
      schema.children = []
    }

    this.isLiveChildren = true
    return schema
  }

  private async getRemoteSchema(schemaName: string) {
    let schema: IUISchema | undefined
    if (_.isString(this.layoutKey) && this.layoutKey) {
      schema = Cache.getLayoutSchema(this.layoutKey, { cacheKey: schemaName })
    }
    if (_.isNil(schema)) {
      try {
        const { data } = await this.request.get(schemaName, { prefixType: 'uiSchema' }, this.engineId)
        if (_.isObject(data)) {
          schema = data
          if (_.isString(this.layoutKey) && this.layoutKey) {
            Cache.setLayoutSchema(this.layoutKey, data, { cacheKey: schemaName })
          }
        }
      } catch (e) {
        console.error(e)
        this.errorInfo = {
          status: 400,
          code: `Error: failed to load layout schema ${schemaName}`
        }
      }
    }
    return _.cloneDeep(schema)
  }

  async loadLayout(schema?: string | IUISchema, loadID?: string | number) {
    // cache the schema which will be loaded, if not provide, use the current loaded schema as default
    const schemaCache = _.isNil(schema) ? this.schema : schema

    // add to load queue
    this.loadQueue++

    if (_.isNil(this.loadProcess)) {
      this.loadProcess = new Promise((resolve, reject) => {
        // set the current loading ID
        if (!_.isNil(loadID)) {
          this.loadingID = loadID
        }

        if (_.isString(schemaCache) && schemaCache) {

          this.getRemoteSchema(schemaCache)
            .then((remoteSchema: IUISchema | undefined) => {
              if (_.isObject(remoteSchema)) {
                this.uiSchema = remoteSchema
                this.analyzeSchema(remoteSchema)
                  .then((finalSchema: IUISchema) => {
                    resolve(finalSchema)
                  })
                  .catch(() => {
                    // error during the analyzation
                    console.warn(`Error occurs when analyze schema for ${
                      this.id
                      }${
                      this.layoutKey ? ` in ${this.layoutKey}` : ''
                      }${
                      this.engineId ? ` of ${this.engineId}` : ''
                      }`)
                    resolve(undefined)
                  })
              } else {
                console.warn(`Can't get remote schema ${schemaCache} for ${
                  this.id
                  }${
                  this.layoutKey ? ` in ${this.layoutKey}` : ''
                  }${
                  this.engineId ? ` of ${this.engineId}` : ''
                  }`)
                resolve(undefined)
              }
            })
            .catch(() => {
              // error during the request
              console.warn(`Error occurs when request remote schema for ${
                this.id
                }${
                this.layoutKey ? ` in ${this.layoutKey}` : ''
                }${
                this.engineId ? ` of ${this.engineId}` : ''
                }`)
              resolve(undefined)
            })

        } else if (_.isObject(schemaCache)) {

          this.uiSchema = schemaCache
          this.analyzeSchema(schemaCache)
            .then((finalSchema: IUISchema) => {
              resolve(finalSchema)
            })
            .catch(() => {
              // error during the analyzation
              console.warn(`Error occurs when analyze schema for ${
                this.id
                }${
                this.layoutKey ? ` in ${this.layoutKey}` : ''
                }${
                this.engineId ? ` of ${this.engineId}` : ''
                }`)
              resolve(undefined)
            })

        } else {
          // invalid schema param
          console.warn(`Can't load layout by invalid schema to ${
            this.id
            }${
            this.layoutKey ? ` in ${this.layoutKey}` : ''
            }${
            this.engineId ? ` of ${this.engineId}` : ''
            }`)
          resolve(undefined)
        }
      })

      const loadResult = await this.loadProcess
      if (!_.isNil(loadResult)) {
        if (_.isString(this.layoutKey) && this.layoutKey) {
          // cache the node instance in its layout
          Cache.setLayoutNode(this.layoutKey, this, { cacheKey: this.id })
        }
        this.uiSchema = loadResult
      }

      if (!_.isNil(loadID)) {
        delete this.loadingID
      }

      this.loadQueue--
      if (this.loadQueue === 0) {
        delete this.loadProcess
      }

      return loadResult || this.schema
    } else {
      this.loadProcess = this.loadProcess.then(() => {
        // set the current loading ID
        if (!_.isNil(loadID)) {
          this.loadingID = loadID
        }

        // prepare the schema
        if (_.isString(schemaCache) && schemaCache) {
          return this.getRemoteSchema(schemaCache)
            .then((schema) => {
              if (_.isNil(schema)) {
                console.warn(`Can't get remote schema ${schemaCache} for ${
                  this.id
                  }${
                  this.layoutKey ? ` in ${this.layoutKey}` : ''
                  }${
                  this.engineId ? ` of ${this.engineId}` : ''
                  }`)
              }
              return schema
            }, () => {
              // error during the request
              console.warn(`Error occurs when request remote schema for ${
                this.id
                }${
                this.layoutKey ? ` in ${this.layoutKey}` : ''
                }${
                this.engineId ? ` of ${this.engineId}` : ''
                }`)
              return undefined
            })
        } else if (_.isObject(schemaCache)) {
          return schemaCache
        } else {
          console.warn(`Can't load layout by invalid schema to ${
            this.id
            }${
            this.layoutKey ? ` in ${this.layoutKey}` : ''
            }${
            this.engineId ? ` of ${this.engineId}` : ''
            }`)
          return undefined
        }
      }).then((schema: IUISchema | undefined) => {
        // analyze the schema
        if (_.isObject(schema)) {
          this.uiSchema = schema
          return this.analyzeSchema(schema)
            .then((finalSchema) => {
              return finalSchema
            }, () => {
              // error during the analyzation
              console.warn(`Error occurs when analyze schema for ${
                this.id
                }${
                this.layoutKey ? ` in ${this.layoutKey}` : ''
                }${
                this.engineId ? ` of ${this.engineId}` : ''
                }`)
              return undefined
            })
        } else {
          return undefined
        }
      })

      const loadResult = await this.loadProcess
      if (!_.isNil(loadResult)) {
        if (_.isString(this.layoutKey) && this.layoutKey) {
          // cache the node instance in its layout
          Cache.setLayoutNode(this.layoutKey, this, { cacheKey: this.id })
        }
        this.uiSchema = loadResult
      }

      if (!_.isNil(loadID)) {
        delete this.loadingID
      }

      this.loadQueue--
      if (this.loadQueue === 0) {
        delete this.loadProcess
      }

      return loadResult || this.schema
    }
  }

  /**
   * replace the layout of the node or its children
   * @param newSchema
   * @param route
   */
  async replaceLayout(
    newSchema: string | IUISchema,
    route?: number[],
    replaceID?: string | number,
  ) {
    if (_.isArray(route) && route.length) {
      const child = this.getChildren(route)
      if (!_.isArray(child) && _.isObject(child)) {
        return await child.loadLayout(newSchema, replaceID)
      } else {
        return {}
      }
    } else {
      return await this.loadLayout(newSchema, replaceID)
    }
  }

  /**
   * refresh the layout of the node. When the node is still loading, the refresh won't work
   */
  async refreshLayout(refreshID?: string | number) {
    if (this.loadQueue === 0) {
      return await this.loadLayout(undefined, refreshID)
    }
    return {}
  }

  clearLayout(options?: IUINodeClearOption) {
    if (_.isObject(options)) {
      const { onlyChild, clearData, clearPool } = options

      if (!onlyChild) {
        // clear the UINode from Cache
        if (_.isString(this.layoutKey) && this.layoutKey) {
          Cache.clearLayoutNode(this.layoutKey, { cacheKey: this.id })
        }

        // reset error info of the node
        this.errorInfo = {}
        // clear schema of the node
        this.uiSchema = {}
      }

      if (clearData === true) {
        // clear data and pool
        this.dataNode.deleteData({ clearPool })
      }

      // clear children layout
      const children = this.children
      if (_.isArray(children) && children.length) {
        children.forEach((child: IUINode) => {
          child.clearLayout({ clearData, clearPool })
        })
      }
      delete this.children

    } else {
      // clear the UINode from Cache
      if (_.isString(this.layoutKey) && this.layoutKey) {
        Cache.clearLayoutNode(this.layoutKey, { cacheKey: this.id })
      }

      // reset error info of the node
      this.errorInfo = {}
      // clear schema of the node
      this.uiSchema = {}

      // clear children layout
      const children = this.children
      if (_.isArray(children) && children.length) {
        children.forEach((child: IUINode) => {
          child.clearLayout()
        })
      }
      delete this.children
    }

    return this
  }

  /**
   * get the schema of the UINode, or the schema from one of its children
   * @param route
   * @returns the uiSchema copy
   */
  getSchema(route?: number[]) {
    if (_.isArray(route) && route.length) {
      const path = route.map((value: number) => {
        return `children[${value}]`
      })
      return _.get(this.schema, path.join('.'))
    }

    return this.schema
  }

  getParent(toTop?: boolean) {
    if (toTop === true) {
      let topNode = this.parent
      while (true) {
        if (!_.isNil(topNode) && !_.isNil(topNode.parent)) {
          topNode = topNode.parent
        } else {
          break
        }
      }
      return topNode
    }

    return this.parent
  }

  getChildren(route?: number[]) {
    if (_.isArray(route) && route.length) {
      const path = route.map((value: number) => {
        return `children[${value}]`
      })
      return _.get(this, path.join('.')) as IUINode | undefined
    } else {
      return this.children
    }
  }

  sendMessage(forceRefresh?: boolean) {
    const currentState = {
      data: _.cloneDeep(this.dataNode.data),
      state: _.cloneDeep(this.stateNode.state),
      time: forceRefresh ? new Date().getTime() : 0,
      layoutMap: this.layoutMap,
    }
    if (!_.isEqual(currentState, this.stateInfo)) {
      this.stateInfo = currentState
      this.messager.sendMessage(this.id, this.stateInfo)
    }
  }
}

export default UINode
