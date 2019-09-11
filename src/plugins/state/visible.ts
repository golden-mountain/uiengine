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
  return { visible: stateDepsResolver(stateNode, 'visible', true)}
}

export const visible: IPlugin = {
  name: 'visible',
  categories: ['state.resolver'],
  paramKeys: ['stateNode'],
  execution,
  priority: 0,
}
