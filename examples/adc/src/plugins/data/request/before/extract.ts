import _ from 'lodash'

import {
  IDataEngine,
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IPluginExecuteOption,
  IUINode,
} from 'uiengine/typings'

/**
 * exclude data
 * @param dataEngine
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const dataEngine: IDataEngine = _.get(param, 'dataEngine')
  const { params } = dataEngine.requestOptions
  const dataSource = dataEngine.source
  if (!dataSource || !dataSource.source) {
    return true
  }
  const dataLineage: string = _.trimEnd(dataSource.source, ':')
  const dataPath = dataLineage.split('.')
  dataPath.pop()
  const extractedData = _.get(params, dataPath)
  if (extractedData) {
    dataEngine.requestOptions.params = extractedData
  }
  return true
}

export const extract: IPlugin = {
  name: 'extract',
  categories: ['data.request.before'],
  paramKeys: ['dataEngine'],
  execution,
  priority: 199,
}
