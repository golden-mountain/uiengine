import _ from 'lodash'

import {
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IUINode
} from '../../../typings'

const execution: IPluginExecution = async (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  const schema = uiNode.getSchema()
  const tplSchemaPath = _.get(schema, '$template')
  let result = {}
  if (tplSchemaPath) {
    let response: any = await uiNode.request.get(
      tplSchemaPath,
      { prefixType: 'uiSchema' },
      uiNode.engineId
    )
    if (response.data) {
      result = response.data
      _.unset(uiNode.schema, '$template')
    }
  }
  return result
}

export const template: IPlugin = {
  name: 'template',
  categories: ['ui.parser.before'],
  paramKeys: ['uiNode'],
  execution,
  priority: 0
}
