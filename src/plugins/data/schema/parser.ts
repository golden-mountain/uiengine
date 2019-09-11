import _ from 'lodash'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../typings'

/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const dataNode: IDataNode = _.get(param, 'dataNode')
  if (_.isNil(dataNode)) {
    return ''
  }
  const rootSchema = dataNode.rootSchema
  let schemaPath = dataNode.source.schema || dataNode.source.source
  if (schemaPath) {
    let name = schemaPath.replace(':', '.')
    const regex = /\[\d+\]/
    name = name.replace(regex, '')
    return _.get(rootSchema, `definition.${name}`)
  } else {
    return ''
  }
}

export const schemaParser: IPlugin = {
  name: 'parse-schema',
  categories: ['data.schema.parser'],
  paramKeys: ['dataNode'],
  execution,
  priority: 0,
}
