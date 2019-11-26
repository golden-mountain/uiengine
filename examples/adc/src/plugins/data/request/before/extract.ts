import _ from 'lodash'

import {
  IDataEngine,
  IDataSource,
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
  const dataSource: IDataSource = _.get(param, 'source')
  const RP: any = _.get(param, 'RP')

  if (!dataSource || !dataSource.source) {
    return true
  }
  const dataLineage: string = _.trimEnd(dataSource.source, ':')
  const dataPath = dataLineage.split('.')
  dataPath.pop()
  const extractedData = _.get(RP.requestPayload, dataPath)
  if (extractedData) {
    RP.requestPayload = extractedData
  }
  return true
}

export const extract: IPlugin = {
  name: 'extract',
  categories: ['data.request.before'],
  paramKeys: ['dataEngine', 'source', 'RP'],
  execution,
  priority: 199,
}
