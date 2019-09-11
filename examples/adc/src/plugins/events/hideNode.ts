import _ from 'lodash'
import { NodeController } from 'uiengine'

import {
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IUINode,
} from 'uiengine/typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  return (e: any, options: any) => {
    const nodeController = NodeController.getInstance()
    nodeController.workflow.deactiveLayout()
  }
}

export const hideNode: IPlugin = {
  name: 'hideNode',
  categories: ['ui.parser.event'],
  paramKeys: ['uiNode'],
  execution,
  priority: 100,
}
