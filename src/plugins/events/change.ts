import _ from 'lodash'

import {
  IUINode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation()
    }
    let value
    if (e.target) {
      value = e.target.value
    } else {
      value = e
    }
    uiNode.dataNode.updateData(value)
  }
}

export const change: IPlugin = {
  name: 'change',
  categories: ['ui.parser.event'],
  paramKeys: ['uiNode'],
  execution,
  priority: 100,
}
