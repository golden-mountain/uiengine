import _ from 'lodash'

import { submit } from '../helpers'

import {
  IHandler,
  IHandlerConfig,
  IHandlerHelper,
  IHandlerParam,
  ISubmitProcess,
  ISubmitTarget,
  ISubmitOption,
  ISubmitCallback,
  IUINode,
} from '../../typings'

const handler: IHandler = async (directParam: IHandlerParam, helper: IHandlerHelper) => {
  if (
    _.isObject(helper) &&
    _.isFunction(helper.getHandlerRecords)
  ) {
    const prevRecords = helper.getHandlerRecords()
    if (_.isArray(prevRecords) && prevRecords.length) {
      for(let i = 0; i < prevRecords.length; i++) {
        const record = prevRecords[i]
        if (_.isObject(record)) {
          const { handlerName, result } = record
          if (handlerName === 'beforeSubmit') {
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

    console.log(target, options, callbacks)
    const record = await submit(target, options, callbacks)

    if (!_.isNil(record) && (record.status === 'COMPLETED' || record.status === 'SUCCESS')) {
      return 'Submit Succeeded'
    }
  }

  return 'Submit Failed'
}

export const submitData: IHandlerConfig = {
  name: 'submitData',
  paramKeys: ['uiNode', 'target', 'options', 'callbacks'],
  debugList: [
    'uiNode.id',
    'uiNode.engineId',
    'uiNode.layoutKey',
    'target',
    'options',
  ],
  handler,
  weight: 0,
  describe: {
    target: {
      type: 'datatarget'
    },
    options: 'object',
    callbacks: 'object',
  }
}
