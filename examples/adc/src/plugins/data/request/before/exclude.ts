import _ from "lodash";
import {
  IPluginFunc,
  IPlugin,
  IPluginExecutionConfig,
  IDataEngine,
  IUINode
} from "UIEngine/typings";
import { NodeController, formatSource } from "UIEngine";

type MatchFunction = (uiNode: IUINode) => boolean;
type ExecuteFunction = (uiNode: IUINode) => void;
interface IExclusionMap {
  [key: string]: IUINode;
}

const deepSearch = (
  uiNode: IUINode,
  matchFn: MatchFunction,
  executeFn: ExecuteFunction
) => {
  const { children } = uiNode;
  if (_.isFunction(matchFn) && _.isFunction(executeFn)) {
    const isMatched = matchFn(uiNode);
    if (isMatched) {
      executeFn(uiNode);
    }
  }

  if (_.isArray(children) && children.length) {
    children.forEach((childNode: IUINode) => {
      deepSearch(childNode, matchFn, executeFn);
    });
  }
};

const hasExclusion = (uiNode: IUINode) => {
  const { dataNode } = uiNode;
  const { schema } = dataNode;
  if (_.isObject(schema)) {
    const exclusion = _.get(schema, "cm-meta.m-exclusion");
    if (_.isArray(exclusion) && exclusion.length) {
      return true;
    }
  }
  return false;
};

const doExclusion = (data: any, uiNode: IUINode) => {
  const { dataNode, stateNode } = uiNode;
  const { source, schema } = dataNode;
  const { visible } = stateNode.state;
  const {
    "cm-meta": { "m-exclusion": exclusion }
  } = schema;

  const dataSource: string = source.source;
  const dataPath = formatSource(dataSource);
  const dataValue = _.get(data, dataPath);
  if (dataValue && visible) {
    const prefix = dataSource.split(":")[0];
    exclusion.forEach((key: string) => {
      const path = `${prefix}.${key}`;
      const doUnset = _.unset(data, path);
    });
  }
};

/**
 * exclude data
 * @param dataEngine
 */
const callback: IPluginFunc = (dataEngine: IDataEngine) => {
  const { params } = dataEngine.requestOptions
  const dataSource = dataEngine.source
  if (!dataSource || !dataSource.source) {
    return true;
  }
  const nodeController = NodeController.getInstance();
  const layout = `schema/ui/${dataSource.source.slice(0, -1)}.json`;
  const rootNode = _.get(nodeController.nodes[layout], "uiNode");
  if (!rootNode) {
    return true;
  }

  deepSearch(rootNode, hasExclusion, doExclusion.bind(null, params));
  return true;
};

export const exclude: IPlugin = {
  type: "data.request.before",
  weight: 100,
  callback,
  name: "exclude"
};
