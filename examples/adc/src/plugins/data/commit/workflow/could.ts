import _ from 'lodash'

import { DataPool } from 'uiengine'

import {
  INodeController,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from 'uiengine/typings'

/**
 * could we commit
 * @param nodeController
 */
const execution: IPluginExecution = (param: IPluginParam) => {
  const nodeController: INodeController = _.get(param, 'nodeController')
  const sources: any = _.get(param, 'sources')

  // const allError = { status: false, code: 'Please make sure every items are good, then submit again'}
  if (_.has(sources, 'source')) {
    // any errors?
    const dataPool = DataPool.getInstance()
    const errors = dataPool.getInfo(sources.source, 'error')
    const isError = _.isEmpty(errors)
    return isError
  }

  return true
}

export const could: IPlugin = {
  name: 'could',
  categories: ['data.commit.workflow.could'],
  paramKeys: ['nodeController', 'sources'],
  execution,
  priority: 100,
}
