import _ from 'lodash'
import { NodeController } from 'uiengine'

import {
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IUINode,
} from 'uiengine/typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  return async (e: any, options: any) => {
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
}

export const submitToPool: IPlugin = {
  name: 'submitToPool',
  categories: ['ui.parser.event'],
  paramKeys: ['uiNode'],
  execution,
  priority: 100,
}