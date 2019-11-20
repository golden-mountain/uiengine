import _ from 'lodash'

import {
  getAccessRoute
} from '../../../helpers/utils'

import {
  IDataSource,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../typings'

/**
 *
 * @param data
 * @param source
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const data: any = _.get(param, 'data')
  const source: IDataSource = _.get(param, 'source')

  const dataSource = _.get(source, 'source')
  if (_.isString(dataSource) && dataSource) {
    const route = getAccessRoute(dataSource).split('.')
    while (true) {
      const pickedData = _.get(data, route)
      if (pickedData !== undefined) {
        return pickedData
      } else if (route.length > 0) {
        route.shift()
        continue
      } else {
        break
      }
    }
  }

  return undefined
}

export const pickSourceData: IPlugin = {
  name: 'pickSourceData',
  categories: ['data.data.picker'],
  paramKeys: ['data', 'source'],
  execution,
  priority: 0,
}
