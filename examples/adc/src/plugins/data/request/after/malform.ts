import _ from 'lodash'

import { getDomainName } from 'uiengine'

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
  const data = dataEngine.data
  if (dataEngine.source !== undefined) {
    const sourceSegs = getDomainName(dataEngine.source, false).split('.')
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
  paramKeys: ['dataEngine'],
  execution,
  priority: 100,
}
