import _ from 'lodash'

import { NodeController } from 'uiengine'

import {
  IListenerConfig,
  IListener,
  IListenerParam,
  IUINode,
} from 'uiengine/typings'

const listener: IListener = async (directParam: IListenerParam) => {
  const uiNode: IUINode = _.get(directParam, 'uiNode')

  const nodeCtroller = NodeController.getInstance()
  const workflow = nodeCtroller.workflow
  const workingMode = uiNode.workingMode
  if (_.has(workingMode, 'options.source')) {
    const connectOptions = _.get(workingMode, 'options.source')
    const key = _.get(workingMode, 'options.key')
    const mode = _.get(workingMode, 'mode')
    const newConnectOptions = _.cloneDeep(connectOptions)
    if (
      mode === 'edit-pool' &&
      key !== undefined &&
      _.has(newConnectOptions, 'target')
    ) {
      newConnectOptions.target = newConnectOptions.target.replace(
        /\[(\d*)\]$/,
        `[${key}]`
      )
    }
    const result = await workflow.submitToPool(newConnectOptions)

    if (result) {
      workflow.deactiveLayout()
    } else {
      // to write to a global notification
      console.error('Data should not empty when submitting')
    }
  }
}

export const submitToPool: IListenerConfig = {
  name: 'submitToPool',
  paramKeys: ['uiNode'],
  listener,
  weight: 100,
}
