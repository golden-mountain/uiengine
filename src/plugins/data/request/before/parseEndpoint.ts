import _ from 'lodash'

import { NodeController } from '../../../../data-layer'
import { replaceParam } from '../../../../helpers/utils'

import {
  IDataSource,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../../typings'

/**
 * parse the endpoint by working mode
 * @directParam
 */
const execution: IPluginExecution = async (directParam: IPluginParam) => {
  const RP: any = _.get(directParam, 'RP')

  if (_.isObject(RP)) {
    const { layoutKey, domainSource, endpoint, requestPayload } = RP as any

    if (_.isString(layoutKey) && layoutKey) {
      const controller = NodeController.getInstance()
      const wMode = controller.getWorkingMode(layoutKey)

      if (_.isObject(wMode)) {
        const { operationModes, options } = wMode

        let urlParamMap = _.isObject(requestPayload) ? requestPayload : {}
        console.log(urlParamMap)
        let queryParamMap = {}
        if (_.isObject(options)) {
          const { urlParam, queryParam } = options
          if (_.isObject(urlParam)) {
            _.assign(urlParamMap, urlParam)
          }
          if (_.isObject(queryParam)) {
            _.assign(queryParamMap, queryParam)
          }
        }
        if (_.isArray(operationModes)) {
          operationModes.forEach((config) => {
            if (_.isObject(config)) {
              const { source, options: subOptions } = config
              if (source === domainSource.source && _.isObject(subOptions)) {
                const { urlParam, queryParam } = subOptions
                if (_.isObject(urlParam)) {
                  _.assign(urlParamMap, urlParam)
                }
                if (_.isObject(queryParam)) {
                  _.assign(queryParamMap, queryParam)
                }
              }
            }
          })
        } else if (_.isObject(operationModes)) {
          const { source, options: subOptions } = operationModes
          if (source === domainSource.source && _.isObject(subOptions)) {
            const { urlParam, queryParam } = subOptions
            if (_.isObject(urlParam)) {
              _.assign(urlParamMap, urlParam)
            }
            if (_.isObject(queryParam)) {
              _.assign(queryParamMap, queryParam)
            }
          }
        }

        const url = replaceParam(endpoint, urlParamMap)
        if (url !== endpoint) {
          _.set(RP, 'endpoint', url)
        }
        if (!_.isEmpty(queryParamMap)) {
          _.set(RP, ['requestConfig', 'params'], queryParamMap)
        }
      }
    }
  }

  return true
}

export const endpointParser: IPlugin = {
  name: 'endpoint-parser',
  categories: ['data.request.before'],
  paramKeys: ['RP'],
  execution,
  priority: 0,
}
