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
  cloneTemplateSchema,
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
  IUISchema,
} from '../../typings'

export class UINode implements IUINode {
  readonly id: string
  engineId?: string
  layoutKey?: string

  dataNode: IDataNode
  stateNode: IStateNode
  messager: IMessager = Messager.getInstance()
  controller: INodeController = NodeController.getInstance()
  pluginManager: IPluginManager = PluginManager.getInstance()
  request: IRequest = Request.getInstance()

  parent?: IUINode
  children?: IUINode[]

  schema: IUISchema = {}
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

    // set the helpers which the node depends on
    this.initialConfig(config)

    // set UI schema
    if (_.isObject(schema)) {
      this.schema = schema

      const { _id } = schema
      if (_.isString(_id) && _id) {
        this.id = _id
      } else {
        schema._id = this.id
      }
    } else {
      this.schema._id = this.id
    }

    // set the UIEngine and layout which this node belongs to
    if (_.isString(engineId) && engineId) {
      this.engineId = engineId
    }
    if (_.isString(layoutKey) && layoutKey) {
      this.layoutKey = layoutKey
    }

    // register the plugin types supported
    this.pluginManager.register(
      this.id,
      {
        categories: [
          'ui.parser',
          'ui.parser.event',
        ]
      }
    )

    // assign parent node
    if (_.isObject(parent)) {
      this.parent = parent
    }

    // initialize data node
    let nodeSource: IDataSource = {
      source: `$dummy.${this.id}`
    }
    const { datasource } = this.schema
    if (_.isObject(datasource)) {
      const { source } = datasource
      if (_.isString(source) && source) {
        nodeSource = datasource
      } else {
        datasource.source = nodeSource.source
        nodeSource = datasource
      }
    } else {
      this.schema.datasource = nodeSource
    }
    this.dataNode = new DataNode(nodeSource, this, this.request)

    // initialize state node
    this.stateNode = new StateNode(this)
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
    let currentSchema: IUISchema = schema

    // use dataNode to load the dataSource
    if (_.isObject(currentSchema.datasource)) {
      const { source } = currentSchema.datasource
      if (source.startsWith('$dummy.')) {
        // dummy node needn't load data
      } else {
        await this.dataNode.loadData(currentSchema.datasource)
      }
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
            await subnode.loadLayout(element)

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
            await node.loadLayout(child)
          }
        }
        if (!_.isNil(node)) {
          children.push(node)
        }
      }
      this.children = childNodes
    }
    this.schema = currentSchema

    // reload State
    this.stateNode = new StateNode(this)
    await this.stateNode.renewStates()

    // load ui.parser plugin
    try {
      await this.pluginManager.executePlugins(
        this.id,
        'ui.parser',
        {uiNode: this}
      )
    } catch (e) {
      console.error(e)
    }

    return currentSchema
  }

  private searchAndReplace(
    srcString: string,
    token: string,
    replacer: string,
    exceptions?: string[],
  ) {
    const matcher = RegExp(`${token}[^${token}]*`, 'g')
    const results = srcString.match(matcher)
    if (!_.isNil(results)) {
      const slices: string[] = []
      let restString = srcString
      results.forEach((result: string) => {
        if (_.isArray(exceptions) && exceptions.length) {
          const except = exceptions.some((value: string) => {
            if (result.startsWith(value) && value.startsWith(token)) {
              return true
            }
            return false
          })
          if (except) {
            return
          }
        }

        const matchLength = result.length
        const startIndex = restString.indexOf(result)
        const endIndex = startIndex + matchLength

        slices.push(restString.slice(0, startIndex))
        slices.push(replacer)
        slices.push(restString.slice(startIndex + token.length, endIndex))
        restString = restString.slice(endIndex)
      })
      slices.push(restString)
      return slices.join('')
    }
    return srcString
  }
  private replaceLiveToken(
    target: any,
    token: string,
    replacer: string,
    exceptions?: string[],
  ) {
    if (_.isString(target) && target.indexOf(token) > -1) {
      return this.searchAndReplace(target, token, replacer, exceptions)
    } else if (_.isObject(target)) {
      _.forIn(target, (value: any, key: string) => {
        if (_.isObject(value)) {
          this.replaceLiveToken(value, token, replacer, exceptions)
        } else if (_.isString(value) && value.indexOf(token) > -1) {
          const newValue = this.searchAndReplace(value, token, replacer, exceptions)
          _.set(target, [key], newValue)
        }
      })
    }
    return target
  }
  private analyzeLiveSchema(schema: IUISchema) {
    const data = this.dataNode.data
    if (_.isArray(data)) {
      const { $children } = schema
      schema.children = data.map((value: any, index: number) => {
        if (_.isArray($children)) {
          cloneTemplateSchema($children)
          return $children.map((item: IUISchema) => {
            const cloneSchema = _.cloneDeep(item)
            if (_.isObject(cloneSchema.datasource)) {
              this.replaceLiveToken(cloneSchema.datasource, '\\\$', `${index}`, ['$dummy'])
            }
            cloneSchema._index = index
            return cloneSchema
          })
        } else if (_.isObject($children)) {
          cloneTemplateSchema($children)
          const cloneSchema = _.cloneDeep($children)
          if (_.isObject(cloneSchema.datasource)) {
            this.replaceLiveToken(cloneSchema.datasource, '\\\$', `${index}`, ['$dummy'])
          }
          cloneSchema._index = index
          return cloneSchema
        } else {
          return undefined
        }
      }).filter((item) => {
        // remove the undefined
        return item !== undefined
      }) as Array<IUISchema|IUISchema[]>
    } else {
      schema.children = []
    }

    this.isLiveChildren = true
    return schema
  }

  private async getRemoteSchema(url: string, config?: IRequestConfig) {
    let schema: IUISchema | undefined
    if (_.isString(this.layoutKey) && this.layoutKey) {
      schema = Cache.getLayoutSchema(this.layoutKey, { cacheKey: url })
    }
    if (_.isNil(schema)) {
      try {
        const { data } = await this.request.get(url, config)
        if (_.isObject(data)) {
          schema = data
          if (_.isString(this.layoutKey) && this.layoutKey) {
            Cache.setLayoutSchema(this.layoutKey, data, { cacheKey: url })
          }
        }
      } catch (e) {
        console.error(e)
        this.errorInfo = {
          status: 400,
          code: `Error loading from ${url}`
        }
      }
    }
    return schema
  }

  async loadLayout(schema?: string | IUISchema) {
    let targetSchema: IUISchema | undefined
    if (_.isString(schema) && schema) {
      targetSchema = await this.getRemoteSchema(schema, {})
    } else if (_.isObject(schema)) {
      targetSchema = schema
    } else {
      targetSchema = this.schema
    }

    if (_.isObject(targetSchema)) {
      const finalSchema = await this.analyzeSchema(targetSchema)

      if (_.isString(this.layoutKey) && this.layoutKey) {
        // cache the node instance in its layout
        Cache.setLayoutNode(this.layoutKey, this, { cacheKey: this.id })
      }

      this.schema = finalSchema
      return finalSchema
    } else {
      console.warn(`Can't load target layout to ${
        this.id
      }${
        this.layoutKey ? ` in ${this.layoutKey}` : ''
      }${
        this.engineId ? ` of ${this.engineId}` : ''
      }`)
      return this.schema
    }
  }

  async replaceLayout(
    newSchema: string | IUISchema,
    route?: number[],
  ) {
    if (_.isArray(route) && route.length) {
      const child = this.getChildren(route)
      if (!_.isArray(child) && _.isObject(child)) {
        return await child.loadLayout(newSchema)
      } else {
        return {}
      }
    } else {
      return await this.loadLayout(newSchema)
    }
  }

  async refreshLayout() {
    return await this.analyzeSchema(this.schema)
  }

  clearLayout() {
    if (_.isString(this.layoutKey) && this.layoutKey) {
      Cache.clearLayoutNode(this.layoutKey, { cacheKey: this.id })
    }
    // this is not the rootNode of the layout
    this.schema = {}
    this.children = []
    this.errorInfo = {}
    return this
  }

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
