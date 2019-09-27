import _ from 'lodash'

import { ListenerManager } from '../../helpers'

import {
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IUINode,
} from '../../../typings'

const execution: IPluginExecution = async (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  const schema = uiNode.getSchema()
  const props = _.get(schema, 'props')
  let result = { key: uiNode.id }
  if (_.isObject(props)) {
    const { $events, ...rest } = props as any
    let eventFuncs = {}
    if (_.isArray($events)) {
      const manager = ListenerManager.getInstance()
      eventFuncs = manager.getStaticEventProps($events)
    }

    // assign props to uiNode
    result = { ...rest, ...eventFuncs, ...result }
  }
  uiNode.props = result
  return result
}

export const props: IPlugin = {
  name: 'props-parser',
  categories: ['ui.parser'],
  paramKeys: ['uiNode'],
  execution,
  priority: 0,
}
