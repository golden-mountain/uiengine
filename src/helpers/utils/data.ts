import _ from 'lodash'

import { DataPool, DataEngine, searchNodes } from '..'

import {
  IDataSource,
  IPluginExecuteOption,
  IUINode,
} from '../../../typings'

/**
 * get the access route from the string, eg:
 * convert 'a.b.c.d' to 'a.b.c.d'
 * convert 'a.b.c:d' to 'a.b.c.d'
 * convert 'a.b.c:' to 'a.b.c'
 * convert 'a.b#c:d' to 'a.b'
 * convert 'a.b.c#:d' to 'a.b.c'
 * convert 'a.b.c:#d' to 'a.b.c'
 * convert '#a.b.c:d' to ''
 * if prefix is provided, add it before the string, convert to prefix.xxx.xxx
 * @param source the source string
 * @param prefix add prefix string
 */
export function getAccessRoute(
  source: string,
  prefix?: string,
) {
  let srcString: string = source
  // replace the ':'
  srcString = srcString.replace(':', '.')
  // splice the string by '#'
  srcString = srcString.split('#')[0]
  // remove the '.' at both ends
  srcString = _.trim(srcString, '.')

  if (_.isString(prefix) && prefix) {
    if (srcString.length) {
      return `${prefix}.${srcString}`
    } else {
      return prefix
    }
  }
  return srcString
}

/**
 * get the domain name from the string, eg:
 * convert 'a.b.c.d' to 'a'
 * convert 'a.b.c:d' to 'a.b.c'/'a_b_c'
 * convert 'a.b.c:' to 'a.b.c'/'a_b_c'
 * convert 'a.b#c:d' to 'a.b.c'/'a_b_c'
 * convert 'a.b.c#:d' to 'a.b.c'/'a_b_c'
 * convert 'a.b.c:#d' to 'a.b.c'/'a_b_c'
 * convert '#a.b.c:d' to 'a.b.c'/'a_b_c'
 * @param source the source string
 * @param snakeCase use snake case
 */
export function getDomainName(
  source: string,
  snakeCase?: boolean,
) {
  if (_.isString(source) && source) {
    // replace the '#'
    source = source.replace('#', '.')
    if (source.includes(':')) {
      // splice the string by ':'
      source = source.split(':')[0]
      // remove the '.' at both ends
      source = _.trim(source, '.')
    } else {
      // splice the string by '.'
      source = source.split('.')[0]
    }
    if (snakeCase) {
      return _.snakeCase(source)
    } else {
      return source
    }
  } else {
    return '$dummy'
  }
}

/**
 * get the schema name which accords to the domain from the string, eg:
 * convert 'a.b.c.d' to 'a.json'
 * convert 'a.b.c:d' to 'a.b.c.json'
 * convert 'a.b.c:' to 'a.b.c.json'
 * convert 'a.b#c:d' to 'a.b.c.json'
 * convert 'a.b.c#:d' to 'a.b.c.json'
 * convert 'a.b.c:#d' to 'a.b.c.json'
 * convert '#a.b.c:d' to 'a.b.c.json'
 * @param source the source string
 */
export function getSchemaName(source: string) {
  return `${getDomainName(source, false)}.json`
}

/**
 * replace the param in the string
 * @param sourceStr the source string
 * @param paramMap the paramters map
 */
export function replaceParam(
  sourceStr: string,
  paramMap: object,
) {
  const matchBlock = /\{[\w\-]*\}/g
  const matchString = /\{(.*)\}/

  let currentStr: string = sourceStr
  const results = currentStr.match(matchBlock)
  if (_.isArray(results) && results.length) {
    results.forEach((item: string) => {
      const result = item.match(matchString)
      if (_.isArray(result) && _.isString(result[1]) && result[1]) {
        const paramKey = result[1]
        const paramValue = _.get(paramMap, [paramKey])
        if (_.isString(paramValue) || _.isFinite(paramValue)) {
          currentStr = currentStr.replace(`{${paramKey}}`, `${paramValue}`)
        }
      }
    })
  }

  return currentStr
}

export async function submitToAPI(
  dataSources: Array<IDataSource>,
  method: string = 'post'
) {
  let result = {}
  let responses: any = []
  const dataPool = DataPool.getInstance()
  const dataEngine = DataEngine.getInstance()
  for (let index in dataSources) {
    const source = dataSources[index]
    result = _.merge(result, dataPool.get(source.source, { withPath: true }))
    result = await dataEngine.sendRequest(source, method, { data: result, cacheID: 'test' })
    if (result !== false) responses.push(result)
  }

  return responses
}

export async function validateAll(dataSources: Array<any>) {
  let validateResults: any = []
  // dataSources.forEach((dataSource: any) => {
  for (let j in dataSources) {
    let dataSource = dataSources[j]
    const props = {
      datasource: dataSource
    }
    const nodes = searchNodes(props)
    // nodes.forEach((uiNode: IUINode) => {
    for (let i in nodes) {
      const uiNode: IUINode = nodes[i]
      // check data from update plugins
      const exeConfig: IPluginExecuteOption = {
        afterExecute: (plugin, param, result) => {
          if (!result) {
            return { stop: true }
          }
          return {}
        }
      }
      const exeResult = uiNode.dataNode.pluginManager.syncExecutePlugins(
        uiNode.dataNode.id,
        'data.update.could',
        { dataNode: uiNode.dataNode },
        exeConfig
      )
      if (exeResult) {
        exeResult.results.forEach((result) => {
          if (result.result) {
            uiNode.dataNode.errorInfo = result.result
            validateResults.push(result.result)
          }
        })
        // await uiNode.refreshLayout()
        await uiNode.parseProps()
        uiNode.sendMessage(true)
      }
    }
  }
  return validateResults
}
