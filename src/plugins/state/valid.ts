import _ from 'lodash'

import { stateDepsResolver } from '../../helpers'

import {
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IStateNode,
} from '../../../typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  const stateNode: IStateNode = _.get(param, 'stateNode')
  return { valid: stateDepsResolver(stateNode, 'valid', true) }
}

export const valid: IPlugin = {
  name: 'valid',
  categories: ['state.resolver'],
  paramKeys: ['stateNode'],
  execution,
  priority: 0,
}
