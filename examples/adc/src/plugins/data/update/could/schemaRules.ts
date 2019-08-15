// import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "UIEngine/typings";

const callback: IPluginFunc = (dataNode: IDataNode) => {
  // console.log(dataNode.schema, dataNode.rootSchema);
  // const errors = dataNode.dataPool.errors;
  // return {
  //   status: _.isEmpty(errors),
  //   errors
  // };
};

export const schemaRules: IPlugin = {
  type: "data.update.could",
  priority: 0,
  callback,
  name: "schemaRules"
};
