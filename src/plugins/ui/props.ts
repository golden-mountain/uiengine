import _ from 'lodash'

import { Event } from '../../helpers'

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
  if (props) {
    const { $events, ...rest } = props as any
    let eventFuncs = {}
    if ($events) {
      const event = new Event(uiNode)
      eventFuncs = await event.loadEvents($events)
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
