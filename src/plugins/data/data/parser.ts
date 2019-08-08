import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../typings";
import { DataPool } from "../../../helpers";
/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  const mode = _.get(dataNode.workingMode, "mode");
  const connect = _.get(dataNode.workingMode, "options.source");
  if (mode === "edit-pool") {
    let { source, target } = connect;
    const index = _.get(dataNode.workingMode, "options.key");
    if (index !== undefined) {
      target = target.replace(/(\[.*?\])/, `[${index}]`);
    }
    // console.log(source, target, index);
    const dataPool = DataPool.getInstance();
    dataPool.merge(target, source);
  }
  let data = dataNode.dataPool.get(dataNode.source.source, false);
  return data;
};

export const loadDataPoolData: IPlugin = {
  type: "data.data.parser",
  weight: 0,
  callback,
  name: "loadDataPoolData"
};
