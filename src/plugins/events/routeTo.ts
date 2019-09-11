import _ from 'lodash'

import {
  IPlugin,
  IPluginExecution,
  IUINode,
  IPluginParam,
} from '../../../typings'

const execution: IPluginExecution = async (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation()
    }
  }
}

export const routeTo: IPlugin = {
  name: 'routeTo',
  categories: ['ui.parser.event'],
  paramKeys: ['uiNode'],
  execution,
  priority: 0,
}
