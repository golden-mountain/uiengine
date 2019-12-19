import _ from 'lodash'

import {
  IHandlerConfig,
  IHandler,
  IHandlerParam,
  IUINode,
} from '../../typings'

const handler: IHandler = async (directParam: IHandlerParam) => {
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

export const routeTo: IHandlerConfig = {
  name: 'routeTo',
  paramKeys: ['event', 'options', 'uiNode'],
  debugList: ['options.redirect'],
  handler,
  weight: 0,
  describe: {
    options: [
      {
        redirect: 'string'
      }
    ]
  }
}
