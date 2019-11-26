import _ from 'lodash'

import {
  DataPool,
  replaceParam,
} from '../../../helpers'

import {
  IDataNode,
  IDataPool,
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IPluginExecutionHelper,
  IWorkingMode,
  IConnectOptions,
} from '../../../../typings'

/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const dataNode: IDataNode = _.get(param, 'dataNode')
  const workingMode: IWorkingMode = _.get(param, 'workingMode')
  const dataPool: IDataPool = _.get(dataNode, 'dataPool')

  if (!_.isNil(dataNode) && !_.isNil(workingMode)) {
    const { options } = workingMode
    if (_.isObject(options)) {
      const { dataConnect, connectParam } = options

      // when the working mode define a data connect
      // transfer the target data to the source when loading data
      if (_.isObject(dataConnect)) {
        let { source, target } = dataConnect as IConnectOptions
        if (_.isString(source) && source && _.isString(target) && target) {
          if (_.isObject(connectParam)) {
            source = replaceParam(source, connectParam)
            target =replaceParam(target, connectParam)
          }

          if (!_.isNil(dataPool)) {
            dataPool.transfer(target, source, { createDst: true })
          }
        }
      }
    }
    return dataNode.data
  }
  return
}

export const loadDataPoolData: IPlugin = {
  name: 'loadDataPoolData',
  categories: ['data.data.parser'],
  paramKeys: ['dataNode', 'workingMode'],
  execution,
  priority: 0,
}
