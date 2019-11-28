import _ from 'lodash'
import { ListenerManager } from 'uiengine'

import {
  IPlugin,
  IPluginExecution,
  IUINode,
  IPluginParam,
  IEventConfig,
} from 'uiengine/typings'

function getDefaultEventConfig(component: string, type: string) {
  const onChangeWithEvent: IEventConfig = {
    eventName: 'onChange',
    receiveParams: ['event'],
    listener: 'updateData'
  }
  const onChangeWithValue: IEventConfig = {
    eventName: 'onChange',
    receiveParams: ['value'],
    listener: 'updateData'
  }

  switch (component) {
    case 'a10:FormItem':
      if (_.isString(type)) {
        if (type === 'input-number') {
          type = 'InputNumber'
        }
        if (type.indexOf(":") === -1) {
          type = "antd:" + _.upperFirst(type)
        }

        if (type.includes('antd:')) {
          switch (true) {
            case type === 'antd:Input':
            case type.includes('antd:Input.'):
            case type === 'antd:Checkbox':
            case type === 'antd:Radio.Group':
              return [onChangeWithEvent]
            case type === 'antd:InputNumber':
            case type === 'antd:Checkbox.Group':
            case type === 'antd:Switch':
            case type === 'antd:Select':
              return [onChangeWithValue]
            default:
              return []
          }
        } else {
          return [onChangeWithValue]
        }
      }
      break
    default:
      break
  }
  return []
}

const execution: IPluginExecution = async (directParam: IPluginParam) => {
  const uiNode: IUINode = _.get(directParam, 'uiNode')

  const schema = uiNode.getSchema()
  const component: any = _.get(schema, 'component')
  const props: any = _.get(schema, 'props')

  const dataNode = uiNode.dataNode
  // load label & type from data schema
  const dataLabel: string = dataNode.getSchema('label')
  const inputType: string = dataNode.getSchema('type')
  // get data value
  const value = dataNode.data
  // get error validation info
  const error = dataNode.errorInfo

  // assign all default props
  let result = {
    key: uiNode.id,
    label: dataLabel,
    type: inputType,
    value,
    error,
  }

  let eventConfigs: IEventConfig[] = []
  // assign user defined props
  if (_.isObject(props)) {
    let {
      label = dataLabel,
      type = inputType,
      $events,
      ...rest
    } = props as any

    // get event configs
    if (_.isArray($events) && $events.length > 0) {
      eventConfigs = $events
    }

    // assign props to result
    result = { ...rest, ...result, label, type }
  }

  // get default event configs
  if (_.isArray(eventConfigs) && eventConfigs.length === 0) {
    const { type } = result
    eventConfigs = getDefaultEventConfig(component, type)
  }

  const manager = ListenerManager.getInstance()
  let eventFuncs = manager.getStaticEventProps(eventConfigs.map((config: IEventConfig) => {
    const { eventName, receiveParams, defaultParams, target, listener, ...rest } = config
    return {
      eventName: _.isString(eventName) ? eventName : 'unknownEvent',
      receiveParams: _.isArray(receiveParams) ? receiveParams : [],
      defaultParams: { ...(_.isObject(defaultParams) ? defaultParams : {}), uiNode },
      target: _.isString(target) ? target : uiNode.id,
      listener: _.isString(listener) ? listener : 'unknownListener',
      ...rest
    }
  }))
  if (!_.isEmpty(eventFuncs)) {
    result = { ...result, ...eventFuncs }
  }

  uiNode.props = result
  return result
}

export const props: IPlugin = {
  name: 'props-parser',
  categories: ['ui.parser'],
  paramKeys: ['uiNode'],
  execution,
  priority: 100,
}
