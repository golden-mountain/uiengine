import _ from 'lodash'

import { validateAll } from '../../helpers'
import { NodeController } from '../../data-layer'

import {
  IDataSource,
  IPlugin,
  IPluginExecution,
  IPluginParam,
  IUINode,
} from '../../../typings'

const execution: IPluginExecution = async (param: IPluginParam) => {
  const uiNode: IUINode = _.get(param, 'uiNode')
  return async (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation()
    }

    const nodeController = NodeController.getInstance()

    if (!options.target) {
      return false
    }

    // // validation
    let sources: Array<IDataSource> = []
    // let errors: any = []
    // const validate = async (target: string) => {
    //   // validate all values
    //   if (target[target.length - 1] === ':') {
    //     const regExp = new RegExp(target)
    //     const errorInfos = await validateAll([regExp])
    //     if (errorInfos.length) {
    //       errors = errors.concat(errorInfos)
    //     }
    //   }
    // }

    if (_.isArray(options.target)) {
      // options.target.forEach((t: string) => {
      for (let i in options.target) {
        const t = options.target[i]
        // await validate(t)
        sources.push({ source: t })
      }
    } else {
      // await validate(options.target)
      sources.push({ source: options.target })
    }

    // if (errors.length) {
    //   let couldRequest = true
    //   errors.forEach((error: any) => {
    //     if (error.status !== true) couldRequest = false
    //   })
    //   if (!couldRequest) return false
    // }

    nodeController.workflow.submit(sources).then((result: any) => {
      console.log(result)
      if (!_.isEmpty(result)) {
        const errorInfo = {
          status: 200,
          code: 'Data committed successfully'
        }
        nodeController.sendMessage({
          error: errorInfo
        })
      }
    })
  }
}

export const request: IPlugin = {
  name: 'request',
  categories: ['ui.parser.event'],
  paramKeys: ['uiNode'],
  execution,
  priority: 0,
}
