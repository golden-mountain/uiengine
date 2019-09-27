import _ from 'lodash'

import { NodeController } from 'uiengine'

import {
  IListenerConfig,
  IListener,
  IListenerParam,
  IUINode,
} from 'uiengine/typings'

const listener: IListener = (directParam: IListenerParam) => {
  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const nodeController = NodeController.getInstance()
  nodeController.workflow.deactiveLayout()
}

export const hideNode: IListenerConfig = {
  name: 'hideNode',
  paramKeys: ['uiNode'],
  listener,
  weight: 100,
}
