import _ from 'lodash'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from 'uiengine/typings'

/**
 * get cm lineage by UI schema
 *
 * @param dataNode
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const dataNode: IDataNode = _.get(param, 'dataNode')
  const rootSchema = dataNode.rootSchema
  let schemaPath = dataNode.source.schema || dataNode.source.source
  let name = schemaPath.replace(':', '.')
  const regex = /\[\d+\]/
  name = name.replace(regex, '')
  // console.log(_.cloneDeep(rootSchema), name)
  let result = _.get(rootSchema, `fields`, []).filter((schema: any) => {
    return schema['cm-lineage'] === name
  })

  // parse data schema deps
  dataNode.schema = result.pop()
  return result
}

export const schemaParser: IPlugin = {
  name: 'parse-schema',
  categories: ['data.schema.parser'],
  paramKeys: ['dataNode'],
  execution,
  priority: 99,
}
