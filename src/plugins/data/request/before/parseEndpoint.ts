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

        const url = replaceParam(endpoint, param)
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
