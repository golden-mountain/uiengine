import _ from 'lodash'

import {
  IDataEngine,
  IDataSource,
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
  const dataSource: IDataSource = _.get(param, 'source')
  const RP: any = _.get(param, 'RP')

  if (_.isString(RP.endpoint)) {
    RP.endpoint = RP.endpoint.replace(/\{(.*?)\}/, '')
  }
  return true
}

export const urlFitter: IPlugin = {
  name: 'urlFitter',
  categories: ['data.request.could'],
  paramKeys: ['dataEngine', 'source', 'RP'],
  execution,
  priority: 100,
}
