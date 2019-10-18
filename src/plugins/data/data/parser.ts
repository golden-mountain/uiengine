import _ from 'lodash'

import { DataPool } from '../../../helpers'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IPluginExecutionHelper,
} from '../../../../typings'

/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const dataNode: IDataNode = _.get(param, 'dataNode')

  if (!_.isNil(dataNode)) {
    const mode = _.get(dataNode.uiNode.workingMode, 'mode')
    const connect = _.get(dataNode.uiNode.workingMode, 'options.source')
    if (mode === 'edit-pool') {
      let { source, target } = connect
      const index = _.get(dataNode.uiNode.workingMode, 'options.key')
      if (index !== undefined) {
        target = target.replace(/(\[.*?\])/, `[${index}]`)
      }
      // console.log(source, target, index);
      const dataPool = DataPool.getInstance()
      dataPool.transfer(target, source, { createDst: true })
    }
    return dataNode.data
  }
  return
}

export const loadDataPoolData: IPlugin = {
  name: 'loadDataPoolData',
  categories: ['data.data.parser'],
  paramKeys: ['dataNode'],
  execution,
  priority: 0,
}
