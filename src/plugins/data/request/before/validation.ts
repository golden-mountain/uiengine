import _ from 'lodash'

import { validateAll } from '../../../../helpers/utils/data'

import {
  IDataSource,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../../typings'

/**
 * add prefix to data
 * @param dataEngine
 */
const execution: IPluginExecution = async (param: IPluginParam) => {
  const dataSource: IDataSource|string = _.get(param, 'source')

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

  if (_.isObject(dataSource)) {
    await validate(dataSource.source)
  } else if (_.isString(dataSource)) {
    await validate(dataSource)
  }

  if (errors.length) {
    let couldRequest = true
    errors.forEach((error: any) => {
      if (error.status !== true) {
        couldRequest = false
        return
      }
    })
    if (!couldRequest) return false
  }

  return true
}

export const validation: IPlugin = {
  name: 'validation',
  categories: ['data.request.before'],
  paramKeys: ['source'],
  execution,
  priority: 200,
}
