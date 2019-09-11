import _ from 'lodash'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from 'uiengine/typings'

/**
 * transfer the data schema to UI deps
 * and other possible used data
 *
 * @param dataNode
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const dataNode: IDataNode = _.get(param, 'dataNode')
  const schema = dataNode.schema
  if (schema) {
    // const toMergeSchema = {}
    // // condition turns to visible deps
    // let exclusions = _.get(schema, 'cm-meta.m-exclusion')
    // if (_.isArray(exclusions)) {
    //   let deps = exclusions.map((ex: any) => {
    //     return {
    //       selector: {
    //         datasource: ex
    //       },
    //       comparerule: 'empty',
    //       data: ''
    //     }
    //   })
    //   const depLine = 'state.visible.deps'
    //   _.set(toMergeSchema, depLine, deps)
    // }
    // // merge ui schema
    // const uiSchema = dataNode.uiNode.schema
    // _.merge(uiSchema, toMergeSchema)
    /**new start */
    // const toMergeSchema = {}
    // let associations = _.get(schema, 'cm-meta.obj-association')
    // _.set(toMergeSchema, 'props.associations', associations)
    // // merge ui schema
    // const uiSchema = dataNode.uiNode.schema
    // _.merge(uiSchema, toMergeSchema)
  }

  return schema
}

export const UISchemaFit: IPlugin = {
  name: 'fit-ui-schema',
  categories: ['data.schema.parser'],
  paramKeys: ['dataNode'],
  execution,
  priority: 100,
}
