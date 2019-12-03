import _ from 'lodash'

import { validateAll } from 'uiengine'

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
const execution: IPluginExecution = async (param: IPluginParam) => {
  const dataEngine: IDataEngine = _.get(param, 'dataEngine')
  const dataSource: IDataSource = _.get(param, 'source')
  const RP: any = _.get(param, 'RP')

  // validation
  let errors: any = []
  const validate = async (target: string) => {
    // validate all values
    if (target[target.length - 1] === ':') {
      const regExp = new RegExp(target)
      const errorInfos = await validateAll([regExp])
      if (errorInfos.length) {
        errors = errors.concat(errorInfos)
      }
    }
  }

  if (dataSource !== undefined) {
    await validate(dataSource.source)
  }

  if (errors.length) {
    let couldRequest = true
    errors.forEach((error: any) => {
      if (error.status !== true) couldRequest = false
    })
    if (!couldRequest) return false
  }
}

export const validation: IPlugin = {
  name: 'validation',
  categories: ['data.request.could'],
  paramKeys: ['dataEngine', 'source', 'RP'],
  execution,
  weight: 100,
}
