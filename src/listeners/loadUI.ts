import _ from 'lodash'

import NodeController from '../data-layer/NodeController'

import {
  IListenerConfig,
  IListener,
  IListenerParam,
  IUINode,
} from '../../typings'

const listener: IListener = (directParam: IListenerParam) => {
  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const layout: string = _.get(directParam, 'layout')
  const container: string = _.get(directParam, 'container')

  if (!layout) {
    return false
  }

  const nodeController = NodeController.getInstance()
  return nodeController.workflow.activeLayout(
    layout,
    {
      container,
      parentNode: uiNode
    }
  )
}

export const loadUI: IListenerConfig = {
  name: 'loadUI',
  paramKeys: ['uiNode', 'layout', 'container'],
  debugList: ['uiNode.id', 'layout', 'container'],
  listener,
  weight: 0,
  describe: {
    layout: 'string',
    container: 'string',
  }
}
