import _ from "lodash";
import { IStateNode } from "../../../typings/StateNode";
import { stateDepsResolver } from "../state-helper";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = (stateNode: IStateNode) => {
  let result = true;
  result = stateDepsResolver(stateNode, "visible");
  return result;
};

export const visible: IPlugin = {
  type: "state",
  initialize: false,
  callback,
  name: "visible"
};
