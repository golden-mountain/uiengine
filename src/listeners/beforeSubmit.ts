import _ from 'lodash'

import { Feedback } from '../helpers/Feedback'

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

function onProcessCompleted() {
  let message: string = 'Submit Process Completed'
  Feedback.getInstance().send('SubmitSuccess', message)
}
function onProcessFailed() {
  let message: string = 'Submit Process Failed'
  Feedback.getInstance().send('SubmitError', message)
}
function onProcessTerminated() {
  let message: string = 'Submit Process Terminated'
  Feedback.getInstance().send('SubmitError', message)
}
function onTargetSuccess() {
  let message: string = 'Submit Target Succeeded'
  Feedback.getInstance().send('SubmitSuccess', message)
}
function onTargetFailure() {
  let message: string = 'Submit Target Failed'
  Feedback.getInstance().send('SubmitError', message)
}

const listener: IListener = async (directParam: IListenerParam) => {
  console.log('beforeSubmit begin')

  const uiNode: IUINode = _.get(directParam, 'uiNode')
  const target: ISubmitProcess | ISubmitTarget = _.get(directParam, 'target')
  const options: ISubmitOption = _.get(directParam, 'options')
  const callbacks: ISubmitCallback = _.get(directParam, 'callbacks')

  let message: string = ''
  if (!_.isNil(target)) {



    if (_.isObject(options)) {
      // if need customize
      // options.requestGenerator =
      // options.dependResolver =
    }

    if (_.isObject(callbacks)) {
      callbacks.onProcessCompleted = onProcessCompleted
      callbacks.onProcessFailed = onProcessFailed
      callbacks.onProcessTerminated = onProcessTerminated
      callbacks.onTargetSuccess = onTargetSuccess
      callbacks.onTargetFailure = onTargetFailure
    }

    return 'Submit Prepared'
  } else {
    message = 'GUI Error: There is no submit config defined!'
  }

  Feedback.getInstance().send('SubmitError', message)
  return 'Submit Stopped'

}

export const beforeSubmit: IListenerConfig = {
  name: 'beforeSubmit',
  paramKeys: ['uiNode', 'target', 'options', 'callbacks'],
  debugList: [],
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
