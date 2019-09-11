import _ from 'lodash'

import { NodeController } from '../..'

import {
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IUINode,
} from '../../../typings'

const execution: IPluginExecution = async (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  return (e: any, options: any) => {
    // console.log(uiNode.schema, options, '... on loadUI plugin')
    const { layout, container } = options
    if (!layout) {
      return false
    }
    const nodeController = NodeController.getInstance()
    return nodeController.workflow.activeLayout(layout, {
      container,
      parentNode: uiNode
    })
  }
}

export const loadLayout: IPlugin = {
  name: 'loadUI',
  categories: ['ui.parser.event'],
  paramKeys: ['uiNode'],
  execution,
  priority: 0,
}
