import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../typings";

/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  const data = dataNode.dataPool.get(dataNode.source.source, false);
  return data;
};

export const loadDataPoolData: IPlugin = {
  type: "data.data.parser",
  weight: 0,
  callback,
  name: "loadDataPoolData"
};
