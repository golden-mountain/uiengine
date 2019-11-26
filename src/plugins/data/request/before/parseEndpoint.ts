import _ from 'lodash'

import { NodeController } from '../../../../data-layer'

import {
  IDataSource,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../../typings'

/**
 * parse the endpoint by working mode
 * @param
 */
const execution: IPluginExecution = async (param: IPluginParam) => {
  const RP: any = _.get(param, 'RP')

  if (_.isObject(RP)) {
    const { layoutKey, domainSource, endpoint } = RP as any

    if (_.isString(layoutKey) && layoutKey) {
      const controller = NodeController.getInstance()
      const wMode = controller.getWorkingMode(layoutKey)

      if (_.isObject(wMode)) {
        const { operationModes, options } = wMode

        let param = {}
        if (_.isObject(options)) {
          const { urlParam } = options
          if (_.isObject(urlParam)) {
            _.assign(param, urlParam)
          }
        }
        if (_.isArray(operationModes)) {
          operationModes.forEach((config) => {
            if (_.isObject(config)) {
              const { source, options: subOptions } = config
              if (source === domainSource.source && _.isObject(subOptions)) {
                const { urlParam } = subOptions
                if (_.isObject(urlParam)) {
                  _.assign(param, urlParam)
                }
              }
            }
          })
        } else if (_.isObject(operationModes)) {
          const { source, options: subOptions } = operationModes
          if (source === domainSource.source && _.isObject(subOptions)) {
            const { urlParam } = subOptions
            if (_.isObject(urlParam)) {
              _.assign(param, urlParam)
            }
          }
        }

        let url: string = endpoint
        const matchBraces = /\{[\w\-]*\}/g
        const matchParam = /\{(.*)\}/
        const results = url.match(matchBraces)
        if (_.isArray(results)) {
          results.forEach((item: string) => {
            const result = item.match(matchParam)
            if (_.isArray(result) && _.isString(result[1])) {
              const paramKey = result[1]
              let paramStr = param[paramKey]
              if (!paramStr) {
                paramStr = param[paramKey]
              }
              if (_.isString(paramStr) || _.isFinite(paramStr)) {
                url = url.replace(`{${paramKey}}`, `${paramStr}`)
              }
            }
          })
        }

        if (url !== endpoint) {
          _.set(RP, 'endpoint', url)
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
