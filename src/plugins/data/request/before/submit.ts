import _ from 'lodash'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../../typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  const dataNode: IDataNode = _.get(param, 'dataNode')
  return true
  // const errors = dataNode.dataPool.errors
  // return {
  //   status: _.isEmpty(errors),
  //   errors
  // }
}

export const submit: IPlugin = {
  name: 'submit-handler',
  categories: ['data.request.before'],
  paramKeys: ['dataNode'],
  execution,
  priority: 0,
}
