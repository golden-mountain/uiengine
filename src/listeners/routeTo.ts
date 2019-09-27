import _ from 'lodash'

import {
  IListenerConfig,
  IListener,
  IListenerParam,
  IUINode,
} from '../../typings'

const listener: IListener = async (directParam: IListenerParam) => {
  const event: Event = _.get(directParam, 'event')
  const options: any = _.get(directParam, 'options')
  const uiNode: IUINode = _.get(directParam, 'uiNode')
  if (_.isFunction(_.get(event, 'stopPropagation'))) {
    event.stopPropagation()
  } else if (_.get(event, 'cancelBubble') === false) {
    event.cancelBubble = true
  }

  console.log(`Mock: route to ${_.get(options, 'redirect')}`)

}

export const routeTo: IListenerConfig = {
  name: 'routeTo',
  paramKeys: ['event', 'options', 'uiNode'],
  debugList: ['options.redirect'],
  listener,
  weight: 0,
  describe: {
    options: [
      {
        redirect: 'string'
      }
    ]
  }
}
