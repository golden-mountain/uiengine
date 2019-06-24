import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../../typings";

const callback: IPluginFunc = (dataNode: IDataNode) => {
  const data = dataNode.updatingData;
  const schema = dataNode.getRootSchema();

  console.log(data, schema);
  return true;
};

export const validate: IPlugin = {
  type: "data.update.could",
  initialize: false,
  callback,
  name: "number"
};
