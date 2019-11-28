import React from 'react'
import _ from 'lodash'
import {
  NodeController,
} from '../data-layer'
import {
  ComponentWrapper,
  UIEngineContext,
} from '../ui-layer'
import {
  getComponent,
  setComponentState,
} from '../helpers'

import {
  UIEngineRegister,
} from '../helpers/UIEngineRegister'
import * as plugins from '../plugins'
import * as listeners from '../listeners'
UIEngineRegister.registerPlugins(plugins)
UIEngineRegister.registerListeners(listeners)

import {
  IErrorInfo,
  ILayoutInfo,
  INodeController,
  IUIEngineProps,
  IUIEngineStates,
  IUINode,
  IUINodeRenderer,
  IUISchema,
  IWorkingMode,
} from '../../typings'

const DefaultMessager: React.FC<IErrorInfo> = (
  props: IErrorInfo
) => null
const DefaultUIEngineWrapper: React.FC<IUIEngineProps> = (
  props: IUIEngineProps
) => <>{props.children || null}</>
const DefaultContainer: React.FC = (
  props: any
) => <>{props.children || null}</>

export class UIEngine extends React.Component<
  IUIEngineProps,
  IUIEngineStates
> {
  static defaultProps: IUIEngineProps = {
    layouts: [],
    config: {},
    loadOptions: {},
  }
  // bind to its own nodes in nodeController, so it can only show the nodes with same id
  readonly engineId: string = _.uniqueId('engine-')
  error: IErrorInfo = {}
  nodeController: INodeController = NodeController.getInstance()

  state: IUIEngineStates = {
    layoutMap: {},
    activeNodeID: '',
    error: {},
    time: 0,
    loading: false,
  }
  updateTime?: number

  constructor(props: IUIEngineProps) {
    super(props)

    if (_.isString(props.id) && props.id) {
      this.engineId = props.id
    }

    if (!_.isNil(this.nodeController)) {
      const nodeController = this.nodeController

      const currentConfig = nodeController.getRequestConfig(this.engineId)
      if (_.isNil(currentConfig) && !_.has(props, ['config', 'requestConfig'])) {
        console.warn(`No available requestConfig, this is required on props of ${this.engineId}!`)
      } else if (!_.isNil(props.config)) {
        const { config: { requestConfig } } = props
        if (!_.isEmpty(requestConfig)) {
          nodeController.setRequestConfig(requestConfig, this.engineId)
        }
      }

      if (_.isFunction(props.onEngineCreate)) {
        props.onEngineCreate(this.engineId, this.nodeController)
      }
    } else {
      console.warn(`No available nodeController, this is required in ${this.engineId}!`)
    }
  }

  componentDidMount() {
    if (!_.isNil(this.nodeController)) {
      const messager = this.nodeController.messager
      if (!_.isNil(messager)) {
        messager.setStateFunc(
          this.engineId,
          setComponentState.bind(this)
        )
      }
    }

    this.loadLayouts()
  }

  componentWillUnmount() {
    this.unloadLayouts()

    if (!_.isNil(this.nodeController)) {
      const messager = this.nodeController.messager
      if (!_.isNil(messager)) {
        messager.removeStateFunc(this.engineId)
      }
    }
  }

  shouldComponentUpdate(nextProps: IUIEngineProps, nextState: IUIEngineStates) {
    const { layouts: nextLayouts } = nextProps
    const { layouts } = this.props
    const { loading } = this.state
    if (!_.isEqual(nextLayouts, layouts)) {
      if (loading === true) {
        this.updateTime = new Date().getTime()
      } else {
        this.refresh()
      }
    }
    return true
  }

  loadLayouts() {
    if (!_.isNil(this.nodeController)) {
      const nodeController = this.nodeController

      const { layouts, loadOptions = {} } = this.props
      const promises: Promise<IUINode>[] = []
      if (_.isArray(layouts) && layouts.length) {
        layouts.forEach((layoutConfig: string | IUISchema | ILayoutInfo, index: number) => {
          let layoutKey: string = `${this.engineId}-layout[${index}]`

          let layoutSchema: string | IUISchema = ''
          let layoutMode: IWorkingMode = {
            mode: 'new'
          }

          if (_.isString(layoutConfig)) {
            layoutSchema = layoutConfig
          } else if (_.has(layoutConfig, 'layout')) {
            const { id, layout, workingMode } = layoutConfig as ILayoutInfo
            if (_.isString(id) && id) {
              layoutKey = id
            }
            if (_.isString(layout)) {
              layoutSchema = layout
            } else if (_.isObject(layout)) {
              layoutSchema = layout
            }
            if (!_.isNil(workingMode) && !_.isEmpty(workingMode)) {
              layoutMode = workingMode
            }
          } else if (_.isObject(layoutConfig)) {
            layoutSchema = layoutConfig as IUISchema
          }

          // load the layout with the UISchema
          promises.push(
            // don't refresh the state from NodeController, otherwise it will cause deadloop
            nodeController
              .loadLayout(this.engineId, layoutKey, layoutSchema, layoutMode, loadOptions, false)
              .then((rootNode: IUINode) => {
                this.setState({ layoutMap: nodeController.layoutMap })
                return rootNode
              })
          )
        })
      }
      if (promises.length) {
        // there are new layouts loading and set update time
        this.setState({ loading: true })
        const currentTime = new Date().getTime()
        this.updateTime = currentTime

        Promise.all(promises).then((rootNodes: IUINode[]) => {
          nodeController.activateEngine(
            this.engineId,
            {
              layoutKey: (loaded?: string[]) => {
                if (_.isArray(loaded)) {
                  return loaded[loaded.length - 1]
                }
                return ''
              },
              autoRefresh: false,
            }
          )

          this.setState({ loading: false })
          if (this.updateTime !== currentTime) {
            this.refresh()
          }
        })
      } else {
        nodeController.activateEngine(this.engineId)
      }
    }
  }

  unloadLayouts() {
    if (!_.isNil(this.nodeController)) {
      const loadedLayouts = this.nodeController.engineMap[this.engineId]
      if (_.isArray(loadedLayouts) && loadedLayouts.length) {
        loadedLayouts.forEach((layoutKey: string) => {
          this.nodeController.removeLayout(layoutKey)
        })
      }
    }
  }

  refresh() {
    this.unloadLayouts()
    this.loadLayouts()
  }

  render() {
    const {
      layouts: l, // deconstruct here so can't deliver to wrapper
      config,
      onEngineCreate: o, // deconstruct here so can't deliver to wrapper
      ...rest
    } = this.props
    const { layoutMap, error, time } = this.state

    // judge whether this is in IDE env.
    let isIDEMode: boolean = false
    if (!_.isNil(config)) {
      const { ideMode } = config
      if (_.isBoolean(ideMode)) {
        isIDEMode = ideMode
      }
    }

    // provide engine context
    const engineContext = {
      controller: this.nodeController
    }

    // error handler
    let Messager = DefaultMessager
    // only show once error
    if (_.has(error, 'code') && !_.isEqual(error, this.error)) {
      if (_.has(config, ['widgetConfig', 'messager'])) {
        Messager = _.get(config, ['widgetConfig', 'messager'], DefaultMessager)
      } else {
        Messager = (props: any) => {
          return (
            <div className={`uiengine-message message-${props.status}`}>
              {props.code}
            </div>
          )
        }
      }
      if (!_.isNil(error)) {
        this.error = error
      }
    }

    // UIEngine Wrapper
    let UIEngineWrapper = DefaultUIEngineWrapper
    if (_.has(config, ['widgetConfig', 'uiengineWrapper'])) {
      UIEngineWrapper = _.get(
        config,
        ['widgetConfig', 'uiengineWrapper'],
        DefaultUIEngineWrapper
      )
    }

    // only get nodes for this engine
    const validNodes = _.pickBy(layoutMap, (nodeRenderer: IUINodeRenderer) => {
        const { engineId, options } = nodeRenderer
        if (options) {
          return engineId === this.engineId && !_.has(options, 'parentNode')
        }
        return engineId === this.engineId
      }
    )

    return (
      <UIEngineContext.Provider value={engineContext}>
        <UIEngineWrapper {...this.props}>
          <Messager {...(error ? error : {})} />
          {renderNodes(validNodes, { config, ...rest })}
        </UIEngineWrapper>
      </UIEngineContext.Provider>
    )
  }
}

export function renderNodes(uiNodeRenderers: _.Dictionary<IUINodeRenderer>, restOptions?: any) {
  return _.entries(uiNodeRenderers).map((entry: [string, IUINodeRenderer], index: number) => {
    const [layoutKey, uiNodeRenderer] = entry
    const { uiNode, options = {}, visible } = uiNodeRenderer
    const { container } = options

    if (!visible) return null

    // use the wrapper if provided
    let Container: React.FC<any> = DefaultContainer
    if (!_.isNil(container)) {
      Container = getComponent(container)
    }

    return (
      <Container {...options} visible={visible} key={`container-${index}`}>
        <ComponentWrapper
          key={layoutKey}
          uiNode={uiNode}
          {...restOptions}
        />
      </Container>
    )
  })
}

export default UIEngine
