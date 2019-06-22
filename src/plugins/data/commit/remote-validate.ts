import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../typings";

const callback: IPluginFunc = (dataNode: IDataNode) => {
  return true;
};

export const remoteValidate: IPlugin = {
  type: "data.commit",
  initialize: false,
  callback,
  name: "remote-validate"
};
