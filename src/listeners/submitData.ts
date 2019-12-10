import _ from 'lodash'

import { submit } from '../helpers'

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

const listener: IListener = async (directParam: IListenerParam, helper: IListenerHelper) => {
  if (
    _.isObject(helper) &&
    _.isFunction(helper.getListenerRecords)
  ) {
    const prevRecords = helper.getListenerRecords()
    if (_.isArray(prevRecords) && prevRecords.length) {
      for(let i = 0; i < prevRecords.length; i++) {
        const record = prevRecords[i]
        if (_.isObject(record)) {
          const { listenerName, result } = record
          if (listenerName === 'beforeSubmit') {
            if (result instanceof Promise) {
              const prevStatus = await result
              if (prevStatus !== 'Submit Prepared') {
                return prevStatus
              }
            } else {
              if (result !== 'Submit Prepared') {
                return result
              }
            }
          }
        }
      }
    }
  }
  console.log('submitData begin')

  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const target: ISubmitProcess | ISubmitTarget = _.get(directParam, 'target')
  const options: ISubmitOption = _.get(directParam, 'options', {})
  const callbacks: ISubmitCallback = _.get(directParam, 'callbacks', {})

  if (
    _.isObject(options) &&
    !_.has(options, 'engineId') &&
    !_.has(options, 'layoutKey')
  ) {
    if (
      !_.isNil(uiNode) &&
      uiNode.engineId &&
      uiNode.layoutKey
    ) {
      options.engineId = uiNode.engineId
      options.layoutKey = uiNode.layoutKey
    }
  }

  if (_.isObject(target)) {

    const record = await submit(target, options, callbacks)

    if (!_.isNil(record) && (record.status === 'COMPLETED' || record.status === 'SUCCESS')) {
      return 'Submit Succeeded'
    }
  }

  return 'Submit Failed'
}

export const submitData: IListenerConfig = {
  name: 'submitData',
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
