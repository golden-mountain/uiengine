import _ from 'lodash'

import { UINode } from '../data-layer'
import {
  DataPool,
  Messager,
  PluginManager,
  Request,
  Workflow,
} from '../helpers'
import {
  searchNodes,
} from '../helpers/utils'

import {
  IErrorInfo,
  ILoadOptions,
  IRequest,
  IRequestConfig,
  IMessager,
  INodeController,
  INodeProps,
  IObject,
  IPluginManager,
  IUINode,
  IUINodeRenderer,
  IUISchema,
  IWorkflow,
  IWorkingMode,
} from '../../typings'

export class NodeController implements INodeController {
  private static instance: NodeController
  static getInstance = () => {
    if (_.isNil(NodeController.instance)) {
      NodeController.instance = new NodeController()
    }
    return NodeController.instance
  }

  // the plugin types which can be used in NodeController
  private static pluginTypes: string[] = [
    'data.commit.workflow.could',
  ]
  static setPluginTypes = (types: string[]) => {
    if (_.isArray(types)) {
      NodeController.pluginTypes = types.map((type: string) => {
        if (_.isString(type) && type) {
          return type
        } else {
          return undefined
        }
      }).filter((type?: string) => {
        return _.isString(type)
      }) as string[]
    }
  }

  id: string = _.uniqueId('NodeController-')
  messager: IMessager = Messager.getInstance()
  pluginManager: IPluginManager = PluginManager.getInstance()
  request: IRequest = Request.getInstance()
  workflow: IWorkflow = Workflow.getInstance()

  activeEngine: string = ''
  activeLayout: string = ''
  errorInfo: IErrorInfo = {}
  engineMap: {
    [engineId: string]: string[]
  } = {}
  layoutMap: {
    [layoutKey: string]: IUINodeRenderer
  } = {}

  constructor() {
    if (!_.isNil(this.workflow)) {
      this.workflow.setNodeController(this)
    }

    if (!_.isNil(this.pluginManager)) {
      this.pluginManager.register(
        this.id,
        { categories: NodeController.pluginTypes },
      )
    }
  }

  private getEngineId(engineId?: string) {
    let targetEngine: string = this.activeEngine
    if (_.isString(engineId) && engineId) {
      targetEngine = engineId
    }
    return targetEngine
  }
  private getLayoutKey(layoutKey?: string) {
    let targetLayout: string = this.activeLayout
    if (_.isString(layoutKey) && layoutKey) {
      targetLayout = layoutKey
    }
    return targetLayout
  }

  /**
   * activate the target UIEngine and its selected layout(if provided)
   * @param engineId the target UIEngine. If not provided, use current active UIEngine as default
   * @param layoutKey the active Layout of target UIEngine. If not provided,
   * use current active layout when active UIEngine doesn't change,
   * use the last layout when active UIEngine changes
   * @returns true when activated the UIEngine and layout, false when not
   */
  activateEngine(engineId?: string, layoutKey?: string) {
    const prevActiveEngine = this.activeEngine
    const prevActiveLayout = this.activeLayout

    if (_.isString(engineId) && engineId) {
      const layouts = this.engineMap[engineId]
      if (_.isNil(layouts)) {
        // the target UIEngine hasn't loaded
        console.warn(`The UIEngine '${engineId}' hasn't loaded, so can't activate yet.`)
        return false
      } else {
        // activate UIEngine
        this.activeEngine = engineId

        if (_.isString(layoutKey) && layoutKey) {
          const hasLoaded = layouts.some((layout: string) => {
            return layout === layoutKey
          })
          if (hasLoaded === true) {
            // activate layout
            this.activeLayout = layoutKey
          } else {
            // the selected layout hasn't loaded
            console.warn(`The layout '${layoutKey}' hasn't loaded in '${engineId}', so can't activate.`)
            this.activeLayout = ''
            return false
          }
        } else {
          if (prevActiveEngine === this.activeEngine) {
            if (!this.activeLayout && layouts.length) {
              // active UIEngine dosen't change, but has't active layout
              this.activeLayout = layouts[layouts.length - 1]
            }
          } else {
            // active UIEngine changes, but has't selected active layout
            if (layouts.length) {
              this.activeLayout = layouts[layouts.length - 1]
            } else {
              this.activeLayout = ''
            }
          }
        }
      }
    } else {
      if (_.isString(prevActiveEngine) && prevActiveEngine) {
        // if not provide engineId, use the current active one
        const layouts = this.engineMap[prevActiveEngine]
        if (_.isNil(layouts)) {
          // lost the layouts of current active UIEngine
          console.error(`Can't find the layouts of active UIEngine '${prevActiveEngine}'.`)
          this.activeEngine = ''
          this.activeLayout = ''
          return false
        } else {
          if (_.isString(layoutKey) && layoutKey) {
            const hasLoaded = layouts.some((layout: string) => {
              return layout === layoutKey
            })
            if (hasLoaded === true) {
              // activate layout
              this.activeLayout = layoutKey
            } else {
              // the selected layout hasn't loaded
              console.warn(`The layout '${layoutKey}' hasn't loaded in '${engineId}', so can't activate.`)
              return false
            }
          } else if (!prevActiveLayout) {
            if (layouts.length) {
              // active UIEngine dosen't change, but has't active layout
              this.activeLayout = layouts[layouts.length - 1]
            }
          }
        }
      } else if (_.isString(layoutKey) && layoutKey) {
        console.warn(`No valid active UIEngine, so can't activate layout '${layoutKey}'`)
        return false
      }
    }
    return true
  }

  /**
   * set the config to Request
   * @param requestConfig the config object
   * @param id the id of the config, if not provide, the config is global
   */
  setRequestConfig(requestConfig: IRequestConfig, id?: string) {
    if (_.isString(id) && id) {
      this.request.setConfig(requestConfig, { id })
    } else {
      this.request.setConfig(requestConfig)
    }
  }

  /**
   * get the config from Request
   * @param id the id of the config, if not provide or not find, get the global config
   * @param devMode if true, get the config for develop, if false, get the one for product
   */
  getRequestConfig(id?: string, devMode?: boolean) {
    if (_.isString(id) && id) {
      return this.request.getConfig({ id, devMode })
    } else {
      return this.request.getConfig({ devMode })
    }
  }

  /**
   * set the working mode of the layout
   * @param workingMode the config object
   * @param layoutKey the layout of this config, if not provide, set it to current active layout
   */
  setWorkingMode(workingMode: IWorkingMode, layoutKey?: string) {
    const targetLayout = this.getLayoutKey(layoutKey)

    if (_.isString(targetLayout) && targetLayout) {
      if (_.isNil(this.layoutMap[targetLayout])) {
        this.layoutMap[targetLayout] = {
          layoutKey: targetLayout,
          workingMode: { mode: 'new' },
        } as IUINodeRenderer
      }

      if (!_.isEmpty(workingMode)) {
        _.set(this.layoutMap[targetLayout], 'workingMode', workingMode)
      } else {
        return false
      }
    } else {
      return false
    }
    return true
  }

  /**
   * get the working mode of the layout
   * @param layoutKey the layout key, if not provide, get working mode of current active layout
   */
  getWorkingMode(layoutKey?: string) {
    const targetLayout = this.getLayoutKey(layoutKey)

    return _.get(this.layoutMap[targetLayout], 'workingMode')
  }

  /**
   * load target layout for the engine
   * @param engineId the id of the UIEngine which target layout is loaded
   * @param layoutKey the unique key of target layout
   * @param schema the schema path or schema object of the loaded layout
   * @param options load options
   * @param autoRefresh if true, refresh the parent node which the layout is loaded in, or refresh the UIEngine when parent doesn't exist
   */
  async loadLayout(
    engineId: string | undefined,
    layoutKey: string | undefined,
    schema: string | IUISchema,
    options?: ILoadOptions,
    autoRefresh?: boolean,
  ) {
    const targetEngine = this.getEngineId(engineId)
    const targetLayout = this.getLayoutKey(layoutKey)

    if (_.isNil(this.engineMap[targetEngine])) {
      this.engineMap[targetEngine] = []
    }
    const loadedLayouts = this.engineMap[targetEngine]
    if (!loadedLayouts.includes(targetLayout)) {
      loadedLayouts.push(targetLayout)
    }

    if (_.isNil(this.layoutMap[targetLayout])) {
      this.layoutMap[targetLayout] = {
        engineId: targetEngine,
        layoutKey: targetLayout,
        uiNode: new UINode(
          {},
          targetEngine,
          targetLayout,
          undefined,
          { request: this.request }
        ),
        options,
      }
    }
    const targetRenderer = this.layoutMap[targetLayout]
    let rootNode = targetRenderer.uiNode
    if (_.isNil(rootNode)) {
      targetRenderer.uiNode = new UINode(
        {},
        targetEngine,
        targetLayout,
        undefined,
        { request: this.request }
      )
      rootNode = targetRenderer.uiNode
    }

    try {
      await rootNode.loadLayout(schema)
      _.merge(targetRenderer, {
        engineId: targetEngine,
        layoutKey: targetLayout,
        uiNode: rootNode,
        options,
        visible: true,
      })
      this.activeEngine = targetEngine
      this.activeLayout = targetLayout

      // update parent node
      const parentNode = _.get(options, 'parentNode')
      if (!_.isNil(parentNode)) {
        const nodeInParent = _.get(parentNode.layoutMap, [targetLayout, 'uiNode'])
        if (nodeInParent !== rootNode) {
          parentNode.layoutMap[targetLayout] = targetRenderer
        }
      }

      // send message
      if (autoRefresh === true) {
        if (!_.isNil(parentNode)) {
          parentNode.sendMessage(true)
        } else {
          this.messager.sendMessage(targetEngine, { layoutMap: this.layoutMap })
        }
      }
    } catch (e) {
      console.error(e)
    }

    return rootNode
  }

  /**
   * get the renderer or rootNode of the layout
   * @param layoutKey the key of target layout
   * @param uiNodeOnly if true, return the root uiNode only, else, return the renderer
   * @returns the renderer or root uiNode of the target layout
   */
  getLayout(
    layoutKey?: string,
    uiNodeOnly?: boolean,
  ) {
    const targetLayout = this.getLayoutKey(layoutKey)

    const renderer = _.get(this.layoutMap, [targetLayout])
    if (_.isObject(renderer) && uiNodeOnly === true) {
      return renderer.uiNode
    }
    return renderer
  }

  /**
   * hide the layout
   * @param layoutKey
   * @param clearData
   */
  hideLayout(
    layoutKey?: string,
    clearData?: boolean,
  ) {
    const targetLayout = this.getLayoutKey(layoutKey)
    const renderer = this.layoutMap[targetLayout]
    if (!_.isNil(renderer)) {
      renderer.visible = false

      // set the last layout of active engine as current active layout
      const activeEngine = this.getEngineId()
      const loadedLayouts = this.engineMap[activeEngine]
      const lastLayout = _.findLast(loadedLayouts, (layout: string) => {
        return layout !== targetLayout
      })
      if (lastLayout === undefined) {
        this.activeLayout = ''
      } else {
        this.activeLayout = lastLayout
      }

      // clear data pool
      if (clearData === true) {
        const { uiNode } = renderer
        const data = _.get(uiNode, ['dataNode', 'data'])
        const datasource = _.get(uiNode.getSchema(), 'datasource')
        if (!_.isNil(data) && !_.isNil(datasource)) {
          const { source } = datasource
          const dataPool = DataPool.getInstance()
          dataPool.clear(source)
        }
      }

      const parentNode = _.get(renderer, ['options', 'parentNode'])
      if (!_.isNil(parentNode)) {
        // must force update , since the data adjugement on uinode side not precised
        parentNode.sendMessage(true)
      } else {
        this.messager.sendMessage(
          this.activeLayout,
          { layoutMap: this.layoutMap }
        )
      }

    } else {
      return false
    }
    return true
  }

  /**
   * remove the layout
   * @param layoutKey
   * @param clearData
   */
  removeLayout(
    layoutKey?: string,
    clearData?: boolean,
  ) {
    const targetLayout = this.getLayoutKey(layoutKey)
    delete this.layoutMap[targetLayout]

    _.forIn(this.engineMap, (layouts: string[], engineId: string) => {
      _.remove(layouts, (layout: string) => {
        return layout === targetLayout
      })
    })

    if (targetLayout === this.activeLayout) {
      // activate the last layout of active engine
      const activeEngine = this.getEngineId()
      const loadedLayouts = this.engineMap[activeEngine]
      const lastLayout = _.findLast(loadedLayouts, (layout: string) => {
        return layout !== targetLayout
      })
      if (lastLayout === undefined) {
        this.activeLayout = ''
      } else {
        this.activeLayout = lastLayout
      }
    }

    // send message
    this.messager.sendMessage(
      this.activeEngine,
      { layoutMap: this.layoutMap }
    )
    return true
  }

  /**
   * change the order of the layout
   * @param layoutKey
   * @param newIndex
   */
  placeLayout(
    layoutKey?: string,
    newIndex?: number,
  ) {
    const targetLayout = this.getLayoutKey(layoutKey)

    let targetEngine: string = ''
    _.forIn(this.engineMap, (layouts: string[], engineId: string) => {
      if (layouts.includes(targetLayout)) {
        targetEngine = engineId
        return false
      }
    })

    if (!_.isEmpty(targetEngine)) {
      const loadedLayouts = this.engineMap[targetEngine]

      _.remove(loadedLayouts, (layout: string) => {
        return layout === targetLayout
      })
      if (!_.isNil(newIndex) && _.isFinite(newIndex)) {
        loadedLayouts.splice(newIndex, 0, targetLayout)
      } else {
        loadedLayouts.push(targetLayout)
      }
    } else {
      return false
    }
    return true
  }

  /**
   * send message to engines for info update
   * @param engines
   * @param info
   * @param forceRefresh
   * @param forAll
   */
  sendMessageToUIEngine(
    engines: string | string[] | undefined,
    info: IObject,
    forceRefresh?: boolean,
    forAll?: boolean,
  ) {
    const targetList: string[] = []
    if (forAll === true) {
      _.forIn(this.engineMap, (l, engineId: string) => {
        targetList.push(engineId)
      })
    } else if (_.isString(engines) && engines) {
      targetList.push(engines)
    } else if (_.isArray(engines)) {
      engines.forEach((item: string) => {
        if (_.isString(item) && item) {
          targetList.push(item)
        }
      })
    } else if (_.isNil(engines) && this.activeEngine) {
      targetList.push(this.activeEngine)
    }

    targetList.forEach((engineId: string) => {
      const state = {
        ...info,
        time: forceRefresh ? new Date().getTime() : 0,
      }

      this.messager.sendMessage(engineId, state)
    })
    return true
  }

  /**
   * cast message to layouts for info update
   * @param layouts
   * @param info
   * @param nodeSelector
   * @param forAll
   */
  castMessageToLayoutNode(
    layouts: string | string[] | undefined,
    info: IObject,
    selector?: INodeProps,
    forAll?: boolean,
  ) {
    const targetList: string[] = []
    if (forAll === true) {
      _.forIn(this.layoutMap, (r, layoutKey: string) => {
        targetList.push(layoutKey)
      })
    } else if (_.isString(layouts) && layouts) {
      targetList.push(layouts)
    } else if (_.isArray(layouts)) {
      layouts.forEach((item: string) => {
        if (_.isString(item) && item) {
          targetList.push(item)
        }
      })
    } else if (_.isNil(layouts) && this.activeLayout) {
      targetList.push(this.activeLayout)
    }

    targetList.forEach((layoutKey: string) => {
      const renderer = this.layoutMap[layoutKey]
      if (!_.isNil(renderer)) {
        if (!_.isNil(selector)) {
          const nodes = searchNodes(selector, layoutKey)
          _.forEach(nodes, (node: IUINode) => {
            node.messager.sendMessage(node.id, info)
          })
        }
      }
    })
    return true
  }
}

export default NodeController
