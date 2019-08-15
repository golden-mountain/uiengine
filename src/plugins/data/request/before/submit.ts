import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../../typings";

const callback: IPluginFunc = (dataNode: IDataNode) => {
  // const errors = dataNode.dataPool.errors;
  // return {
  //   status: _.isEmpty(errors),
  //   errors
  // };
};

export const submit: IPlugin = {
  type: "data.request.before",
  priority: 0,
  callback,
  name: "submit-handler"
};
