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
 * @param source
 * @param prefix
 */
export function formatSource(source: string, prefix?: string) {
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
 * @param id a.b.c:d
 */
export function getDomainName(
  source: IDataSource | string,
  snakeCase: boolean = true
) {
  let srcString = source
  // if it's an IDataSource instance, eg:
  // {source: 'slb.virtual-server:template-policy', autoload: true}
  if (_.isObject(srcString)) {
    srcString = _.get(srcString, 'source', '')
  }

  if (_.isString(srcString) && srcString) {
    // replace the '#'
    srcString = srcString.replace('#', '.')
    if (srcString.includes(':')) {
      // splice the string by ':'
      srcString = srcString.split(':')[0]
      // remove the '.' at both ends
      srcString = _.trim(srcString, '.')
    } else {
      // splice the string by '.'
      srcString = srcString.split('.')[0]
    }
    if (snakeCase) {
      return _.snakeCase(srcString)
    } else {
      return srcString
    }
  } else {
    return '$dummy'
  }
}

/**
 * convert source to a.b.c.
 * @param source
 */
export function parseSchemaPath(source: string) {
  let schemaPath = getDomainName(source, false)
  return `${schemaPath}.json`
}

/**
 * Convert source to a_b_c
 *
 * @param source
 * @param parsePath
 */
export function parseCacheID(source: string, parsePath: boolean = true) {
  let path = source
  if (parsePath) {
    path = parseSchemaPath(source)
  }
  return _.snakeCase(path)
}

/**
 * export to a_b_c
 *
 * @param root like a-b-c.json
 */
export function parseRootName(root: string) {
  root = root.replace('.json', '')
  return _.snakeCase(root)
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
    result = await dataEngine.sendRequest(source, result, method, false)
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
        // await uiNode.updateLayout()
        await uiNode.pluginManager.executePlugins(
          uiNode.id,
          'ui.parser',
          { uiNode },
        )
        uiNode.sendMessage(true)
      }
    }
  }
  return validateResults
}
