import _ from 'lodash'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from 'uiengine/typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  // const dataNode: IDataNode = _.get(param, 'dataNode')
  // console.log(dataNode.schema, dataNode.rootSchema)
  // const errors = dataNode.dataPool.errors
  // return {
  //   status: _.isEmpty(errors),
  //   errors
  // }
}

export const schemaRules: IPlugin = {
  name: 'schemaRules',
  categories: ['data.update.could'],
  // paramKeys: ['dataNode'],
  execution,
  priority: 0,
}
