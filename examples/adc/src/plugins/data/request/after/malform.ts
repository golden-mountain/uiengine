import _ from 'lodash'

import { getDomainName } from 'uiengine'

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
  const source: IDataSource = _.get(param, 'source')
  const RP: any = _.get(param, 'RP')
  const data = RP.responseData
  if (source !== undefined) {
    const sourceSegs = getDomainName(source.source, false).split('.')
    let result: any = {}
    let validSegs: any = []
    let validData: any = {}
    for (let index in sourceSegs) {
      validSegs.push(sourceSegs[index])
      if (_.has(data, sourceSegs[index])) {
        validData = _.get(data, sourceSegs[index])
        break
      }
    }

    if (_.isEmpty(validData)) validData = data
    _.set(result, validSegs, validData)
    return result
  }
}

export const malform: IPlugin = {
  name: 'malform',
  categories: ['data.request.after'],
  paramKeys: ['dataEngine', 'source', 'RP'],
  execution,
  priority: 100,
}
