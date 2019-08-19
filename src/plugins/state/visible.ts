import _ from 'lodash'
import { stateDepsResolver } from '../../helpers'
import { IPluginFunc, IPlugin, IStateNode } from '../../../typings'

const callback: IPluginFunc = (stateNode: IStateNode) => {
  return stateDepsResolver(stateNode, 'visible', true)
}

export const visible: IPlugin = {
  type: 'state.resolver',
  priority: 0,
  callback,
  name: 'visible'
}
