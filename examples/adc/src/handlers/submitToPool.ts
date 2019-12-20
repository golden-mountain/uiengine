import _ from 'lodash'

import {
  NodeController,
  UINode,
  replaceParam,
} from 'uiengine'

import {
  IConnectOptions,
  IHandlerConfig,
  IHandler,
  IHandlerParam,
  IObject,
  IUINode,
} from 'uiengine/typings'

const handler: IHandler = async (directParam: IHandlerParam) => {
  const uiNode: IUINode = _.get(directParam, 'uiNode')

  if (uiNode instanceof UINode) {
    const controller = NodeController.getInstance()
    const workflow = controller.workflow
    const workingMode = controller.getWorkingMode(uiNode.layoutKey)

    if (!_.isNil(workingMode)) {
      const { options } = workingMode
      if (_.isObject(options)) {
        const { dataConnect, connectParam } = options

        if (_.isObject(dataConnect)) {
          let { source, target, ...rest } = dataConnect as IConnectOptions
          if (_.isString(source) && source && _.isString(target) && target) {
            if (_.isObject(connectParam)) {
              source = replaceParam(source, connectParam)
              target = replaceParam(target, connectParam)
            }

            const result = await workflow.submitToPool({
              source,
              target,
              ...rest
            })

            if (!_.isNil(result)) {
              workflow.hideLayout()
            } else {
              console.error('Data should not empty when submitting')
            }
          }
        }
      }
    }
  }
}

export const submitToPool: IHandlerConfig = {
  name: 'submitToPool',
  paramKeys: ['uiNode'],
  handler,
  weight: 100,
}
