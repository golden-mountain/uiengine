import _ from 'lodash'

import {
  IUINode,
  IListenerConfig,
  IListener,
  IListenerParam,
  IListenerHelper,
} from '../../typings'

const listener: IListener = (
  directParam: IListenerParam,
  helper: IListenerHelper,
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
      console.log('Can\'t find function dataNode.updateData in listener "updateData"')
    }
  } else {
    console.log('Can\'t find the target uiNode in listener "updateData"')
  }
}

export const updateData: IListenerConfig = {
  name: 'updateData',
  paramKeys: ['event', 'value', 'uiNode'],
  debugList: ['event', 'value', 'uiNode.id', 'uiNode.dataNode.data'],
  listener,
  weight: 0,
}
