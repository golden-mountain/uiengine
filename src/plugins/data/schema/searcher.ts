import _ from 'lodash'

import {
  IDataSchema,
  IDataNodeSchema,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  const schema: IDataSchema = _.get(param, 'schema')
  const lineage: string = _.get(param, 'lineage')

  let targetSchema: IDataSchema | IDataNodeSchema | undefined
  if (_.isObject(schema) && schema['cm-lineage'] === lineage) {
    targetSchema = schema
  } else if (_.isObject(schema) && _.has(schema, 'fields')) {
    const { fields } = schema
    if (_.isArray(fields) && fields.length) {
      fields.some((fieldSchema: IDataNodeSchema) => {
        if (fieldSchema['cm-lineage'] === lineage) {
          targetSchema = fieldSchema
          return true
        }
        return false
      })
    }
  }

  return targetSchema
}

export const schemaSearcher: IPlugin = {
  name: 'schema-searcher',
  categories: ['dataMapper.dataSchema.searchFromRoot'],
  paramKeys: ['schema', 'lineage'],
  execution,
  priority: 0,
}
