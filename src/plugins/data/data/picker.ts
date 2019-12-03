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
    const route: string[] = []
    getAccessRoute(dataSource)
      .split('.')
      .forEach((slice: string) => {
        const accessArray = /\[\d*\]/g;
        const matchResult = slice.match(accessArray);
        if (!_.isNil(matchResult)) {
          let restStr = slice;
          matchResult.forEach((matchStr: string) => {
            const startIndex = restStr.indexOf(matchStr);
            const endIndex = startIndex + matchStr.length;

            route.push(restStr.slice(0, startIndex));
            restStr = restStr.slice(endIndex);

            const arrayIndex = /\[(\d*)\]/;
            const mResult = matchStr.match(arrayIndex);
            if (!_.isNil(mResult)) {
              const indexStr = mResult[1];
              const indexNum = Number(indexStr);
              route.push(`${indexNum}`);
            }
          });
          if (restStr) {
            route.push(restStr);
          }
        } else {
          route.push(slice);
        }
      })
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
