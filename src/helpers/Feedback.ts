import _ from 'lodash'

import {
  IFeedback,
  IFeedbacker,
  IFeedbackConfig,
  IFeedbackList,
  IFeedbackMap,
  IFeedbackSendOption,
  IFeedbackResult,
} from '../../typings'

export class Feedback implements IFeedback {
  private static instance: Feedback
  static getInstance() {
    if (_.isNil(Feedback.instance)) {
      Feedback.instance = new Feedback()
    }
    return Feedback.instance
  }

  private feedbackMap: IFeedbackMap = {

  }

  send = (type: string, info?: any, options?: IFeedbackSendOption) => {
    const results: IFeedbackResult[] = []
    if (_.isString(type) && type) {
      const feedbackList = this.feedbackMap[type]
      if (!_.isNil(feedbackList)) {
        const includeList: string[] = []
        const excludeList: string[] = []
        const orderList: string[] = []
        if (_.isObject(options)) {
          const { include, exclude, order } = options
          if (_.isString(include) && include) {
            includeList.push(include)
          } else if (_.isArray(include) && include.length) {
            include.forEach((item) => {
              if (_.isString(item) && item) {
                includeList.push(item)
              }
            })
          }
          if (_.isString(exclude) && exclude) {
            excludeList.push(exclude)
          } else if (_.isArray(exclude) && exclude.length) {
            exclude.forEach((item) => {
              if (_.isString(item) && item) {
                excludeList.push(item)
              }
            })
          }
          if (_.isArray(order) && order.length) {
            order.forEach((item) => {
              if (_.isString(item) && item) {
                orderList.push(item)
              }
            })
          }
        }

        Object.values(feedbackList)
          .filter((config: IFeedbackConfig) => {
            if (includeList.length) {
              return includeList.includes(config.name)
            } else if (excludeList.length) {
              return !excludeList.includes(config.name)
            }
            return true
          })
          .sort((configA: IFeedbackConfig, configB: IFeedbackConfig) => {
            const priorityA = _.get(configA, 'priority', 0)
            const priorityB = _.get(configB, 'priority', 0)
            return priorityB - priorityA
          })
          .sort((configA: IFeedbackConfig, configB: IFeedbackConfig) => {
            if (orderList.length) {
              let priorityA = orderList.indexOf(configA.name)
              if (priorityA === -1) {
                priorityA = orderList.length
              }
              let priorityB = orderList.indexOf(configB.name)
              if (priorityB === -1) {
                priorityB = orderList.length
              }
              return priorityA - priorityB
            }
            return 0
          })
          .forEach((config: IFeedbackConfig) => {
            const { feedbacker } = config
            if (_.isFunction(feedbacker)) {
              results.push(feedbacker(type, info, results))
            }
          })
      }
    }
    return results
  }

  inject = (type: string, feedbacker: IFeedbacker|IFeedbackConfig) => {
    let feedbackList = this.feedbackMap[type]
    if (_.isString(type) && type && _.isNil(feedbackList)) {
      this.feedbackMap[type] = {}
      feedbackList = this.feedbackMap[type]
    }

    if (!_.isNil(feedbackList)) {
      let config: IFeedbackConfig|undefined
      if (_.isFunction(feedbacker)) {
        config = {
          name: _.uniqueId('Feedback-'),
          feedbacker,
        }
      } else if (_.isObject(feedbacker)) {
        const { name, priority, feedbacker: callback } = feedbacker
        config = {
          name: _.isString(name) && name ? name : _.uniqueId('Feedback-'),
          priority,
          feedbacker: callback,
        }
      }

      if (!_.isNil(config) && _.isFunction(config.feedbacker)) {
        feedbackList[config.name] = config
        return config.name
      }
    }

    return ''
  }
  eject = (type: string, name?: string) => {
    if (_.isString(type) && type) {
      const feedbackList = this.feedbackMap[type]
      if (_.isString(name) && name) {
        delete feedbackList[name]
      } else if (name === undefined && !_.isNil(feedbackList)) {
        delete this.feedbackMap[type]
      }
    }
  }

  search = (type?: string, name?: string) => {
    if (_.isString(type) && type) {
      const list = this.feedbackMap[type]
      if (!_.isNil(list) && _.isString(name) && name) {
        return list[name]
      }
      return list
    }
    return this.feedbackMap
  }
}

export default Feedback
