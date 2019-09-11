import _ from 'lodash'

import {
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IUINode,
} from '../../../typings'

const execution: IPluginExecution = async (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  const schema = uiNode.getSchema()
  const tplSchemaPath = _.get(schema, '$template')
  let result = {}
  if (tplSchemaPath) {
    const reqConfig = uiNode.request.getConfig()
    let path = `${reqConfig.layoutSchemaPrefix}${tplSchemaPath}`
    let response: any = await uiNode.request.get(path)
    if (response.data) {
      result = response.data
      // Cache.setLayoutSchema(rootName, result)
      _.unset(uiNode.schema, '$template')
      _.forIn(result, (v, k) => {
        uiNode.schema[k] = v
      })
      await uiNode.replaceLayout(uiNode.schema)
    }
  }
  return result
}

export const template: IPlugin = {
  name: 'template',
  categories: ['ui.parser'],
  paramKeys: ['uiNode'],
  execution,
  priority: 0,
}
