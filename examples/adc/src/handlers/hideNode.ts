import _ from 'lodash'

import { NodeController } from 'uiengine'

import {
  IHandlerConfig,
  IHandler,
  IHandlerParam,
  IUINode,
} from 'uiengine/typings'

const handler: IHandler = (directParam: IHandlerParam) => {
  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const nodeController = NodeController.getInstance()
  nodeController.workflow.hideLayout()
}

export const hideNode: IHandlerConfig = {
  name: 'hideNode',
  paramKeys: ['uiNode'],
  handler,
  weight: 100,
}
