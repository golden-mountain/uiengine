import _ from 'lodash'

import { Feedback } from '../helpers/Feedback'

import {
  IHandler,
  IHandlerConfig,
  IHandlerHelper,
  IHandlerParam,
  ISubmitProcess,
  ISubmitTarget,
  ISubmitOption,
  ISubmitCallback,
  ISubmitProcessRecord,
  ISubmitTargetRecord,
  IUINode,
} from '../../typings'

function onProcessCompleted(process: ISubmitProcess, record: ISubmitProcessRecord) {
  let message: string = 'Submit Process Completed'
  console.log('Submit Process Completed', process, record)
  Feedback.getInstance().send('SubmitSuccess', message)
}
function onProcessFailed(process: ISubmitProcess, record: ISubmitProcessRecord) {
  let message: string = 'Submit Process Failed'
  console.log('Submit Process Failed', process, record)
  Feedback.getInstance().send('SubmitError', message)
}
function onProcessTerminated(process: ISubmitProcess, record: ISubmitProcessRecord) {
  let message: string = 'Submit Process Terminated'
  console.log('Submit Process Terminated', process, record)
  Feedback.getInstance().send('SubmitError', message)
}
function onTargetSuccess(target: ISubmitTarget, record: ISubmitTargetRecord) {
  let message: string = 'Submit Target Succeeded'
  console.log('Submit Target Succeeded', target, record)
  Feedback.getInstance().send('SubmitSuccess', message)
}
function onTargetFailure(target: ISubmitTarget, record: ISubmitTargetRecord) {
  let message: string = 'Submit Target Failed'
  console.log('Submit Target Failed', target, record)
  Feedback.getInstance().send('SubmitError', message)
}

const handler: IHandler = async (directParam: IHandlerParam) => {
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

export const beforeSubmit: IHandlerConfig = {
  name: 'beforeSubmit',
  paramKeys: ['uiNode', 'target', 'options', 'callbacks'],
  debugList: [],
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
