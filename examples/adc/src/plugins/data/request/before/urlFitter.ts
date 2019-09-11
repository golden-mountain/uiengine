import _ from 'lodash'

import {
  IDataEngine,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from 'uiengine/typings'

/**
 * add prefix to data
 * @param dataEngine
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const dataEngine: IDataEngine = _.get(param, 'dataEngine')
  const { endpoint = '' } = dataEngine.requestOptions
  dataEngine.requestOptions.endpoint = endpoint.replace(/\{(.*?)\}/, '')
  return true
}

export const urlFitter: IPlugin = {
  name: 'urlFitter',
  categories: ['data.request.could'],
  paramKeys: ['dataEngine'],
  execution,
  priority: 100,
}
