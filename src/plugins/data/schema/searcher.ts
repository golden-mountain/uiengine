import _ from 'lodash'

import {
  IDataSchema,
  IDataNodeSchema,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../typings'

function searchSchema(schema: any, lineage: string) {
  if (_.isObject(schema)) {
    if (schema['cm-lineage'] === lineage) {
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
  const schema: IDataSchema | IDataNodeSchema = _.get(param, 'schema')
  const lineage: string = _.get(param, 'lineage')
  return searchSchema(schema, lineage)
}

export const schemaSearcher: IPlugin = {
  name: 'schema-searcher',
  categories: ['dataMapper.dataSchema.searchFromRoot'],
  paramKeys: ['schema', 'lineage'],
  execution,
  priority: 0,
}
