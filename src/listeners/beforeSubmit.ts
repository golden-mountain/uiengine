import _ from 'lodash'

import {
  NodeController
} from '../data-layer'

import {
  IListener,
  IListenerConfig,
  IListenerHelper,
  IListenerParam,
  ISubmitProcess,
  ISubmitTarget,
  ISubmitOption,
  ISubmitCallback,
  IUINode,
} from '../../typings'

const listener: IListener = async (directParam: IListenerParam) => {

  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const target: ISubmitProcess | ISubmitTarget = _.get(directParam, 'target')
  const options: ISubmitOption = _.get(directParam, 'options')
  const callbacks: ISubmitCallback = _.get(directParam, 'callbacks')

  return 'Submit Prepared'
}

export const beforeSubmit: IListenerConfig = {
  name: 'beforeSubmit',
  paramKeys: ['uiNode', 'target', 'options', 'callbacks'],
  debugList: [
    'uiNode.id',
    'uiNode.engineId',
    'uiNode.layoutKey',
    'target',
    'options',
  ],
  listener,
  weight: 0,
  describe: {
    target: {
      type: 'datatarget'
    },
    options: 'object',
    callbacks: 'object',
  }
}
