import _ from 'lodash'

import {
  IDataSchema,
  IDataNodeSchema,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from 'uiengine/typings'

function searchSchema(schema: any, lineage: string) {
  if (_.isObject(schema)) {
    if (_.get(schema, ['cm-lineage']) === lineage) {
      return schema
    } else if (_.has(schema, 'fields')) {
      const { fields } = schema as IDataSchema | IDataNodeSchema
      if (_.isArray(fields) && fields.length) {
        let targetSchema
        fields.some((fieldSchema: IDataNodeSchema) => {
          const result = searchSchema(fieldSchema, lineage)
          if (_.isObject(result)) {
            targetSchema = result
            return true
          }
          return false
        })
        if (!_.isNil(targetSchema)) {
          return targetSchema
        }
      }
    }
  }

  return undefined
}

const execution: IPluginExecution = (param: IPluginParam) => {
  const domainSchema: IDataSchema | IDataNodeSchema = _.get(param, 'domainSchema')
  const lineage: string = _.get(param, 'lineage')
  return searchSchema(domainSchema, lineage)
}

export const schemaParser: IPlugin = {
  name: 'schema-parser',
  categories: ['data.schema.parser'],
  paramKeys: ['domainSchema', 'lineage'],
  execution,
  priority: 0,
}
