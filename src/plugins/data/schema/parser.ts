import _ from 'lodash'

import {
  IDataSchema,
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
  const domainSchema: IDataSchema = _.get(param, 'domainSchema')
  const lineage: string = _.get(param, 'lineage')

  if (_.isObject(domainSchema) && _.isString(lineage)) {
    return _.get(domainSchema, `definition.${lineage}`)
  }

  return undefined
}

export const schemaParser: IPlugin = {
  name: 'schema-parser',
  categories: ['data.schema.parser'],
  paramKeys: ['domainSchema', 'lineage'],
  execution,
  priority: 0,
}
