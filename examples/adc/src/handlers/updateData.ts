import _ from 'lodash'

import {
  IUINode,
  IHandlerConfig,
  IHandler,
  IHandlerParam,
  IHandlerHelper,
} from 'uiengine/typings'

const handler: IHandler = (
  directParam: IHandlerParam,
  helper: IHandlerHelper,
) => {
  const event: Event = _.get(directParam, 'event')
  if (_.isFunction(_.get(event, 'stopPropagation'))) {
    event.stopPropagation()
  } else if (_.get(event, 'cancelBubble') === false) {
    event.cancelBubble = true
  }

  let value: any = _.get(directParam, 'value')
  if (_.isNil(value) && _.has(event, 'target.value')) {
    value = _.get(event, 'target.value')
  }

  const uiNode: IUINode = _.get(directParam, 'uiNode')
  if (!_.isNil(uiNode)) {
    if (_.isFunction(_.get(uiNode, 'dataNode.updateData'))) {
      uiNode.dataNode.updateData(value)
    } else {
      console.log('Can\'t find function dataNode.updateData in handler "updateData"')
    }
  } else {
    console.log('Can\'t find the target uiNode in handler "updateData"')
  }
}

export const updateData: IHandlerConfig = {
  name: 'updateData',
  paramKeys: ['event', 'value', 'uiNode'],
  debugList: ['event', 'value', 'uiNode.id', 'uiNode.dataNode.data'],
  handler,
  weight: 1,
}
