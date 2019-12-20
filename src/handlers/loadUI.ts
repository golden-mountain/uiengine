import _ from 'lodash'

import NodeController from '../data-layer/NodeController'

import {
  IHandlerConfig,
  IHandler,
  IHandlerParam,
  IUINode,
} from '../../typings'

const handler: IHandler = (directParam: IHandlerParam) => {
  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const engineId: string = _.get(directParam, 'engineId')
  const layout: string = _.get(directParam, 'layout')
  const container: string = _.get(directParam, 'container')

  if (!layout) {
    return false
  }

  const nodeController = NodeController.getInstance()
  return nodeController.workflow.addLayout(
    engineId,
    layout,
    {
      schema: layout,
      loadOptions: {
        container,
        parentNode: uiNode
      }
    }
  )
}

export const loadUI: IHandlerConfig = {
  name: 'loadUI',
  paramKeys: ['uiNode', 'layout', 'container'],
  debugList: ['uiNode.id', 'layout', 'container'],
  handler,
  weight: 0,
  describe: {
    layout: 'string',
    container: 'string',
  }
}
