import _ from "lodash";
import {
  IPluginFunc,
  IPlugin,
  IPluginExecutionConfig,
  IDataEngine,
  IUINode,
} from "UIEngine/typings";
import {
  NodeController,
  formatSource,
} from "UIEngine";

type MatchFunction = (uiNode: IUINode) => boolean
type ExecuteFunction = (uiNode: IUINode) => void
interface IExclusionMap {
  [key: string]: IUINode
}

const deepSearch = (
  uiNode: IUINode,
  matchFn: MatchFunction,
  executeFn: ExecuteFunction,
) => {
  const { children } = uiNode
  if (_.isFunction(matchFn) && _.isFunction(executeFn)) {
    const isMatched = matchFn(uiNode)
    if (isMatched) {
      executeFn(uiNode)
    }
  }

  if (_.isArray(children) && children.length) {
    children.forEach((childNode: IUINode) => {
      deepSearch(childNode, matchFn, executeFn)
    })
  }
}

const hasExclusion = (uiNode: IUINode) => {
  const { dataNode } = uiNode
  const { schema } = dataNode
  if (_.isObject(schema)) {
    const exclusion = _.get(schema, 'cm-meta.m-exclusion')
    if (_.isArray(exclusion) && exclusion.length) {
      return true
    }
  }
  return false
}

const doExclusion = (data: any, uiNode: IUINode) => {
  const { dataNode, stateNode } = uiNode
  const { source, schema } = dataNode
  const { visible } = stateNode.state
  const { 'cm-meta': { 'm-exclusion': exclusion } } = schema

  const dataSource: string = source.source
  const dataPath = formatSource(dataSource)
  const dataValue = _.get(data, dataPath)
  if (dataValue && visible) {
    const prefix = dataSource.split(':')[0]
    exclusion.forEach((key: string) => {
      const path = `${prefix}.${key}`
      const doUnset = _.unset(data, path)
    })
  }
}

/**
 * exclude data
 * @param dataEngine
 */
const callback: IPluginFunc = (
  dataEngine: IDataEngine,
  options?: any
) => {
  const { source, data } = options
  if (!source.source) {
    return data
  }
  const nodeController = NodeController.getInstance()
  const layout = `schema/ui/${source.source.slice(0, -1)}.json`
  const rootNode = _.get(nodeController.nodes[layout], 'uiNode')
  if (!rootNode) {
    return data
  }

  const copyData = _.cloneDeep(data)
  deepSearch(rootNode, hasExclusion, doExclusion.bind(null, copyData))
  return copyData
};

export const exclude: IPlugin = {
  type: "data.commit.exclude",
  weight: 100,
  callback,
  name: "exclude"
};
